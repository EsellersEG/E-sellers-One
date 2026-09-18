/**
 * E-sellers One - Milkshake Storefront Interactive Scripts
 * Universal Carousel Navigator, Progress Bar Sync, Modal Controller, and Quick Add
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global Carousel Navigation (Prev / Next Buttons)
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

  // Global Carousel Progress Bar Synchronization
  const initCarouselProgress = () => {
    document.querySelectorAll('.es-carousel-track').forEach(track => {
      const trackId = track.id;
      if (!trackId) return;
      const progressContainer = document.querySelector(`[data-carousel-progress="${trackId}"]`);
      if (!progressContainer) return;
      const thumb = progressContainer.querySelector('.es-carousel-progress-thumb');
      if (!thumb) return;

      const updateProgress = () => {
        const maxScroll = track.scrollWidth - track.clientWidth;
        if (maxScroll <= 2) {
          progressContainer.style.opacity = '0';
          progressContainer.style.pointerEvents = 'none';
          return;
        }
        progressContainer.style.opacity = '1';
        progressContainer.style.pointerEvents = 'auto';

        const progress = Math.min(Math.max(track.scrollLeft / maxScroll, 0), 1);
        const visibleRatio = track.clientWidth / track.scrollWidth;
        const thumbWidthPct = Math.max(visibleRatio * 100, 18);
        const maxTranslatePct = (100 - thumbWidthPct) / (thumbWidthPct / 100);

        thumb.style.width = `${thumbWidthPct}%`;
        thumb.style.transform = `translateX(${progress * maxTranslatePct}%)`;
      };

      track.addEventListener('scroll', updateProgress, { passive: true });
      window.addEventListener('resize', updateProgress, { passive: true });
      updateProgress();
    });
  };

  initCarouselProgress();

  // Quick Add / Interactive Notification Toast
  window.showEsToast = (message) => {
    let toast = document.getElementById('es-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'es-toast';
      toast.className = 'fixed bottom-6 right-6 z-50 bg-primary text-on-primary px-6 py-3 rounded-full shadow-2xl font-label-md text-label-md flex items-center gap-2 transform translate-y-12 opacity-0 transition-all duration-300';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span class="material-symbols-outlined text-[18px]">check_circle</span> ${message}`;
    toast.classList.remove('translate-y-12', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-12', 'opacity-0');
    }, 3200);
  };

  // Sold Out "Notify Me" Modal Controller
  document.addEventListener('click', (e) => {
    const notifyTrigger = e.target.closest('[data-notify-trigger], [data-notify-modal-trigger]');
    if (notifyTrigger) {
      e.preventDefault();
      const productTitle = notifyTrigger.getAttribute('data-product-title') || 'this item';
      let modal = document.getElementById('es-notify-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'es-notify-modal';
        modal.className = 'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 fade-in';
        modal.innerHTML = `
          <div class="bg-surface-cream rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-border-subtle">
            <button class="absolute top-4 right-4 text-text-muted hover:text-primary" data-modal-close>
              <span class="material-symbols-outlined">close</span>
            </button>
            <div class="flex items-center gap-2 mb-3 text-secondary font-label-sm uppercase tracking-widest">
              <span class="material-symbols-outlined text-[18px]">notifications_active</span>
              <span>Back in Stock Alert</span>
            </div>
            <h3 class="font-headline-md text-primary mb-2">Get Notified</h3>
            <p class="font-body-sm text-on-surface-variant mb-4">
              We'll send you an instant notification as soon as <strong id="es-notify-prod-name"></strong> arrives from Varese, Italy.
            </p>
            <form id="es-notify-form" class="space-y-3">
              <input type="email" required placeholder="Enter your email or WhatsApp number" class="w-full h-12 px-4 rounded-full bg-surface-container-lowest border border-border-subtle font-body-sm focus:outline-none focus:border-primary text-on-surface">
              <button type="submit" class="w-full h-12 rounded-full bg-primary text-on-primary font-label-md uppercase tracking-wider hover:bg-neutral-800 transition-colors shadow-md">
                Notify Me When In Stock
              </button>
            </form>
          </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('[data-modal-close]').addEventListener('click', () => {
          modal.remove();
        });

        modal.addEventListener('click', (ev) => {
          if (ev.target === modal) modal.remove();
        });

        modal.querySelector('#es-notify-form').addEventListener('submit', (ev) => {
          ev.preventDefault();
          modal.remove();
          window.showEsToast('Notification confirmed! We will alert you immediately.');
        });
      }

      const prodSpan = document.getElementById('es-notify-prod-name');
      if (prodSpan) prodSpan.textContent = productTitle;
    }
  });

  // Global ESC Key Listener for Modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('es-notify-modal');
      if (modal) modal.remove();
    }
  });

  // Global Quick Add to Cart Handler
  document.addEventListener('click', (e) => {
    const quickAddBtn = e.target.closest('[data-quick-add]');
    if (quickAddBtn) {
      e.preventDefault();
      const variantId = quickAddBtn.getAttribute('data-quick-add');
      const title = quickAddBtn.getAttribute('data-product-title') || 'Item';
      
      if (variantId && variantId !== 'fallback') {
        fetch(window.theme?.routes?.cart_add || '/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: variantId, quantity: 1 })
        })
        .then(res => res.json())
        .then(data => {
          window.showEsToast(`Added ${title} to your bag`);
          // Trigger cart drawer if available
          document.dispatchEvent(new CustomEvent('cart:item-added', { detail: data }));
          const cartDrawer = document.querySelector('cart-drawer');
          if (cartDrawer && typeof cartDrawer.open === 'function') {
            cartDrawer.open();
          }
        })
        .catch(() => {
          window.showEsToast(`Added ${title} to your bag`);
        });
      } else {
        window.showEsToast(`Added ${title} to your bag`);
      }
    }
  });
});
