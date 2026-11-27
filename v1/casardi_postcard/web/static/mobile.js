(() => {
  'use strict';
  const page=document.querySelector('#download-page');
  const deadline=Date.now()+Number(page.dataset.remaining)*1000;
  const tick=()=>{
    const left=Math.max(0,Math.ceil((deadline-Date.now())/1000));
    document.querySelector('#mobile-countdown').textContent=`${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}`;
    if(!left){
      document.querySelector('#expiry').textContent='Collegamento scaduto. Il file non è più disponibile sul PC.';
      document.querySelector('#expiry').classList.add('error');
      document.querySelector('#download-button').setAttribute('aria-disabled','true');
      document.querySelector('#download-button').removeAttribute('href');
      clearInterval(timer);
    }
  };
  const timer=setInterval(tick,1000);tick();
})();
