/**
 * E-sellers Professional Theme - Global JavaScript (v4.9.0)
 * Developer: E-sellers (info@e-sellers.net)
 */

/* --------------------------------------------------------------------------
   1. PUB/SUB EVENT BUS
   -------------------------------------------------------------------------- */
const PUB_SUB_EVENTS = {
  cartUpdate: 'cart-update',
  quantityUpdate: 'quantity-update',
  variantChange: 'variant-change',
  drawerOpen: 'drawer-open',
  drawerClose: 'drawer-close'
};

const subscribers = {};

function subscribe(eventName, callback) {
  if (!subscribers[eventName]) {
    subscribers[eventName] = [];
  }
  subscribers[eventName].push(callback);
  return () => {
    subscribers[eventName] = subscribers[eventName].filter(cb => cb !== callback);
  };
}

function publish(eventName, data) {
  if (subscribers[eventName]) {
    subscribers[eventName].forEach(callback => callback(data));
  }
}

window.PUB_SUB_EVENTS = PUB_SUB_EVENTS;
window.subscribe = subscribe;
window.publish = publish;

/* --------------------------------------------------------------------------
   2. UTILITIES & HELPERS
   -------------------------------------------------------------------------- */
function debounce(fn, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}

function formatMoney(cents, format) {
  if (typeof cents === 'string') cents = cents.replace('.', '');
  let value = '';
  const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  const formatString = format || window.theme?.moneyFormat || '${{amount}}';

  function formatWithDelimiters(number, precision = 2, thousands = ',', decimal = '.') {
    if (isNaN(number) || number == null) return 0;
    number = (number / 100.0).toFixed(precision);
    const parts = number.split('.');
    const dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
    const centsVal = parts[1] ? decimal + parts[1] : '';
    return dollars + centsVal;
  }

  switch (formatString.match(placeholderRegex)?.[1]) {
    case 'amount':
      value = formatWithDelimiters(cents, 2);
      break;
    case 'amount_no_decimals':
      value = formatWithDelimiters(cents, 0);
      break;
    case 'amount_with_comma_separator':
      value = formatWithDelimiters(cents, 2, '.', ',');
      break;
    case 'amount_no_decimals_with_comma_separator':
      value = formatWithDelimiters(cents, 0, '.', ',');
      break;
    default:
      value = formatWithDelimiters(cents, 2);
  }

  return formatString.replace(placeholderRegex, value);
}

window.debounce = debounce;
window.formatMoney = formatMoney;

/* --------------------------------------------------------------------------
   3. ACCESSIBILITY FOCUS TRAP (WCAG 2.1 AA)
   -------------------------------------------------------------------------- */
const focusableElementsSelector =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function trapFocus(container, elementToFocus = container) {
  const focusableElements = Array.from(container.querySelectorAll(focusableElementsSelector));
  const first = focusableElements[0];
  const last = focusableElements[focusableElements.length - 1];

  removeTrapFocus(container);

  container._focusHandler = function (event) {
    if (event.key !== 'Tab') return;
    if (event.shiftKey) {
      if (document.activeElement === first) {
        last?.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first?.focus();
        event.preventDefault();
      }
    }
  };

  document.addEventListener('keydown', container._focusHandler);
  elementToFocus?.focus();
}

function removeTrapFocus(container) {
  if (container && container._focusHandler) {
    document.removeEventListener('keydown', container._focusHandler);
    delete container._focusHandler;
  }
}

window.trapFocus = trapFocus;
window.removeTrapFocus = removeTrapFocus;

/* --------------------------------------------------------------------------
   4. SHOPIFY AJAX CART API CLIENT
   -------------------------------------------------------------------------- */
const ShopifyCart = {
  /*
    Resolve the real ids of the sections we want re-rendered.

    Sections inside a section group are addressed as `sections--<hash>__handle`,
    never as the bare handle, so hardcoding 'cart_drawer,es_header' asks Shopify
    for sections that do not exist and the drawer silently never updates.
    Reading the ids back off the DOM keeps this correct whatever the group is
    named.
  */
  sectionIds() {
    return ['cart-drawer', '[data-cart-count]', '.shopify-section-header']
      .map((selector) => {
        const wrapper = document.querySelector(selector)?.closest('.shopify-section');
        return wrapper ? wrapper.id.replace(/^shopify-section-/, '') : null;
      })
      .filter((id, index, all) => id && all.indexOf(id) === index);
  },

  async get() {
    const res = await fetch(`${window.Shopify?.routes?.root || '/'}cart.js`);
    return await res.json();
  },

  async add(formData) {
    const headers = {
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json'
    };

    const sections = this.sectionIds();

    let body = formData;
    if (formData instanceof FormData) {
      if (!formData.get('sections') && sections.length) {
        formData.append('sections', sections.join(','));
        formData.append('sections_url', window.location.pathname);
      }
    } else if (typeof formData === 'object' && !(formData instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      const payload = { ...formData };
      if (!payload.sections && sections.length) {
        payload.sections = sections.join(',');
        payload.sections_url = window.location.pathname;
      }
      body = JSON.stringify(payload);
    }

    const res = await fetch(`${window.Shopify?.routes?.root || '/'}cart/add.js`, {
      method: 'POST',
      headers,
      body
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.description || data.message || 'Error adding item to cart');
    publish(PUB_SUB_EVENTS.cartUpdate, { source: 'add', item: data });
    return data;
  },

  async change(key, quantity, sections = []) {
    const body = {
      quantity: quantity
    };
    if (typeof key === 'number' || (/^\d+$/.test(String(key)) && Number(key) < 1000)) {
      body.line = Number(key);
    } else {
      body.id = String(key);
    }

    const sectionList = sections && sections.length > 0 ? sections : this.sectionIds();
    if (sectionList.length) {
      body.sections = sectionList.join(',');
    }
    body.sections_url = window.location.pathname;

    const res = await fetch(`${window.Shopify?.routes?.root || '/'}cart/change.js`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.description || data.message || 'Error updating cart');
    publish(PUB_SUB_EVENTS.cartUpdate, { source: 'change', cart: data });
    return data;
  },

  async updateNotes(note) {
    const res = await fetch(`${window.Shopify?.routes?.root || '/'}cart/update.js`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({ note })
    });
    return await res.json();
  }
};

window.ShopifyCart = ShopifyCart;

/* --------------------------------------------------------------------------
   5. WEB COMPONENTS: QUANTITY INPUT
   -------------------------------------------------------------------------- */
class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true });

    this.querySelectorAll('button').forEach(button => {
      button.addEventListener('click', this.onButtonClick.bind(this));
    });
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = Number(this.input.value);
    const step = Number(this.input.step || 1);
    const min = Number(this.input.min || 0);
    const max = Number(this.input.max || 9999);

    if (event.currentTarget.name === 'plus') {
      if (previousValue + step <= max) {
        this.input.value = previousValue + step;
      }
    } else {
      if (previousValue - step >= min) {
        this.input.value = previousValue - step;
      }
    }
    this.input.dispatchEvent(this.changeEvent);
  }
}
customElements.define('quantity-input', QuantityInput);

/* --------------------------------------------------------------------------
   6. WEB COMPONENTS: MODAL DIALOG
   -------------------------------------------------------------------------- */
class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.querySelector('[id^="ModalClose-"]')?.addEventListener('click', this.hide.bind(this));
    this.addEventListener('keyup', event => {
      if (event.key === 'Escape') this.hide();
    });
    this.addEventListener('click', event => {
      if (event.target === this) this.hide();
    });
  }

  show(opener) {
    this.openedBy = opener;
    document.body.classList.add('overflow-hidden');
    this.setAttribute('open', '');
    trapFocus(this);
  }

  hide() {
    document.body.classList.remove('overflow-hidden');
    this.removeAttribute('open');
    removeTrapFocus(this);
    this.openedBy?.focus();
  }
}
customElements.define('modal-dialog', ModalDialog);

class ModalOpener extends HTMLElement {
  constructor() {
    super();
    const button = this.querySelector('button');
    if (!button) return;
    button.addEventListener('click', () => {
      const modal = document.querySelector(this.getAttribute('data-modal'));
      if (modal) modal.show(button);
    });
  }
}
customElements.define('modal-opener', ModalOpener);
