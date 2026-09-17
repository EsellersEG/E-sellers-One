/**
 * Product Media Gallery Web Component - E-sellers Professional (v4.9.0)
 */

class ProductGallery extends HTMLElement {
  constructor() {
    super();
    this.mainImage = this.querySelector('.product-gallery__main-img');
    this.thumbnails = this.querySelectorAll('.product-gallery__thumbnail-btn');

    this.thumbnails.forEach(btn => {
      btn.addEventListener('click', this.onThumbnailClick.bind(this));
    });

    // Variant change listener to update main gallery image
    if (window.subscribe && window.PUB_SUB_EVENTS) {
      window.subscribe(window.PUB_SUB_EVENTS.variantChange, (data) => {
        if (data.variant && data.variant.featured_media) {
          this.setActiveMedia(data.variant.featured_media.id);
        }
      });
    }

    this.setupZoom();
  }

  onThumbnailClick(e) {
    const btn = e.currentTarget;
    const mediaId = btn.getAttribute('data-media-id');
    const mediaSrc = btn.getAttribute('data-media-src');
    const mediaAlt = btn.getAttribute('data-media-alt');

    this.thumbnails.forEach(t => t.classList.remove('is-active'));
    btn.classList.add('is-active');

    if (this.mainImage && mediaSrc) {
      this.mainImage.src = mediaSrc;
      if (mediaAlt) this.mainImage.alt = mediaAlt;
      this.mainImage.setAttribute('data-media-id', mediaId);
    }
  }

  setActiveMedia(mediaId) {
    const matchingThumb = this.querySelector(`[data-media-id="${mediaId}"]`);
    if (matchingThumb) {
      matchingThumb.click();
    }
  }

  setupZoom() {
    const wrapper = this.querySelector('.product-gallery__image-wrapper');
    if (!wrapper || !this.mainImage) return;

    wrapper.addEventListener('mousemove', (e) => {
      const rect = wrapper.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      this.mainImage.style.transformOrigin = `${x}% ${y}%`;
      this.mainImage.style.transform = 'scale(1.5)';
    });

    wrapper.addEventListener('mouseleave', () => {
      this.mainImage.style.transform = 'scale(1)';
      this.mainImage.style.transformOrigin = 'center center';
    });
  }
}

customElements.define('product-gallery', ProductGallery);
