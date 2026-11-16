/* Gösteriş katmanı (isteğe bağlı, kaldırılabilir). */
(function(){
  'use strict';
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse=window.matchMedia&&matchMedia('(pointer: coarse)').matches;
  // kaydırma çubuğu
  var bar=document.createElement('div');bar.id='fx-progress';document.body.appendChild(bar);
  var tick=false;
  function prog(){tick=false;var h=document.documentElement.scrollHeight-innerHeight;bar.style.transform='scaleX('+(h>0?Math.min(1,scrollY/h):0)+')'}
  addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(prog)}},{passive:true});prog();
  // yıldız alanı
  var hero=document.querySelector('.hero');
  if(hero&&!reduce){
    var c=document.createElement('canvas');c.id='fx-stars';hero.insertBefore(c,hero.firstChild);
    var x=c.getContext('2d'),W=0,H=0,S=[],mx=.5,my=.5,run=true;
    var cols=['#ffffff','#9ec1ff','#c9a6ff','#ff9fb4'];
    function size(){W=c.width=hero.clientWidth;H=c.height=hero.clientHeight;S=[];var n=Math.min(130,Math.round(W*H/9000));for(var i=0;i<n;i++)S.push({x:Math.random()*W,y:Math.random()*H,z:Math.random()*.9+.1,t:Math.random()*6.28,c:cols[Math.random()*4|0]})}
    size();addEventListener('resize',size);
    hero.addEventListener('pointermove',function(e){var r=hero.getBoundingClientRect();mx=(e.clientX-r.left)/r.width;my=(e.clientY-r.top)/r.height});
    new IntersectionObserver(function(en){run=en[0].isIntersecting;if(run)loop()}).observe(hero);
    var last=0;
    function loop(t){
      if(!run)return;requestAnimationFrame(loop);
      var dt=Math.min(.05,((t||0)-last)/1000);last=t||0;
      x.clearRect(0,0,W,H);
      for(var i=0;i<S.length;i++){var s=S[i];s.t+=dt*2*s.z;s.y-=dt*8*s.z;if(s.y<-4){s.y=H+4;s.x=Math.random()*W}
        var px=s.x+(mx-.5)*30*s.z,py=s.y+(my-.5)*30*s.z;
        x.globalAlpha=.35+.55*Math.abs(Math.sin(s.t));x.fillStyle=s.c;x.beginPath();x.arc(px,py,s.z*1.7,0,6.283);x.fill()}
      x.globalAlpha=1;
    }
    loop();
  }
  // sayaçlar
  document.querySelectorAll('.hero-stats .stat-num').forEach(function(el){
    var end=parseInt(el.textContent.replace(/\D/g,''),10);if(!end||reduce)return;
    var t0=null;el.textContent='0';
    function step(t){if(!t0)t0=t;var k=Math.min(1,(t-t0)/1400),e=1-Math.pow(1-k,3);el.textContent=Math.round(end*e);if(k<1)requestAnimationFrame(step)}
    setTimeout(function(){requestAnimationFrame(step)},900);
  });
  // bölüm başlığı çizgisi
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('fx-in');io.unobserve(e.target)}})},{threshold:.4});
  document.querySelectorAll('.shelf-head').forEach(function(el){io.observe(el)});
  // ışık izi
  function spot(sel){document.querySelectorAll(sel).forEach(function(el){el.addEventListener('pointermove',function(e){var r=el.getBoundingClientRect();el.style.setProperty('--mx',(e.clientX-r.left)+'px');el.style.setProperty('--my',(e.clientY-r.top)+'px')})})}
  spot('.group-tile');spot('.top-rated-row');
  // kart eğilme + parlama
  if(!reduce&&!coarse){
    document.querySelectorAll('.cart').forEach(function(card){
      var cov=card.querySelector('.cart-cover');if(!cov)return;
      var g=document.createElement('span');g.className='cart-glare';cov.appendChild(g);
      card.addEventListener('pointermove',function(e){
        var r=cov.getBoundingClientRect(),px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;
        if(px<-.2||px>1.2||py<-.5||py>1.5){cov.style.transform='';return}
        cov.style.transform='perspective(700px) rotateY('+((px-.5)*10).toFixed(2)+'deg) rotateX('+((.5-py)*8).toFixed(2)+'deg) scale(1.02)';
        g.style.setProperty('--gx',(px*100)+'%');g.style.setProperty('--gy',(py*100)+'%');
      });
      card.addEventListener('pointerleave',function(){cov.style.transform=''});
    });
  }
})();
