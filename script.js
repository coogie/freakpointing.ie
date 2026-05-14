/* ============================================================
   FREAK POINTING — script.js
   Nav scroll behaviour + photo grid + lightbox
   ============================================================ */

(function () {
  'use strict';

  /* --- Contact email (scraper protection) ------------------- */
  const emailEl = document.getElementById('contact-email');
  if (emailEl) {
    const u = 'lads', d = 'freakpointing.ie';
    emailEl.href = 'mailto:' + u + '@' + d;
    emailEl.textContent = u + '@' + d;
  }

  /* --- Nav: add .scrolled class on scroll ------------------- */
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  /* --- Focus trap utility ----------------------------------- */
  function getFocusable(el) {
    return Array.from(el.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(n => !n.disabled);
  }

  function trapFocus(el, e) {
    if (e.key !== 'Tab') return;
    const focusable = getFocusable(el);
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /* --- Review lightbox -------------------------------------- */
  const reviewLightbox = document.getElementById('review-lightbox');
  let reviewLightboxTrigger = null;

  function openReviewLightbox() {
    if (!reviewLightbox) return;
    reviewLightboxTrigger = document.activeElement;
    reviewLightbox.classList.add('open');
    reviewLightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const focusable = getFocusable(reviewLightbox);
    requestAnimationFrame(() => { if (focusable.length) focusable[0].focus(); });
  }

  function closeReviewLightbox() {
    if (!reviewLightbox) return;
    reviewLightbox.classList.remove('open');
    reviewLightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    const trigger = reviewLightboxTrigger;
    requestAnimationFrame(() => { if (trigger) trigger.focus(); });
  }

  if (reviewLightbox) {
    reviewLightbox.addEventListener('click', e => {
      if (e.target === reviewLightbox) closeReviewLightbox();
    });
  }

  /* --- Press carousel --------------------------------------- */
  const pressCarousel = document.getElementById('press-carousel');
  if (pressCarousel) {
    const pressSlides  = Array.from(pressCarousel.querySelectorAll('.press-slide'));
    const pressDots    = Array.from(document.querySelectorAll('.press-dot'));
    const pressPrev    = document.getElementById('press-prev');
    const pressNext    = document.getElementById('press-next');
    // The common ancestor of both .press-carousel and .press-carousel-nav —
    // the paused class must live here so the CSS selector can reach the dots.
    const pressSection = pressCarousel.closest('section');
    const total        = pressSlides.length;

    let AUTO_MS        = 8000;
    let current        = 0;
    let autoTimer      = null;
    let remaining      = AUTO_MS;
    let startTime      = null;
    let isPaused       = false; // Explicitly track state

    // --- SVG ring injection ----------------------------------
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const RADIUS = 8;
    const CIRCUM = +(2 * Math.PI * RADIUS).toFixed(2); // ≈ 50.27

    pressDots.forEach(dot => {
      dot.style.setProperty('--ring-c', CIRCUM);
      dot.style.setProperty('--auto-ms', `${AUTO_MS}ms`);

      const svg = document.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('viewBox', '0 0 20 20');
      svg.setAttribute('aria-hidden', 'true');
      svg.classList.add('press-dot__ring');

      const ringTrack = document.createElementNS(SVG_NS, 'circle');
      ringTrack.setAttribute('cx', '10');
      ringTrack.setAttribute('cy', '10');
      ringTrack.setAttribute('r', RADIUS);
      ringTrack.classList.add('ring-track');

      const ringProgress = document.createElementNS(SVG_NS, 'circle');
      ringProgress.setAttribute('cx', '10');
      ringProgress.setAttribute('cy', '10');
      ringProgress.setAttribute('r', RADIUS);
      ringProgress.classList.add('ring-progress');

      svg.appendChild(ringTrack);
      svg.appendChild(ringProgress);
      dot.appendChild(svg);
    });

    // --- Slide track -----------------------------------------
    const slideTrack = document.createElement('div');
    slideTrack.className = 'press-carousel-track';
    pressSlides.forEach(s => slideTrack.appendChild(s));
    pressCarousel.appendChild(slideTrack);

    const resetRing = dot => {
      dot.classList.remove('press-dot--active');
      void dot.offsetWidth; // reflow — required to restart the CSS animation
      dot.classList.add('press-dot--active');
    };

    const goTo = index => {
      index = ((index % total) + total) % total;
      pressSlides.forEach((s, i) => s.setAttribute('aria-hidden', i === index ? 'false' : 'true'));
      slideTrack.style.transform = `translateX(-${index * 100}%)`;
      
      pressDots.forEach((d, i) => {
        d.setAttribute('aria-selected', String(i === index));
        if (i === index) { resetRing(d); } 
        else { d.classList.remove('press-dot--active'); }
      });
      current = index;
    };

    const stopAuto = () => {
      if (isPaused) return;
      
      clearTimeout(autoTimer);
      isPaused = true;
      pressSection.classList.add('press-carousel--paused');
      
      if (startTime) {
        const elapsed = Date.now() - startTime;
        remaining = Math.max(0, remaining - elapsed);
      }
      startTime = null;
    };

    const startAuto = (resetTime = false) => {
      if (!isPaused && !resetTime) return;

      clearTimeout(autoTimer);
      isPaused = false;
      pressSection.classList.remove('press-carousel--paused');
      
      if (resetTime) remaining = AUTO_MS;
      
      startTime = Date.now();
      autoTimer = setTimeout(() => {
        goTo(current + 1);
        startAuto(true);
      }, remaining);
    };

    const manualNav = fn => {
      clearTimeout(autoTimer);
      isPaused = false; 
      fn();
      remaining = AUTO_MS;
      startAuto(true);
    };

    goTo(0);
    startAuto(true);

    if (pressPrev) pressPrev.addEventListener('click', () => manualNav(() => goTo(current - 1)));
    if (pressNext) pressNext.addEventListener('click', () => manualNav(() => goTo(current + 1)));

    pressDots.forEach(d => {
      d.addEventListener('click', () => manualNav(() => goTo(Number(d.dataset.index))));
    });

    // Pause on hover/focus over the whole section so the ring freezes
    // whether the cursor is over the quote text, the buttons, or the dots.
    pressSection.addEventListener('mouseenter', stopAuto);
    pressSection.addEventListener('mouseleave', () => startAuto(false));
    pressSection.addEventListener('focusin',    stopAuto);
    pressSection.addEventListener('focusout',   () => startAuto(false));

    // Swipe support
    let touchStartX = null;
    pressCarousel.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    pressCarousel.addEventListener('touchend', e => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) manualNav(() => goTo(dx < 0 ? current + 1 : current - 1));
      touchStartX = null;
    }, { passive: true });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) stopAuto();
  }

  /* Expose to inline onclick */
  window.openReviewLightbox  = openReviewLightbox;
  window.closeReviewLightbox = closeReviewLightbox;

  /* --- Instagram video lightbox ----------------------------- */
  const videoLightbox = document.getElementById('video-lightbox');
  const igVideo       = document.getElementById('ig-video');
  let videoLightboxTrigger = null;

  // Preload the video on hover/focus so it's ready when the lightbox opens
  const igTrigger = document.querySelector('.video-slot--instagram');
  if (igTrigger && igVideo) {
    function preloadIgVideo() {
      if (igVideo.preload === 'none') {
        igVideo.preload = 'auto';
        igVideo.load();
      }
    }
    igTrigger.addEventListener('mouseenter', preloadIgVideo, { once: true });
    igTrigger.addEventListener('focus',      preloadIgVideo, { once: true });
  }

  function openVideoLightbox() {
    if (!videoLightbox) return;
    videoLightboxTrigger = document.activeElement;
    videoLightbox.classList.add('open');
    videoLightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (igVideo) {
      const playPromise = igVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => { /* autoplay blocked — user can press play manually */ });
      }
    }
    const focusable = getFocusable(videoLightbox);
    requestAnimationFrame(() => { if (focusable.length) focusable[0].focus(); });
  }

  function closeVideoLightbox() {
    if (!videoLightbox) return;
    videoLightbox.classList.remove('open');
    videoLightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (igVideo) {
      igVideo.pause();
      igVideo.currentTime = 0;
    }
    const trigger = videoLightboxTrigger;
    requestAnimationFrame(() => { if (trigger) trigger.focus(); });
  }

  if (videoLightbox) {
    videoLightbox.addEventListener('click', e => {
      if (e.target === videoLightbox) closeVideoLightbox();
    });
  }

  window.openVideoLightbox  = openVideoLightbox;
  window.closeVideoLightbox = closeVideoLightbox;

  /* --- Photo grid ------------------------------------------- */
  // Photos are listed here. Add/remove filenames as needed.
  // All photos must be in assets/photos/
  const PHOTOS = [
    { f: 'IMG_1272.webp', w: 683,  h: 1024 },
    { f: 'IMG_0761.webp', w: 1024, h: 683  },
    { f: 'IMG_0764.webp', w: 1024, h: 683  },
    { f: 'IMG_0812.webp', w: 1024, h: 683  },
    { f: 'IMG_0889.webp', w: 1024, h: 683  },
    { f: 'IMG_1978.webp', w: 1024, h: 683  },
    { f: 'IMG_2049.webp', w: 1024, h: 683  },
    { f: 'IMG_2248.webp', w: 1024, h: 683  },
    { f: 'IMG_4732.webp', w: 1024, h: 683  },
    { f: 'IMG_4877.webp', w: 1024, h: 683  },
    { f: 'IMG_4977.webp', w: 1024, h: 683  },
    { f: 'IMG_1447.webp', w: 683,  h: 1024 },
  ];

  // Fisher-Yates shuffle (unbiased)
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const grid = document.getElementById('photo-grid');

  function buildPhotoGrid() {
    if (!grid) return;
    shuffle(PHOTOS);

    if (PHOTOS.length === 0) {
      grid.innerHTML = '<p class="photos-empty">Photos coming soon.</p>';
      return;
    }

    PHOTOS.forEach(({ f, w, h }, index) => {
      const img = document.createElement('img');
      img.src = `assets/photos/${f}`;
      img.alt = 'Freak Pointing live';
      img.loading = 'lazy';
      img.width  = w;
      img.height = h;
      img.dataset.index = index;
      img.addEventListener('click', () => openLightbox(index));
      img.addEventListener('error', () => { img.remove(); });
      grid.appendChild(img);
    });
  }

  buildPhotoGrid();

  /* --- Photo lightbox --------------------------------------- */
  const lightbox      = document.getElementById('lightbox');
  const lightboxImg   = lightbox ? document.getElementById('lightbox-img') : null;
  const lightboxClose = lightbox ? lightbox.querySelector('.lightbox-close') : null;
  const lightboxPrev  = lightbox ? lightbox.querySelector('.lightbox-prev') : null;
  const lightboxNext  = lightbox ? lightbox.querySelector('.lightbox-next') : null;
  const lightboxCount = document.getElementById('lightbox-counter');

  let currentIndex = 0;
  let lightboxTrigger = null;
  let cachedGridImages = null;

  function getGridImages() {
    if (!cachedGridImages) {
      cachedGridImages = grid ? Array.from(grid.querySelectorAll('img')) : [];
    }
    return cachedGridImages;
  }

  function openLightbox(index) {
    if (!lightbox) return;
    const allImgs = getGridImages();
    if (allImgs.length === 0) return;
    lightboxTrigger = document.activeElement;
    currentIndex = index;
    showImage(currentIndex);
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => { if (lightboxClose) lightboxClose.focus(); });
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lightboxImg) lightboxImg.src = '';
    const trigger = lightboxTrigger;
    requestAnimationFrame(() => { if (trigger) trigger.focus(); });
  }

  function showImage(index) {
    const allImgs = getGridImages();
    const img = allImgs[index];
    if (!img || !lightboxImg) return;
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    if (lightboxCount) lightboxCount.textContent = `${index + 1} / ${allImgs.length}`;
  }

  function prev() {
    const allImgs = getGridImages();
    currentIndex = (currentIndex - 1 + allImgs.length) % allImgs.length;
    showImage(currentIndex);
  }

  function next() {
    const allImgs = getGridImages();
    currentIndex = (currentIndex + 1) % allImgs.length;
    showImage(currentIndex);
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev)  lightboxPrev.addEventListener('click', prev);
  if (lightboxNext)  lightboxNext.addEventListener('click', next);

  if (lightbox) {
    lightbox.addEventListener('click', e => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  /* --- Bandsintown widget: lazy-load on scroll -------------- */
  const gigsSection = document.getElementById('gigs');
  if (gigsSection) {
    const observer = new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting) {
        obs.disconnect();
        const s = document.createElement('script');
        s.charset = 'utf-8';
        s.src = 'https://widgetv3.bandsintown.com/main.min.js';
        document.head.appendChild(s);
      }
    }, { rootMargin: '400px' });
    observer.observe(gigsSection);
  }

  /* --- Consolidated keyboard handler ------------------------ */
  document.addEventListener('keydown', e => {
    if (lightbox && lightbox.classList.contains('open')) {
      if (e.key === 'Escape')     { closeLightbox(); return; }
      if (e.key === 'ArrowLeft')  { prev(); return; }
      if (e.key === 'ArrowRight') { next(); return; }
      trapFocus(lightbox, e);
      return;
    }
    if (reviewLightbox && reviewLightbox.classList.contains('open')) {
      if (e.key === 'Escape') { closeReviewLightbox(); return; }
      trapFocus(reviewLightbox, e);
      return;
    }
    if (videoLightbox && videoLightbox.classList.contains('open')) {
      if (e.key === 'Escape') { closeVideoLightbox(); return; }
      trapFocus(videoLightbox, e);
    }
  });

})();
