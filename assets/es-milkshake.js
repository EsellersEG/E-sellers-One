/**
 * E-sellers One - Milkshake Storefront Enhancements
 * Universal Carousel Navigator & Interactivity
 */
document.addEventListener('DOMContentLoaded', () => {
  // Global Carousel Navigation
  document.addEventListener('click', (e) => {
    const prevBtn = e.target.closest('[data-carousel-prev]');
    const nextBtn = e.target.closest('[data-carousel-next]');

    if (prevBtn) {
      e.preventDefault();
      const targetId = prevBtn.getAttribute('data-carousel-prev');
      const track = document.getElementById(targetId);
      if (track) {
        const item = track.firstElementChild;
        const style = window.getComputedStyle(track);
        const gap = parseFloat(style.columnGap || style.gap || 16);
        const scrollAmount = item ? item.offsetWidth + gap : 320;
        track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      }
    } else if (nextBtn) {
      e.preventDefault();
      const targetId = nextBtn.getAttribute('data-carousel-next');
      const track = document.getElementById(targetId);
      if (track) {
        const item = track.firstElementChild;
        const style = window.getComputedStyle(track);
        const gap = parseFloat(style.columnGap || style.gap || 16);
        const scrollAmount = item ? item.offsetWidth + gap : 320;
        track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  });
});
