/**
 * Predictive Search Web Component - E-sellers Professional (v4.9.0)
 */

class PredictiveSearch extends HTMLElement {
  constructor() {
    super();
    this.modal = document.getElementById('SearchModal');
    this.input = this.querySelector('input[type="search"]');
    this.resultsContainer = this.querySelector('#PredictiveSearchResults');
    this.closeBtn = this.querySelector('.search-modal__close');
    this.spinner = this.querySelector('.search-modal__spinner');

    this.setupListeners();
  }

  setupListeners() {
    // Open trigger
    document.querySelectorAll('#SearchModalOpener, [data-search-modal-trigger]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.open(btn);
      });
    });

    // Close triggers
    this.closeBtn?.addEventListener('click', this.close.bind(this));
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });
    this.addEventListener('keyup', (e) => {
      if (e.key === 'Escape') this.close();
    });

    // Live search input
    this.input?.addEventListener('input', window.debounce(this.onInput.bind(this), 300));
  }

  open(opener) {
    this.openedBy = opener;
    this.modal?.classList.add('is-open');
    this.modal?.setAttribute('aria-hidden', 'false');
    document.body.classList.add('overflow-hidden');
    setTimeout(() => this.input?.focus(), 50);
    if (window.trapFocus) window.trapFocus(this.modal);
  }

  close() {
    this.modal?.classList.remove('is-open');
    this.modal?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('overflow-hidden');
    if (window.removeTrapFocus) window.removeTrapFocus(this.modal);
    this.openedBy?.focus();
  }

  async onInput() {
    const searchTerm = this.input.value.trim();

    if (!searchTerm.length) {
      this.resultsContainer.innerHTML = '';
      return;
    }

    if (this.spinner) this.spinner.style.display = 'block';

    try {
      const url = `${window.theme?.routes?.predictive_search_url || '/search/suggest'}?q=${encodeURIComponent(searchTerm)}&resources[type]=product,collection,article&resources[limit]=4&section_id=predictive-search`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Search query failed');
      
      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const results = doc.querySelector('#shopify-section-predictive-search');

      if (results && this.resultsContainer) {
        this.resultsContainer.innerHTML = results.innerHTML;
      }
    } catch (err) {
      console.error('Predictive search error:', err);
    } finally {
      if (this.spinner) this.spinner.style.display = 'none';
    }
  }
}

customElements.define('predictive-search', PredictiveSearch);
