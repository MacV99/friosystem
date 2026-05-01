# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**AC FRIOSYSTEM S.A.S** — corporate website and field service portal for an HVAC company. Built with Astro 5 + TypeScript. No backend server; data comes from a public Google Sheet (CSV export) and a static JSON file.

## Commands

```bash
npm run dev       # Dev server at localhost:4321 (hot reload)
npm run build     # Production build → ./dist/
npm run preview   # Preview production build locally
```

No test or lint commands are configured.

## Architecture

### Pages & Routing
Astro auto-routes files in `src/pages/`:
- `index.astro` — Marketing home (Hero, Stats, Nosotros, Servicios, MisionVision, Marcas sections)
- `tienda.astro` — Standalone shop page (Hero + Shop section)
- `clientes.astro` — Customer equipment lookup and report viewer
- `reporte.astro` — Password-protected maintenance report form
- `404.astro` — Custom not-found page

All pages use `src/layouts/Layout1.astro` as the base shell (navbar, WhatsApp CTA button, footer scaffolding).

### Data Flow
- **Product catalog**: static JSON at `public/JSON/products.json`
- **Customer/maintenance records**: fetched client-side from a public Google Sheets CSV export (URL hardcoded in `src/components/info_clientes.astro`). Lookup is by cedula/NIT. Retry logic: 3 attempts with 800 ms delay.
- **No persistence**: the maintenance report form (`src/components/form_reporte.astro`) is not saved server-side; it is exported to JPEG via `html2canvas` (loaded on-demand from CDN).

### Key Patterns

**Modal system** — `fsModalShow(type, title, body)` / `fsModalHide()` are global helpers defined in `src/components/info_clientes.astro`. Modal types: `aviso` (yellow), `error` (red), `exito` (green), `carga` (blue).

**PDF/image export** — The printable report DOM is rendered off-screen (`position:fixed; left:100vw`) inside the page, then captured with `html2canvas`. See `generarReporte()` in `src/components/form_reporte.astro`.

**Password protection** — `verificarAcceso()` checks a hardcoded password before revealing the report form. Not a security mechanism — purely a friction layer.

**Product shop** — `src/sections/Shop.astro` reads `products.json`, renders cards dynamically by cloning the `<template>` in `src/components/product_card.astro`. Cart state is in-browser only (no checkout/payment integration). `src/components/view_product.astro` handles the product detail modal; `src/components/cart_tab.astro` is the cart sidebar; `src/components/category_search.astro` filters by category.

**Product data shape** — `public/JSON/products.json` is keyed by category (e.g., `#INVERTER`). Each entry has `name`, `price`, `originalPrice`, `details` (multiline spec string), and `images` (array of external URLs).

**WhatsApp CTA** — Two integration points: layout-level contact button and a shop-level offer inquiry button (`wa.me/573107751017`).

### Styles
- `src/styles/global.css` — base colors, Montserrat typography, spacing tokens
- `src/styles/project.css` — component-level custom properties
- Primary palette: navy `#032132`, red accent `#EA4B5E`, green `#2b9348`
- External CDN: Google Fonts (Montserrat), Bootstrap Icons, html2canvas

### Domain Concepts
**Service types**: Preventivo, Correctivo, Instalación, Revisión  
**Equipment types**: MINI SPLIT, CASSETTE, CENTRAL, PISO FIJO, PISO TECHO, CHILLER, NEVERA  
**Measurement fields on reports**: amperage (L1/L2/L3), suction/discharge pressure, voltage, supply/return/ambient temperature
