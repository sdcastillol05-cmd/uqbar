/* ── Semilla → planta → diente de león, controlada por el scroll ──────────────
   · 12 fotogramas webp transparentes: img/Background_01.webp … Background_12.webp
   · Un <canvas> fijo a la derecha, detrás del contenido (ver planta.css).
   · El fotograma es función pura de la posición de scroll → al volver hacia
     arriba la animación se reproduce al revés, sin saltos.
   · Entre dos fotogramas se hace fundido cruzado y la posición se suaviza con
     un lerp en requestAnimationFrame para que se sienta continua.
   · Cada sección ancla un fotograma (ver STOPS): la planta "crece" con el relato.
   Activar/desactivar: <body data-planta="on"> en el HTML de cada ruta.        */
(function () {
  const body = document.body;
  if (body.dataset.planta !== 'on') return;

  /* ── Ajustes ─────────────────────────────────────────────────────────────── */
  const BASE  = 'img/Background_';   // ← ruta + prefijo de tus archivos (relativa al index.html)
  const EXT   = '.webp';
  const COUNT = 12;
  const SMOOTH = 130;                // ms de suavizado (menos = más directo)
  // [selector, punto de la sección (0 = arriba, 1 = abajo), fotograma (0 = Background_01 … 11 = Background_12)]
  const STOPS = [
    ['.hero',          0.6, 0   ],   // semilla en reposo durante el hero
    ['#valores',       0.5, 2.5 ],   // germina
    ['#camino',        0.5, 5   ],   // brota y crece (etapas del negocio)
    ['#diferenciales', 0.5, 7   ],   // planta formada
    ['#rutas',         0.5, 9   ],   // flor / diente de león abriéndose
    ['#contacto',      0.15, 11 ],   // diente de león completo
  ];

  /* ── DOM ─────────────────────────────────────────────────────────────────── */
  const wrap = document.createElement('div');
  wrap.className = 'planta';
  wrap.setAttribute('aria-hidden', 'true');
  const cv  = document.createElement('canvas');
  const ctx = cv.getContext('2d');
  wrap.appendChild(cv);
  body.insertBefore(wrap, body.firstChild);

  const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = t => t * t * (3 - 2 * t);

  /* ── Carga de fotogramas ─────────────────────────────────────────────────── */
  const frames = new Array(COUNT).fill(null);
  let ratio = 0;                                   // alto / ancho

  function load(i) {
    return new Promise(resolve => {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => {
        (im.decode ? im.decode().catch(() => {}) : Promise.resolve()).then(() => {
          frames[i] = im; resolve(im);
        });
      };
      im.onerror = () => resolve(null);
      im.src = BASE + String(i + 1).padStart(2, '0') + EXT;
    });
  }
  // Fotograma más cercano ya cargado (así nunca se ve un hueco mientras llegan los demás)
  function pick(i) {
    for (let d = 0; d < COUNT; d++) {
      if (frames[i - d]) return frames[i - d];
      if (frames[i + d]) return frames[i + d];
    }
    return null;
  }

  /* ── Tamaño del canvas (nítido en pantallas retina) ──────────────────────── */
  function size() {
    if (!ratio) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = wrap.clientWidth || 200;
    cv.width  = Math.round(w * dpr);
    cv.height = Math.round(w * ratio * dpr);
    lastF = -1;                                    // fuerza redibujado
  }

  /* ── Dibujo con fundido cruzado ──────────────────────────────────────────── */
  let lastF = -1;
  function draw(f) {
    if (Math.abs(f - lastF) < 0.001) return;
    lastF = f;
    const i = clamp(Math.floor(f), 0, COUNT - 1);
    const s = smooth(f - i);
    const a = pick(i), b = pick(Math.min(i + 1, COUNT - 1));
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (a) { ctx.globalAlpha = (b && b !== a && s > 0) ? 1 - s : 1; ctx.drawImage(a, 0, 0, cv.width, cv.height); }
    if (b && b !== a && s > 0) { ctx.globalAlpha = s; ctx.drawImage(b, 0, 0, cv.width, cv.height); }
    ctx.globalAlpha = 1;
  }

  /* ── Mapa scroll → fotograma (interpolación lineal entre anclas) ─────────── */
  let stops = [], lights = [], vh = window.innerHeight;
  function layout() {
    vh = window.innerHeight;
    stops = [];
    STOPS.forEach(([sel, k, f]) => {
      const el = document.querySelector(sel);
      if (!el) return;
      const r = el.getBoundingClientRect();
      stops.push({ y: r.top + window.scrollY + r.height * k, f });
    });
    stops.sort((p, q) => p.y - q.y);
    lights = Array.from(document.querySelectorAll('.sec--light, .cta-section'));
    size();
    target = frameAt();
    cur = target;
    draw(cur);
  }
  function frameAt() {
    if (!stops.length) return 0;
    const y = window.scrollY + vh * 0.5;           // se evalúa al centro de la pantalla
    if (y <= stops[0].y) return stops[0].f;
    for (let i = 1; i < stops.length; i++) {
      if (y <= stops[i].y) {
        const p = stops[i - 1], n = stops[i];
        return p.f + (n.f - p.f) * ((y - p.y) / ((n.y - p.y) || 1));
      }
    }
    return stops[stops.length - 1].f;
  }

  /* ── Bucle (suavizado) ───────────────────────────────────────────────────── */
  let cur = 0, target = 0, raf = 0, last = 0, onLight = false;

  function updateTone() {
    const py = vh * 0.75;
    const light = lights.some(el => { const r = el.getBoundingClientRect(); return r.top <= py && r.bottom > py; });
    if (light !== onLight) { onLight = light; wrap.classList.toggle('on-light', light); }
  }
  function frame(now) {
    raf = 0;
    const dt = Math.min(64, now - last || 16);
    last = now;
    const diff = target - cur;
    cur = (reduceMq.matches || Math.abs(diff) < 0.002) ? target : cur + diff * (1 - Math.exp(-dt / SMOOTH));
    draw(cur);
    if (cur !== target) raf = requestAnimationFrame(frame);
  }
  function request() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }

  window.addEventListener('scroll', () => { target = frameAt(); updateTone(); request(); }, { passive: true });

  let rl = 0;
  const relayout = () => { cancelAnimationFrame(rl); rl = requestAnimationFrame(() => { layout(); updateTone(); }); };
  let lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    // En móvil la barra del navegador solo cambia la altura: no recalcular entonces
    if (window.innerWidth !== lastW) { lastW = window.innerWidth; relayout(); }
  });
  window.addEventListener('load', relayout);
  if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(document.documentElement);

  /* ── Arranque: primero el fotograma 1, luego el resto en segundo plano ───── */
  load(0).then(first => {
    if (!first) return;                            // sin imágenes: no se muestra nada
    ratio = first.naturalHeight / first.naturalWidth;
    wrap.classList.add('ready');
    layout(); updateTone();
    for (let i = 1; i < COUNT; i++) load(i).then(() => { lastF = -1; draw(cur); });
  });
})();
