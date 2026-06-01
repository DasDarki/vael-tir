<script setup lang="ts">
import {
  MONTHS,
  WEEKDAYS_SHORT,
  DAYS_PER_MONTH,
  DEFAULT_YEAR,
  SEASON_TONE,
  holidayOn,
  weekdayName,
  formatLumDate,
  type LumDate,
} from '~/composables/useLuminoxCalendar'
import { computeMoons, moonLitPath, type MoonReport } from '~/composables/useMoons'

const STORAGE = 'vaeltir-calendar'

const year = ref(DEFAULT_YEAR)
const seed = ref('karzun')
const sel = reactive({ month: 0, day: 1 })

const days = Array.from({ length: DAYS_PER_MONTH }, (_, i) => i + 1)

const selDate = computed<LumDate>(() => ({ year: year.value, month: sel.month, day: sel.day }))
const moons = computed(() => computeMoons(selDate.value, seed.value))

const selWeekday = computed(() => weekdayName(selDate.value))

function selectDay(month: number, day: number) {
  sel.month = month
  sel.day = day
}

function isSelected(month: number, day: number) {
  return sel.month === month && sel.day === day
}

function stepYear(delta: number) {
  year.value = Math.max(0, Math.min(99999, year.value + delta))
}

// ---- Persistenz (client-only) ----
onMounted(() => {
  try {
    const raw = localStorage.getItem(STORAGE)
    if (raw) {
      const s = JSON.parse(raw)
      if (Number.isFinite(s.year)) year.value = s.year
      if (typeof s.seed === 'string') seed.value = s.seed
      if (s.sel && Number.isFinite(s.sel.month) && Number.isFinite(s.sel.day)) {
        sel.month = Math.min(9, Math.max(0, s.sel.month))
        sel.day = Math.min(36, Math.max(1, s.sel.day))
      }
    }
  } catch {
    /* ignore */
  }
})

watch(
  [year, seed, () => sel.month, () => sel.day],
  () => {
    try {
      localStorage.setItem(
        STORAGE,
        JSON.stringify({ year: year.value, seed: seed.value, sel: { month: sel.month, day: sel.day } }),
      )
    } catch {
      /* ignore */
    }
  },
)

// Moon-Karten als Datenstruktur fürs Template
const moonCards = computed(() => [
  { key: 'orun', name: 'Orun', sub: 'Der stabile Mond', tone: '#f3e7c0', report: moons.value.orun },
  { key: 'kazun', name: 'Kazun', sub: 'Der wandernde Mond', tone: '#b9c6e8', report: moons.value.kazun },
])

function fmt(d: LumDate) {
  return formatLumDate(d)
}
function moonPath(report: MoonReport) {
  return moonLitPath(report.phase.fraction, 26)
}
</script>

<template>
  <div class="ct">
    <!-- Steuerleiste -->
    <div class="ct__controls">
      <div class="ct__ctl">
        <span class="ct__ctlLabel">Jahr</span>
        <div class="ct__stepper">
          <button type="button" @click="stepYear(-1)" aria-label="Jahr zurück">−</button>
          <input v-model.number="year" type="number" min="0" max="99999" />
          <button type="button" @click="stepYear(1)" aria-label="Jahr vor">+</button>
          <span class="ct__lz">LZ</span>
        </div>
      </div>
      <div class="ct__ctl ct__ctl--seed">
        <span class="ct__ctlLabel">Kazun-Seed</span>
        <input v-model="seed" type="text" class="ct__seed" placeholder="Seed …" spellcheck="false" />
      </div>
    </div>

    <div class="ct__layout">
      <!-- TOOL 1 · Kalender -->
      <div class="ct__calendar">
        <div class="ct__legend">
          <span v-for="(s, k) in SEASON_TONE" :key="k" class="ct__legendItem" :style="{ '--t': s }">
            <i /> {{ k }}
          </span>
          <span class="ct__legendItem ct__legendItem--holiday"><i /> Feiertag</span>
        </div>

        <div class="ct__months">
          <section
            v-for="(m, mi) in MONTHS"
            :key="m.name"
            class="ct__month"
            :style="{ '--t': SEASON_TONE[m.season] }"
          >
            <header class="ct__monthHead">
              <div>
                <span class="ct__monthNum">{{ String(mi + 1).padStart(2, '0') }}</span>
                <h4 class="ct__monthName">{{ m.name }}</h4>
              </div>
              <span class="ct__monthSeason">{{ m.season }}</span>
            </header>

            <div class="ct__week">
              <span v-for="w in WEEKDAYS_SHORT" :key="w">{{ w }}</span>
            </div>

            <div class="ct__grid">
              <button
                v-for="d in days"
                :key="d"
                type="button"
                class="ct__day"
                :class="{
                  'ct__day--selected': isSelected(mi, d),
                  'ct__day--holiday': !!holidayOn(mi, d),
                }"
                :style="{ '--t': SEASON_TONE[m.season] }"
                :title="holidayOn(mi, d)?.name || `${d}. ${m.name}`"
                @click="selectDay(mi, d)"
              >
                {{ d }}
              </button>
            </div>
          </section>
        </div>
      </div>

      <!-- TOOL 2 · Monde -->
      <aside class="ct__moons">
        <div class="ct__selDate">
          <span class="ct__selWeekday">{{ selWeekday }}</span>
          <span class="ct__selFull">{{ fmt(selDate) }}</span>
          <span v-if="holidayOn(sel.month, sel.day)" class="ct__selHoliday">
            ✦ {{ holidayOn(sel.month, sel.day)?.name }}
          </span>
        </div>

        <div
          v-if="moons.constellation"
          class="ct__constellation"
          :class="`ct__constellation--${moons.constellation.type}`"
        >
          {{ moons.constellation.label }}
        </div>

        <article v-for="c in moonCards" :key="c.key" class="ct__moonCard" :style="{ '--moon': c.tone }">
          <div class="ct__moonTop">
            <svg class="ct__moonIcon" viewBox="-30 -30 60 60" width="58" height="58" aria-hidden="true">
              <circle cx="0" cy="0" r="26" class="ct__moonDark" />
              <path :d="moonPath(c.report)" class="ct__moonLit" />
              <circle cx="0" cy="0" r="26" class="ct__moonRing" />
            </svg>
            <div class="ct__moonInfo">
              <div class="ct__moonName">{{ c.name }} <span>· {{ c.sub }}</span></div>
              <div class="ct__moonPhase">{{ c.report.phase.name }}</div>
              <div class="ct__moonIllum">
                {{ c.report.phase.illumination }} % beleuchtet · {{ c.report.phase.waxing ? 'zunehmend' : 'abnehmend' }}
              </div>
            </div>
          </div>
          <dl class="ct__moonEvents">
            <div><dt>Voriger Vollmond</dt><dd>{{ fmt(c.report.prevFull) }}</dd></div>
            <div class="hl"><dt>Nächster Vollmond</dt><dd>{{ fmt(c.report.nextFull) }}</dd></div>
            <div><dt>Voriger Neumond</dt><dd>{{ fmt(c.report.prevNew) }}</dd></div>
            <div class="hl"><dt>Nächster Neumond</dt><dd>{{ fmt(c.report.nextNew) }}</dd></div>
          </dl>
        </article>

        <div class="ct__special">
          <div><span>Nächster Doppelvollmond</span><strong>{{ moons.nextDoubleFull ? fmt(moons.nextDoubleFull) : '—' }}</strong></div>
          <div><span>Nächster Doppelneumond</span><strong>{{ moons.nextDoubleNew ? fmt(moons.nextDoubleNew) : '—' }}</strong></div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped lang="scss">
.ct {
  margin-top: 36px;
}

// ---------- Steuerleiste ----------
.ct__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 22px;
}
.ct__ctl {
  display: grid;
  gap: 6px;
}
.ct__ctl--seed {
  flex: 1;
  min-width: 200px;
}
.ct__ctlLabel {
  @include eyebrow;
}
.ct__stepper {
  display: flex;
  align-items: center;
  gap: 6px;
  button {
    width: 38px;
    height: 42px;
    border-radius: $r-sm;
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--text);
    font-size: 20px;
    cursor: pointer;
    transition: border-color 0.2s $ease, background 0.2s $ease;
    &:hover {
      border-color: var(--hairline);
      background: color-mix(in srgb, var(--gold) 12%, var(--surface-2));
    }
  }
  input {
    width: 90px;
    height: 42px;
    text-align: center;
    border-radius: $r-sm;
    border: 1px solid var(--border);
    background: var(--surface-inset);
    color: var(--text);
    font-family: var(--font-data);
    font-size: 17px;
    outline: 0;
    &:focus {
      border-color: var(--hairline);
    }
  }
}
.ct__lz {
  font-family: var(--font-data);
  font-size: 12px;
  letter-spacing: 0.16em;
  color: var(--faint);
}
.ct__seed {
  height: 42px;
  width: 100%;
  padding: 0 14px;
  border-radius: $r-sm;
  border: 1px solid var(--border);
  background: var(--surface-inset);
  color: var(--text);
  font-family: var(--font-data);
  font-size: 15px;
  outline: 0;
  &:focus {
    border-color: var(--hairline);
    box-shadow: 0 0 0 4px rgba(var(--gold-raw), 0.12);
  }
}

// ---------- Layout ----------
.ct__layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 20px;
  align-items: start;
  @include down(lg) {
    grid-template-columns: 1fr;
  }
}

// ---------- Legende ----------
.ct__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-bottom: 16px;
  font-family: var(--font-data);
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}
.ct__legendItem {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  i {
    width: 11px;
    height: 11px;
    border-radius: 3px;
    background: color-mix(in srgb, var(--t) 45%, transparent);
    border: 1px solid color-mix(in srgb, var(--t) 70%, transparent);
  }
  &--holiday i {
    background: rgba(var(--gold-raw), 0.5);
    border-color: var(--gold);
  }
}

// ---------- Monate ----------
.ct__months {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(218px, 1fr));
  gap: 14px;
}
.ct__month {
  @include panel;
  padding: 14px;
  border-left: 2px solid color-mix(in srgb, var(--t) 60%, transparent);
}
.ct__monthHead {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
  > div {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
}
.ct__monthNum {
  font-family: var(--font-data);
  font-size: 11px;
  color: var(--faint);
}
.ct__monthName {
  font-size: 19px;
  font-weight: 600;
}
.ct__monthSeason {
  font-family: var(--font-data);
  font-size: 9px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--t) 70%, var(--muted));
  padding-top: 4px;
}
.ct__week {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
  margin-bottom: 5px;
  span {
    text-align: center;
    font-family: var(--font-data);
    font-size: 8.5px;
    letter-spacing: 0.04em;
    color: var(--faint);
  }
}
.ct__grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
}
.ct__day {
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 6px;
  border: 1px solid transparent;
  background: color-mix(in srgb, var(--t) 12%, var(--surface-inset));
  color: var(--text);
  font-family: var(--font-data);
  font-size: 12px;
  cursor: pointer;
  transition: transform 0.12s $ease, background 0.18s $ease, border-color 0.18s $ease;
  &:hover {
    transform: translateY(-1px);
    background: color-mix(in srgb, var(--t) 26%, var(--surface-inset));
    border-color: color-mix(in srgb, var(--t) 50%, transparent);
  }
  &--holiday {
    border-color: var(--gold);
    color: var(--gold);
    background: rgba(var(--gold-raw), 0.12);
    font-weight: 600;
  }
  &--selected {
    background: var(--gold);
    color: var(--gold-ink);
    border-color: transparent;
    box-shadow: 0 0 0 3px rgba(var(--gold-raw), 0.3);
    font-weight: 700;
  }
}

// ---------- Mond-Panel ----------
.ct__moons {
  display: grid;
  gap: 14px;
  position: sticky;
  top: 78px;
  @include down(lg) {
    position: static;
  }
}
.ct__selDate {
  @include panel;
  padding: 16px 18px;
  display: grid;
  gap: 2px;
}
.ct__selWeekday {
  font-family: var(--font-data);
  font-size: 10.5px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gold);
}
.ct__selFull {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 600;
}
.ct__selHoliday {
  font-family: var(--font-lore);
  font-size: 14px;
  color: var(--muted);
  margin-top: 2px;
}

.ct__constellation {
  padding: 12px 16px;
  border-radius: $r-md;
  border: 1px solid var(--hairline);
  background: rgba(var(--gold-raw), 0.1);
  font-family: var(--font-display);
  font-size: 15px;
  color: var(--gold);
  text-align: center;
  &--wanderer {
    border-color: rgba(var(--celest-raw), 0.4);
    background: rgba(var(--celest-raw), 0.12);
    color: var(--celest);
  }
}

.ct__moonCard {
  @include panel;
  padding: 16px 18px;
}
.ct__moonTop {
  display: flex;
  align-items: center;
  gap: 14px;
}
.ct__moonIcon {
  flex-shrink: 0;
}
.ct__moonDark {
  fill: #0b0e16;
}
.ct__moonLit {
  fill: var(--moon);
}
.ct__moonRing {
  fill: none;
  stroke: color-mix(in srgb, var(--moon) 40%, transparent);
  stroke-width: 1;
}
.ct__moonName {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  span {
    font-family: var(--font-lore);
    font-size: 13px;
    font-weight: 400;
    color: var(--faint);
  }
}
.ct__moonPhase {
  font-family: var(--font-lore);
  font-size: 16px;
  color: var(--text);
  margin-top: 2px;
}
.ct__moonIllum {
  font-family: var(--font-data);
  font-size: 10.5px;
  letter-spacing: 0.04em;
  color: var(--muted);
  margin-top: 2px;
}
.ct__moonEvents {
  margin: 14px 0 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  div {
    background: var(--surface-inset);
    border: 1px solid var(--border-soft);
    border-radius: $r-sm;
    padding: 8px 10px;
    &.hl {
      border-color: color-mix(in srgb, var(--moon) 30%, var(--border));
    }
  }
  dt {
    font-family: var(--font-data);
    font-size: 9px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--faint);
  }
  dd {
    margin: 3px 0 0;
    font-family: var(--font-lore);
    font-size: 14px;
    color: var(--text);
  }
}

.ct__special {
  @include panel;
  padding: 14px 18px;
  display: grid;
  gap: 8px;
  div {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-family: var(--font-lore);
  }
  span {
    color: var(--muted);
    font-size: 14px;
  }
  strong {
    font-family: var(--font-data);
    font-size: 13px;
    color: var(--gold);
    font-weight: 500;
  }
}
</style>
