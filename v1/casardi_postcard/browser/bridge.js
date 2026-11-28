/* PNG bridge, inactive in standalone/phone mode. Internet relay is opt-in.
 * Only the local Windows service injects an owner key. Never persist keys,
 * nickname, PNG or links. Cloudflare transit is disclosed before activation.
 */
globalThis.CasardiBridge=(()=>{
 'use strict';
 const $=s=>document.querySelector(s),node=$('#local-service-config');
 let cfg=null;try{if(node)cfg=JSON.parse(node.textContent);}catch(_){}node?.remove();
 let stopped=false,revision=0,upload=null,lastFile=null,timer=null,clockStart=0,remaining=0,lastReset=Promise.resolve(),pollTimer=null,polling=false,displaySignature='';
 const available=()=>!!cfg?.key&&!stopped&&/^https?:$/.test(location.protocol);
 const clearTimer=()=>{clearInterval(timer);timer=null;};
 const internet=()=>cfg?.internet||{status:'off',message:''};
 function hideCode(){clearTimer();$('#transfer-qr').removeAttribute('src');$('#transfer-code').hidden=true;$('#transfer-link').removeAttribute('href');$('#transfer-link').textContent='';$('#transfer-time').textContent='';}
 function status(text,error=false){$('#transfer-status').textContent=text;$('#transfer-status').classList.toggle('transfer-error',error);}
 async function request(path,{method='GET',body,signal}={}){
  const headers={'X-Casardi-Key':cfg.key,'X-Casardi-Generation':String(cfg.generation)};
  if(body instanceof Blob)headers['Content-Type']='image/png';else if(body!==undefined){headers['Content-Type']='application/json';body=JSON.stringify(body);}
  let res;try{res=await fetch(path,{method,headers,body,signal,cache:'no-store',credentials:'omit',redirect:'error'});}catch(e){if(e.name==='AbortError')throw e;throw new Error('Il servizio locale non risponde. Il PNG resta disponibile: usa Scarica PNG sul PC e riapri l’avvio Windows.');}
  let data;try{data=await res.json();}catch(_){throw new Error('Risposta locale non valida. Salva il PNG sul PC e riapri l’avvio Windows.');}
  if(!res.ok)throw new Error(data.error||'Trasferimento non riuscito. Il PNG si può sempre salvare sul PC.');
  return data;
 }
 function apply(data){if(data.generation<cfg.generation||(data.state_seq||0)<(cfg.state_seq||0))return false;cfg={...cfg,...data};return true;}
 function refreshNetwork(){
  const list=$('#network-ip');list.replaceChildren();
  for(const n of cfg.networks||[]){const option=document.createElement('option');option.value=n.ip;option.textContent=n.label;option.selected=n.ip===cfg.selected_ip;list.append(option);}
  $('#network-select-wrap').hidden=!cfg.networks?.length;$('#network-missing').hidden=!!cfg.networks?.length;
  $('#creator-qr').hidden=!cfg.creator_qr;if(cfg.creator_qr)$('#creator-qr').src=cfg.creator_qr;else $('#creator-qr').removeAttribute('src');
  $('#creator-link').textContent=cfg.creator_url||'Nessun indirizzo LAN rilevato';if(cfg.creator_url)$('#creator-link').href=cfg.creator_url;else $('#creator-link').removeAttribute('href');
  const i=internet(),active=i.status!=='off',busy=['downloading','starting','reconnecting'].includes(i.status);
  $('#internet-status').textContent=i.message;$('#internet-status').classList.toggle('transfer-error',i.status==='error');
  $('#internet-start').disabled=busy||i.status==='ready';$('#internet-start').textContent=i.status==='error'?'Riprova QR Internet':'Attiva QR Internet · anche 4G/5G';
  $('#internet-stop').hidden=!active;$('#transfer-internet').hidden=active&&i.status!=='error';
  $('.offline-badge').textContent=i.status==='ready'?'● Studio Windows · QR Internet attivo':'● Studio Windows · QR '+(active?'Internet in preparazione':'rete locale');
  $('#result-privacy').textContent=active?'Il PNG resta nella RAM del PC. Con QR Internet il download transita da Cloudflare, fornitore esterno. Link casuale, scadenza entro 10 minuti e revoca con Nuova cartolina; le copie già scaricate restano sul telefono.':'Il PNG finale è copiato nella RAM del servizio locale, per il QR LAN: scadenza entro 10 minuti e revoca con Nuova cartolina. Nessun trasferimento Internet finché non attivi QR Internet.';
 }
 function signature(data){return JSON.stringify([data.generation,data.internet?.status,data.internet?.message,data.transfer?.url,data.transfer?.expires_at]);}
 function showTransfer(data,focus=true){
  if(!apply(data))data=cfg;displaySignature=signature(data);hideCode();$('#transfer-loading').hidden=true;$('#transfer-retry').hidden=false;
  const t=data.transfer,i=internet(),remote=data.transfer_mode==='internet';
  if(!t){status('Il collegamento è scaduto o è stato azzerato. Puoi crearne uno nuovo, senza ricomporre il PNG.');return;}
  if(remote&&i.status!=='ready'){status(i.message||'Preparo il collegamento Internet…',i.status==='error');$('#transfer-loading').hidden=!['downloading','starting','reconnecting'].includes(i.status);return;}
  if(!t.url||!t.qr){status('Per reti diverse attiva QR Internet qui sotto. Il QR LAN richiede un indirizzo privato del PC. Intanto puoi salvare il PNG sul PC.',true);return;}
  $('#transfer-code').hidden=false;$('#transfer-qr').src=t.qr;$('#transfer-link').href=t.url;$('#transfer-link').textContent=t.url;
  status(remote?'QR INTERNET · Scansiona con il telefono, anche su 4G/5G o altra Wi-Fi, poi premi «Scarica il PNG». PC e telefono devono avere Internet.':'QR LAN · Scansiona e premi «Scarica il PNG». Serve la stessa rete locale. Per 4G/5G o un’altra rete attiva QR Internet qui sotto.');
  $('#transfer-help').textContent=remote?'Lascia accesi PC, programma e connessione. Il download passa da Cloudflare; chi possiede il link può scaricare il PNG finché è valido. Se la rete blocca il tunnel chiedi all’IT, senza disattivare le protezioni.':'Non si apre? Controlla la stessa rete locale e l’assenza di isolamento tra dispositivi, oppure attiva QR Internet. Il salvataggio sul PC è sempre disponibile.';
  remaining=Math.max(0,t.expires_at-data.server_time);clockStart=performance.now();
  const tick=()=>{const left=Math.max(0,Math.ceil((remaining-(performance.now()-clockStart))/1000));if(left<=0){hideCode();status('QR scaduto: il servizio ha eliminato la copia temporanea. Il PNG sul PC rimane disponibile.');return;}$('#transfer-time').textContent='Scade tra '+Math.floor(left/60)+':'+String(left%60).padStart(2,'0')+' · Nuova cartolina lo elimina subito.';};
  tick();timer=setInterval(tick,500);if(focus)$('#transfer-box').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
 }
 async function publish(file){
  if(!available())return;
  const ticket=++revision;upload?.abort();const ctl=upload=new AbortController();lastFile=file;hideCode();$('#transfer-box').hidden=false;$('#transfer-loading').hidden=false;$('#transfer-retry').hidden=true;
  status('Preparo il trasferimento del PNG al telefono…');
  try{await lastReset;if(ticket!==revision||ctl.signal.aborted)return;const data=await request('/bridge/export',{method:'POST',body:file,signal:ctl.signal});if(ticket===revision&&!ctl.signal.aborted){refreshNetworkFrom(data);showTransfer(data);}}
  catch(e){if(e.name!=='AbortError'&&ticket===revision){$('#transfer-loading').hidden=true;$('#transfer-retry').hidden=false;status(e.message,true);}}
  finally{if(upload===ctl)upload=null;}
 }
 function refreshNetworkFrom(data){apply(data);refreshNetwork();}
 function clear(force=false){
  const needed=force||!!lastFile||!!upload;++revision;upload?.abort();upload=null;lastFile=null;hideCode();$('#transfer-box').hidden=true;$('#transfer-loading').hidden=true;displaySignature='';
  if(!available()||!needed)return lastReset;
  lastReset=lastReset.catch(()=>{}).then(async()=>{const data=await request('/bridge/reset',{method:'POST'});apply(data);}).catch(e=>{status('Non posso confermare l’azzeramento del servizio. Il vecchio link scadrà comunque entro 10 minuti. Riapri l’avvio Windows prima del prossimo visitatore.',true);$('#service-warning').textContent=e.message;$('#service-warning').hidden=false;throw e;});
  lastReset.catch(()=>{});return lastReset;
 }
 async function internetAction(action){
  if(action==='start'&&!confirm('Attivare QR Internet tramite Cloudflare? Il PNG verrà trasferito attraverso un fornitore esterno. Il PC deve restare acceso e online. Al primo uso verrà scaricato il componente ufficiale (circa 55 MB), verificato con SHA-256. Il tunnel gratuito è temporaneo e non ha garanzia di disponibilità.'))return;
  try{const data=await request('/bridge/internet',{method:'POST',body:{action}});refreshNetworkFrom(data);if(lastFile&&!upload)showTransfer(data,false);}
  catch(e){$('#service-warning').textContent=e.message;$('#service-warning').hidden=false;}
 }
 async function pollInternet(){
  if(!available()||polling||internet().status==='off')return;
  polling=true;
  try{const data=await request('/bridge/state');refreshNetworkFrom(data);if(lastFile&&!upload&&!$('#transfer-box').hidden&&signature(data)!==displaySignature)showTransfer(data,false);}
  catch(e){hideCode();$('#service-warning').textContent=e.message;$('#service-warning').hidden=false;}
  finally{polling=false;}
 }
 function init(){
  $('#transfer-local-only').hidden=available();$('#service-controls').hidden=!available();
  if(!available())return;
  $('.welcome-bottom span').textContent='Edizione stand · QR LAN o Internet facoltativo';
  $('#welcome-title').closest('.welcome-copy').querySelector('.welcome-note').textContent='Creazione sul PC. Il QR usa la LAN oppure Internet tramite Cloudflare se lo attivi da Info. Nome e animale facoltativi.';
  refreshNetwork();pollTimer=setInterval(pollInternet,2000);
  $('#transfer-retry').addEventListener('click',()=>{if(lastFile)publish(lastFile);});
  $('#internet-start').addEventListener('click',()=>internetAction('start'));$('#transfer-internet').addEventListener('click',()=>internetAction('start'));$('#internet-stop').addEventListener('click',()=>internetAction('stop'));
  $('#network-ip').addEventListener('change',async e=>{try{const data=await request('/bridge/network',{method:'POST',body:{ip:e.target.value}});refreshNetworkFrom(data);if(lastFile)showTransfer(data);}catch(err){$('#service-warning').textContent=err.message;$('#service-warning').hidden=false;}});
  $('#service-stop').addEventListener('click',async()=>{
   if(!confirm('Arrestare il servizio e il tunnel? Il QR attuale smetterà subito di funzionare. Le cartoline già scaricate non vengono eliminate.'))return;
   try{await request('/bridge/stop',{method:'POST'});stopped=true;clearInterval(pollTimer);clear();$('#service-stop').disabled=true;$('#service-stop').textContent='Servizio arrestato';$('#internet-start').disabled=true;$('#internet-stop').hidden=true;$('#service-warning').textContent='Per riattivare i QR, fai doppio clic su AVVIA_CARTOLINA_WINDOWS.exe. Il creatore aperto continua a esportare PNG sul dispositivo.';$('#service-warning').hidden=false;}
   catch(e){$('#service-warning').textContent=e.message;$('#service-warning').hidden=false;}
  });
 }
 return{init,publish,clear,available};
})();
