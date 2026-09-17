/**
 * Expandable Brands Section
 * Vanilla JS, no dependencies. Handles expand/collapse interaction for both
 * the desktop horizontal-card layout and the mobile/tablet vertical accordion.
 * Fully keyboard accessible with standard ARIA Roving Tabindex pattern over role="tab" triggers.
 */
(function () {
  'use strict';

  var SELECTOR = {
    root: '[data-section-type="expandable-brands"]',
    card: '[data-brand-card]',
    trigger: '[data-brand-trigger]',
  };

  function EBSection(root) {
    this.root = root;
    this.cards = Array.prototype.slice.call(root.querySelectorAll(SELECTOR.card));
    if (!this.cards.length) return;

    this.triggers = this.cards.map(function (card) {
      return card.querySelector(SELECTOR.trigger);
    });

    this.pendingFrame = null;

    this.onTriggerClick = this.onTriggerClick.bind(this);
    this.onTriggerKeydown = this.onTriggerKeydown.bind(this);

    this.bindEvents();
    this.bindResize();

    root.__ebInstance = this;
  }

  EBSection.prototype.bindEvents = function () {
    var self = this;
    this.triggers.forEach(function (trigger, index) {
      if (!trigger) return;
      trigger.addEventListener('click', self.onTriggerClick);
      trigger.addEventListener('keydown', self.onTriggerKeydown);
      trigger.dataset.ebIndex = index;
    });
  };

  EBSection.prototype.bindResize = function () {
    var self = this;
    var wasDesktop = window.innerWidth >= 990;
    var resizeTimer;

    window.addEventListener('resize', function () {
      var isDesktop = window.innerWidth >= 990;
      if (isDesktop !== wasDesktop) {
        wasDesktop = isDesktop;

        self.root.classList.add('eb-no-transition');

        // Force reflow
        void self.root.offsetWidth;

        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          self.root.classList.remove('eb-no-transition');
        }, 100);
      }
    });
  };

  EBSection.prototype.onTriggerClick = function (event) {
    var trigger = event.currentTarget;
    var card = trigger.closest(SELECTOR.card);
    this.toggleOrActivateCard(card);
  };

  EBSection.prototype.onTriggerKeydown = function (event) {
    var key = event.key;
    var currentTrigger = event.currentTarget;
    var currentIndex = parseInt(currentTrigger.dataset.ebIndex, 10);
    if (isNaN(currentIndex)) return;

    var validTriggers = this.triggers.filter(function (t) { return !!t; });
    var validIndex = validTriggers.indexOf(currentTrigger);
    if (validIndex === -1) return;

    var nextIndex = null;

    if (key === 'ArrowRight' || key === 'ArrowDown') {
      nextIndex = (validIndex + 1) % validTriggers.length;
    } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
      nextIndex = (validIndex - 1 + validTriggers.length) % validTriggers.length;
    } else if (key === 'Home') {
      nextIndex = 0;
    } else if (key === 'End') {
      nextIndex = validTriggers.length - 1;
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      this.toggleOrActivateCard(currentTrigger.closest(SELECTOR.card));
      return;
    } else {
      return;
    }

    event.preventDefault();
    var nextTrigger = validTriggers[nextIndex];
    if (nextTrigger) {
      nextTrigger.focus();
      this.activateCard(nextTrigger.closest(SELECTOR.card));
    }
  };

  EBSection.prototype.toggleOrActivateCard = function (targetCard) {
    if (!targetCard) return;
    var isActive = targetCard.classList.contains('is-active');

    // On mobile accordion or desktop, allow toggling off if already active
    if (isActive) {
      this.deactivateAllCards();
    } else {
      this.activateCard(targetCard);
    }
  };

  EBSection.prototype.deactivateAllCards = function () {
    var self = this;
    if (this.pendingFrame !== null) {
      cancelAnimationFrame(this.pendingFrame);
    }

    this.pendingFrame = requestAnimationFrame(function () {
      self.pendingFrame = null;
      self.cards.forEach(function (card) {
        card.classList.remove('is-active');
        var trigger = card.querySelector(SELECTOR.trigger);
        if (trigger) {
          trigger.setAttribute('aria-selected', 'false');
          trigger.setAttribute('tabindex', '-1');
        }
      });
    });
  };

  EBSection.prototype.activateCard = function (targetCard) {
    if (!targetCard) return;

    var self = this;

    if (this.pendingFrame !== null) {
      cancelAnimationFrame(this.pendingFrame);
    }

    this.pendingFrame = requestAnimationFrame(function () {
      self.pendingFrame = null;
      self.cards.forEach(function (card) {
        var isTarget = card === targetCard;
        var trigger = card.querySelector(SELECTOR.trigger);

        card.classList.toggle('is-active', isTarget);
        if (trigger) {
          trigger.setAttribute('aria-selected', isTarget ? 'true' : 'false');
          trigger.setAttribute('tabindex', isTarget ? '0' : '-1');
        }
      });
    });
  };

  function init() {
    var sections = document.querySelectorAll(SELECTOR.root);
    sections.forEach(function (section) {
      if (section.__ebInitialized) return;
      section.__ebInitialized = true;
      new EBSection(section);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Shopify Theme Editor Integration
  document.addEventListener('shopify:section:load', function (event) {
    var section = event.target.querySelector ? event.target.querySelector(SELECTOR.root) : null;
    if (!section && event.target.matches && event.target.matches(SELECTOR.root)) {
      section = event.target;
    }
    if (section) {
      section.__ebInitialized = false;
      init();
    }
  });

  document.addEventListener('shopify:block:select', function (event) {
    var block = event.target;
    if (!block) return;
    var card = block.matches && block.matches(SELECTOR.card) ? block : block.querySelector ? block.querySelector(SELECTOR.card) : null;
    if (!card && block.closest) {
      card = block.closest(SELECTOR.card);
    }
    if (card) {
      var section = card.closest(SELECTOR.root);
      if (section && section.__ebInstance) {
        section.__ebInstance.activateCard(card);
      }
    }
  });
})();
