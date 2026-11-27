"""Regression tests for user-reported inert character controls."""
import base64
import io
import re
import tempfile
import unittest
from PIL import Image
from app.catalogue import normalise_character,ValidationError
from app.character import default_spec,render
from app.control_effects import assess,apply_field,visible_diff,values_for
from app.storage import CardStore


class ControlTests(unittest.TestCase):
    def test_shorts_are_not_long_pants(self):
        s={**default_spec(),'top':'tshirt','shoes':'sandali'}
        self.assertGreater(visible_diff(render({**s,'bottom':'jeans'}),render({**s,'bottom':'shorts'})),10)

    def test_denim_colours_no_longer_alias_fabric_colours(self):
        for a,b in [('jeans','blu'),('jeans-scuro','navy'),('beige','crema')]:
            self.assertGreater(visible_diff(render({'bottom_color':a}),render({'bottom_color':b})),0,(a,b))

    def test_headphones_colour_really_changes_pixels(self):
        self.assertGreater(visible_diff(render({'hat':'cuffie','hat_color':'rosso'}),render({'hat':'cuffie','hat_color':'blu'})),15)

    def test_hood_keeps_but_explicitly_occludes_hair_options(self):
        s={**default_spec(),'hat':'cappuccio','hair':'trecce'};r=assess(s,['hair'])['hair']
        self.assertTrue(all(n==0 for n in r['pixels'].values()))
        self.assertEqual(r['reveal'],{'hat':'none'})
        self.assertEqual(normalise_character(s)['hair'],'trecce')
        self.assertGreater(visible_diff(render({**s,**r['reveal']}),render({**s,**r['reveal'],'hair':'coda'})),0)

    def test_closed_eye_colour_is_not_counted_as_successful_effect(self):
        r=assess({**default_spec(),'expression':'sorriso'},['eyes'])['eyes']
        self.assertTrue(all(n==0 for n in r['pixels'].values()))
        self.assertEqual(r['reveal'],{'expression':'neutra'})

    def test_visor_blocks_eye_shape_until_explicitly_removed(self):
        r=assess({**default_spec(),'glasses':'visore'},['eye_shape'])['eye_shape']
        self.assertTrue(all(n==0 for n in r['pixels'].values()))
        self.assertEqual(r['reveal'],{'glasses':'none'})

    def test_coat_hides_belt_instead_of_drawing_it_over_coat(self):
        r=assess({**default_spec(),'build':'medio','top':'cappotto'},['belt_color'])['belt_color']
        self.assertTrue(all(n==0 for n in r['pixels'].values()))
        self.assertEqual(r['reveal'],{'top':'cyber_jacket'})

    def test_pose_button_puts_held_object_away_before_comparison(self):
        s={**default_spec(),'held':'libro','pose':'libro'};n=apply_field(s,'pose','movimento')
        self.assertEqual(n['held'],'none');self.assertEqual(n['pose'],'movimento')
        self.assertGreater(visible_diff(render(s),render(n)),100)

    def test_incompatible_garment_is_not_a_successful_visual_choice(self):
        self.assertIsNone(assess(default_spec(),['top'])['top']['pixels']['cappotto'])

    def test_transparent_rgb_is_not_a_visible_difference(self):
        from app.pixel import PixelCanvas
        a=PixelCanvas(1,1);b=PixelCanvas(1,1);b.buf[0]=(255,20,20,0)
        self.assertEqual(visible_diff(a,b),0)

    def test_bad_field_and_oversized_field_list_rejected(self):
        for fields in (['not-a-control'],['hair']*13,'hair',[{}]):
            with self.assertRaises(ValidationError):assess(default_spec(),fields)


class EffectsApiTests(unittest.TestCase):
    def setUp(self):
        from app import server
        self.s=server;self.tmp=tempfile.TemporaryDirectory();self.previous=server.store
        server.store=CardStore(self.tmp.name,600);self.client=server.app.test_client()
        r=self.client.get('/');csrf=re.search(rb'name="kiosk-csrf" content="([^"]+)"',r.data)[1].decode()
        self.headers={'X-Kiosk-CSRF':csrf,'X-Kiosk-Generation':'0'}

    def tearDown(self):
        self.s.store.close();self.s.store=self.previous;self.tmp.cleanup()

    def test_endpoint_returns_actual_effects_and_actual_face_crop(self):
        c={**default_spec(),'glasses':'visore'}
        r=self.client.post('/api/control-effects',json={'character':c,'fields':['eye_shape','hair']},headers=self.headers)
        self.assertEqual(r.status_code,200);self.assertEqual(r.json['effects'],assess(c,['eye_shape','hair']))
        with Image.open(io.BytesIO(base64.b64decode(r.json['face'].split(',')[1]))) as im:self.assertEqual(im.size,(28,28))

    def test_endpoint_uses_existing_capability_and_input_validation(self):
        self.assertEqual(self.client.post('/api/control-effects',json={}).status_code,403)
        for fields in ('hair',['unknown'],['hair']*13):
            r=self.client.post('/api/control-effects',json={'fields':fields},headers=self.headers);self.assertEqual(r.status_code,400)


if __name__=='__main__':unittest.main()
