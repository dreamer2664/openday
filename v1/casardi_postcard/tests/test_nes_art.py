"""Revised native paintings: integrity/grid checks, not aesthetic certification."""
from pathlib import Path
import hashlib
import json
import tempfile
import unittest
from unittest.mock import patch
import numpy as np
from PIL import Image
from app import nes_art
from app.character import default_spec
from app.postcard import compose
from app.scenes import NES_SCENES,build_nes_scene

ROOT=Path(__file__).resolve().parent.parent

class NesArtTests(unittest.TestCase):
    def test_manifest_has_twelve_distinct_architectural_sources(self):
        m=nes_art.art_manifest()
        self.assertEqual(set(m['scenes']),set(NES_SCENES))
        self.assertEqual(m['native_grid'],[600,400])
        self.assertIn('AI-assisted',m['disclosure'])
        self.assertEqual(len({r['sha256'] for r in m['scenes'].values()}),12)
        for r in m['scenes'].values():self.assertTrue(r['landmarks'] and r['reference_photo'].startswith('https://commons.wikimedia.org/'))

    def test_native_png_dimensions_palette_opacity_and_hashes(self):
        for sid,r in nes_art.art_manifest()['scenes'].items():
            with self.subTest(scene=sid):
                path=ROOT/r['path'];self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(),r['sha256'])
                with Image.open(path) as im:
                    self.assertEqual(im.size,(600,400));self.assertLessEqual(len(im.convert('RGB').getcolors(1000000)),64)
                    self.assertEqual(im.convert('RGBA').getchannel('A').getextrema(),(255,255))
                    self.assertIn('assistita da IA',im.info['Description'])
                    self.assertIn('CC BY-SA 4.0',im.info['Copyright'])

    def test_licensed_reference_bytes_are_preserved(self):
        m=json.loads((ROOT/'assets/photos/photo_metadata.json').read_text())
        for sid,r in nes_art.art_manifest()['scenes'].items():
            self.assertEqual(r['reference_local_sha256'],hashlib.sha256((ROOT/'assets/photos'/sid/'source.jpg').read_bytes()).hexdigest())
            self.assertEqual(r['reference_license'],m[sid]['lic'])

    def test_loader_returns_exact_source_pixels(self):
        for sid in NES_SCENES:
            with Image.open(ROOT/'assets/nes'/(sid+'.png')) as im:
                self.assertTrue(np.array_equal(np.asarray(nes_art.load_nes_art(sid)),np.asarray(im.convert('RGBA'))))

    def test_pixelcanvas_adapter_preserves_all_pixels(self):
        for sid in NES_SCENES:
            self.assertEqual(build_nes_scene(sid).buf,list(nes_art.load_nes_art(sid).getdata()))

    def test_catalogue_keeps_photo_and_nes_notes_distinct(self):
        from app.catalogue import public_catalogue
        for scene in public_catalogue(600,'qa')['scenes']:
            self.assertNotEqual(scene['note'],scene['nes_note'])
            if scene['id']=='casardi':
                self.assertIn('1936',scene['note']);self.assertIn('1936',scene['nes_note'])
                self.assertIn('a colori',scene['nes_note']);self.assertNotIn('attenuati',scene['nes_note'])

    def test_unknown_scene_does_not_fall_back_to_old_art(self):
        with self.assertRaises(KeyError):nes_art.load_nes_art('invented-school')

    def test_tampering_is_an_explicit_error(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);(root/'bad.png').write_bytes(b'not the expected PNG')
            with patch.object(nes_art,'ROOT',root),patch.object(nes_art,'art_manifest',return_value={'scenes':{'test':{'path':'bad.png','sha256':'0'*64}}}):
                nes_art.load_nes_art.cache_clear()
                with self.assertRaisesRegex(ValueError,'modificato o incompleto'):nes_art.load_nes_art('test')
            nes_art.load_nes_art.cache_clear()

    def test_all_twelve_hd_exports_are_exact_native_nearest_neighbour(self):
        for sid in NES_SCENES:
            with self.subTest(scene=sid):
                job=dict(scene=sid,mode='nes',name='Èlisa',character=default_spec())
                native=compose(job,600);full=compose(job,3000)
                self.assertEqual(full.size,(3000,2000))
                self.assertTrue(np.array_equal(np.asarray(full),np.asarray(native.resize(full.size,Image.Resampling.NEAREST))))

if __name__=='__main__':unittest.main()
