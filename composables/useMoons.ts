// =============================================================
//  Die drei Monde Vael Tirs
//  Orun  — stabil, 36-Tage-Zyklus: Vollmond Tag 15, Neumond Tag 33
//  Kazun — wandernd, 28–32 Tage (Ø 30), per Seed deterministisch
//  Nyxun — verborgen (nur zu Nyxrun sichtbar, ~alle 36 Jahre)
// =============================================================

import { absDayOf, dateFromAbs, domOfAbs, type LumDate } from './useLuminoxCalendar'

export interface MoonPhase {
  /** 0 = Neumond, 0.5 = Vollmond */
  fraction: number
  name: string
  /** beleuchteter Anteil in % */
  illumination: number
  waxing: boolean
}

export interface MoonReport {
  phase: MoonPhase
  prevFull: LumDate
  nextFull: LumDate
  prevNew: LumDate
  nextNew: LumDate
}

export interface MoonsResult {
  orun: MoonReport
  kazun: MoonReport
  constellation: { type: string; label: string } | null
  nextDoubleFull: LumDate | null
  nextDoubleNew: LumDate | null
}

const PHASE_NAMES = [
  'Neumond',
  'Zunehmende Sichel',
  'Erstes Viertel',
  'Zunehmender Mond',
  'Vollmond',
  'Abnehmender Mond',
  'Letztes Viertel',
  'Abnehmende Sichel',
]

const ORUN_CYCLE = 36
const ORUN_FULL_DOM = 15
const ORUN_NEW_DOM = 33

function phaseFromFraction(f: number): MoonPhase {
  const frac = ((f % 1) + 1) % 1
  const idx = Math.round(frac * 8) % 8
  const illumination = Math.round(((1 - Math.cos(2 * Math.PI * frac)) / 2) * 100)
  return { fraction: frac, name: PHASE_NAMES[idx]!, illumination, waxing: frac < 0.5 }
}

// ---------- Orun (deterministisch) ----------
export function orunFraction(dom: number): number {
  return ((((dom - ORUN_NEW_DOM) % ORUN_CYCLE) + ORUN_CYCLE) % ORUN_CYCLE) / ORUN_CYCLE
}

export function orunPhase(dom: number): MoonPhase {
  return phaseFromFraction(orunFraction(dom))
}

/** Nächster/voriger absoluter Tag mit gegebenem Tag-im-Monat. */
function scanDom(absStart: number, targetDom: number, dir: 1 | -1): number {
  let abs = absStart + dir
  for (let i = 0; i < ORUN_CYCLE + 2; i++) {
    if (domOfAbs(abs) === targetDom) return abs
    abs += dir
  }
  return absStart
}

// ---------- Seeded RNG (xmur3 + mulberry32) ----------
function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return h >>> 0
  }
}

function mulberry32(a: number): () => number {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface KazunCycle {
  start: number
  len: number
  newDay: number
  fullDay: number
}

/** Kazun-Zyklen ab Epoche bis maxAbs — deterministisch aus dem Seed. */
function kazunCycles(seed: string, maxAbs: number): KazunCycle[] {
  const rng = mulberry32(xmur3(seed || 'kazun')())
  const cycles: KazunCycle[] = []
  let start = 0
  // Sicherheitslimit gegen Endlosschleifen bei absurden Eingaben
  while (start <= maxAbs && cycles.length < 200000) {
    const len = 28 + Math.floor(rng() * 5) // 28..32
    cycles.push({ start, len, newDay: start, fullDay: start + Math.round(len / 2) })
    start += len
  }
  return cycles
}

function kazunCycleAt(cycles: KazunCycle[], abs: number): KazunCycle {
  for (const c of cycles) {
    if (abs >= c.start && abs < c.start + c.len) return c
  }
  return cycles[cycles.length - 1]!
}

// ---------- Gesamtbericht ----------
export function computeMoons(date: LumDate, seed: string): MoonsResult {
  const abs = absDayOf(date)
  const dom = date.day

  // Orun
  const orun: MoonReport = {
    phase: orunPhase(dom),
    prevFull: dateFromAbs(dom >= ORUN_FULL_DOM ? abs - (dom - ORUN_FULL_DOM) : scanDom(abs, ORUN_FULL_DOM, -1)),
    nextFull: dateFromAbs(dom < ORUN_FULL_DOM ? abs + (ORUN_FULL_DOM - dom) : scanDom(abs, ORUN_FULL_DOM, 1)),
    prevNew: dateFromAbs(dom >= ORUN_NEW_DOM ? abs - (dom - ORUN_NEW_DOM) : scanDom(abs, ORUN_NEW_DOM, -1)),
    nextNew: dateFromAbs(dom < ORUN_NEW_DOM ? abs + (ORUN_NEW_DOM - dom) : scanDom(abs, ORUN_NEW_DOM, 1)),
  }

  // Kazun — Zyklen großzügig in beide Richtungen erzeugen (für Konstellationssuche).
  const horizon = abs + 360 * 80
  const cycles = kazunCycles(seed, horizon)
  const cur = kazunCycleAt(cycles, abs)
  const kPhase = phaseFromFraction((abs - cur.start) / cur.len)

  const fulls = cycles.map((c) => c.fullDay)
  const news = cycles.map((c) => c.newDay)
  const nextOf = (list: number[]) => list.find((d) => d > abs) ?? abs
  const prevOf = (list: number[]) => {
    let best = list[0] ?? abs
    for (const d of list) {
      if (d <= abs) best = d
      else break
    }
    return best
  }

  const kazun: MoonReport = {
    phase: kPhase,
    prevFull: dateFromAbs(prevOf(fulls)),
    nextFull: dateFromAbs(nextOf(fulls)),
    prevNew: dateFromAbs(prevOf(news)),
    nextNew: dateFromAbs(nextOf(news)),
  }

  // Konstellation am gewählten Tag
  const orunFullToday = dom === ORUN_FULL_DOM
  const orunNewToday = dom === ORUN_NEW_DOM
  const kazunFullToday = fulls.includes(abs)
  const kazunNewToday = news.includes(abs)

  let constellation: MoonsResult['constellation'] = null
  if (orunFullToday && kazunFullToday)
    constellation = { type: 'doppelvollmond', label: 'Doppelvollmond — selten und mächtig' }
  else if (orunNewToday && kazunNewToday)
    constellation = { type: 'doppelneumond', label: 'Doppelneumond — zwiefache Finsternis' }
  else if (kazunFullToday && orunNewToday)
    constellation = { type: 'wanderer', label: 'Einsamer Wanderer — Kazun voll bei dunklem Orun' }

  // Nächster Doppelvollmond / Doppelneumond
  const nextDoubleFull = (() => {
    const fd = fulls.find((d) => d > abs && domOfAbs(d) === ORUN_FULL_DOM)
    return fd != null ? dateFromAbs(fd) : null
  })()
  const nextDoubleNew = (() => {
    const nd = news.find((d) => d > abs && domOfAbs(d) === ORUN_NEW_DOM)
    return nd != null ? dateFromAbs(nd) : null
  })()

  return { orun, kazun, constellation, nextDoubleFull, nextDoubleNew }
}

/** SVG-Pfad der beleuchteten Mondfläche (Radius r, Phase 0..1). */
export function moonLitPath(fraction: number, r: number): string {
  const ph = ((fraction % 1) + 1) % 1
  const cos = Math.cos(2 * Math.PI * ph)
  const rx = Math.abs(cos) * r
  const waxing = ph <= 0.5
  const outerSweep = waxing ? 1 : 0
  const innerSweep = cos > 0 ? (waxing ? 1 : 0) : waxing ? 0 : 1
  return `M0 ${-r} A ${r} ${r} 0 0 ${outerSweep} 0 ${r} A ${rx} ${r} 0 0 ${innerSweep} 0 ${-r} Z`
}
