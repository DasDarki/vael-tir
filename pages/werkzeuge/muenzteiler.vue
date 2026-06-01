<script setup lang="ts">
definePageMeta({ title: 'Münzteiler' })

useSeoMeta({
  title: 'Münzteiler',
  ogTitle: 'Münzteiler · Vael Tir',
  description:
    'Teile Beute sauber auf — Gold, Silber und Kupfer pro Person samt Rest, ohne Kopfrechnen.',
})

const split = ref(1)
const gold = ref(0)
const silver = ref(0)
const copper = ref(0)

const SPLITS = [1, 2, 3, 4, 5, 6]

function toCopper() {
  return gold.value * 100 + silver.value * 10 + copper.value
}

function breakdown(totalCopper: number) {
  return {
    gold: Math.floor(totalCopper / 100),
    silver: Math.floor((totalCopper % 100) / 10),
    copper: totalCopper % 10,
  }
}

const result = computed(() => {
  const total = toCopper()
  const per = Math.floor(total / split.value)
  const rest = total % split.value
  return { result: breakdown(per), remainder: breakdown(rest) }
})

const totalCopper = computed(() => toCopper())
const perPersonCopper = computed(() => Math.floor(totalCopper.value / split.value))
const restCopper = computed(() => totalCopper.value % split.value)

const COINS = [
  { key: 'gold', sigil: 'GP', label: 'Gold', cls: 'gp' },
  { key: 'silver', sigil: 'SP', label: 'Silber', cls: 'sp' },
  { key: 'copper', sigil: 'CP', label: 'Kupfer', cls: 'cp' },
] as const

const inputs = { gold, silver, copper }
</script>

<template>
  <div class="mt shell">
    <header class="mt__head" v-reveal>
      <p class="eyebrow">Werkzeuge · Spieltisch</p>
      <h1 class="mt__title">Münzteiler</h1>
      <p class="mt__lead">Teile Beute sauber auf — ohne Kopfrechnen. Gold, Silber, Kupfer pro Person samt Rest.</p>
    </header>

    <div class="mt__grid">
      <!-- EINGABE -->
      <section class="mt__panel" v-reveal>
        <div class="mt__panelHead">
          <h2>Eingabe</h2>
          <p>Münzen eingeben, dann Anzahl der Personen wählen.</p>
        </div>

        <div class="mt__fields">
          <label v-for="c in COINS" :key="c.key" class="mt__field">
            <span class="mt__fieldLabel">{{ c.label }}</span>
            <span class="mt__input">
              <span class="mt__sigil" :class="c.cls">{{ c.sigil }}</span>
              <input
                v-model.number="inputs[c.key].value"
                type="number"
                min="0"
                step="1"
                inputmode="numeric"
                placeholder="0"
              />
            </span>
          </label>
        </div>

        <div class="mt__split">
          <div class="mt__splitTop">
            <span class="mt__splitLabel">
              Aufteilen auf <strong>{{ split }}</strong> Person{{ split === 1 ? '' : 'en' }}
            </span>
            <div class="mt__chips">
              <button
                v-for="n in SPLITS"
                :key="n"
                type="button"
                class="mt__chip"
                :class="{ active: split === n }"
                @click="split = n"
              >
                {{ n }}
              </button>
            </div>
          </div>
          <input v-model.number="split" class="mt__range" type="range" min="1" max="12" step="1" />
          <p class="mt__hint">
            Standard: <span class="mt__mono">1 GP = 10 SP</span>, <span class="mt__mono">1 SP = 10 CP</span>.
          </p>
        </div>
      </section>

      <!-- ERGEBNIS -->
      <aside class="mt__panel" v-reveal="80">
        <div class="mt__panelHead">
          <h2>Ergebnis</h2>
          <p>Pro Person + Rest, falls nicht teilbar.</p>
        </div>

        <div class="mt__cards">
          <div class="mt__card">
            <div class="mt__cardTitle">Pro Person</div>
            <div class="mt__coins">
              <div v-for="c in COINS" :key="c.key" class="mt__coin">
                <span class="mt__disc" :class="c.cls">{{ c.sigil }}</span>
                <span class="mt__value">{{ result.result[c.key] }}</span>
                <span class="mt__unit">{{ c.label }}</span>
              </div>
            </div>
          </div>

          <div class="mt__card mt__card--subtle">
            <div class="mt__cardTitle">Rest</div>
            <div class="mt__coins">
              <div v-for="c in COINS" :key="c.key" class="mt__coin">
                <span class="mt__disc" :class="c.cls">{{ c.sigil }}</span>
                <span class="mt__value">{{ result.remainder[c.key] }}</span>
                <span class="mt__unit">{{ c.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <dl class="mt__summary">
          <div class="mt__row"><dt>Gesamt (in Kupfer)</dt><dd class="mt__mono">{{ totalCopper }}</dd></div>
          <div class="mt__row"><dt>Pro Person (in Kupfer)</dt><dd class="mt__mono">{{ perPersonCopper }}</dd></div>
          <div class="mt__row"><dt>Rest (in Kupfer)</dt><dd class="mt__mono">{{ restCopper }}</dd></div>
        </dl>
      </aside>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mt {
  padding-block: clamp(40px, 7vw, 80px);
}
.mt__head {
  text-align: center;
  margin-bottom: 40px;
}
.mt__title {
  font-size: clamp(34px, 7vw, 58px);
  font-weight: 800;
  letter-spacing: 0.06em;
  margin-top: 12px;
}
.mt__lead {
  font-family: var(--font-lore);
  font-style: italic;
  font-size: 19px;
  color: var(--muted);
  max-width: 520px;
  margin: 14px auto 0;
}

.mt__grid {
  display: grid;
  gap: 18px;
  grid-template-columns: 1.1fr 0.9fr;
  align-items: start;
  @include down(lg) {
    grid-template-columns: 1fr;
  }
}

.mt__panel {
  @include panel;
  padding: 26px;
}
.mt__panelHead {
  margin-bottom: 20px;
  h2 {
    font-size: 22px;
    font-weight: 600;
  }
  p {
    font-family: var(--font-lore);
    color: var(--muted);
    margin-top: 4px;
  }
}

.mt__fields {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 22px;
  @include down(sm) {
    grid-template-columns: 1fr;
  }
}
.mt__fieldLabel {
  @include eyebrow;
  display: block;
  margin-bottom: 8px;
}
.mt__input {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--surface-inset);
  border: 1px solid var(--border);
  border-radius: $r-md;
  transition: border-color 0.2s $ease, box-shadow 0.2s $ease;
  &:focus-within {
    border-color: var(--hairline);
    box-shadow: 0 0 0 4px rgba(var(--gold-raw), 0.12);
  }
  input {
    width: 100%;
    background: transparent;
    border: 0;
    outline: 0;
    color: var(--text);
    font-family: var(--font-data);
    font-size: 19px;
  }
}
.mt__sigil {
  font-family: var(--font-data);
  font-size: 11px;
  letter-spacing: 0.08em;
  padding: 4px 8px;
  border-radius: $r-sm;
  border: 1px solid var(--border);
  color: var(--gold);
  &.gp {
    border-color: rgba(217, 160, 64, 0.4);
  }
  &.sp {
    border-color: rgba(150, 170, 190, 0.4);
  }
  &.cp {
    border-color: rgba(185, 120, 90, 0.4);
  }
}

.mt__split {
  padding-top: 18px;
  border-top: 1px solid var(--border-soft);
}
.mt__splitTop {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.mt__splitLabel {
  font-family: var(--font-lore);
  color: var(--muted);
  strong {
    font-family: var(--font-display);
    color: var(--gold);
    font-size: 19px;
    margin: 0 2px;
  }
}
.mt__chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.mt__chip {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--muted);
  border-radius: 999px;
  width: 32px;
  height: 32px;
  font-family: var(--font-data);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s $ease;
  &:hover {
    border-color: var(--hairline);
    color: var(--text);
  }
  &.active {
    background: var(--gold);
    color: var(--gold-ink);
    border-color: transparent;
  }
}
.mt__range {
  width: 100%;
  accent-color: var(--gold);
  margin: 4px 0 12px;
}
.mt__hint {
  font-family: var(--font-lore);
  font-style: italic;
  color: var(--faint);
}
.mt__mono {
  font-family: var(--font-data);
  font-style: normal;
  font-size: 0.9em;
  color: var(--text);
}

.mt__cards {
  display: grid;
  gap: 14px;
}
.mt__card {
  background: var(--surface-inset);
  border: 1px solid var(--border);
  border-radius: $r-md;
  padding: 16px 18px;
  &--subtle {
    opacity: 0.82;
  }
}
.mt__cardTitle {
  @include eyebrow;
  margin-bottom: 14px;
}
.mt__coins {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.mt__coin {
  display: grid;
  justify-items: center;
  gap: 4px;
  text-align: center;
}
.mt__disc {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 12px;
  color: #1a1304;
  box-shadow:
    inset 0 0 0 2px rgba(255, 255, 255, 0.25),
    inset 0 -6px 10px rgba(0, 0, 0, 0.25),
    0 5px 14px rgba(0, 0, 0, 0.3);
  &.gp {
    background: radial-gradient(circle at 35% 28%, #fbe9a8, #c79a36 70%);
  }
  &.sp {
    background: radial-gradient(circle at 35% 28%, #f2f4f8, #9aa3ad 70%);
    color: #2a2f36;
  }
  &.cp {
    background: radial-gradient(circle at 35% 28%, #e8a878, #a35a30 70%);
    color: #2a1206;
  }
}
.mt__value {
  font-family: var(--font-data);
  font-size: 22px;
  font-weight: 500;
  color: var(--text);
}
.mt__unit {
  font-family: var(--font-lore);
  font-size: 13px;
  color: var(--muted);
}

.mt__summary {
  margin: 18px 0 0;
  display: grid;
  gap: 2px;
}
.mt__row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 2px;
  border-bottom: 1px solid var(--border-soft);
  font-family: var(--font-lore);
  color: var(--muted);
  &:last-child {
    border-bottom: 0;
  }
  dt {
    font-size: 15px;
  }
  dd {
    margin: 0;
  }
}
</style>
