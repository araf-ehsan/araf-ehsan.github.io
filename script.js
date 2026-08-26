
(function(){
  "use strict";

  /* ---------- scroll reveal ---------- */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PAGES = ['home','about','skills','projects','research','experience','contact'];

  var revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion) {
    revealEls.forEach(function(el){ el.classList.add('in'); });
  } else if ('IntersectionObserver' in window) {
    var revealIO = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function(el){ revealIO.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('in'); });
  }

  /* ---------- scroll-spy: highlight the nav link for the section in view ---------- */
  function updateActiveNav(id){
    document.querySelectorAll('.nav-links a').forEach(function(a){
      var href = a.getAttribute('href') || '';
      if (href === '#' + id) { a.classList.add('nav-active'); }
      else { a.classList.remove('nav-active'); }
    });
  }

  var spySections = PAGES.map(function(id){ return document.getElementById(id); }).filter(Boolean);
  if ('IntersectionObserver' in window && spySections.length) {
    var navIO = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) { updateActiveNav(entry.target.id); }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    spySections.forEach(function(sec){ navIO.observe(sec); });
  }
  updateActiveNav('home');

  /* ---------- mobile hamburger nav ---------- */
  var navToggle = document.getElementById('nav-toggle');
  var navLinks = document.getElementById('nav-links');

  function openMenu(){
    navToggle.classList.add('is-open');
    navLinks.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
  }
  function closeMenu(){
    navToggle.classList.remove('is-open');
    navLinks.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function(){
      if (navLinks.classList.contains('is-open')) { closeMenu(); } else { openMenu(); }
    });

    navLinks.querySelectorAll('a').forEach(function(link){
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function(ev){
      if (ev.key === 'Escape') closeMenu();
    });

    document.addEventListener('click', function(ev){
      if (!navLinks.classList.contains('is-open')) return;
      if (navLinks.contains(ev.target) || navToggle.contains(ev.target)) return;
      closeMenu();
    });

    window.addEventListener('resize', function(){
      if (window.innerWidth > 720) closeMenu();
    });
  }

  /* ---------- skill dot ratings ---------- */
  var levels = [5,4,3,5,4,4,3,4,4,4,3,3,3,4,3,3,4];
  document.querySelectorAll('.df-level').forEach(function(el, i){
    var n = levels[i] || 3;
    for (var d = 0; d < 5; d++) {
      var dot = document.createElement('span');
      dot.className = 'dot' + (d < n ? ' on' : '');
      el.appendChild(dot);
    }
  });

  /* ---------- copy email ---------- */
  document.querySelectorAll('.copy-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var text = btn.getAttribute('data-copy');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function(){
          var original = btn.textContent;
          btn.textContent = 'copied';
          setTimeout(function(){ btn.textContent = original; }, 1500);
        });
      }
    });
  });

  /* ---------- hero canvas: scatter -> regression fit ---------- */
  var canvas = document.getElementById('hero-canvas');
  var ctx = canvas.getContext('2d');
  var wrap = canvas.parentElement;
  var W, H, DPR;
  var points = [];
  var N = 46;
  var startTime = null;
  var DURATION = 1900; // ms for the settle animation
  var mouseX = 0.5, mouseY = 0.5;

  function resize(){
    var rect = wrap.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    buildPoints();
  }

  function curveY(x){
    // a gentle fitted-looking curve across the canvas width
    var nx = x / W;
    return H*0.55 + Math.sin(nx*Math.PI*1.6 + 0.4) * H*0.16 + Math.sin(nx*Math.PI*4.2) * H*0.035;
  }

  function buildPoints(){
    points = [];
    for (var i = 0; i < N; i++) {
      var tx = (i + 0.5) / N * W;
      var ty = curveY(tx) + (Math.random() - 0.5) * H * 0.22; // noisy target near curve
      points.push({
        x0: Math.random() * W,
        y0: Math.random() * H,
        tx: tx,
        ty: ty,
        r: 2 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

  function draw(now){
    if (startTime === null) startTime = now;
    var elapsed = now - startTime;
    var t = reduceMotion ? 1 : Math.min(elapsed / DURATION, 1);
    var e = easeOutCubic(t);

    ctx.clearRect(0, 0, W, H);

    // fitted curve line
    ctx.beginPath();
    for (var cx = 0; cx <= W; cx += 6) {
      var cy = curveY(cx);
      if (cx === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
    }
    ctx.strokeStyle = 'rgba(240,168,104,' + (0.35 * e) + ')';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // current point positions
    var bob = reduceMotion ? 0 : Math.sin(now / 900) * 2;
    var pts = points.map(function(p){
      var x = p.x0 + (p.tx - p.x0) * e + (mouseX - 0.5) * 10;
      var y = p.y0 + (p.ty - p.y0) * e + (mouseY - 0.5) * 10 + (t >= 1 ? Math.sin(now/700 + p.phase)*2 : 0);
      return { x: x, y: y, r: p.r };
    });

    // connecting lines (network feel) between near points, once mostly settled
    if (t > 0.5) {
      var netAlpha = (t - 0.5) * 2;
      for (var i = 0; i < pts.length; i++) {
        for (var j = i + 1; j < pts.length; j++) {
          var dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          var dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 70) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = 'rgba(79,209,197,' + (0.14 * (1 - dist/70) * netAlpha) + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    }

    // points
    pts.forEach(function(p){
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(79,209,197,' + (0.55 + 0.45*e) + ')';
      ctx.fill();
    });

    if (t < 1 && !reduceMotion) {
      requestAnimationFrame(draw);
    } else if (!reduceMotion) {
      requestAnimationFrame(draw); // keep ambient bob/parallax going
    }
  }

  wrap.addEventListener('mousemove', function(ev){
    var rect = wrap.getBoundingClientRect();
    mouseX = (ev.clientX - rect.left) / rect.width;
    mouseY = (ev.clientY - rect.top) / rect.height;
  });

  window.addEventListener('resize', function(){
    startTime = null;
    resize();
  });

  resize();
  requestAnimationFrame(draw);

})();
