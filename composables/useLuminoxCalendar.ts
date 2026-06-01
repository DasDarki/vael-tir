// =============================================================
//  Luminoxischer Kalender — reine Logik & Daten
//  360 Tage · 10 Monate × 36 Tage · 6 Wochentage
// =============================================================

export interface LumDate {
  year: number
  /** 0 = Domyra … 9 = Elyndor */
  month: number
  /** 1 … 36 */
  day: number
}

export type Season = 'Frühling' | 'Sommer' | 'Herbst' | 'Winter' | 'Übergang'

export interface MonthDef {
  name: string
  fn: string
  season: Season
}

export const DAYS_PER_MONTH = 36
export const MONTHS_PER_YEAR = 10
export const DAYS_PER_WEEK = 6
export const DAYS_PER_YEAR = DAYS_PER_MONTH * MONTHS_PER_YEAR // 360
export const DEFAULT_YEAR = 110

export const MONTHS: MonthDef[] = [
  { name: 'Domyra', fn: 'Setzung', season: 'Übergang' },
  { name: 'Lethain', fn: 'Licht', season: 'Übergang' },
  { name: 'Elisar', fn: 'Erhalt', season: 'Frühling' },
  { name: 'Helvarn', fn: 'Pflicht', season: 'Frühling' },
  { name: 'Kaldor', fn: 'Disziplin', season: 'Sommer' },
  { name: 'Arkaelis', fn: 'Bewahrung', season: 'Sommer' },
  { name: 'Velaris', fn: 'Dauer', season: 'Herbst' },
  { name: 'Mor’thal', fn: 'Übergang', season: 'Herbst' },
  { name: 'Caedryn', fn: 'Offenlegung', season: 'Winter' },
  { name: 'Elyndor', fn: 'Ausdauer', season: 'Winter' },
]

export const WEEKDAYS = ['Settag', 'Bindtag', 'Wahrtag', 'Sichttag', 'Lasttag', 'Stilltag'] as const
export const WEEKDAYS_SHORT = ['Set', 'Bind', 'Wahr', 'Sicht', 'Last', 'Still'] as const

export interface Holiday {
  month: number
  day: number
  name: string
}

export const HOLIDAYS: Holiday[] = [
  { month: 0, day: 1, name: 'Tag der Setzung' },
  { month: 1, day: 18, name: 'Tag des Lichts' },
  { month: 5, day: 36, name: 'Tag der Bewahrung' },
  { month: 8, day: 36, name: 'Tag der Offenlegung' },
]

export const SEASON_TONE: Record<Season, string> = {
  Frühling: '#7bbf6a',
  Sommer: '#e0a93a',
  Herbst: '#d2763a',
  Winter: '#6aa0e0',
  Übergang: '#e8cd82',
}

// ---- absolute Tageszählung (Epoche = Jahr 0, Domyra 1) ----
export function absDayOf(d: LumDate): number {
  return d.year * DAYS_PER_YEAR + d.month * DAYS_PER_MONTH + (d.day - 1)
}

export function dateFromAbs(abs: number): LumDate {
  const year = Math.floor(abs / DAYS_PER_YEAR)
  const rem = ((abs % DAYS_PER_YEAR) + DAYS_PER_YEAR) % DAYS_PER_YEAR
  const month = Math.floor(rem / DAYS_PER_MONTH)
  const day = (rem % DAYS_PER_MONTH) + 1
  return { year, month, day }
}

/** Tag-im-Monat (1..36) eines absoluten Tages. */
export function domOfAbs(abs: number): number {
  const rem = ((abs % DAYS_PER_MONTH) + DAYS_PER_MONTH) % DAYS_PER_MONTH
  return rem + 1
}

/** Wochentag-Index (0 = Settag). Jeder Monat beginnt am Settag, da 36 % 6 = 0. */
export function weekdayOf(day: number): number {
  return (day - 1) % DAYS_PER_WEEK
}

export function holidayOn(month: number, day: number): Holiday | null {
  return HOLIDAYS.find((h) => h.month === month && h.day === day) ?? null
}

export function seasonOf(month: number): Season {
  return MONTHS[month]?.season ?? 'Übergang'
}

export function formatLumDate(d: LumDate | null): string {
  if (!d) return '—'
  return `${d.day}. ${MONTHS[d.month]?.name ?? '?'} ${d.year} LZ`
}

export function weekdayName(d: LumDate): string {
  return WEEKDAYS[weekdayOf(d.day)] ?? ''
}
