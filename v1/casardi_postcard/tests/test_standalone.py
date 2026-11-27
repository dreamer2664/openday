"""Structural and in-process HTTP checks for the self-contained full creator.
These are not physical-phone or real-school-network tests.
"""
import ast
import base64
import hashlib
from html.parser import HTMLParser
import io
import json
from pathlib import Path
import re
import unittest
from fontTools.ttLib import TTFont

ROOT=Path(__file__).resolve().parent.parent
HTML=ROOT/'Cartolina_Casardi_PC_e_Telefono.html'

class Resources(HTMLParser):
    def __init__(self):super().__init__();self.external=[];self.scripts=0
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if tag=='script':self.scripts+=1
        for key in (['src'] if tag in ('img','script','iframe','audio','video','source') else ['href'] if tag=='link' else []):
            value=d.get(key)
            if value and not value.startswith(('data:','blob:')):self.external.append((tag,value))

class StandaloneTests(unittest.TestCase):
    def test_every_runtime_resource_embedded_and_no_connections(self):
        text=HTML.read_text();parser=Resources();parser.feed(text)
        self.assertFalse(parser.external);self.assertEqual(parser.scripts,2)
        self.assertNotIn('/*__',text)
        self.assertIn("connect-src 'self'",text)
        self.assertNotRegex(text,r'<script[^>]+src=')
        for value in re.findall(r'url\([\s\"\']*([^\)\"\']+)',text):
            self.assertTrue(value.startswith('data:') or 'PORTABLE.' in value,value[:80])

    def test_build_hashes_and_all_twelve_sources(self):
        r=json.loads((ROOT/'docs/test-results/standalone-build.json').read_text())
        self.assertEqual(r['sha256'],hashlib.sha256(HTML.read_bytes()).hexdigest())
        self.assertEqual(len(r['photos']),12)
        for sid,item in r['photos'].items():
            self.assertEqual(item['source_sha256'],hashlib.sha256((ROOT/'assets/photos'/sid/'source.jpg').read_bytes()).hexdigest())
            self.assertLessEqual(max(item['embedded_dimensions']),3000)
        self.assertEqual(r['photos']['casardi']['embedded_dimensions'],[707,491])

    def test_modified_reserved_font_is_renamed(self):
        match=re.search(r'font-family:"Pixel";src:url\("data:font/woff;base64,([^\"]+)',HTML.read_text())
        self.assertIsNotNone(match)
        f=TTFont(io.BytesIO(base64.b64decode(match[1])))
        names={n.toUnicode() for n in f['name'].names if n.nameID in (1,4,16,18)}
        self.assertEqual(names,{'Casardi Pixel'})
        self.assertTrue(any('Copyright 2012' in n.toUnicode() for n in f['name'].names if n.nameID==0))

    def test_canonical_nes_pixels_and_manifest_are_embedded_unchanged(self):
        match=re.search(r'<script id="embedded-data" type="application/json">(.*?)</script>',HTML.read_text(),re.S)
        self.assertIsNotNone(match)
        data=json.loads(match[1])
        self.assertEqual(data['nesArt'],json.loads((ROOT/'assets/nes/manifest.json').read_text()))
        for sid,images in data['images'].items():
            self.assertEqual(base64.b64decode(images['nes'].split(',',1)[1]),(ROOT/'assets/nes'/(sid+'.png')).read_bytes())

    def test_go_download_page_font_is_embedded_renamed_and_licensed(self):
        match=re.search(r'const phoneFontData = "([^"]+)"',(ROOT/'service/phone_font.go').read_text())
        self.assertIsNotNone(match)
        font=TTFont(io.BytesIO(base64.b64decode(match[1])))
        names={n.toUnicode() for n in font['name'].names if n.nameID in (1,4,16,18)}
        self.assertEqual(names,{'Casardi Pixel'})
        self.assertTrue(any('Copyright 2012' in n.toUnicode() for n in font['name'].names if n.nameID==0))
        self.assertTrue(any('Open Font License' in n.toUnicode() for n in font['name'].names if n.nameID==13))

    def test_phone_route_full_creator_no_owner_or_card(self):
        from app import server
        client=server.app.test_client(use_cookies=False);before=len(server.store.cards)
        for path in ('/telefono','/telefono/'):
            with client.get(path) as r:
                self.assertEqual(r.status_code,200)
                self.assertEqual(hashlib.sha256(r.data).digest(),hashlib.sha256(HTML.read_bytes()).digest())
                self.assertNotIn('Set-Cookie',r.headers)
                self.assertIn('no-store',r.headers['Cache-Control'])
                self.assertIn("connect-src 'none'",r.headers['Content-Security-Policy'])
        self.assertEqual(len(server.store.cards),before)
        with client.get('/') as r:self.assertIn("script-src 'self';",r.headers['Content-Security-Policy'])

    def test_phone_creator_qr_really_contains_creator_url(self):
        from app import server
        from PIL import Image
        import zxingcpp
        d=server.app.test_client().get('/api/diagnostics').json
        self.assertTrue(d['phone_creator_url'].endswith('/telefono'))
        qr=Image.open(io.BytesIO(base64.b64decode(d['phone_creator_qr'].split(',')[1]))).convert('RGB')
        self.assertEqual(zxingcpp.read_barcode(qr).text,d['phone_creator_url'])

    def test_translator_current_and_rejects_unsupported_syntax(self):
        from scripts.sprite_to_js import generate,Translator
        self.assertEqual(generate(ROOT),(ROOT/'browser/sprites.js').read_text())
        with self.assertRaises(TypeError):Translator().module(ast.parse('while True:\n    pass\n'))

if __name__=='__main__':unittest.main()
