# E-sellers One

Shopify Online Store 2.0 theme, version 5.0.0.
Author: E-sellers (info@e-sellers.net)

---

## Provenance and licensing

This theme is original work. It contains **no code from any third-party
commercial theme**. That is a deliberate constraint, and this section records
how it is maintained so it can be verified at any time.

**What was deliberately excluded.** An earlier iteration of this codebase carried a large
compiled JavaScript bundle originating from a third-party commercial theme. It
was an orphan — no layout, section or snippet referenced it — and it was **not**
carried into this theme. The same applies to that theme's stylesheet, its other
compiled bundles, its vendored image-viewer library, and its documentation
pointer.

**How the feature set was rebuilt.** Sections that previously depended on a
third-party engine were reimplemented from scratch against this theme's own
design system. Layout, behaviour and merchant-facing settings were
treated as the specification; none of the original source was copied, adapted or
reworked. Layout and functionality are not protected by copyright; source code
is, so the source here is newly written.

**Verifying.** The theme should contain no occurrence of any third-party theme's name or its
signature class names and custom elements. The terms are kept out of this file
and listed in `.provenance-denylist`, which is not uploaded to Shopify. To check:

```bash
grep -riE "$(cat .provenance-denylist | paste -sd'|')" assets config layout locales sections snippets templates
```

This is expected to return nothing. Re-run it after any future merge that pulls
files in from another theme.

**Trademarks.** Section, snippet and asset filenames are brand-neutral, so the
theme carries no third-party trademark in its code. Brand names appear only in
merchant-entered content and in store-specific page templates
(`page.reebokwork.json`, `product.reebokwork.json`), which are store content
rather than theme code. Confirm distribution rights for any brand whose products
or marks the storefront presents.

---

## Architecture

- **Online Store 2.0** throughout — JSON templates, section groups, app blocks.
- **No third-party runtime dependencies.** No jQuery, no carousel library, no
  vendored lightbox. Interactivity is vanilla JS custom elements, CSS
  scroll-snap, `IntersectionObserver` and native `<details>`.
- **Scoped section CSS.** Every section emits its own `{% style %}` block scoped
  to `#shopify-section-{{ section.id }}`, driven by CSS custom properties. No
  section leaks styles, and multiple instances of the same section coexist safely
  (keyframe names are namespaced per section id).
- **Single naming scheme.** Merchant-facing sections use the `es-` prefix. There
  are no duplicate proxy stubs; earlier versions shipped 34 stub sections
  alongside their real implementations, and those have been removed.
- **Shared snippets.** `card-product`, `price`, `icon`, `es-styled-text`,
  `es-position-styles`, `facet-filters`, `pagination`.

### Layout

`layout/theme.liquid` renders `header-group`, `footer-group` and `overlay-group`.

The transparent overlay header (`es-header-home`) is opt-in. Set
**Theme settings → Header → Templates using the overlay header** to a
comma-separated list of template names (for example `index`). Leave it blank to
use the standard header everywhere. Use it only where the first section below the
header is a full-bleed hero.

---

## Sections

### Layout and navigation
`es-header`, `es-header-home`, `es-footer`, `es-announcement-bar`,
`es-cart-drawer`, `es-search-drawer`, `es-apps`

### Content
`es-slideshow`, `es-rich-text`, `es-statement-text`, `es-media-with-text`,
`es-multi-column`, `es-multiple-images-with-text`, `es-image-with-text-overlay`,
`es-image-link-blocks`, `es-images-and-text-scrolling`, `es-revealed-image`,
`es-media-grid`, `es-video`, `es-scrolling-text`, `es-timeline`, `es-tabs`,
`es-faq`, `es-accordion-content`, `es-custom-html`, `es-custom-liquid`

### Commerce
`es-featured-product`, `es-featured-product-spotlight`, `es-featured-collection`,
`es-brand-collection`, `es-collection-list`, `es-collection-banner`,
`es-collection-icons`, `es-best-sellers-by-model`, `es-product-recommendations`,
`es-recently-viewed-products`, `es-product-specs`, `es-product-disclosures`,
`es-quick-order-list`, `es-buy-together`, `es-bib-personalizer`,
`es-shop-the-look`, `es-hot-spots`, `es-feature-chart`, `es-variant-added`

### Brand and social proof
`es-brands-showcase`, `es-expandable-brands`, `es-partners-carousel`,
`es-logo-list`, `es-premium-logo-list`, `es-press`, `es-testimonials`,
`es-video-testimonial-gallery`, `es-before-after-image`

### Marketing and utility
`es-newsletter`, `es-email-signup-banner`, `es-newsletter-popup`,
`es-privacy-banner`, `es-contact`, `es-blog-posts`, `es-account-banner`,
`es-hair-categories-grid`

### Template mains
`main-product`, `main-collection`, `main-list-collections`, `main-cart`,
`main-page`, `main-blog`, `main-article`, `main-search`, `main-404`,
`main-password`, `main-gift-card`, `main-pickup-availability`, `main-account`,
`main-login`, `main-register`, `main-addresses`, `main-order`,
`main-activate-account`, `main-reset-password`

---

## Known issues fixed during the rebuild

These were live defects in the previous codebase, corrected here:

1. **Piped arguments inside tag filters (47 occurrences).** In Liquid a `|`
   inside a filter's argument list terminates that list, so
   `{{ img | image_tag: alt: product.title | escape }}` parses as
   `image_tag(alt: …)` piped into `escape` — HTML-escaping the whole `<img>`
   element so it rendered as literal text. Where such an argument was followed by
   a comma it was a hard syntax error instead. All are now hoisted into `assign`
   statements ahead of the tag.
2. **`snippets/horizontal-product.liquid` was not a snippet.** The file contained
   a dumped tooling error report, with the real markup trapped inside a comment.
   Rebuilt from the recoverable content, with the syntax error that caused it
   fixed.
3. **A non-existent `ternary` filter** in `es-slideshow`, replaced with real
   conditionals so the first slide genuinely loads eagerly at high priority.
4. **`es-variant-added` was an empty stub** while the real 196-line implementation
   sat in the file that was slated for deletion. Resolved in favour of the real one.
5. **Unbalanced markup in the newsletter section** — the non-image branch never
   closed its wrapper `<div>`.
6. **Global CSS in `brands-showcase` and `partners-carousel`**, including global
   `@keyframes`, so two instances on one page fought over speed and state. All
   selectors and keyframes are now namespaced per section id.
7. **`partners-carousel` re-declared `id="shopify-section-…"`** on an inner
   element, duplicating the ID Shopify already emits. Now uses `"tag": "section"`.
8. **Clipped rating labels** in the specs section: at 10% fill, "POOR" was cut off
   by `overflow: hidden`. Short bars now place their label outside the fill.
9. **Metafield placeholders in presets.** Preset values such as
   `"{{ product.metafields.custom.type.value }}"` are stored literally by Shopify,
   not evaluated, so they rendered as raw text. Removed; connect dynamic sources
   in the editor instead.
10. **Missing accessibility affordances** — tab keyboard navigation
    (arrow keys / Home / End with roving tabindex) in the brand showcase, ARIA
    labelling on the rating bars, focus trapping in the mobile drawer, and
    `prefers-reduced-motion` handling across all animated sections.

---

## Validation

The theme passes a structural check covering: `{% schema %}` JSON validity,
duplicate setting ids, preset block types matching declared blocks, Liquid tag
balance, snippet and asset reference integrity, template and section-group
section references, template block types matching section schemas, unknown Liquid
filters, and translation keys resolving without a fallback.

Before deploying, also run Shopify's own checker:

```bash
shopify theme check
shopify theme dev --store <your-store>
```

`theme check` catches performance and accessibility rules beyond the structural
checks above.

---

## Development

```bash
shopify theme dev --store <your-store>     # local preview with hot reload
shopify theme push --unpublished           # upload as an unpublished theme
shopify theme check                        # lint
```

Test the overlay header, cart drawer, predictive search, and every carousel
section at 400 px width and with reduced motion enabled before publishing.
