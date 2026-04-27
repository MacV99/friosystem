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
- `index.astro` — Marketing home (hero, sections, product shop)
- `clientes.astro` — Customer equipment lookup and report viewer
- `reporte.astro` — Password-protected maintenance report form
- `404.astro` — Custom not-found page

### Data Flow
- **Product catalog**: static JSON at `public/JSON/products.json`
- **Customer/maintenance records**: fetched client-side from a public Google Sheets CSV export (URL hardcoded in `src/components/info_clientes.astro`). Lookup is by cedula/NIT. Retry logic: 3 attempts with 800 ms delay.
- **No persistence**: the maintenance report form (`src/components/form_reporte.astro`) is not saved server-side; it is exported to JPEG via `html2canvas` (loaded on-demand from CDN).

### Key Patterns

**Modal system** — `fsModalShow(type, title, body)` / `fsModalHide()` are global helpers defined in `src/components/info_clientes.astro`. Modal types: `aviso` (yellow), `error` (red), `exito` (green), `carga` (blue).

**PDF/image export** — The printable report DOM is rendered off-screen (`position:fixed; left:100vw`) inside the page, then captured with `html2canvas`. See `generarReporte()` in `src/components/form_reporte.astro`.

**Password protection** — `verificarAcceso()` checks a hardcoded password before revealing the report form. Not a security mechanism — purely a friction layer.

**Product shop** — `src/sections/Shop.astro` reads `products.json`, renders cards via `src/components/product_card.astro`, and manages cart state entirely in-browser (no checkout/payment integration exists).

### Styles
- `src/styles/global.css` — base colors, Montserrat typography, spacing tokens
- `src/styles/project.css` — component-level custom properties
- Primary palette: navy `#032132`, red accent `#EA4B5E`, green `#2b9348`
- External CDN: Google Fonts (Montserrat), Bootstrap Icons, html2canvas

### Domain Concepts
**Service types**: Preventivo, Correctivo, Instalación, Revisión  
**Equipment types**: MINI SPLIT, CASSETTE, CENTRAL, PISO FIJO, PISO TECHO, CHILLER, NEVERA  
**Measurement fields on reports**: amperage (L1/L2/L3), suction/discharge pressure, voltage, supply/return/ambient temperature
