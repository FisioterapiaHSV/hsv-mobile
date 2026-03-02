// Lightweight confetti launcher (no external libs)
(function(){
  function rand(min,max){ return Math.random()*(max-min)+min; }

  function launchConfetti(opts){
    try{
      opts = opts || {};
      const count = typeof opts.count === 'number' ? opts.count : 48;
      const colors = opts.colors || (window.APP_CONFETTI_COLORS || ['#ef4444','#f59e0b','#10b981','#06b6d4','#7c3aed','#ff6b6b','#ffd166']);
      const body = document.body; if(!body) return;
      const root = document.createElement('div'); root.className = 'confetti-root';
      root.style.position = 'fixed'; root.style.left = 0; root.style.top = 0; root.style.width = '100%'; root.style.height = '0'; root.style.overflow = 'visible'; root.style.pointerEvents = 'none'; root.style.zIndex = 9999;
      for(let i=0;i<count;i++){
        const el = document.createElement('div'); el.className = 'confetti-piece';
        const w = Math.round(rand(6,12)); const h = Math.round(rand(8,18)); el.style.width = w + 'px'; el.style.height = h + 'px'; el.style.background = colors[Math.floor(Math.random()*colors.length)];
        el.style.position = 'absolute'; el.style.left = (rand(5,95)) + '%'; el.style.top = '-10%'; el.style.opacity = ''+rand(0.85,1);
        el.style.transform = 'rotate(' + Math.round(rand(0,360)) + 'deg)';
        el.style.borderRadius = (Math.random()>0.7? '3px' : '0');
        el.style.willChange = 'transform, top, opacity';
        root.appendChild(el);
        // animate
        (function(e){
          const duration = rand(1300,2200);
          const delay = rand(0,200);
          const horiz = rand(-25,25);
          setTimeout(()=>{
            e.style.transition = `transform ${duration}ms cubic-bezier(.2,.8,.2,1), top ${duration}ms ease-in, opacity ${duration}ms linear`;
            e.style.top = (60 + rand(0,30)) + '%';
            e.style.transform = `translateX(${horiz}vw) rotate(${Math.round(rand(360,1080))}deg)`;
            e.style.opacity = '0.02';
          }, delay);
        })(el);
      }
      body.appendChild(root);
      setTimeout(()=>{ try{ body.removeChild(root); }catch(e){} }, 2600);
    }catch(e){ console.warn('launchConfetti', e); }
  }

  // expose globally
  try{ window.launchConfetti = launchConfetti; }catch(e){}
})();
