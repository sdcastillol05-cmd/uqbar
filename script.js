/* ═══════════════════════════════════════════════
   UQBAR — script.js
═══════════════════════════════════════════════ */

/* ── Reveal on scroll ── */
(function () {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });

  reveals.forEach(el => io.observe(el));
})();

/* ── Nav: shrink on scroll ── */
(function () {
  const nav = document.querySelector('nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
})();

/* ── Mobile menu toggle ── */
(function () {
  const toggle = document.querySelector('.nav-mobile-toggle');
  const nav    = document.querySelector('nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    nav.classList.toggle('menu-open');
    const open = nav.classList.contains('menu-open');
    document.body.style.overflow = open ? 'hidden' : '';
    toggle.setAttribute('aria-expanded', open);
  });

  // Close on link click
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('menu-open');
      document.body.style.overflow = '';
    });
  });
})();

/* ── CTA form: pseudo-submit ── */
(function () {
  const form    = document.querySelector('.cta-form');
  const input   = form ? form.querySelector('input[type="email"]') : null;
  const success = document.querySelector('.cta-success');
  if (!form || !input || !success) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = input.value.trim();
    const re    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) {
      input.style.outline = '1px solid #f07070';
      setTimeout(() => { input.style.outline = ''; }, 1800);
      return;
    }

    // Construct mailto
    const subject = encodeURIComponent('Solicitud de sesión de diagnóstico — Uqbar');
    const body    = encodeURIComponent(
      `Hola,\n\nQuisiera agendar una sesión de diagnóstico.\n\nCorreo de contacto: ${email}\n`
    );
    window.location.href = `mailto:hola@uqbar.app?subject=${subject}&body=${body}`;

    // Show confirmation
    form.style.opacity = '0';
    form.style.pointerEvents = 'none';
    success.style.display = 'block';
    setTimeout(() => { success.style.opacity = '1'; }, 50);
  });
})();

/* ── Smooth active nav highlight ── */
(function () {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-links a[href^="#"]');
  if (!sections.length || !links.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(s => io.observe(s));
})();
