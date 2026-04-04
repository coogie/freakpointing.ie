/* ============================================================
   FREAK POINTING — script.js
   Nav scroll behaviour + photo grid + lightbox
   ============================================================ */

/* --- Nav: add .scrolled class on scroll ------------------- */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* --- Photo grid ------------------------------------------- */
// Photos are listed here. Add/remove filenames as needed.
// All photos must be in assets/photos/
const PHOTOS = [
  // Album 1 — gig photos
  'IMG_1952.jpg',
  'IMG_1978.jpg',
  'IMG_1999.jpg',
  'IMG_2049.jpg',
  'IMG_2096.jpg',
  'IMG_2233.jpg',
  'IMG_2248.jpg',
  'IMG_2246.jpg',
  'IMG_2263.jpg',
  // Album 2 — gig photos (populated after download)
  // TODO: add Album 2 filenames here once downloaded
  // Album 3 — gig photos
  'IMG_0761.jpg',
  'IMG_0764.jpg',
  'IMG_0770.jpg',
  'IMG_0812.jpg',
  'IMG_0839.jpg',
  'IMG_0860.jpg',
  'IMG_0889.jpg',
  'IMG_0894.jpg',
  'IMG_0906.jpg',
  'IMG_0964.jpg',
];

const grid = document.getElementById('photo-grid');
let loadedPhotos = [];

function buildPhotoGrid() {
  loadedPhotos = [];

  if (PHOTOS.length === 0) {
    grid.innerHTML = '<p class="photos-empty">Photos coming soon.</p>';
    return;
  }

  PHOTOS.forEach((filename, index) => {
    const img = document.createElement('img');
    img.src = `assets/photos/${filename}`;
    img.alt = `Freak Pointing live — ${filename.replace(/\.[^.]+$/, '')}`;
    img.loading = 'lazy';
    img.dataset.index = index;

    img.addEventListener('click', () => openLightbox(index));

    // Only add to grid if it loads successfully
    img.addEventListener('load', () => {
      loadedPhotos.push({ src: img.src, alt: img.alt });
    });

    grid.appendChild(img);
  });
}

buildPhotoGrid();

/* --- Lightbox --------------------------------------------- */
const lightbox      = document.getElementById('lightbox');
const lightboxImg   = document.getElementById('lightbox-img');
const lightboxClose = lightbox.querySelector('.lightbox-close');
const lightboxPrev  = lightbox.querySelector('.lightbox-prev');
const lightboxNext  = lightbox.querySelector('.lightbox-next');
const lightboxCount = document.getElementById('lightbox-counter');

let currentIndex = 0;
let allImgs = [];

function getGridImages() {
  return Array.from(grid.querySelectorAll('img'));
}

function openLightbox(index) {
  allImgs = getGridImages();
  if (allImgs.length === 0) return;
  currentIndex = index;
  showImage(currentIndex);
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  lightboxImg.src = '';
}

function showImage(index) {
  allImgs = getGridImages();
  const img = allImgs[index];
  if (!img) return;
  lightboxImg.src = img.src;
  lightboxImg.alt = img.alt;
  lightboxCount.textContent = `${index + 1} / ${allImgs.length}`;
}

function prev() {
  allImgs = getGridImages();
  currentIndex = (currentIndex - 1 + allImgs.length) % allImgs.length;
  showImage(currentIndex);
}

function next() {
  allImgs = getGridImages();
  currentIndex = (currentIndex + 1) % allImgs.length;
  showImage(currentIndex);
}

lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', prev);
lightboxNext.addEventListener('click', next);

// Close on backdrop click
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape')      closeLightbox();
  if (e.key === 'ArrowLeft')   prev();
  if (e.key === 'ArrowRight')  next();
});
