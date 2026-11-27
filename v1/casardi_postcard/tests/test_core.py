"""Run: python -m unittest discover -s tests -v

All HTTP clients in this suite are in-process, not physical phones. Expiry
uses a controlled clock. Browser and live-HTTP tests are separate scripts.
"""
from __future__ import annotations
import base64
from concurrent.futures import ThreadPoolExecutor
import io
from pathlib import Path
import re
import tempfile
import time
import unittest
from unittest.mock import patch

from PIL import Image
import numpy as np
from app.pixel import PixelCanvas
from app.character import default_spec, render
from app.catalogue import normalise_job, normalise_character, ValidationError, CHOICES
from app.postcard import compose
from app.storage import CardStore, CancelledExport


class RasterTests(unittest.TestCase):
    def test_polygon_is_solid_not_sparse_samples(self):
        c=PixelCanvas(32,32)
        c.poly([(2,2),(28,2),(28,28),(2,28)],(20,30,40,255))
        self.assertEqual(sum(p[3]>0 for p in c.buf),26*26)
        self.assertTrue(all(c.alpha(x,y)==255 for y in range(2,28) for x in range(2,28)))

    def test_ellipse_hard_alpha_and_clipping(self):
        c=PixelCanvas(20,20);c.ellipse(1,3,8,12,(5,6,7,255))
        self.assertTrue({p[3] for p in c.buf}<={0,255})
        self.assertGreater(sum(p[3]>0 for p in c.buf),50)

    def test_nes_entire_render_is_on_native_grid(self):
        job=dict(mode='nes',scene='biblioteca',character=default_spec(),name='Àccenti')
        full=compose(job,3000)
        native=compose(job,600)
        self.assertEqual(full.size,(3000,2000))
        self.assertTrue(np.array_equal(np.asarray(full),np.asarray(native.resize((3000,2000),Image.Resampling.NEAREST))))

    def test_photo_is_not_blank(self):
        image=compose(dict(mode='photo',scene='pantheon',character=default_spec()),600)
        a=np.asarray(image)
        self.assertGreater(a.std(),30)
        self.assertGreater(a.mean(),40)
        self.assertLess(a.mean(),235)

    def test_distinct_poses_and_expressions(self):
        base=default_spec();base['hair']='calvo'
        for field in ('pose','expression','eye_shape','brows','nose','mouth'):
            signatures=[]
            for value in CHOICES[field]:
                s={**base,field:value};c=render(s)
                signatures.append(bytes(v for rgba in c.buf for v in rgba))
            self.assertEqual(len(set(signatures)),len(signatures),field)


class ValidationTests(unittest.TestCase):
    def test_unicode_name_normalisation_and_length(self):
        j=normalise_job(dict(name='  E\u0300lisa\n\x00 Rossi  '))
        self.assertEqual(j['name'],'Èlisa Rossi')
        self.assertEqual(len(normalise_job({'name':'W'*50})['name']),28)

    def test_invalid_payloads(self):
        for raw in ([],{'mode':'bad'},{'scene':[]},{'character':[]},
                    {'character':{'expression':'bad'}},{'character':{'skin':'unknown'}},
                    {'companion':{'animal':'unknown'}}, {'name':12}, {'name':False},
                    {'companion':{'animal':'gatto','pose':[]}}):
            with self.subTest(raw=raw):
                with self.assertRaises(ValidationError): normalise_job(raw)

    def test_held_items_have_compatible_pose(self):
        self.assertEqual(normalise_character({'held':'cetra','pose':'aperta'})['pose'],'libro')
        self.assertEqual(normalise_character({'pose':'libro'})['held'],'libro')


class StorageTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.now=[1000.]
        self.s=CardStore(self.tmp.name,600,clock=lambda:self.now[0])
    def tearDown(self): self.s.close();self.tmp.cleanup()

    def test_ttl_range(self):
        for ttl in (299,601):
            with self.assertRaises(ValueError): CardStore(self.tmp.name,ttl)

    def test_unpredictable_token_format_and_no_name_data(self):
        c=self.s.register('owner',0,b'png',{'license':'CC0'})
        self.assertRegex(c.token,r'^[A-Za-z0-9_-]{32}$')
        self.assertFalse(hasattr(c,'name'))
        self.assertTrue(c.path.exists())

    def test_expiry_deletes_file(self):
        c=self.s.register('owner',0,b'png',{})
        self.now[0]=1599.;self.assertEqual(self.s.get(c.token)[1],200)
        self.now[0]=1600.;self.assertEqual(self.s.get(c.token)[1],410)
        self.assertFalse(c.path.exists())
        self.assertFalse(self.s.cards)

    def test_purger_without_http_reads(self):
        c=self.s.register('owner',0,b'png',{});self.now[0]+=601
        self.assertEqual(self.s.purge(),1);self.assertFalse(c.path.exists())

    def test_reset_is_owner_scoped(self):
        a=self.s.register('a',0,b'a',{});b=self.s.register('b',0,b'b',{})
        self.assertEqual(self.s.reset('a'),1)
        self.assertFalse(a.path.exists());self.assertTrue(b.path.exists())

    def test_inflight_render_cannot_resurrect_after_reset(self):
        epoch=self.s.generation('owner');self.s.reset('owner')
        with self.assertRaises(CancelledExport): self.s.register('owner',epoch,b'png',{})
        self.assertEqual(list(Path(self.tmp.name).iterdir()),[])

    def test_new_export_replaces_prior_file(self):
        a=self.s.register('a',0,b'a',{});b=self.s.register('a',0,b'b',{})
        self.assertNotEqual(a.token,b.token);self.assertFalse(a.path.exists());self.assertTrue(b.path.exists())

    def test_restart_removes_unreachable_orphans(self):
        p=Path(self.tmp.name)/'orphan.png';p.write_bytes(b'png')
        other=CardStore(self.tmp.name,600)
        self.assertFalse(p.exists());other.close()

    def test_shutdown_cancels_late_export(self):
        self.s.close()
        with self.assertRaises(CancelledExport): self.s.register('a',0,b'png',{})
        self.assertFalse(list(Path(self.tmp.name).iterdir()))

    def test_parallel_register_reset_no_stray_files(self):
        def work(i):
            if i%4==0: self.s.reset('a')
            else:
                try: self.s.register('a',self.s.generation('a'),b'png',{})
                except CancelledExport: pass
        with ThreadPoolExecutor(max_workers=6) as pool:list(pool.map(work,range(80)))
        self.s.reset('a')
        self.assertFalse(list(Path(self.tmp.name).iterdir()))


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from app import server
        cls.server=server

    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.original=self.server.store
        self.server.store=CardStore(self.tmp.name,600)
        self.client=self.server.app.test_client()
        response=self.client.get('/')
        csrf=re.search(rb'name="kiosk-csrf" content="([^"]+)"',response.data)[1].decode()
        self.headers={'X-Kiosk-CSRF':csrf,'X-Kiosk-Generation':'0'}

    def tearDown(self):
        self.server.store.close();self.server.store=self.original;self.tmp.cleanup()

    def post(self,path,data=None): return self.client.post(path,json=data if data is not None else {},headers=self.headers)

    def make_card(self):
        r=self.post('/api/export',{'mode':'nes','scene':'casardi','name':'Nome di prova'})
        self.assertEqual(r.status_code,200)
        return r.json

    def test_catalogue_and_assets(self):
        r=self.client.get('/api/options');self.assertEqual(r.status_code,200)
        self.assertEqual(len(r.json['scenes']),6);self.assertEqual(len(r.json['animals']),8)
        for path in ('/static/app.js','/static/app.css','/static/fonts/Cinzel.ttf','/network-test'):
            with self.client.get(path) as response:
                self.assertEqual(response.status_code,200)
        self.assertIn('no-store',self.client.get('/network-test').headers['Cache-Control'])
        for mode in ('photo','nes'):
            self.assertEqual(self.client.get(f'/icons/{mode}/hair/corti.png').status_code,200)
            self.assertEqual(self.client.get(f'/icons/{mode}/animal/drago.png').status_code,200)

    def test_post_requires_capability_even_without_cookie(self):
        self.assertEqual(self.client.post('/api/reset',json={}).status_code,403)
        # Preview iframe may block third-party cookies; header capability still works.
        other=self.server.app.test_client(use_cookies=False)
        self.assertEqual(other.post('/api/reset',json={},headers=self.headers).status_code,200)

    def test_bad_json_and_bad_scene_are_400(self):
        self.assertEqual(self.post('/api/preview',[]).status_code,400)
        self.assertEqual(self.post('/api/export',{'scene':'../secret'}).status_code,400)

    def test_export_png_metadata_qr_and_all_downloads(self):
        c=self.make_card()
        r=self.client.get(c['file_url']);self.assertEqual(r.status_code,200)
        image=Image.open(io.BytesIO(r.data));self.assertEqual(image.size,(3000,2000))
        self.assertEqual(image.format,'PNG');self.assertIn('LICEO ALFREDO CASARDI',image.info['Title'])
        self.assertIn('Source',image.info);self.assertIn('Copyright',image.info)
        self.assertIn('/download/',c['url']);self.assertEqual(c['expires_in'],600)
        for suffix in ('','/preview.jpg','/crediti.txt'):
            resp=self.client.get('/download/'+c['token']+suffix)
            self.assertEqual(resp.status_code,200)
            self.assertIn('no-store',resp.headers['Cache-Control'])
        try: import zxingcpp
        except ImportError: self.skipTest('Install requirements-dev.txt for independent QR decoding')
        qr=Image.open(io.BytesIO(base64.b64decode(c['qr'].split(',')[1]))).convert('RGB')
        decoded=zxingcpp.read_barcode(qr)
        self.assertIsNotNone(decoded);self.assertEqual(decoded.text,c['url'])

    def test_every_token_route_checks_expiry_and_deletion(self):
        for suffix in ('','/preview.jpg','/file.png','/crediti.txt'):
            c=self.make_card();card=self.server.store.cards[c['token']];card.expires=time.time()-1
            self.assertIn(self.client.get('/download/'+c['token']+suffix).status_code,(404,410))
            self.assertFalse(card.path.exists())

    def test_reset_revokes_file_and_old_export_generation(self):
        c=self.make_card();r=self.post('/api/reset')
        self.assertEqual(r.json['generation'],1)
        self.assertIn(self.client.get(c['file_url']).status_code,(404,410))
        self.assertEqual(self.post('/api/export',{'mode':'nes'}).status_code,409)
        self.assertFalse(list(Path(self.tmp.name).iterdir()))

    def test_render_error_is_recoverable_and_private(self):
        with patch.object(self.server.pc,'compose_full',side_effect=RuntimeError('sensitive request should never be logged')):
            with self.assertLogs(self.server.app.logger,level='ERROR') as logs:
                response=self.post('/api/export',{'name':'Nome segreto'})
        self.assertEqual(response.status_code,500)
        self.assertNotIn('Nome segreto',''.join(logs.output));self.assertNotIn('sensitive',''.join(logs.output))
        self.assertFalse(list(Path(self.tmp.name).iterdir()))
        self.assertEqual(self.post('/api/export',{'mode':'nes'}).status_code,200)

    def test_busy_renderer_does_not_block_sprites(self):
        self.server.RENDER_GATE.acquire()
        try:
            self.assertEqual(self.post('/api/preview').status_code,429)
            self.assertEqual(self.post('/api/sprite').status_code,200)
        finally:self.server.RENDER_GATE.release()

    def test_no_directory_or_path_traversal(self):
        for path in ('/var/exports/','/assets/','/download/','/static/../../app/server.py','/download/not-a-token'):
            self.assertEqual(self.client.get(path).status_code,404)

    def test_explicit_lan_override_and_offline_fallback(self):
        with patch.dict('os.environ',{'POSTCARD_LAN_IP':'192.168.50.23'}):
            self.assertTrue(self.server.base_url().startswith('http://192.168.50.23:'))
        with patch.object(self.server,'lan_candidates',return_value=['127.0.0.1']):
            diag=self.client.get('/api/diagnostics').json
            self.assertTrue(diag['warnings']);self.assertEqual(self.client.get('/healthz').status_code,200)

if __name__=='__main__': unittest.main()
