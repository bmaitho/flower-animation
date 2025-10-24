// js/flower-trail.js
// Spawn tiny SVG flowers following mouse/touch, then fade & remove.
// No dependencies. Perf-safe. Respects reduced motion.

(() => {
    const DISABLE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (DISABLE) return;
  
    const MAX_ACTIVE = 120;          // cap total particles
    const THROTTLE_MS = 40;          // min gap between spawns along a path
    const LIFETIME_MS = 1200;        // fade-out duration
    const SIZE_MIN = 16;
    const SIZE_MAX = 34;
    const PETALS = 6;                // petals per flower
  
    let lastT = 0;
    let active = 0;
  
    function rand(min, max){ return Math.random() * (max - min) + min; }
  
    function hsl(h, s, l){ return `hsl(${h}deg ${s}% ${l}%)`; }
  
    function createFlower(x, y, opts = {}) {
      if (active >= MAX_ACTIVE) return;
      active++;
  
      const size = Math.round(rand(SIZE_MIN, SIZE_MAX));
      const hue  = (opts.hue ?? rand(330, 360)) + rand(-10, 10); // rosy default ±
      const petal = opts.petal ?? hsl(hue, 70, 70);
      const center = opts.center ?? hsl((hue + 15) % 360, 85, 45);
  
      // Build a simple SVG flower
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('viewBox','0 0 100 100');
      svg.setAttribute('aria-hidden','true');
  
      const g = document.createElementNS(svgNS, 'g');
      g.setAttribute('transform','translate(50,50)');
  
      // petals: circles around a ring
      for (let i = 0; i < PETALS; i++) {
        const angle = (i / PETALS) * Math.PI * 2;
        const r = 30; // radius of ring
        const cx = Math.cos(angle) * r;
        const cy = Math.sin(angle) * r;
        const p = document.createElementNS(svgNS, 'circle');
        p.setAttribute('cx', cx);
        p.setAttribute('cy', cy);
        p.setAttribute('r', 20);
        p.setAttribute('fill', petal);
        g.appendChild(p);
      }
  
      // center
      const c = document.createElementNS(svgNS, 'circle');
      c.setAttribute('cx', 0);
      c.setAttribute('cy', 0);
      c.setAttribute('r', 12);
      c.setAttribute('fill', center);
      g.appendChild(c);
  
      svg.appendChild(g);
  
      const el = document.createElement('span');
      el.className = 'trail-flower';
      el.style.left = x + 'px';
      el.style.top  = y + 'px';
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.setProperty('--life', LIFETIME_MS + 'ms');
      // small random rotation drift
      el.style.setProperty('--rot', (rand(-12, 12)).toFixed(1) + 'deg');
      // slight upward drift
      el.style.setProperty('--lift', (rand(6, 14)).toFixed(0) + 'px');
  
      el.appendChild(svg);
      document.body.appendChild(el);
  
      // kick transition on next frame
      requestAnimationFrame(() => {
        el.dataset.on = '1'; // triggers CSS transition to scale(1) & lift
        // start fade-out a beat later
        setTimeout(() => {
          el.dataset.fade = '1';
          setTimeout(() => {
            el.remove();
            active--;
          }, LIFETIME_MS);
        }, 60);
      });
    }
  
    function spawnAtEvent(e){
      const now = performance.now();
      if (now - lastT < THROTTLE_MS) return;
      lastT = now;
  
      // clientX/Y for mouse; for touch take the first touch
      let x, y;
      if (e.touches && e.touches.length) {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      } else {
        x = e.clientX;
        y = e.clientY;
      }
      createFlower(x, y);
    }
  
    // bonus: single tap/click burst
    function burst(e){
      let x, y;
      if (e.touches && e.touches.length) { x = e.touches[0].clientX; y = e.touches[0].clientY; }
      else { x = e.clientX; y = e.clientY; }
      for (let i = 0; i < 10; i++) {
        setTimeout(() => createFlower(x + rand(-30,30), y + rand(-30,30)), i * 18);
      }
    }
  
    // listeners
    document.addEventListener('pointermove', spawnAtEvent, {passive:true});
    document.addEventListener('touchmove',   spawnAtEvent, {passive:true});
    document.addEventListener('click',       burst,        {passive:true});
    document.addEventListener('touchstart',  burst,        {passive:true});
  })();
  