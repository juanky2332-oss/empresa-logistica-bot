// =====================================================
// MAIN.JS — Animaciones, navbar, scroll effects
// =====================================================

// Navbar scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

// Counter animation para hero stats
function animateCounter(el, target, duration = 2000) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { start = target; clearInterval(timer); }
    el.textContent = Math.floor(start).toLocaleString('es-ES');
  }, 16);
}

// Intersection Observer para fade-in y counters
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

// Counters para stats hero
const statNums = document.querySelectorAll('.stat-num[data-target]');
const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
  const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        statNums.forEach(el => {
          animateCounter(el, parseInt(el.dataset.target));
        });
        heroObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  heroObserver.observe(heroStats);
}

// Apply fade-in to all cards
document.querySelectorAll('.service-card, .route-card, .container-card, .sector-card, .bot-feat-card').forEach(el => {
  el.classList.add('fade-in');
  observer.observe(el);
});

// Hamburger menu (mobile)
const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');
if (hamburger) {
  hamburger.addEventListener('click', () => {
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    navLinks.style.flexDirection = 'column';
    navLinks.style.position = 'absolute';
    navLinks.style.top = '64px';
    navLinks.style.left = '0';
    navLinks.style.right = '0';
    navLinks.style.background = 'rgba(5,11,24,0.98)';
    navLinks.style.padding = '16px 24px';
    navLinks.style.borderBottom = '1px solid rgba(255,255,255,0.08)';
  });
}

// Close mobile menu on link click
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth < 768) {
      navLinks.style.display = 'none';
    }
  });
});

// Contact form submit
function handleFormSubmit(e) {
  e.preventDefault();
  const success = document.getElementById('formSuccess');
  success.style.display = 'flex';
  e.target.reset();
  setTimeout(() => { success.style.display = 'none'; }, 5000);
}

// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 120) current = s.getAttribute('id');
  });
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.remove('active-link');
    if (a.getAttribute('href') === '#' + current) a.classList.add('active-link');
  });
});

// Smooth appear for hero
window.addEventListener('load', () => {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.4s ease';
  requestAnimationFrame(() => {
    document.body.style.opacity = '1';
  });
});
