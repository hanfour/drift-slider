# DriftSlider GEO/SEO Enhancement Design

## Overview

Strengthen the DriftSlider documentation site for both traditional search engines (SEO) and AI-powered search engines (GEO). The site is hosted on GitHub Pages at `hanfour.github.io/drift-slider`.

## Changes

### 1. Sitemap Update
- Add missing demo pages: `deck.html`, `creative-presets.html`, `thumbs-product.html`, `thumbs-vertical.html`, `ticker.html`, `ticker-dual.html`
- Update all `lastmod` dates to `2026-04-04`

### 2. Hreflang Tags (all pages)
Since EN/ZH are on the same URL (toggled client-side), all three hreflang point to the same URL:
```html
<link rel="alternate" hreflang="en" href="{canonical-url}">
<link rel="alternate" hreflang="zh-Hant" href="{canonical-url}">
<link rel="alternate" hreflang="x-default" href="{canonical-url}">
```

### 3. JSON-LD Structured Data
- `index.html`: Keep `SoftwareSourceCode`, add `WebSite` with `SearchAction`, add `FAQPage`
- `getting-started.html`: `HowTo` schema (install steps)
- `api.html`: `TechArticle` schema
- `modules.html`: `TechArticle` schema
- `demos.html`: `CollectionPage` schema
- `changelog.html`: `TechArticle` schema

### 4. OG Image PNG
- Generate `og-image.png` (1200x630) to replace SVG
- Update all `og:image` meta tags site-wide

### 5. Meta Robots
- Add `<meta name="robots" content="index, follow">` to all pages

### 6. GEO (AI Search) Enhancement
- `index.html`: `FAQPage` JSON-LD with common questions
- `getting-started.html`: `HowTo` JSON-LD for installation steps
- `robots.txt`: Add `PerplexityBot`, `Googlebot`, `Bingbot` Allow rules

## Files to Modify
- `docs/sitemap.xml`
- `docs/robots.txt`
- All `docs/*.html` (6 main pages)
- All `docs/demos/*.html` (29 demo pages)
- `docs/assets/img/og-image.png` (new)
