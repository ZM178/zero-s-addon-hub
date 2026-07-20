// ================= INFINITE CAROUSEL =================
class InfiniteCarousel {
  constructor(root, opts = {}) {
    this.root = root;
    this.viewport = root.querySelector('[data-viewport]');
    this.track = root.querySelector('[data-track]');
    this.section = root.closest('section');
    this.prevBtn = this.section ? this.section.querySelector('[data-prev]') : null;
    this.nextBtn = this.section ? this.section.querySelector('[data-next]') : null;
    this.getItemsPerView = opts.getItemsPerView || (() => 1);
    this.autoplay = opts.autoplay !== false;
    this.autoplayDelay = opts.autoplayDelay || 5000;
    this.originals = Array.from(this.track.children);
    this.isAnimating = false;
    this.timer = null;

    this.build();
    this.bindDrag();
    window.addEventListener('resize', this.debounce(() => this.build(), 200));
  }

  debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  build() {
    this.itemsPerView = Math.max(1, this.getItemsPerView());

    this.track.querySelectorAll('[data-clone]').forEach((n) => n.remove());
    this.originals.forEach((node) => this.track.appendChild(node));

    const before = this.originals.slice(-this.itemsPerView).map((n) => {
      const c = n.cloneNode(true);
      c.setAttribute('data-clone', '');
      return c;
    });
    const after = this.originals.slice(0, this.itemsPerView).map((n) => {
      const c = n.cloneNode(true);
      c.setAttribute('data-clone', '');
      return c;
    });

    before.reverse().forEach((n) => this.track.prepend(n));
    after.forEach((n) => this.track.appendChild(n));

    this.slides = Array.from(this.track.children);
    this.slideWidthPct = 100 / this.itemsPerView;
    this.slides.forEach((s) => { s.style.width = this.slideWidthPct + '%'; });

    this.index = this.itemsPerView;
    this.track.style.transition = 'none';
    this.setPosition();
    void this.track.offsetHeight;
    this.track.style.transition = '';

    this.bindEvents();
    this.restartAutoplay();
  }

  setPosition() {
    this.track.style.transform = `translateX(-${this.index * this.slideWidthPct}%)`;
  }

  go(dir) {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.index += dir;
    this.track.style.transition = 'transform 0.6s cubic-bezier(.65,0,.35,1)';
    this.setPosition();
  }

  bindEvents() {
    if (this.prevBtn) this.prevBtn.onclick = () => { this.go(-1); this.restartAutoplay(); };
    if (this.nextBtn) this.nextBtn.onclick = () => { this.go(1); this.restartAutoplay(); };

    this.track.ontransitionend = () => {
      this.isAnimating = false;
      const realCount = this.originals.length;

      if (this.index >= realCount + this.itemsPerView) {
        this.index -= realCount;
        this.track.style.transition = 'none';
        this.setPosition();
      } else if (this.index < this.itemsPerView) {
        this.index += realCount;
        this.track.style.transition = 'none';
        this.setPosition();
      }
    };
  }

  restartAutoplay() {
    if (!this.autoplay) return;
    clearInterval(this.timer);
    this.timer = setInterval(() => this.go(1), this.autoplayDelay);
  }

  bindDrag() {
    const vp = this.viewport;
    let dragging = false;
    let moved = false;
    let startX = 0;
    let vpWidth = 0;
    let startTransformPct = 0;
    let liveDeltaPct = 0;

    const onDown = (e) => {
      if (e.target.closest('a, button, input, textarea, select')) return;
      dragging = true;
      moved = false;
      vpWidth = vp.getBoundingClientRect().width || 1;
      startX = e.clientX;
      startTransformPct = this.index * this.slideWidthPct;
      liveDeltaPct = 0;
      clearInterval(this.timer);
      this.track.style.transition = 'none';
      vp.classList.add('is-dragging');
      vp.setPointerCapture(e.pointerId);
    };

    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      liveDeltaPct = (dx / vpWidth) * 100;
      this.track.style.transform = `translateX(-${startTransformPct - liveDeltaPct}%)`;
    };

    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      vp.classList.remove('is-dragging');

      let movedSlides = Math.round(-liveDeltaPct / this.slideWidthPct);
      movedSlides = Math.max(-this.itemsPerView, Math.min(this.itemsPerView, movedSlides));

      this.index += movedSlides;
      this.isAnimating = true;
      this.track.style.transition = 'transform 0.5s cubic-bezier(.65,0,.35,1)';
      this.setPosition();
      this.restartAutoplay();

      if (moved) {
        const swallowClick = (ev) => { ev.preventDefault(); ev.stopPropagation(); };
        vp.addEventListener('click', swallowClick, { capture: true, once: true });
      }
    };

    vp.addEventListener('pointerdown', onDown);
    vp.addEventListener('pointermove', onMove);
    vp.addEventListener('pointerup', onUp);
    vp.addEventListener('pointercancel', onUp);
  }
}

// ================= CLOUDS (light mode) =================
function initClouds() {
  const layer = document.getElementById('clouds-layer');
  if (!layer) return;
  const count = window.innerWidth < 640 ? 4 : 7;

  for (let i = 0; i < count; i++) {
    const c = document.createElement('div');
    c.className = 'cloud';
    const width = Math.random() * 90 + 90; // 90-180px
    const height = width * 0.32;
    c.style.width = width + 'px';
    c.style.height = height + 'px';
    c.style.top = Math.random() * 45 + '%';
    c.style.opacity = (Math.random() * 0.4 + 0.5).toFixed(2);
    const duration = Math.random() * 40 + 50; // 50-90s
    const delay = -(Math.random() * duration);
    c.style.animationDuration = duration.toFixed(1) + 's';
    c.style.animationDelay = delay.toFixed(1) + 's';
    layer.appendChild(c);
  }
}

// ================= STARS + SHOOTING STARS =================
function initStars() {
  const layer = document.getElementById('stars-layer');
  if (!layer) return;
  const count = window.innerWidth < 640 ? 60 : 130;

  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const size = (Math.random() * 2 + 1).toFixed(2);
    s.style.width = size + 'px';
    s.style.height = size + 'px';
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 100 + '%';
    s.style.setProperty('--dur', (Math.random() * 3 + 2).toFixed(2) + 's');
    s.style.setProperty('--delay', (Math.random() * 5).toFixed(2) + 's');
    layer.appendChild(s);
  }
}

function spawnShootingStar() {
  const layer = document.getElementById('stars-layer');
  if (!layer) return;
  const el = document.createElement('div');
  el.className = 'shooting-star';
  el.style.top = Math.random() * 40 + '%';
  el.style.left = Math.random() * 60 + 20 + '%';
  layer.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

function loopShootingStars() {
  spawnShootingStar();
  const next = Math.random() * 4000 + 2500;
  setTimeout(loopShootingStars, next);
}

// ================= THEME TOGGLE =================
function initTheme() {
  const html = document.documentElement;
  const btn = document.getElementById('themeToggle');
  const icon = document.getElementById('themeIcon');
  if (!btn || !icon) return;

  const media = window.matchMedia('(prefers-color-scheme: light)');
  const saved = localStorage.getItem('nocturne-theme');

  // kalo user pernah manual toggle, pake itu. kalo belom, ikutin tema browser
  const theme = saved === 'light' || saved === 'dark'
    ? saved
    : (media.matches ? 'light' : 'dark');

  applyTheme(theme);

  btn.addEventListener('click', () => {
    const next = html.classList.contains('light') ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem('nocturne-theme', next);
  });

  // kalo user belom pernah toggle manual, ikutin kalo user ganti tema browser real-time
  media.addEventListener('change', (e) => {
    const stillDefault = !localStorage.getItem('nocturne-theme');
    if (stillDefault) {
      applyTheme(e.matches ? 'light' : 'dark');
    }
  });

  function applyTheme(theme) {
    html.classList.remove('dark', 'light');
    html.classList.add(theme);
    icon.textContent = theme === 'light' ? '☀️' : '🌙';
  }
}

// ================= MOBILE MENU =================
function initMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileMenuArrow = document.getElementById('mobileMenuArrow');
  if (!mobileMenuBtn || !mobileMenu || !mobileMenuArrow) return;

  mobileMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = mobileMenu.classList.toggle('open');
    mobileMenuBtn.setAttribute('aria-expanded', isOpen);
    mobileMenuArrow.textContent = isOpen ? '⌃' : '⌄';
  });

  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
      mobileMenuArrow.textContent = '⌄';
    });
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('#mobileMenuWrapper')) {
      mobileMenu.classList.remove('open');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
      mobileMenuArrow.textContent = '⌄';
    }
  });
}

// ================= LIGHTBOX =================
// ================= LIGHTBOX =================
function initLightbox() {
  const overlay = document.getElementById('lightboxOverlay');
  const overlayImg = document.getElementById('lightboxImg');
  const closeBtn = document.getElementById('lightboxClose');
  if (!overlay || !overlayImg || !closeBtn) return;

  let scale = 1;
  let posX = 0;
  let posY = 0;
  let dragging = false;
  let startX = 0;
  let startY = 0;

  const MIN_SCALE = 1;
  const MAX_SCALE = 4;

  const applyTransform = () => {
    overlayImg.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
    overlayImg.classList.toggle('is-zoomed', scale > 1);
  };

  const resetZoom = () => {
    scale = 1;
    posX = 0;
    posY = 0;
    applyTransform();
  };

  const images = document.querySelectorAll('.lightbox-img');
  images.forEach((img) => {
    img.addEventListener('click', () => {
      overlayImg.src = img.src;
      overlayImg.alt = img.alt;
      resetZoom();
      overlay.classList.add('open');
    });
  });

  const closeLightbox = () => {
    overlay.classList.remove('open');
    resetZoom();
  };

  closeBtn.addEventListener('click', closeLightbox);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  // scroll buat zoom in/out
  overlayImg.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + delta));
    if (scale === MIN_SCALE) { posX = 0; posY = 0; }
    applyTransform();
  }, { passive: false });

  // double click buat reset zoom
  overlayImg.addEventListener('dblclick', () => {
    resetZoom();
  });

  // drag buat geser pas lagi di-zoom
  overlayImg.addEventListener('pointerdown', (e) => {
    if (scale <= 1) return;
    dragging = true;
    startX = e.clientX - posX;
    startY = e.clientY - posY;
    overlayImg.classList.add('is-dragging');
    overlayImg.setPointerCapture(e.pointerId);
  });

  overlayImg.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    posX = e.clientX - startX;
    posY = e.clientY - startY;
    applyTransform();
  });

  const stopDrag = () => {
    dragging = false;
    overlayImg.classList.remove('is-dragging');
  };

  overlayImg.addEventListener('pointerup', stopDrag);
  overlayImg.addEventListener('pointercancel', stopDrag);
  overlayImg.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
  
}
// ================= INIT =================
document.addEventListener('DOMContentLoaded', () => {
  initStars();
  loopShootingStars();
  initClouds();
  initTheme();
    initLightbox(); 
  initMobileMenu();

  const featuredEl = document.querySelector('#featured-carousel');
  if (featuredEl) {
    new InfiniteCarousel(featuredEl, {
      getItemsPerView: () => 1,
      autoplayDelay: 6000,
    });
  }

  const portfolioEl = document.querySelector('#portfolio-carousel');
  if (portfolioEl) {
    new InfiniteCarousel(portfolioEl, {
      getItemsPerView: () => 1,
      autoplayDelay: 4500,
    });
  }
});