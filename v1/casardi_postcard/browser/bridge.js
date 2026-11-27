/* Local HTTP PNG bridge; inactive in the standalone file and phone creator.
 * Only the Windows/local service injects an owner key. Never persist it, the
 * nickname, PNG or download URL. No cloud, analytics, cookies or localStorage.
 */
globalThis.CasardiBridge=(()=>{
 'use strict';
 const $=s=>document.querySelector(s),node=$('#local-service-config');
 let cfg=null;try{if(node)cfg=JSON.parse(node.textContent);}catch(_){}node?.remove();
 let stopped=false,revision=0,upload=null,lastFile=null,timer=null,clockStart=0,remaining=0,lastReset=Promise.resolve();
 const available=()=>!!cfg?.key&&!stopped&&/^https?:$/.test(location.protocol);
 const clearTimer=()=>{clearInterval(timer);timer=null;};
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
 function apply(data){if(data.generation>=cfg.generation)cfg={...cfg,...data};}
 function refreshNetwork(){
  const list=$('#network-ip');list.replaceChildren();
  for(const n of cfg.networks||[]){const option=document.createElement('option');option.value=n.ip;option.textContent=n.label;option.selected=n.ip===cfg.selected_ip;list.append(option);}
  $('#network-select-wrap').hidden=!cfg.networks?.length;$('#network-missing').hidden=!!cfg.networks?.length;
  $('#creator-qr').hidden=!cfg.creator_qr;if(cfg.creator_qr)$('#creator-qr').src=cfg.creator_qr;else $('#creator-qr').removeAttribute('src');
  $('#creator-link').textContent=cfg.creator_url||'Nessun indirizzo LAN rilevato';if(cfg.creator_url)$('#creator-link').href=cfg.creator_url;else $('#creator-link').removeAttribute('href');
 }
 function showTransfer(data){
  apply(data);hideCode();$('#transfer-loading').hidden=true;$('#transfer-retry').hidden=false;
  const t=data.transfer;
  if(!t){status('Il collegamento è scaduto o è stato azzerato. Puoi crearne uno nuovo, senza ricomporre il PNG.');return;}
  if(!t.url||!t.qr){status('Collega il PC a una rete locale. In Info → Rete puoi controllare l’indirizzo. Intanto salva il PNG sul PC.',true);return;}
  $('#transfer-code').hidden=false;$('#transfer-qr').src=t.qr;$('#transfer-link').href=t.url;$('#transfer-link').textContent=t.url;
  status('Scansiona questo QR con il telefono e premi «Scarica il PNG». PC e telefono devono essere sulla stessa rete locale.');
  remaining=Math.max(0,t.expires_at-data.server_time);clockStart=performance.now();
  const tick=()=>{const left=Math.max(0,Math.ceil((remaining-(performance.now()-clockStart))/1000));if(left<=0){hideCode();status('QR scaduto: il servizio ha eliminato la copia temporanea. Il PNG sul PC rimane disponibile.');return;}$('#transfer-time').textContent='Scade tra '+Math.floor(left/60)+':'+String(left%60).padStart(2,'0')+' · Nuova cartolina lo elimina subito.';};
  tick();timer=setInterval(tick,500);$('#transfer-box').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
 }
 async function publish(file){
  if(!available())return;
  const ticket=++revision;upload?.abort();const ctl=upload=new AbortController();lastFile=file;hideCode();$('#transfer-box').hidden=false;$('#transfer-loading').hidden=false;$('#transfer-retry').hidden=true;
  status('Preparo il trasferimento del PNG al telefono…');
  try{await lastReset;if(ticket!==revision||ctl.signal.aborted)return;const data=await request('/bridge/export',{method:'POST',body:file,signal:ctl.signal});if(ticket===revision&&!ctl.signal.aborted)showTransfer(data);}
  catch(e){if(e.name!=='AbortError'&&ticket===revision){$('#transfer-loading').hidden=true;$('#transfer-retry').hidden=false;status(e.message,true);}}
  finally{if(upload===ctl)upload=null;}
 }
 function clear(force=false){
  const needed=force||!!lastFile||!!upload;++revision;upload?.abort();upload=null;lastFile=null;hideCode();$('#transfer-box').hidden=true;$('#transfer-loading').hidden=true;
  if(!available()||!needed)return lastReset;
  lastReset=lastReset.catch(()=>{}).then(async()=>{const data=await request('/bridge/reset',{method:'POST'});apply(data);}).catch(e=>{status('Non posso confermare l’azzeramento del servizio. Il vecchio link scadrà comunque entro 10 minuti. Riapri l’avvio Windows prima del prossimo visitatore.',true);$('#service-warning').textContent=e.message;$('#service-warning').hidden=false;throw e;});
  // Reset errors are displayed, not unhandled rejection noise.
  lastReset.catch(()=>{});return lastReset;
 }
 function init(){
  $('#transfer-local-only').hidden=available();$('#service-controls').hidden=!available();
  if(!available())return;
  $('.offline-badge').innerHTML='<span aria-hidden="true">●</span> Studio locale · Windows · QR del PNG pronto';
  $('.welcome-bottom span').textContent='Edizione stand · Avvio Windows con doppio clic';
  $('#welcome-title').closest('.welcome-copy').querySelector('.welcome-note').textContent='Nessun account o cloud. Solo il PNG finale passa al servizio del PC per il QR temporaneo. Nome e animale facoltativi.';
  $('#result-privacy').textContent='Il PNG finale è copiato solo nella memoria del servizio locale, per il download via QR: scadenza entro 10 minuti, eliminazione immediata con Ricomincia. Le copie già scaricate restano sul dispositivo.';
  refreshNetwork();
  $('#transfer-retry').addEventListener('click',()=>{if(lastFile)publish(lastFile);});
  $('#network-ip').addEventListener('change',async e=>{try{const data=await request('/bridge/network',{method:'POST',body:{ip:e.target.value}});apply(data);refreshNetwork();if(lastFile)showTransfer(data);}catch(err){$('#service-warning').textContent=err.message;$('#service-warning').hidden=false;}});
  $('#service-stop').addEventListener('click',async()=>{
   if(!confirm('Arrestare il servizio locale? Il QR attuale smetterà subito di funzionare. Le cartoline già scaricate non vengono eliminate.'))return;
   try{await request('/bridge/stop',{method:'POST'});stopped=true;clear();$('#service-stop').disabled=true;$('#service-stop').textContent='Servizio arrestato';$('#service-warning').textContent='Per riattivare i QR, fai doppio clic su AVVIA_CARTOLINA_WINDOWS.exe. Il creatore aperto continua a esportare PNG sul dispositivo.';$('#service-warning').hidden=false;}
   catch(e){$('#service-warning').textContent=e.message;$('#service-warning').hidden=false;}
  });
 }
 return{init,publish,clear,available};
})();
