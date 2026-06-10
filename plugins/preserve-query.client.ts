// Manche Hosts (z. B. Cloudflares Trailing-Slash-Redirect /karte/ → /karte) lassen
// den Query-String fallen, bevor vue-router ihn liest. Wir sichern die ursprüngliche
// URL-Query EINMAL beim ersten Client-Load — noch bevor der Router sie normalisiert —
// und stellen sie als Fallback bereit (genutzt für Share-/Mess-/Auswahl-Links auf der Karte).
export default defineNuxtPlugin(() => {
  const initialQuery = new URLSearchParams(window.location.search)
  return {
    provide: { initialQuery },
  }
})
