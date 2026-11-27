"""Optional decoration/placement tests; no physical-device claims."""
import base64,copy,hashlib,io,json,math
from pathlib import Path
import unittest
from unittest.mock import patch
from PIL import Image
from app import layout_edit as e
from app.catalogue import normalise_job,ValidationError
from app import postcard as pc
from app.credits import credit_for,credit_text,png_bytes
ROOT=Path(__file__).resolve().parent.parent
class CompositionTests(unittest.TestCase):
 def test_empty_is_genuinely_undecorated(self):
  c=normalise_job({})['composition'];self.assertEqual(c,e.default_composition());self.assertIsNone(c['actor']);self.assertEqual(c['stickers'],[]);self.assertFalse(e.has_custom_plaque({}));self.assertEqual(e.credits({}),'')
 def test_independent_defaults(self):
  a=e.normalise();b=e.normalise();a['plaque']['theme']='notte';a['stickers'].append({});self.assertEqual(b,e.default_composition())
 def test_no_extra_credits_by_default(self):
  self.assertNotIn('DECORAZIONI',credit_text(credit_for(normalise_job({}))));self.assertNotIn('Logo ufficiale',credit_text(credit_for(normalise_job({}))))
 def test_invalid_actor_inputs_are_not_coerced(self):
  for actor in [[],3,'x',{'x':True,'y':200},{'x':1.2,'y':200},{'x':-1,'y':200},{'x':300,'y':401},{'x':300,'y':200,'scale':0},{'x':None,'y':100},{'x':300,'y':200,'scale':136}]:
   with self.subTest(actor=actor),self.assertRaises(ValidationError):normalise_job({'composition':{'actor':actor}})
 def test_invalid_plaque_inputs(self):
  for plaque in [[],None,False,{'theme':'neon'},{'ornament':'https://bad'},{'position':'outside'},{'track':'other'},{'theme':None}]:
   with self.subTest(plaque=plaque),self.assertRaises(ValidationError):normalise_job({'composition':{'plaque':plaque}})
 def test_invalid_stickers_and_maximum(self):
  for stickers in [None,{},'x',[None],[{'id':'../logo'}],[{'id':'pegaso','x':-1}],[{'id':'alloro','size':133}],[{'id':'libro','rotation':31}],[{'id':'pegaso','rotation':False}],[{'id':'alloro'}]*7]:
   with self.subTest(stickers=stickers),self.assertRaises(ValidationError):normalise_job({'composition':{'stickers':stickers}})
 def test_official_logo_not_rotatable(self):
  with self.assertRaises(ValidationError):normalise_job({'composition':{'stickers':[{'id':'logo_casardi','rotation':5}]}})
 def test_six_stickers_are_valid(self):
  c=e.normalise({'stickers':[dict(id=sid) for sid in list(e.sticker_manifest()['stickers'])[:6]]});self.assertEqual(len(c['stickers']),6)
 def test_no_unknown_paths_or_free_text_in_normalized_layout(self):
  c=e.normalise({'script':'x','actor':{'x':300,'y':300,'scale':100,'url':'xx'},'plaque':{'html':'<script>'},'stickers':[{'id':'alloro','path':'xx'}]});self.assertEqual(set(c),{'actor','plaque','stickers'});self.assertNotIn('url',c['actor']);self.assertNotIn('html',c['plaque']);self.assertNotIn('path',c['stickers'][0])
 def test_actor_group_remains_inside_frame_at_edges(self):
  p=dict(w=47,h=61,anchor=21);a=dict(w=38,h=40,anchor=19)
  from app.scenes import PHOTO_SCENES
  for mode in ['photo','nes']:
   for scene in PHOTO_SCENES:
    for scale in [65,100,135]:
     for x,y in [(0,0),(600,400),(300,0),(0,400),(600,0)]:
      j=normalise_job(dict(mode=mode,scene=scene,companion=dict(animal='gatto'),composition=dict(actor=dict(x=x,y=y,scale=scale))));g=e.actor_geometry(j,p,a,40)['group'];self.assertGreaterEqual(g['x']+1e-6,11.5);self.assertGreaterEqual(g['y']+1e-6,11.5);self.assertLessEqual(g['x']+g['w'],588.5);self.assertLessEqual(g['y']+g['h'],388.5)
 def test_companion_follows_player_without_changing_its_relative_scale(self):
  j=normalise_job(dict(scene='paestum',companion=dict(animal='cane'),composition=dict(actor=dict(x=250,y=300,scale=100))));g=e.actor_geometry(j,dict(w=36,h=60,anchor=18),dict(w=40,h=32,anchor=20),32);j['composition']['actor']['x']=300;h=e.actor_geometry(j,dict(w=36,h=60,anchor=18),dict(w=40,h=32,anchor=20),32);self.assertEqual(h['companion']['cx']-g['companion']['cx'],50);self.assertEqual(g['companion']['ground'],g['character']['ground']);self.assertEqual(h['companion']['scale'],g['companion']['scale'])
 def test_rotated_sticker_bounds(self):
  for sid in e.sticker_manifest()['stickers']:
   for angle in ([-30,0,30] if sid!='logo_casardi' else [0]):
    for x,y in [(0,0),(600,400),(300,200)]:
     g=e.sticker_geometry(dict(id=sid,x=x,y=y,size=132,rotation=angle));self.assertGreaterEqual(g['x'],10-1e-6);self.assertGreaterEqual(g['y'],10-1e-6);self.assertLessEqual(g['x']+g['box_w'],590+1e-6);self.assertLessEqual(g['y']+g['box_h'],390+1e-6)
 def test_source_hashes_and_native_originals(self):
  m=e.sticker_manifest()['stickers'];self.assertEqual(len(m),8)
  for sid,r in m.items():
   for mode,path in r['paths'].items():self.assertEqual(hashlib.sha256((ROOT/path).read_bytes()).hexdigest(),r['sha256'][mode])
   with Image.open(ROOT/r['paths']['photo']) as im:
    if sid!='logo_casardi':self.assertEqual(im.size,(96,96));self.assertLessEqual(len(im.getcolors(1000000)),64);self.assertEqual(im.getchannel('A').getextrema()[0],0)
    else:self.assertEqual(im.size,(387,506));self.assertIn('brochure',im.info['Source'].lower());self.assertIn('non è lo stemma',im.info['Description'].lower())
 def test_default_route_preserves_legacy_no_decoration(self):
  with patch('app.postcard._compose_optional',side_effect=AssertionError('Decorations must remain opt-in')):self.assertEqual(pc.compose(normalise_job(dict(mode='nes')),600).size,(600,400))
 def test_edit_layers_do_not_contaminate_export(self):
  j=normalise_job(dict(mode='nes',composition=dict(actor=dict(x=400,y=330,scale=100),stickers=[dict(id='pegaso',x=500,y=100)])));im=pc.compose(j,600,editor=True);self.assertTrue(hasattr(im,'editor'));self.assertEqual(im.editor['clean'].size,(600,400));self.assertIn('character',im.editor['meta']);self.assertEqual(im.editor['ghost'].mode,'RGBA');full=pc.compose(j,600);self.assertFalse(hasattr(full,'editor'));self.assertNotEqual(full.tobytes(),im.tobytes())
 def test_selected_only_attributions_and_png(self):
  j=normalise_job(dict(mode='nes',composition=dict(plaque=dict(ornament='logo_casardi',track='classico'),stickers=[dict(id='alloro')])));text=credit_text(credit_for(j));self.assertIn('POF-26-27',text);self.assertIn('CC BY 4.0',text);self.assertIn('Corona d’alloro',text);self.assertNotIn('Astrolabio:',text)
  with Image.open(io.BytesIO(png_bytes(pc.compose(j,600),j))) as im:self.assertIn('Logo ufficiale Casardi',im.info['Description']);self.assertIn('PERSONAGGIO MODULARE LPC',im.info['Description'])
 def test_every_new_option_is_rendered_and_nes_upsampling_is_exact(self):
  base=normalise_job(dict(mode='nes'));before=pc.compose(base,600).tobytes()
  for field,values in dict(theme=e.THEMES[1:],track=list(e.TRACKS)[1:],ornament=list(e.sticker_manifest()['stickers']),position=e.POSITIONS[1:]).items():
   for value in values:
    j=copy.deepcopy(base);j['composition']['plaque'][field]=value;im=pc.compose(j,600);self.assertNotEqual(before,im.tobytes(),(field,value))
  j=copy.deepcopy(base);j['composition']=e.normalise(dict(actor=dict(x=250,y=300,scale=115),stickers=[dict(id='logo_casardi',size=88),dict(id='teatro',rotation=15)]));small=pc.compose(j,600);large=pc.compose(j,3000);self.assertEqual(large.tobytes(),small.resize((3000,2000),Image.Resampling.NEAREST).tobytes())
 def test_api_editor_and_logo_are_local_validated_and_nonpersistent(self):
  from app import server
  client=server.app.test_client();response=client.get('/');import re
  csrf=re.search(rb'name="kiosk-csrf" content="([^"]+)',response.data)[1].decode();headers={'X-Kiosk-CSRF':csrf};before=len(server.store.cards)
  r=client.post('/api/editor-preview',json=dict(mode='nes'),headers=headers);self.assertEqual(r.status_code,200);self.assertIn('no-store',r.headers['Cache-Control']);data=r.json;self.assertEqual(set(data),{'image','clean','ghost','meta'});self.assertTrue(data['image'].startswith('data:image/png;'));self.assertEqual(len(server.store.cards),before)
  r=client.post('/api/editor-preview',json=dict(composition=dict(stickers=[dict(id='https://bad')])),headers=headers);self.assertEqual(r.status_code,400)
  with client.get('/stickers/logo_casardi.png?mode=nes') as r:self.assertEqual(r.status_code,200);self.assertEqual(r.data,(ROOT/'assets/stickers/logo_casardi-nes.png').read_bytes())
  with client.get('/stickers/not-a-logo.png') as r:self.assertEqual(r.status_code,404)
if __name__=='__main__':unittest.main()
