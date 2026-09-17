/**
 * Product Variant Picker Web Component - E-sellers Professional (v4.9.0)
 */

class VariantRadios extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('change', this.onVariantChange.bind(this));
  }

  onVariantChange() {
    this.updateOptions();
    this.updateMasterId();
    this.updateMedia();
    this.updateURL();
    this.updateVariantInput();
    this.renderProductInfo();
  }

  updateOptions() {
    const fieldsets = Array.from(this.querySelectorAll('fieldset'));
    this.options = fieldsets.map(fieldset => {
      return Array.from(fieldset.querySelectorAll('input')).find(radio => radio.checked)?.value;
    });

    // Update selected value label text next to option title
    fieldsets.forEach((fieldset, index) => {
      const selectedLabel = fieldset.querySelector('.variant-selected-value');
      if (selectedLabel && this.options[index]) {
        selectedLabel.textContent = this.options[index];
      }
    });
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find(variant => {
      return !variant.options.map((option, index) => {
        return this.options[index] === option;
      }).includes(false);
    });
  }

  updateMedia() {
    if (!this.currentVariant || !this.currentVariant.featured_media) return;
    if (window.publish && window.PUB_SUB_EVENTS) {
      window.publish(window.PUB_SUB_EVENTS.variantChange, { variant: this.currentVariant });
    }
  }

  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
    window.history.replaceState({}, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`);
    productForms.forEach(productForm => {
      const input = productForm.querySelector('input[name="id"]');
      if (input && this.currentVariant) {
        input.value = this.currentVariant.id;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }

  renderProductInfo() {
    const priceContainer = document.getElementById(`price-${this.dataset.section}`);
    const addButton = document.getElementById(`ProductSubmitButton-${this.dataset.section}`);
    const addButtonText = addButton?.querySelector('span');

    if (!this.currentVariant) {
      if (addButton) {
        addButton.setAttribute('disabled', 'disabled');
        if (addButtonText) addButtonText.textContent = window.theme?.strings?.unavailable || 'Unavailable';
      }
      return;
    }

    if (addButton) {
      if (this.currentVariant.available) {
        addButton.removeAttribute('disabled');
        if (addButtonText) addButtonText.textContent = window.theme?.strings?.addToCart || 'Add to Cart';
      } else {
        addButton.setAttribute('disabled', 'disabled');
        if (addButtonText) addButtonText.textContent = window.theme?.strings?.soldOut || 'Sold Out';
      }
    }

    // Update Price
    if (priceContainer && window.formatMoney) {
      const regularPrice = priceContainer.querySelector('.price-item--regular');
      const salePrice = priceContainer.querySelector('.price-item--sale');
      const comparePrice = priceContainer.querySelector('.price-item--compare, s');

      if (this.currentVariant.compare_at_price > this.currentVariant.price) {
        if (salePrice) salePrice.textContent = window.formatMoney(this.currentVariant.price);
        if (comparePrice) comparePrice.textContent = window.formatMoney(this.currentVariant.compare_at_price);
        priceContainer.classList.add('price--on-sale');
      } else {
        if (regularPrice) regularPrice.textContent = window.formatMoney(this.currentVariant.price);
        priceContainer.classList.remove('price--on-sale');
      }
    }

    // Update SKU
    const skuElement = document.getElementById(`Sku-${this.dataset.section}`);
    if (skuElement) {
      skuElement.textContent = this.currentVariant.sku || '';
    }

    // Update Inventory Urgency
    const inventoryElement = document.getElementById(`Inventory-${this.dataset.section}`);
    if (inventoryElement && this.currentVariant.inventory_quantity !== undefined) {
      if (this.currentVariant.inventory_quantity > 0 && this.currentVariant.inventory_quantity <= 10) {
        inventoryElement.innerHTML = `⚠️ Only <strong>${this.currentVariant.inventory_quantity}</strong> left in stock - order soon!`;
        inventoryElement.style.display = 'block';
      } else {
        inventoryElement.style.display = 'none';
      }
    }
  }

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }
}

customElements.define('variant-radios', VariantRadios);
