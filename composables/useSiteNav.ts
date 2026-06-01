import type { NavLink } from '~/types/nav'

/** Primäre Navigation des Atlas — eine Quelle für Header & Landing. */
export function useSiteNav() {
  const primary: NavLink[] = [
    { label: 'Karte', to: '/karte', glyph: '◎', desc: 'Die Weltkarte Vael Tirs — Orte, Regionen, Wege.' },
    { label: 'Kompendium', to: '/kompendium', glyph: '❧', desc: 'Flora & Fauna der bekannten Lande.' },
    { label: 'Kalender', to: '/kalender', glyph: '☉', desc: 'Die luminoxische Zeitrechnung — zehn Monate, 360 Tage.' },
    { label: 'Übersetzer', to: '/uebersetzer', glyph: '✶', desc: 'Deutsch ↔ Aelthîr & Vethran übersetzen.' },
    { label: 'Regionen', to: '/regionen', glyph: '⛬', desc: 'Calythar, Esh’Raen und Varkuun im Überblick.' },
    { label: 'Werkzeuge', to: '/werkzeuge/muenzteiler', glyph: '⚖', desc: 'Münzteiler und Hilfen für den Spieltisch.' },
  ]
  return { primary }
}
