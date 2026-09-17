/**
 * Cart Drawer Web Component - E-sellers Professional (v4.9.0)
 */

class CartDrawer extends HTMLElement {
  constructor() {
    super();
    this.overlay = this.querySelector('.cart-drawer__overlay');
    this.closeBtn = this.querySelector('.cart-drawer__close');
    this.inner = this.querySelector('.cart-drawer__inner');

    // Close listeners
    this.overlay?.addEventListener('click', () => this.close());
    this.closeBtn?.addEventListener('click', () => this.close());
    this.addEventListener('keyup', (e) => {
      if (e.key === 'Escape') this.close();
    });

    // Delegated event handling for inside the drawer (handles dynamically re-rendered items)
    this.addEventListener('click', (e) => {
      // Close button
      if (e.target.closest('.cart-drawer__close') || e.target.closest('.cart-drawer__overlay')) {
        e.preventDefault();
        this.close();
        return;
      }

      // Quantity buttons (+ / -)
      const qtyBtn = e.target.closest('.cart-quantity-btn');
      if (qtyBtn) {
        e.preventDefault();
        const wrapper = qtyBtn.closest('.cart-quantity-wrapper');
        const input = wrapper?.querySelector('.cart-quantity-input');
        const key = qtyBtn.getAttribute('data-key') || qtyBtn.getAttribute('data-line');
        if (input && key) {
          let qty = parseInt(input.value, 10) || 0;
          if (qtyBtn.name === 'plus') {
            qty += 1;
          } else {
            qty -= 1;
          }
          this.updateItem(key, Math.max(0, qty));
        }
        return;
      }

      // Remove item button
      const removeBtn = e.target.closest('.cart-item__remove');
      if (removeBtn) {
        e.preventDefault();
        const key = removeBtn.getAttribute('data-key') || removeBtn.getAttribute('data-line');
        if (key) {
          this.updateItem(key, 0);
        }
        return;
      }
    });

    // Delegated order note change
    this.addEventListener('change', (e) => {
      if (e.target && e.target.matches('#CartDrawer-Note, .cart-drawer__note-input')) {
        if (window.ShopifyCart?.updateNotes) {
          window.ShopifyCart.updateNotes(e.target.value);
        }
      }
    });

    // Listen to PubSub cart events (e.g. when product is added from product card or PDP)
    if (window.subscribe && window.PUB_SUB_EVENTS) {
      window.subscribe(window.PUB_SUB_EVENTS.cartUpdate, async (data = {}) => {
        const sections = data?.item?.sections || data?.cart?.sections || data?.sections;
        let rendered = false;
        if (sections) {
          rendered = this.renderFromSections(sections);
        }
        if (!rendered) {
          await this.renderDrawer();
        }
        if (data.source === 'add') {
          this.open();
        }
      });
    }
  }

  open(opener) {
    this.openedBy = opener || this.openedBy;
    this.classList.add('is-open');
    this.setAttribute('aria-hidden', 'false');
    document.body.classList.add('overflow-hidden');
    if (window.trapFocus && this.inner) window.trapFocus(this.inner);
    if (window.publish && window.PUB_SUB_EVENTS) {
      window.publish(window.PUB_SUB_EVENTS.drawerOpen, { drawer: 'cart' });
    }
  }

  close() {
    this.classList.remove('is-open');
    this.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('overflow-hidden');
    if (window.removeTrapFocus && this.inner) window.removeTrapFocus(this.inner);
    this.openedBy?.focus?.();
    if (window.publish && window.PUB_SUB_EVENTS) {
      window.publish(window.PUB_SUB_EVENTS.drawerClose, { drawer: 'cart' });
    }
  }

  async updateItem(key, quantity) {
    try {
      this.classList.add('is-loading');
      // Let ShopifyCart resolve the real section ids from the DOM.
      const response = await window.ShopifyCart.change(key, quantity);
      if (response && response.sections) {
        const rendered = this.renderFromSections(response.sections);
        if (!rendered) {
          await this.renderDrawer();
        }
      } else {
        await this.renderDrawer();
      }
    } catch (error) {
      console.error('Failed to update cart item:', error);
    } finally {
      this.classList.remove('is-loading');
    }
  }

  renderFromSections(sections) {
    if (!sections || typeof sections !== 'object') return false;

    const drawerHtml = sections['cart_drawer'] || sections['es-cart-drawer'] || sections['cart-drawer'];
    const headerHtml = sections['es_header'] || sections['es-header'] || sections['header'];
    const parser = new DOMParser();
    let renderedDrawer = false;

    if (drawerHtml) {
      const doc = parser.parseFromString(drawerHtml, 'text/html');
      const newDrawerInner = doc.querySelector('.cart-drawer__inner');
      if (newDrawerInner && this.inner) {
        this.inner.innerHTML = newDrawerInner.innerHTML;
        renderedDrawer = true;
      }
    }

    if (headerHtml) {
      const headerDoc = parser.parseFromString(headerHtml, 'text/html');
      const newBubble = headerDoc.querySelector('#cart-icon-bubble');
      const currentBubble = document.querySelector('#cart-icon-bubble');
      if (newBubble && currentBubble) {
        currentBubble.innerHTML = newBubble.innerHTML;
      }
    }

    return renderedDrawer;
  }

  async renderDrawer() {
    try {
      const rootUrl = window.Shopify?.routes?.root || '/';
      const cleanRoot = rootUrl.endsWith('/') ? rootUrl : `${rootUrl}/`;
      const response = await fetch(`${cleanRoot}?sections=cart_drawer,es-cart-drawer,es_header,es-header`);
      const data = await response.json().catch(() => null);

      if (data && this.renderFromSections(data)) {
        return;
      }

      // Fallback: fetch single section HTML
      const fallbackUrl = `${cleanRoot}?section_id=cart_drawer`;
      const fallbackRes = await fetch(fallbackUrl);
      const html = await fallbackRes.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newDrawerInner = doc.querySelector('.cart-drawer__inner');
      if (newDrawerInner && this.inner) {
        this.inner.innerHTML = newDrawerInner.innerHTML;
      }
    } catch (error) {
      console.error('Failed to re-render cart drawer:', error);
    }
  }
}

if (!customElements.get('cart-drawer')) {
  customElements.define('cart-drawer', CartDrawer);
}

// Global Delegated click listener for Cart Drawer openers
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('#CartDrawerOpener, [data-cart-drawer-trigger], #cart-icon-bubble');
  if (trigger) {
    const isCartPage = window.location.pathname.endsWith('/cart');
    const isDrawerType = window.theme?.cartType === 'drawer' || Boolean(document.querySelector('cart-drawer'));

    // If configured as drawer and not on cart page, open drawer
    if (isDrawerType && !isCartPage) {
      e.preventDefault();
      const cartDrawer = document.querySelector('cart-drawer');
      if (cartDrawer && typeof cartDrawer.open === 'function') {
        cartDrawer.open(trigger);
      }
    }
  }
});

// Shopify Theme Editor Section Lifecycle Handlers
if (window.Shopify && window.Shopify.designMode) {
  document.addEventListener('shopify:section:select', (e) => {
    if (e.target && (e.target.id === 'shopify-section-cart_drawer' || e.target.querySelector('cart-drawer'))) {
      const cartDrawer = document.querySelector('cart-drawer');
      if (cartDrawer && typeof cartDrawer.open === 'function') {
        cartDrawer.open();
      }
    }
  });

  document.addEventListener('shopify:section:deselect', (e) => {
    if (e.target && (e.target.id === 'shopify-section-cart_drawer' || e.target.querySelector('cart-drawer'))) {
      const cartDrawer = document.querySelector('cart-drawer');
      if (cartDrawer && typeof cartDrawer.close === 'function') {
        cartDrawer.close();
      }
    }
  });
}

/*
  Add-to-cart interception lives in es-product-form.js, on the <product-form>
  element itself.

  A delegated listener here previously guarded preventDefault() behind a
  cartType/drawer check. Whenever that check was false the submit fell through
  to a native POST to /cart/add, and Shopify answered with its own full-page
  error screen instead of the theme reporting the problem inline. Scoping the
  handler to the element removes that fall-through path entirely, so it is not
  reintroduced here.

  Any form NOT inside a <product-form> (a quick-add on a card, say) should be
  wrapped in one rather than handled by a second global listener, so there is
  exactly one owner of the submit event.
*/
