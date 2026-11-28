from flask import Flask,Response,request
from pathlib import Path
A=Flask(__name__);R=Path('/home/user/.cache/casardi-rootcause/casardi_postcard')
@A.get('/base.html')
def base():
 path=Path('/home/user/Cartolina_Casardi_DIAGNOSTICA_ANDROID_A1.html') if request.args.get('a1')=='1' else Path('/home/user/.cache/casardi-rootcause/canvas-experiment/canvas-preview.html') if request.args.get('exp')=='1' else R/'Cartolina_Casardi_PC_e_Telefono.html'
 return Response(path.read_bytes(),mimetype='text/html',headers={'Cache-Control':'no-store'})
@A.get('/')
def host():return Response('''<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;width:100%;height:100%;background:#080d20;color:#fff}header{height:48px;display:flex;align-items:center;gap:20px}button{padding:8px}main{height:calc(100% - 48px);overflow:auto}iframe{display:block;width:100%;height:100%;border:0;box-sizing:border-box}</style><header><button id="outside">Fuori</button><span>Collaudo dell’incorporamento</span></header><main><iframe id="viewer" sandbox="allow-scripts"></iframe></main><script>const p=new URLSearchParams(location.search),f=document.querySelector('iframe');fetch('/base.html'+location.search).then(r=>r.text()).then(html=>{if(p.get('nested')==='1'){f.srcdoc='<style>html,body,iframe{margin:0;border:0;display:block;width:100%;height:100%}</style><iframe id="child" sandbox="allow-scripts"></iframe><script>window.addEventListener("message",e=>document.querySelector("iframe").srcdoc=e.data)<\\/script>';f.onload=()=>{f.onload=null;f.contentWindow.postMessage(html,'*')};}else f.srcdoc=html;});</script>''',mimetype='text/html')
if __name__=='__main__':
 from waitress import serve
 serve(A,host='0.0.0.0',port=8092,threads=3,_quiet=True)
