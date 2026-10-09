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
