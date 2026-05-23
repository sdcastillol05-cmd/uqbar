/* ── Scroll reveal ─────────────────────────────────────────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ── Navbar scroll tint ────────────────────────────────────────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

/* ── Mobile hamburger menu ─────────────────────────────────────────────────── */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');

hamburger.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
  // prevent body scroll when menu is open
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

// Close menu when a link is clicked
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', false);
    document.body.style.overflow = '';
  });
});

// Close on outside click
document.addEventListener('click', (e) => {
  if (navLinks.classList.contains('open') &&
      !navLinks.contains(e.target) &&
      !hamburger.contains(e.target)) {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', false);
    document.body.style.overflow = '';
  }
});

/* ── CTA email form ────────────────────────────────────────────────────────── */
const ctaBtn      = document.getElementById('cta-btn');
const ctaEmail    = document.getElementById('cta-email');
const ctaFeedback = document.getElementById('cta-feedback');

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

/* ── Smooth anchor scroll (offset for fixed nav) ───────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--nav-height')) || 70;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});
