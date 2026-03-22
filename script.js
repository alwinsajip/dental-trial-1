/**
 * PearlDent — Dental Clinic Website
 * script.js — All interactive behaviour
 *
 * Features:
 *  - Dark/Light mode toggle with localStorage persistence
 *  - Sticky navbar with scroll detection
 *  - Mobile hamburger menu
 *  - Scroll reveal (Intersection Observer)
 *  - Active nav link tracking
 *  - Gallery lightbox (keyboard + click navigation)
 *  - Testimonials slider
 *  - Scroll-to-top button
 */

/* ============================================================
   1. THEME TOGGLE
   ============================================================ */
(function initTheme() {
  const root    = document.documentElement;
  const btn     = document.getElementById('themeToggle');
  const STORAGE = 'pd-theme';

  // Apply stored preference immediately (before paint)
  const saved = localStorage.getItem(STORAGE);
  if (saved) root.setAttribute('data-theme', saved);

  btn.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') || 'light';
    const next    = current === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE, next);
  });
})();


/* ============================================================
   2. STICKY NAVBAR
   ============================================================ */
(function initNavbar() {
  const navbar = document.getElementById('navbar');

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 30);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // initial call
})();


/* ============================================================
   3. HAMBURGER MENU
   ============================================================ */
(function initMobileMenu() {
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLinks = mobileMenu.querySelectorAll('.mobile-link');

  const toggle = (open) => {
    hamburger.classList.toggle('open', open);
    mobileMenu.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    mobileMenu.setAttribute('aria-hidden', String(!open));
  };

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.contains('open');
    toggle(!isOpen);
  });

  // Close when a link is clicked
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => toggle(false));
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
      toggle(false);
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggle(false);
  });
})();


/* ============================================================
   4. SCROLL REVEAL  (Intersection Observer)
   ============================================================ */
(function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // fire once only
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  elements.forEach(el => observer.observe(el));
})();


/* ============================================================
   5. ACTIVE NAV LINK (Scroll spy)
   ============================================================ */
(function initScrollSpy() {
  const sections  = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    },
    {
      rootMargin: '-40% 0px -55% 0px',
      threshold: 0,
    }
  );

  sections.forEach(s => observer.observe(s));
})();


/* ============================================================
   6. GALLERY LIGHTBOX
   ============================================================ */
(function initLightbox() {
  const galleryItems  = Array.from(document.querySelectorAll('.gallery-item'));
  const lightbox      = document.getElementById('lightbox');
  const lightboxImg   = document.getElementById('lightboxImg');
  const lightboxCap   = document.getElementById('lightboxCaption');
  const closeBtn      = document.getElementById('lightboxClose');
  const prevBtn       = document.getElementById('lightboxPrev');
  const nextBtn       = document.getElementById('lightboxNext');

  let currentIndex = 0;

  const open = (index) => {
    currentIndex = index;
    const item   = galleryItems[index];
    lightboxImg.src = item.dataset.src || item.querySelector('img').src;
    lightboxImg.alt = item.querySelector('img').alt || '';
    lightboxCap.textContent = item.dataset.caption || '';
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  };

  const close = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    lightboxImg.src = '';
  };

  const navigate = (dir) => {
    currentIndex = (currentIndex + dir + galleryItems.length) % galleryItems.length;
    // Brief fade between images
    lightboxImg.style.opacity = '0';
    setTimeout(() => {
      const item = galleryItems[currentIndex];
      lightboxImg.src = item.dataset.src || item.querySelector('img').src;
      lightboxCap.textContent = item.dataset.caption || '';
      lightboxImg.style.opacity = '1';
    }, 150);
  };

  // Smooth image transition
  lightboxImg.style.transition = 'opacity .2s ease';

  // Open on click
  galleryItems.forEach((item, i) => {
    item.addEventListener('click', () => open(i));
    item.setAttribute('tabindex', '0');
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
    });
  });

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => navigate(-1));
  nextBtn.addEventListener('click', () => navigate(1));

  // Close on backdrop click
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) close();
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape')       close();
    if (e.key === 'ArrowLeft')    navigate(-1);
    if (e.key === 'ArrowRight')   navigate(1);
  });

  // Swipe support (touch)
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) navigate(dx > 0 ? -1 : 1);
  }, { passive: true });
})();


/* ============================================================
   7. TESTIMONIALS SLIDER
   ============================================================ */
(function initTestimonialsSlider() {
  const track  = document.getElementById('testimonialsTrack');
  const cards  = Array.from(track.querySelectorAll('.testimonial-card'));
  const dotsEl = document.getElementById('tDots');
  const prevBtn = document.getElementById('tPrev');
  const nextBtn = document.getElementById('tNext');

  if (!track || cards.length === 0) return;

  // Determine how many cards are visible per "page"
  const getVisible = () => {
    if (window.innerWidth <= 600) return 1;
    if (window.innerWidth <= 960) return 2;
    return 3;
  };

  let current  = 0;
  let visible  = getVisible();
  let totalPages = Math.ceil(cards.length / visible);

  // Create dots
  const buildDots = () => {
    dotsEl.innerHTML = '';
    totalPages = Math.ceil(cards.length / visible);
    for (let i = 0; i < totalPages; i++) {
      const dot = document.createElement('button');
      dot.className = 't-dot' + (i === current ? ' active' : '');
      dot.setAttribute('aria-label', `Go to page ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsEl.appendChild(dot);
    }
  };

  const goTo = (page) => {
    current = Math.max(0, Math.min(page, totalPages - 1));
    const cardW = cards[0].offsetWidth + 24; // gap = 24px
    track.style.transform = `translateX(-${current * visible * cardW}px)`;
    track.style.transition = 'transform .45s cubic-bezier(.4,0,.2,1)';
    document.querySelectorAll('.t-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === current);
    });
  };

  const next = () => goTo((current + 1) % totalPages);
  const prev = () => goTo((current - 1 + totalPages) % totalPages);

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  // Keyboard
  document.addEventListener('keydown', (e) => {
    const section = document.getElementById('testimonials');
    const rect    = section?.getBoundingClientRect();
    const inView  = rect && rect.top < window.innerHeight && rect.bottom > 0;
    if (!inView) return;
    if (e.key === 'ArrowLeft')  prev();
    if (e.key === 'ArrowRight') next();
  });

  // Auto-play
  let autoplay = setInterval(next, 5000);

  track.parentElement.addEventListener('mouseenter', () => clearInterval(autoplay));
  track.parentElement.addEventListener('mouseleave', () => {
    autoplay = setInterval(next, 5000);
  });

  // Touch swipe
  let swipeStart = 0;
  track.addEventListener('touchstart', (e) => {
    swipeStart = e.changedTouches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - swipeStart;
    if (Math.abs(dx) > 50) dx > 0 ? prev() : next();
  }, { passive: true });

  // Recalculate on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const newVisible = getVisible();
      if (newVisible !== visible) {
        visible = newVisible;
        current = 0;
        buildDots();
        goTo(0);
      }
    }, 200);
  });

  // Init
  buildDots();
  goTo(0);
})();


/* ============================================================
   8. SCROLL-TO-TOP BUTTON
   ============================================================ */
(function initScrollTop() {
  const btn = document.getElementById('scrollTop');

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 600);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();


/* ============================================================
   9. SMOOTH SCROLL FOR ALL ANCHOR LINKS
      (fallback for browsers that ignore CSS scroll-behavior
       inside overflow:hidden containers)
   ============================================================ */
(function initSmoothScroll() {
  const NAV_OFFSET = 76; // px — accounts for sticky navbar height

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();


/* ============================================================
   10. BUTTON RIPPLE EFFECT (micro-interaction)
   ============================================================ */
(function initRipple() {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.style.position  = 'relative';
    btn.style.overflow  = 'hidden';

    btn.addEventListener('click', function (e) {
      const circle   = document.createElement('span');
      const diameter = Math.max(btn.clientWidth, btn.clientHeight);
      const radius   = diameter / 2;
      const rect     = btn.getBoundingClientRect();

      Object.assign(circle.style, {
        width:       `${diameter}px`,
        height:      `${diameter}px`,
        left:        `${e.clientX - rect.left - radius}px`,
        top:         `${e.clientY - rect.top  - radius}px`,
        position:    'absolute',
        borderRadius: '50%',
        background:  'rgba(255,255,255,0.3)',
        transform:   'scale(0)',
        animation:   'pd-ripple .55s linear',
        pointerEvents: 'none',
      });

      btn.appendChild(circle);
      circle.addEventListener('animationend', () => circle.remove());
    });
  });

  // Inject keyframes once
  if (!document.getElementById('pd-ripple-style')) {
    const style = document.createElement('style');
    style.id = 'pd-ripple-style';
    style.textContent = `
      @keyframes pd-ripple {
        to { transform: scale(4); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
})();
