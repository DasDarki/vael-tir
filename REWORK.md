Kleines Rework:
- Von pure Vue 3 auf Nuxt 3 mit Vue 3 umstellen
- Design Overhaul für Mobile Compatibility, Dark and Light Mode, Clean, Modern, Fantasy Style
- Neue Features: Pro Seite Titles mit og: meta tags, SEO Optimierung, Performance Verbesserungen
- Code Refactoring: Bessere Struktur, Modularisierung, Nutzung von Nuxt Features wie Auto Imports, Middleware, etc.

---

## Stand (umgesetzt)

- ✅ Design System (HTML-Vorschau): design-system.html
- ✅ Umstellung pure Vue 3 (Vite SPA) → **Nuxt 3** (Vue 3, file-based routing, auto-imports)
- ✅ Design-Overhaul: SCSS Design-System (assets/scss), Hell/Dunkel via @nuxtjs/color-mode,
  mobile-tauglich, „Clean Modern Fantasy" (Luminoxischer Stilkanon)
- ✅ Neue **Landing Page** (pages/index.vue)
- ✅ Neue Seiten: **Kalender** (aus Kalender.md), **Regionen** (Calythar / Esh'Raen / Varkuun)
- ✅ Migriert: Weltkarte (OpenSeadragon, client-only), Kompendium (Flora & Fauna), Münzteiler
- ✅ SEO: pro Seite Title + og:-Meta via useSeoMeta, titleTemplate, SSG-Prerendering aller Routen
- ✅ Fonts: **@nuxt/fonts** lädt im Build & hostet selbst (Cinzel, Cormorant Garamond, JetBrains Mono).
  Hinweis: vite-plugin-webfont-dl integriert nicht mit Nuxts SSR/SSG-HTML — @nuxt/fonts erzielt
  denselben Effekt (Download im Buildprozess, keine Laufzeit-Google-Requests).
- ✅ Deploy: Dockerfile (Bun → generate → nginx), Coolify-tauglich (SSG)

## Offen / nächste Schritte (Vorschläge)

- Inhalte für Esh'Raen ausbauen (aktuell wenig Lore)
- Kompendium-Seite: Hell-Modus-Feinschliff (einige Inputs noch dunkel getönt)
- Alte Map-Share-Links `/map?s=…` ggf. testen