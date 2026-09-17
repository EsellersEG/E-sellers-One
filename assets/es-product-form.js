/* ==========================================================================
   E-SELLERS PRODUCT FORM
   Version: 5.0.0 | E-sellers (info@e-sellers.net)

   Owns the add-to-cart flow for a single product form.

   This is deliberately an element-scoped custom element rather than a
   document-level delegated listener. A delegated handler that only calls
   preventDefault() behind a condition will fall through to a native POST the
   moment that condition is false, and Shopify then answers with its own
   full-page error screen ("Something went wrong... is already sold out").
   Scoping the handler to the element means the native POST can never happen:
   every outcome, including sold-out and inventory errors, is handled inline.
   ========================================================================== */

if (!customElements.get('product-form')) {
  class ProductForm extends HTMLElement {
    connectedCallback() {
      this.form = this.querySelector('form');
      if (!this.form) return;

      this.submitButton = this.querySelector('[type="submit"]');
      this.errorTarget = this.querySelector('[data-product-form-error]');
      this.cartDrawer = document.querySelector('cart-drawer');

      // A hidden id input carrying `disabled` would submit no variant at all.
      this.variantInput = this.form.querySelector('input[name="id"]');

      this.form.addEventListener('submit', this.onSubmit.bind(this));
    }

    async onSubmit(event) {
      // Unconditional: nothing below may hand control back to the browser.
      event.preventDefault();

      if (this.submitButton?.getAttribute('aria-disabled') === 'true') return;

      this.clearError();
      this.setLoading(true);

      try {
        const variantId = this.variantInput?.value;
        if (!variantId) {
          throw new Error(
            window.theme?.strings?.selectVariant || 'Please choose an option before adding to cart.'
          );
        }

        const formData = new FormData(this.form);
        // A disabled input is omitted by FormData, so restate it explicitly.
        formData.set('id', variantId);

        const result = await this.addToCart(formData);
        this.onSuccess(result);
      } catch (error) {
        this.showError(error.message);
      } finally {
        this.setLoading(false);
      }
    }

    async addToCart(formData) {
      const root = window.Shopify?.routes?.root || '/';

      // Ask for the sections we actually want re-rendered, resolved from the
      // DOM: inside a section group the real id is `sections--xxx__cart_drawer`,
      // never the bare handle.
      const sections = ProductForm.sectionsToRender();
      if (sections.length) {
        formData.set('sections', sections.join(','));
        formData.set('sections_url', window.location.pathname);
      }

      const response = await fetch(`${root}cart/add.js`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: formData
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Shopify returns 422 with `description` for stock problems.
        throw new Error(
          data.description || data.message || 'This item could not be added to your cart.'
        );
      }

      return data;
    }

    onSuccess(result) {
      document.dispatchEvent(new CustomEvent('es:cart:added', { detail: { item: result } }));

      ProductForm.renderSections(result.sections);
      ProductForm.refreshCartCount();

      const useDrawer =
        window.theme?.cartType === 'drawer' && document.querySelector('cart-drawer');

      if (useDrawer) {
        const drawer = document.querySelector('cart-drawer');
        if (typeof drawer.open === 'function') {
          drawer.open(this.submitButton);
          return;
        }
      }

      // No drawer available: fall back to the cart page rather than doing nothing.
      window.location.href = `${window.Shopify?.routes?.root || '/'}cart`;
    }

    /* ---- section rendering ---------------------------------------------- */

    static sectionIdOf(selector) {
      const el = document.querySelector(selector);
      const wrapper = el?.closest('.shopify-section');
      return wrapper ? wrapper.id.replace(/^shopify-section-/, '') : null;
    }

    static sectionsToRender() {
      return ['cart-drawer', '#CartDrawer', '[data-cart-count]']
        .map((sel) => ProductForm.sectionIdOf(sel))
        .filter((id, index, all) => id && all.indexOf(id) === index);
    }

    static renderSections(sections) {
      if (!sections) return;

      Object.entries(sections).forEach(([id, html]) => {
        const target = document.getElementById(`shopify-section-${id}`);
        if (!target || typeof html !== 'string') return;

        const parsed = new DOMParser().parseFromString(html, 'text/html');
        const replacement = parsed.getElementById(`shopify-section-${id}`);
        if (replacement) target.innerHTML = replacement.innerHTML;
      });
    }

    static async refreshCartCount() {
      try {
        const root = window.Shopify?.routes?.root || '/';
        const cart = await (await fetch(`${root}cart.js`)).json();

        document.querySelectorAll('[data-cart-count], .cart-count-bubble').forEach((node) => {
          node.textContent = cart.item_count;
          node.hidden = cart.item_count === 0;
        });

        document.dispatchEvent(new CustomEvent('es:cart:updated', { detail: { cart } }));
      } catch (_) {
        /* A count that fails to refresh must not break the add itself. */
      }
    }

    /* ---- ui state -------------------------------------------------------- */

    setLoading(isLoading) {
      if (!this.submitButton) return;

      this.submitButton.setAttribute('aria-disabled', isLoading ? 'true' : 'false');
      this.submitButton.classList.toggle('is-loading', isLoading);

      if (isLoading) {
        this._label = this.submitButton.innerHTML;
        this.submitButton.innerHTML =
          '<span class="spinner" aria-hidden="true"></span><span class="visually-hidden">Adding…</span>';
      } else if (this._label) {
        this.submitButton.innerHTML = this._label;
      }
    }

    showError(message) {
      if (this.errorTarget) {
        this.errorTarget.textContent = message;
        this.errorTarget.hidden = false;
        this.errorTarget.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        // Never silently swallow the reason the add failed.
        console.warn('[es-product-form]', message);
      }
    }

    clearError() {
      if (!this.errorTarget) return;
      this.errorTarget.textContent = '';
      this.errorTarget.hidden = true;
    }
  }

  customElements.define('product-form', ProductForm);
}
