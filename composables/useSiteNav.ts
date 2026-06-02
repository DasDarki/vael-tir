import type { NavLink } from '~/types/nav'

/** Primäre Navigation des Atlas — eine Quelle für Header & Landing. */
export function useSiteNav() {
  const primary: NavLink[] = [
    { label: 'Karte', to: '/karte', glyph: '◎', desc: 'Die Weltkarte Vael Tirs — Orte, Regionen, Wege.' },
    { label: 'Flora & Fauna', to: '/kompendium', glyph: '❧', desc: 'Pflanzen & Wesen der bekannten Lande.' },
    { label: 'Kalender', to: '/kalender', glyph: '☉', desc: 'Die luminoxische Zeitrechnung — zehn Monate, 360 Tage.' },
    { label: 'Übersetzer', to: '/uebersetzer', glyph: '✶', desc: 'Deutsch ↔ Aelthîr & Vethran übersetzen.' },
    { label: 'Regionen', to: '/regionen', glyph: '⛬', desc: 'Calythar, Esh’Raen und Varkuun im Überblick.' },
    { label: 'Werkzeuge', to: '/werkzeuge/muenzteiler', glyph: '⚖', desc: 'Münzteiler und Hilfen für den Spieltisch.' },
    { label: 'Codex', to: 'https://codex.vael-tir.de/entities', glyph: '📖', desc: 'Das externe Wiki — Personen, Orte & Wesen.', external: true },
  ]
  return { primary }
}
