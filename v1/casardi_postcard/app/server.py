"""Local kiosk + expiring, token-based LAN downloads. Run: python -m app.server.

Waitress serves one process (the temporary index is intentionally in RAM).
No access logging, telemetry, external requests, accounts or API keys.
"""
from __future__ import annotations
import atexit
import base64
from functools import lru_cache
import hashlib
import io
import ipaddress
import logging
import os
from pathlib import Path
import secrets
import signal
import socket
import threading
import time
from urllib.parse import urlsplit

from flask import (Flask, Response, abort, g, jsonify, render_template, request,
                   send_from_directory, session)
from PIL import Image
import qrcode
from werkzeug.exceptions import HTTPException

from . import postcard as pc
from .animals import ANIMALS, draw_animal
from .catalogue import (CHOICES, ValidationError, normalise_character,
                        normalise_companion, normalise_job, public_catalogue)
from .character import default_spec, render as render_char
from .credits import credit_for, credit_text, photo_metadata, png_bytes
from .imgutil import to_pil
from .scenes import PHOTO_SCENES
from .storage import CardStore, CancelledExport

ROOT=Path(__file__).resolve().parent.parent
WEB=ROOT/'web'
def env_integer(name, default, low, high):
    try:
        value=int(os.environ.get(name,str(default)))
        if not low<=value<=high: raise ValueError()
        return value
    except ValueError:
        raise SystemExit(f'{name}: inserisci un numero intero fra {low} e {high}.')

PORT=env_integer('POSTCARD_PORT',8080,1024,65535)
TTL_SECONDS=env_integer('POSTCARD_TTL_SECONDS',600,300,600)
EXPORT_DIR=Path(os.environ.get('POSTCARD_EXPORT_DIR') or ROOT/'var/exports')
THUMB_DIR=ROOT/'var/thumbs'
THUMB_DIR.mkdir(parents=True,exist_ok=True)
ASSET_REVISION=hashlib.sha256(b''.join((ROOT/'app'/f).read_bytes() for f in
    ('character.py','cyber_layers.py','animals.py','scenes.py','pixel.py','postcard.py','palette.py'))+
    (ROOT/'assets/photos/photo_metadata.json').read_bytes()+
    b''.join((ROOT/cfg['photo']).read_bytes() if (ROOT/cfg['photo']).is_file() else b'missing'
             for cfg in PHOTO_SCENES.values())).hexdigest()[:10]

# Strictly one in-flight composite: bounds peak RAM; sprites remain independent.
RENDER_GATE=threading.BoundedSemaphore(1)
try:
    store=CardStore(EXPORT_DIR,TTL_SECONDS,clean_start=False)
except OSError:
    raise SystemExit('Cartella temporanea non scrivibile. Controlla POSTCARD_EXPORT_DIR e i permessi del PC.')
atexit.register(store.close)
app=Flask(__name__,static_folder=None,template_folder=str(WEB/'templates'))
app.secret_key=secrets.token_bytes(32)  # rotated on restart; never stored in the ZIP
app.config.update(MAX_CONTENT_LENGTH=64*1024,SESSION_COOKIE_HTTPONLY=True,
                  SESSION_COOKIE_SAMESITE='Strict',SESSION_COOKIE_NAME='casardi_kiosk',
                  SESSION_COOKIE_SECURE=False)
logging.getLogger('werkzeug').disabled=True
CAPABILITIES = {}  # random CSRF capability -> anonymous owner; enables embedded previews without third-party cookies


def lan_candidates():
    candidates=[]
    forced=os.environ.get('POSTCARD_LAN_IP')
    if forced:
        ipaddress.IPv4Address(forced)
        candidates.append(forced)
    # UDP connect selects the route but sends NO packets (works without Internet).
    try:
        with socket.socket(socket.AF_INET,socket.SOCK_DGRAM) as sock:
            sock.connect(('10.255.255.255',1))
            candidates.append(sock.getsockname()[0])
    except OSError: pass
    try:
        candidates.extend(i[4][0] for i in socket.getaddrinfo(socket.gethostname(),None,socket.AF_INET))
    except OSError: pass
    return list(dict.fromkeys(candidates))


def lan_ip():
    forced=os.environ.get('POSTCARD_LAN_IP')
    if forced:
        return str(ipaddress.IPv4Address(forced))
    candidates=lan_candidates()
    for ip in candidates:
        if not ipaddress.ip_address(ip).is_loopback and not ipaddress.ip_address(ip).is_link_local:
            return ip
    return candidates[0] if candidates else '127.0.0.1'


def base_url():
    override=os.environ.get('POSTCARD_BASE_URL','').rstrip('/')
    if override:
        p=urlsplit(override)
        if p.scheme not in ('http','https') or not p.hostname or p.username or p.password or p.query or p.fragment or p.path not in ('','/'):
            raise ValueError('POSTCARD_BASE_URL non valido: usa http://IP-LAN:PORTA')
        return override
    return f'http://{lan_ip()}:{PORT}'


@app.before_request
def protect_writes():
    if request.path.startswith('/api/') and request.method=='POST':
        owner=CAPABILITIES.get(request.headers.get('X-Kiosk-CSRF',''))
        if not owner:
            return jsonify(error='Sessione non valida: riapri la schermata iniziale sul PC.'),403
        g.owner=owner
        if not request.is_json:
            return jsonify(error='È richiesta una richiesta JSON.'),415
        if request.path=='/api/export':
            try: generation=int(request.headers.get('X-Kiosk-Generation','-1'))
            except ValueError: generation=-1
            if generation!=store.generation(owner):
                return jsonify(error='Esportazione annullata: la sessione è stata resettata.'),409
            g.generation=generation


@app.after_request
def response_headers(res):
    if request.path.startswith(('/api/','/download/','/d/')) or request.path in ('/','/network-test','/healthz','/telefono','/telefono/'):
        res.headers['Cache-Control']='no-store, max-age=0'
    res.headers['X-Content-Type-Options']='nosniff'
    res.headers['Referrer-Policy']='no-referrer'
    # Do not set X-Frame-Options / frame-ancestors: the sandbox preview is embedded.
    res.headers['Content-Security-Policy']=("default-src 'self'; img-src 'self' data: blob:; "
        "style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self'; "
        "connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'")
    if request.endpoint=='phone_creator':
        # This audited, self-contained file has inline code/fonts by design.
        # Its different policy is scoped to /telefono, never the kiosk/API.
        res.headers['Content-Security-Policy']=("default-src 'none'; script-src 'unsafe-inline'; "
            "style-src 'unsafe-inline'; img-src data: blob:; font-src data:; "
            "connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'")
    return res


def json_body():
    data=request.get_json(silent=True)
    if not isinstance(data,dict): raise ValidationError('La richiesta deve contenere un oggetto JSON.')
    return data


@app.errorhandler(ValidationError)
def invalid(exc): return jsonify(error=str(exc)),400


@app.errorhandler(Exception)
def errors(exc):
    if isinstance(exc,HTTPException):
        if request.path.startswith('/api/'):
            return jsonify(error='Richiesta non valida o risorsa non disponibile.'),exc.code
        if exc.code in (404,410): return render_template('expired.html'),exc.code
        return 'Richiesta non valida.',exc.code
    # Never log request bodies, tokens, names or exception messages containing them.
    app.logger.error('Errore interno (%s); nessun dato visitatore registrato.',type(exc).__name__)
    if request.path.startswith('/api/'):
        return jsonify(error='Operazione non riuscita. Riprova; se persiste, avvisa l’operatore.'),500
    return 'Operazione non riuscita. Avvisa l’operatore.',500


@app.get('/')
def index():
    if not session.get('owner'):
        session['owner']=secrets.token_urlsafe(24)
        session['csrf']=secrets.token_urlsafe(24)
    CAPABILITIES[session['csrf']]=session['owner']
    return render_template('index.html',csrf=session['csrf'],app_version='3.0',
                           lpc_credits=(ROOT/'assets/characters/CREDITI_LPC.txt').read_text(encoding='utf-8'))


@app.get('/telefono')
@app.get('/telefono/')
def phone_creator():
    # The complete creator runs on the phone, not a download-only template.
    # No CSRF owner, visitor PNG or token is allocated for this public file.
    filename='Cartolina_Casardi_PC_e_Telefono.html'
    if not (ROOT/filename).is_file():
        return 'File HTML completo mancante. Ripristina il pacchetto distribuito.',503
    return send_from_directory(ROOT,filename,mimetype='text/html')


@app.get('/healthz')
def healthz(): return 'ok'


@app.get('/network-test')
def network_test(): return render_template('network.html')


@app.get('/api/options')
def options(): return jsonify(public_catalogue(TTL_SECONDS,ASSET_REVISION))


def image_response(image, fmt='PNG'):
    buf=io.BytesIO()
    image.save(buf,fmt,**({'quality':90} if fmt=='JPEG' else {}))
    return Response(buf.getvalue(),mimetype='image/jpeg' if fmt=='JPEG' else 'image/png')


@app.post('/api/sprite')
def sprite():
    data=json_body()
    spec=normalise_character(data.get('character'),allow_blink=True)
    scale=data.get('scale',5)
    if not isinstance(scale,int) or isinstance(scale,bool) or not 1<=scale<=8:
        raise ValidationError('Scala dello sprite non valida.')
    mode='nes' if data.get('mode')=='nes' else 'photo'
    img=pc.crop_sprite(render_char(spec,style=mode))
    img=img.resize((img.width*scale,img.height*scale),Image.Resampling.NEAREST)
    return image_response(img)


@app.post('/api/companion')
def companion():
    data=json_body(); comp=normalise_companion(data.get('companion'))
    if not comp: return Response(status=204)
    mode='nes' if data.get('mode')=='nes' else 'photo'
    img=pc.crop_sprite(draw_animal(comp['animal'],comp['variant'],comp['pose'],style=mode))
    return image_response(img.resize((img.width*4,img.height*4),Image.Resampling.NEAREST))


def render_card(job,width):
    if not RENDER_GATE.acquire(blocking=False):
        return None,(jsonify(error='Composizione già in corso. Attendi un momento e riprova.'),429)
    try: return pc.compose(job,width),None
    finally: RENDER_GATE.release()


@app.post('/api/preview')
def preview():
    job=normalise_job(json_body())
    image,error=render_card(job,1200)
    if error: return error
    return image_response(image,'PNG' if job['mode']=='nes' else 'JPEG')


@app.post('/api/export')
def export():
    job=normalise_job(json_body())
    owner=g.owner;generation=g.generation
    if not RENDER_GATE.acquire(blocking=False):
        return jsonify(error='Composizione già in corso. Attendi un momento e riprova.'),429
    started=time.perf_counter()
    try:
        data=png_bytes(pc.compose_full(job),job)
        try: card=store.register(owner,generation,data,credit_for(job))
        except CancelledExport: return jsonify(error='Esportazione annullata dal reset.'),409
    finally: RENDER_GATE.release()
    url=f'{base_url()}/download/{card.token}'
    qr=qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M,box_size=8,border=4)
    qr.add_data(url);qr.make(fit=True)
    qbuf=io.BytesIO();qr.make_image(fill_color='#111c2b',back_color='white').save(qbuf,format='PNG')
    return jsonify(token=card.token,url=url,
        qr='data:image/png;base64,'+base64.b64encode(qbuf.getvalue()).decode(),
        file_url=f'/download/{card.token}/file.png',
        credits_url=f'/download/{card.token}/crediti.txt',
        expires_in=TTL_SECONDS,expires_at=int(card.expires),bytes=len(data),
        size=[3000,2000],render_seconds=round(time.perf_counter()-started,2),
        filename='cartolina-casardi.png')


@app.post('/api/reset')
def reset():
    removed=store.reset(g.owner)
    return jsonify(ok=True,removed=removed,generation=store.generation(g.owner))


@app.get('/api/diagnostics')
def diagnostics():
    ip=lan_ip();address=ipaddress.ip_address(ip)
    warnings=[]
    if address.is_loopback or address.is_link_local:
        warnings.append('Non è stato trovato un normale indirizzo LAN: controlla Wi-Fi/Ethernet o imposta POSTCARD_LAN_IP.')
    try:
        with socket.create_connection(('127.0.0.1',PORT),timeout=1): listening=True
    except OSError: listening=False
    url=base_url()+'/network-test'
    qr=qrcode.make(url,box_size=5,border=4);b=io.BytesIO();qr.save(b,format='PNG')
    phone_url=base_url()+'/telefono'
    phone_qr=qrcode.make(phone_url,box_size=5,border=4);pb=io.BytesIO();phone_qr.save(pb,format='PNG')
    return jsonify(lan_ip=ip,candidates=lan_candidates(),port=PORT,base_url=base_url(),
        listening=listening,ttl_seconds=TTL_SECONDS,active_cards=store.stats(),warnings=warnings,
        phone_creator_url=phone_url,phone_creator_qr='data:image/png;base64,'+base64.b64encode(pb.getvalue()).decode(),
        network_test_url=url,network_test_qr='data:image/png;base64,'+base64.b64encode(b.getvalue()).decode(),
        export_dir=str(EXPORT_DIR),photos={sid:(ROOT/cfg['photo']).is_file()
                                          for sid,cfg in PHOTO_SCENES.items()})


@app.get('/api/credits')
def credits():
    return jsonify({sid:credit_for(dict(scene=sid,mode='photo')) for sid in PHOTO_SCENES})


def thumb_path(scene,mode):
    return THUMB_DIR/f'{ASSET_REVISION}-{scene}-{mode}.{("png" if mode=="nes" else "jpg")}'


def build_thumbnail(scene,mode):
    path=thumb_path(scene,mode)
    if not path.is_file():
        img=pc.nes_background(scene,600) if mode=='nes' else pc.photo_background(scene,600)[0]
        tmp=path.with_suffix('.part')
        img.convert('RGB').save(tmp,'PNG' if mode=='nes' else 'JPEG',**({} if mode=='nes' else {'quality':88}))
        tmp.replace(path)
    return path


@app.get('/thumbs/<scene>-<mode>.<ext>')
def thumb(scene,mode,ext):
    if scene not in PHOTO_SCENES or mode not in ('photo','nes') or ext!=('png' if mode=='nes' else 'jpg'):
        abort(404)
    path=build_thumbnail(scene,mode)
    return send_from_directory(THUMB_DIR,path.name,max_age=86400)


@lru_cache(maxsize=256)
def icon_data(mode,category,value):
    spec=default_spec();spec[category]=value
    from .character import COMPATIBILITY
    allowed=COMPATIBILITY.get(category,{}).get(value)
    if allowed:spec['build']=allowed[0]
    if category in ('face','eye_shape','eyes','brows','nose','mouth'):spec.update(hair='rasati',expression='neutra')
    canvas=render_char(spec,style=mode)
    image=to_pil(canvas)
    if category in ('hair','face','beard','hat','glasses','expression','eye_shape','brows','nose','mouth'):
        image=image.crop((17,8,48,36))
    else: image=pc.crop_sprite(canvas)
    b=io.BytesIO();image.save(b,'PNG');return b.getvalue()


@app.get('/icons/<mode>/<category>/<value>.png')
def character_icon(mode,category,value):
    if mode not in ('photo','nes') or category not in CHOICES or value not in CHOICES[category]: abort(404)
    return Response(icon_data(mode,category,value),mimetype='image/png',headers={'Cache-Control':'public, max-age=86400'})


@lru_cache(maxsize=16)
def animal_icon_data(mode,kind):
    info=ANIMALS[kind]
    return pc.crop_sprite(draw_animal(kind,info['variants'][0][0],info['poses'][0],style=mode))


@app.get('/icons/<mode>/animal/<kind>.png')
def animal_icon(mode,kind):
    if mode not in ('photo','nes') or kind not in ANIMALS: abort(404)
    return image_response(animal_icon_data(mode,kind))


def get_card(token):
    card,status=store.get(token)
    if not card: abort(status)
    return card


@app.get('/d/<token>')
@app.get('/download/<token>')
def download_page(token):
    card=get_card(token)
    return render_template('mobile.html',token=token,remaining=max(0,int(card.expires-time.time())),
                           credit=card.credit)


@app.get('/d/<token>/file.png')
@app.get('/download/<token>/file.png')
def download_png(token):
    _,data,status=store.read(token,download=True)
    if data is None: abort(status)
    return Response(data,mimetype='image/png',headers={'Content-Disposition':'attachment; filename="cartolina-casardi.png"'})


@app.get('/d/<token>/preview.jpg')
@app.get('/download/<token>/preview.jpg')
def download_preview(token):
    _,data,status=store.read(token)
    if data is None: abort(status)
    with Image.open(io.BytesIO(data)) as img:
        img.thumbnail((900,600));return image_response(img.convert('RGB'),'JPEG')


@app.get('/download/<token>/crediti.txt')
def download_credit(token):
    card=get_card(token)
    return Response(credit_text(card.credit),mimetype='text/plain',
                    headers={'Content-Disposition':'attachment; filename="crediti-cartolina.txt"'})


@app.get('/static/<path:path>')
def static_file(path): return send_from_directory(WEB/'static',path)


def warm_caches():
    for sid in PHOTO_SCENES:
        for mode in ('photo','nes'): build_thumbnail(sid,mode)
    # Actual samples for the first style screen; not coloured placeholders.
    return True


def main():
    from waitress import create_server
    try: address=base_url()
    except ValueError:
        raise SystemExit('Indirizzo LAN non valido: controlla POSTCARD_LAN_IP / POSTCARD_BASE_URL (http://IP:PORTA, senza percorso).')
    host=os.environ.get('POSTCARD_HOST','0.0.0.0')
    if host!='0.0.0.0':
        print('Attenzione: POSTCARD_HOST diverso da 0.0.0.0 può impedire il download da telefono.')
    # Bind BEFORE deleting stale files: a second instance must never erase
    # another running kiosk's cards. create_server holds the listening socket.
    try:
        server=create_server(app,host=host,port=PORT,threads=6,ident='Casardi',clear_untrusted_proxy_headers=True)
    except OSError:
        print(f'Porta {PORT} occupata o non disponibile. Chiudi l’altra istanza oppure imposta POSTCARD_PORT=8090.')
        raise SystemExit(1)
    def terminate(_signum,_frame):
        raise KeyboardInterrupt
    signal.signal(signal.SIGTERM,terminate)
    try:
        for sid,cfg in PHOTO_SCENES.items():
            if not (ROOT/cfg['photo']).is_file():
                raise SystemExit(f'Fotografia locale mancante: {sid}. Ripristina la cartella assets.')
        for path in EXPORT_DIR.iterdir():
            if path.is_file() and path.suffix in ('.png','.part'): path.unlink(missing_ok=True)
        # Migration clean-up from early development versions (never keep a copy).
        (ROOT/'var/ultima_cartolina.png').unlink(missing_ok=True)
        warm_caches();store.start_cleaner()
        print('='*64,flush=True)
        print(' LICEO ALFREDO CASARDI · OPEN DAY 2026/27 · BARLETTA',flush=True)
        print(f' PC kiosk:  http://127.0.0.1:{PORT}',flush=True)
        print(f' Rete LAN:  {address}  (telefono sulla stessa Wi-Fi)',flush=True)
        print(f' PNG temporanei: {EXPORT_DIR} · {TTL_SECONDS}s · nessun access log',flush=True)
        print(' Arresto: Ctrl+C. Prova fisica del QR richiesta prima dell’evento.',flush=True)
        print('='*64,flush=True)
        server.run()
    except KeyboardInterrupt:
        print('Server arrestato; rimozione delle cartoline temporanee.',flush=True)
    finally:
        server.close();store.close()


if __name__=='__main__': main()
