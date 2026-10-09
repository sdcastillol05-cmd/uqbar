/* ── Scroll reveal ─────────────────────────────────────────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal, .journey, .line-draw').forEach(el => revealObserver.observe(el));

/* ── Navbar scroll tint ────────────────────────────────────────────────────── */
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

/* ── Mobile hamburger menu ─────────────────────────────────────────────────── */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');

function closeMenu() {
  navLinks.classList.remove('open');
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', false);
  document.body.style.overflow = '';
}

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', (e) => {
    if (navLinks.classList.contains('open') &&
        !navLinks.contains(e.target) &&
        !hamburger.contains(e.target)) closeMenu();
  });
}

/* ── CTA email form ────────────────────────────────────────────────────────── */
const ctaBtn      = document.getElementById('cta-btn');
const ctaEmail    = document.getElementById('cta-email');
const ctaFeedback = document.getElementById('cta-feedback');

if (ctaBtn && ctaEmail && ctaFeedback) {
  ctaBtn.addEventListener('click', () => {
    const email = ctaEmail.value.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!valid) {
      ctaFeedback.textContent = 'Por favor ingresa un correo válido.';
      ctaFeedback.style.color = '#e57373';
      ctaEmail.focus();
      return;
    }

    // Simulate submission
    ctaBtn.disabled = true;
    ctaBtn.textContent = 'Enviando…';

    setTimeout(() => {
      ctaFeedback.textContent = '¡Listo! Te contactamos pronto.';
      ctaFeedback.style.color = 'var(--violet-600)';
      ctaEmail.value = '';
      ctaBtn.textContent = 'Enviado ✓';
      ctaBtn.style.background = '#4a2fa8';
    }, 900);
  });

  ctaEmail.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') ctaBtn.click();
  });
}

/* ── Smooth anchor scroll (offset for fixed nav) ───────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const id = anchor.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const offset = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--nav-height')) || 70;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ── Puntero circular (solo escritorio con mouse) ──────────────────────────── */
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  cursor.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cursor);
  document.body.classList.add('has-cursor');

  let mx = 0, my = 0, cx = 0, cy = 0;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    cursor.classList.add('on');
  }, { passive: true });
  document.addEventListener('mouseleave', () => cursor.classList.remove('on'));
  document.addEventListener('mousedown', () => cursor.classList.add('down'));
  document.addEventListener('mouseup',   () => cursor.classList.remove('down'));

  document.addEventListener('mouseover', (e) => {
    cursor.classList.toggle('hover', !!e.target.closest('a, button, input, .route'));
  });

  (function loop() {
    cx += (mx - cx) * (still ? 1 : 0.2);
    cy += (my - cy) * (still ? 1 : 0.2);
    cursor.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(loop);
  })();
}

/* ── Hilo que se desenreda con el scroll ───────────────────────────────────────
   Un único path SVG dentro del .hero. Cada punto del hilo se calcula como:
     posición = mezcla(centro del ovillo → línea final, e) + órbitas de lazos × (1 − e)
   Al reducirse las órbitas, los lazos se abren en ondas y luego en una curva casi
   recta, sin cambios de topología. e se retrasa a lo largo del hilo (se "tira" del
   extremo izquierdo). El estado es función pura del scroll: reversible y sin saltos.
   Desactivar: <body data-hilo="off">. Ajustes: constantes en build(). */
(function () {
  const hero = document.querySelector('.hero');
  if (!hero || document.body.dataset.hilo === 'off') return;

  const NS = 'http://www.w3.org/2000/svg';
  const wrap = document.createElement('div');
  wrap.className = 'hilo';
  wrap.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS(NS, 'path');
  svg.appendChild(path);
  wrap.appendChild(svg);
  hero.insertBefore(wrap, hero.firstChild);

  const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const TAU = Math.PI * 2;
  const STAGGER = 0.7;                       // cuánto se retrasa el desenredo a lo largo del hilo
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = p => p * p * p * (p * (p * 6 - 15) + 10);

  let N = 0, tcx, tcy, lx, ly, ox, oy, tt;
  let sEnd = 1, lastW = 0;
  let cur = 0, target = 0, raf = 0, last = 0;

  function build() {
    const r = hero.getBoundingClientRect();
    const W = Math.round(r.width), H = Math.round(r.height);
    if (!W || !H) return false;
    const small = W < 700;
    N = small ? 300 : 460;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

    const u = clamp(Math.min(W, H), 320, 900);
    const R1 = u * 0.1, R2 = u * 0.04, R3 = u * 0.06;      // radios de los lazos
    const spreadX = Math.min(W * 0.2, 300), spreadY = H * 0.08;
    const cx0 = W * 0.5, cy0 = H * (small ? 0.26 : 0.31);     // dónde vive el ovillo
    const yL = H * 0.9, amp = Math.min(H * 0.03, 28);        // línea final

    tcx = new Float32Array(N); tcy = new Float32Array(N);
    lx = new Float32Array(N);  ly = new Float32Array(N);
    ox = new Float32Array(N);  oy = new Float32Array(N);
    tt = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      tcx[i] = cx0 + spreadX * Math.sin(TAU * 1.1 * t + 0.6);
      tcy[i] = cy0 + spreadY * Math.sin(TAU * 1.7 * t + 1.7);
      lx[i] = -W * 0.02 + t * W * 1.04;
      ly[i] = yL - amp * Math.sin(Math.PI * t) + amp * 0.35 * Math.sin(TAU * t);
      tt[i] = t * STAGGER;
      const env = 0.4 + 0.6 * Math.pow(Math.sin(Math.PI * t), 0.7);   // extremos más sueltos
      // Tres familias de lazos (elipses rotadas, radio y fase irregulares) para que no parezcan círculos
      const a1 = TAU * 9  * t + 0.9 * Math.sin(TAU * 2 * t + 0.5), k1 = 1 + 0.4 * Math.sin(TAU * 3.1 * t + 1.0), r1 = TAU * 1.3 * t;
      const a2 = TAU * 23 * t + 1.3 * Math.sin(TAU * 3 * t + 2) + 1.1, k2 = 1 + 0.5 * Math.sin(TAU * 5.3 * t + 0.4), r2 = TAU * 2.1 * t + 1;
      const a3 = TAU * 5  * t + 0.7 * Math.sin(TAU * 4 * t) + 2.4,      k3 = 1 + 0.3 * Math.sin(TAU * 1.7 * t + 2.2), r3 = TAU * 0.8 * t + 2;
      const e1x = R1 * k1 * 1.3 * Math.cos(a1), e1y = R1 * k1 * 0.6 * Math.sin(a1);
      const e2x = R2 * k2 * 1.2 * Math.cos(a2), e2y = R2 * k2 * 0.7 * Math.sin(a2);
      const e3x = R3 * k3 * 1.2 * Math.cos(a3), e3y = R3 * k3 * 0.7 * Math.sin(a3);
      ox[i] = env * (e1x * Math.cos(r1) - e1y * Math.sin(r1) + e2x * Math.cos(r2) - e2y * Math.sin(r2) + e3x * Math.cos(r3) - e3y * Math.sin(r3));
      oy[i] = env * (e1x * Math.sin(r1) + e1y * Math.cos(r1) + e2x * Math.sin(r2) + e2y * Math.cos(r2) + e3x * Math.sin(r3) + e3y * Math.cos(r3));
    }

    // Recorrido de scroll: al terminar, la línea queda hacia la mitad de la pantalla, bajo la barra.
    const vh = window.innerHeight;
    const hi = yL - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 70) - 40;
    sEnd = Math.max(100, Math.min(Math.max(yL - vh * 0.5, vh * 0.45), hi));
    lastW = window.innerWidth;
    return true;
  }

  function draw(P) {
    if (!N) return;
    let d = '';
    for (let i = 0; i < N; i++) {
      const e = ease(clamp(P * (1 + STAGGER) - tt[i], 0, 1));
      const a = 1 - e;
      const x = tcx[i] + (lx[i] - tcx[i]) * e + ox[i] * a;
      const y = tcy[i] + (ly[i] - tcy[i]) * e + oy[i] * a;
      d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    path.setAttribute('d', d);
  }

  const progress = () => reduceMq.matches ? 1 : clamp(window.scrollY / sEnd, 0, 1);

  function frame(now) {
    raf = 0;
    const dt = Math.min(64, now - last || 16);
    last = now;
    const diff = target - cur;
    cur = Math.abs(diff) < 0.0005 ? target : cur + diff * (1 - Math.exp(-dt / 110));  // suavizado ligero
    draw(cur);
    if (cur !== target) raf = requestAnimationFrame(frame);
  }
  function request() {
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  function relayout() {
    if (!build()) return;
    target = progress();
    cur = target;
    draw(cur);
  }

  window.addEventListener('scroll', () => { target = progress(); request(); }, { passive: true });
  if (reduceMq.addEventListener) reduceMq.addEventListener('change', relayout);

  relayout();
  if ('ResizeObserver' in window) {
    let t = 0;
    new ResizeObserver(() => { cancelAnimationFrame(t); t = requestAnimationFrame(relayout); }).observe(hero);
  } else {
    window.addEventListener('resize', relayout);
  }
  // En móvil la barra del navegador cambia solo la altura: no recalcular entonces.
  window.addEventListener('resize', () => { if (window.innerWidth !== lastW) relayout(); });
})();
