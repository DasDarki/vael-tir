import { fileURLToPath } from 'node:url'

// SCSS abstracts (variables + mixins, no CSS output) injected into every component <style lang="scss">
const abstracts = fileURLToPath(new URL('./assets/scss/_abstracts.scss', import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: ['@nuxtjs/color-mode', '@nuxt/fonts'],

  // Fonts werden im Build von Google geladen, lokal self-hosted (keine Laufzeit-Requests).
  fonts: {
    families: [
      { name: 'Cinzel', provider: 'google', weights: [400, 500, 600, 700, 800, 900] },
      { name: 'Cormorant Garamond', provider: 'google', weights: [300, 400, 500, 600], styles: ['normal', 'italic'] },
      { name: 'JetBrains Mono', provider: 'google', weights: [300, 400, 500, 600] },
    ],
  },

  // Dark/Light via <html data-theme="…">, no FOUC, persisted to localStorage.
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
    classSuffix: '',
    dataValue: 'theme',
    storageKey: 'vaeltir-theme',
  },

  css: ['~/assets/scss/main.scss'],

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "${abstracts}" as *;`,
        },
      },
    },
  },

  // Site-wide SEO defaults; pages override per-route via useSeoMeta().
  app: {
    head: {
      htmlAttrs: { lang: 'de' },
      title: 'Vael Tir · Atlas des Luminoxischen Zeitalters',
      titleTemplate: '%s · Vael Tir',
      link: [{ rel: 'icon', href: '/logo.png' }],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#0a0c10' },
        { property: 'og:site_name', content: 'Vael Tir' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
    },
  },

  // Static generation (SSG) — prerender every route to plain HTML for SEO.
  ssr: true,
  nitro: {
    // Preset explizit fixieren: verhindert, dass Nitro auf Cloudflare/Vercel/etc.
    // automatisch einen Server-/Worker-Preset wählt. Erzeugt rein statisch (.output/public).
    preset: 'static',
    prerender: {
      crawlLinks: true,
      routes: ['/'],
      // The map page is purely client-side (OpenSeadragon) — prerender the shell only.
    },
  },

  routeRules: {
    '/karte': { prerender: true },
    // Alte SPA-Pfade → neue Slugs
    '/map': { redirect: '/karte' },
    '/flora-fauna': { redirect: '/kompendium' },
    '/money': { redirect: '/werkzeuge/muenzteiler' },
  },
})
