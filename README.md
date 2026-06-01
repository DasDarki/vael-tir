# Vael Tir

Atlas des Luminoxischen Zeitalters — eine Nuxt 3 Anwendung mit interaktiver Weltkarte,
Kompendium der Flora & Fauna, luminoxischem Kalender und Werkzeugen für den Spieltisch.

## Stack

- **Nuxt 3** (Vue 3, file-based routing, auto-imports)
- **SCSS** mit globalem Design-System (`assets/scss/`) — Tokens für Hell/Dunkel, Tokens via CSS-Custom-Properties
- **@nuxtjs/color-mode** — Dark/Light über `<html data-theme="…">`, ohne FOUC, persistiert in `localStorage`
- **@nuxt/fonts** — lädt Cinzel, Cormorant Garamond & JetBrains Mono **im Build** von Google und hostet sie selbst (keine Laufzeit-Requests)
- **OpenSeadragon** — gekachelte Weltkarte (client-only Komponente)
- Auslieferung als **statische Site** (`nuxt generate` → `.output/public`)

## Struktur

```
pages/            Routen (index, karte, kompendium, kalender, regionen/*, werkzeuge/*)
layouts/          default (Wiki-Shell) · fullscreen (Karte)
components/       AppHeader, AppFooter, ThemeToggle, BrandSigil, SectionHead, LoreBadge, WorldMap.client
composables/      useSiteNav
data/             flora-fauna (YAML + Logik), realms, places/regions/region-colors (JSON)
assets/scss/      _abstracts (Variablen/Mixins) · main (Tokens, Reset, Basis)
plugins/          reveal (v-reveal Scroll-Direktive)
```

Das Design-System wird zusätzlich als statische Vorschau in [`design-system.html`](design-system.html) dokumentiert.

## Entwicklung

```sh
bun install
bun dev            # Dev-Server (HMR)
bun run typecheck  # vue-tsc über das Projekt
bun run generate   # statische Site nach .output/public
bun run preview    # generierte Site lokal servieren
```

## Deployment

Die App ist statisch (`nuxt generate` → `.output/public`) und lässt sich auf jedem
statischen Host ausliefern.

### Cloudflare Pages (empfohlen, kostenlos)

- **Build command:** `bun run generate`
- **Build output directory:** `.output/public`
- **Env:** `NODE_VERSION=22`

`public/_redirects` (301 für alte Pfade) und `public/_headers` (Cache) sind bereits
hinterlegt. 511 Dateien total — weit unter CF Pages' 20.000-Datei-Limit.

### Coolify / Docker (SSG)

Das `Dockerfile` baut mit Bun, generiert die statische Site (`bun run generate`) und
serviert `.output/public` via nginx (`nginx-default.conf`).

- **Coolify:** als „Dockerfile"-Ressource deployen — kein Node-Server zur Laufzeit nötig.
  Alternativ Coolifys statischer Buildpack mit Build-Command `bun run generate` und
  Publish-Verzeichnis `.output/public`.
- **Standalone:** `docker compose up -d` (Port 2280 → 80).

Alte SPA-Pfade werden umgeleitet: `/map → /karte`, `/flora-fauna → /kompendium`,
`/money → /werkzeuge/muenzteiler`.
