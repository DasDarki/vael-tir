<script setup lang="ts">
import {computed, ref} from "vue";

definePage({
  meta: {
    title: 'Münzteiler',
  }
})

const split = ref(1);

const gold = ref(0);
const silver = ref(0);
const copper = ref(0);

const result = computed<{
  result: {
    gold: number;
    silver: number;
    copper: number;
  };
  remainder: {
    gold: number;
    silver: number;
    copper: number;
  };
}>(() => {
  const totalCopper = convertToCopper();
  const splitCopper = Math.floor(totalCopper / split.value);
  const remainderCopper = totalCopper % split.value;

  const result = {
    gold: Math.floor(splitCopper / 100),
    silver: Math.floor((splitCopper % 100) / 10),
    copper: splitCopper % 10,
  };
  const remainder = {
    gold: Math.floor(remainderCopper / 100),
    silver: Math.floor((remainderCopper % 100) / 10),
    copper: remainderCopper % 10,
  };
  return {result, remainder};
});

function convertToCopper() {
  return gold.value * 100 + silver.value * 10 + copper.value;
}
</script>

<template>
  <div class="body">
    <header>
      <h1>MÜNZTEILER</h1>
      <p class="subtitle">Teile Beute sauber auf — ohne Kopfrechnen.</p>
    </header>

    <div class="wrap">
      <section class="panel">
        <div class="panel-head">
          <h2>Eingabe</h2>
          <p>Gold, Silber, Kupfer eingeben — dann Anzahl Personen wählen.</p>
        </div>

        <div class="grid">
          <div class="field">
            <label>Gold</label>
            <div class="input">
              <span class="sigil gp">GP</span>
              <input
                v-model.number="gold"
                type="number"
                min="0"
                step="1"
                inputmode="numeric"
                placeholder="0"
              />
            </div>
          </div>

          <div class="field">
            <label>Silber</label>
            <div class="input">
              <span class="sigil sp">SP</span>
              <input
                v-model.number="silver"
                type="number"
                min="0"
                step="1"
                inputmode="numeric"
                placeholder="0"
              />
            </div>
          </div>

          <div class="field">
            <label>Kupfer</label>
            <div class="input">
              <span class="sigil cp">CP</span>
              <input
                v-model.number="copper"
                type="number"
                min="0"
                step="1"
                inputmode="numeric"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div class="split">
          <div class="split-top">
            <div class="split-label">
              <span>Aufteilen auf</span>
              <strong>{{ split }}</strong>
              <span>Person{{ split === 1 ? '' : 'en' }}</span>
            </div>

            <div class="split-buttons">
              <button class="chip" type="button" @click="split = 1">1</button>
              <button class="chip" type="button" @click="split = 2">2</button>
              <button class="chip" type="button" @click="split = 3">3</button>
              <button class="chip" type="button" @click="split = 4">4</button>
              <button class="chip" type="button" @click="split = 5">5</button>
              <button class="chip" type="button" @click="split = 6">6</button>
            </div>
          </div>

          <input
            class="range"
            v-model.number="split"
            type="range"
            min="1"
            max="12"
            step="1"
          />

          <div class="hint">
            Standard: <span class="mono">1 GP = 10 SP</span>, <span class="mono">1 SP = 10 CP</span>.
          </div>
        </div>
      </section>

      <aside class="panel result">
        <div class="panel-head">
          <h2>Ergebnis</h2>
          <p>Pro Person + Rest (falls nicht teilbar).</p>
        </div>

        <div class="cards">
          <div class="card">
            <div class="card-title">Pro Person</div>
            <div class="coins">
              <div class="coin gp">
                <div class="coin-top">
                  <span class="badge">GP</span>
                  <span class="value">{{ result.result.gold }}</span>
                </div>
                <div class="bar"></div>
              </div>

              <div class="coin sp">
                <div class="coin-top">
                  <span class="badge">SP</span>
                  <span class="value">{{ result.result.silver }}</span>
                </div>
                <div class="bar"></div>
              </div>

              <div class="coin cp">
                <div class="coin-top">
                  <span class="badge">CP</span>
                  <span class="value">{{ result.result.copper }}</span>
                </div>
                <div class="bar"></div>
              </div>
            </div>
          </div>

          <div class="card subtle">
            <div class="card-title">Rest</div>
            <div class="coins">
              <div class="coin gp">
                <div class="coin-top">
                  <span class="badge">GP</span>
                  <span class="value">{{ result.remainder.gold }}</span>
                </div>
                <div class="bar"></div>
              </div>

              <div class="coin sp">
                <div class="coin-top">
                  <span class="badge">SP</span>
                  <span class="value">{{ result.remainder.silver }}</span>
                </div>
                <div class="bar"></div>
              </div>

              <div class="coin cp">
                <div class="coin-top">
                  <span class="badge">CP</span>
                  <span class="value">{{ result.remainder.copper }}</span>
                </div>
                <div class="bar"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="summary">
          <div class="row">
            <span>Gesamt (in Kupfer)</span>
            <span class="mono">{{ gold * 100 + silver * 10 + copper }}</span>
          </div>
          <div class="row">
            <span>Pro Person (in Kupfer)</span>
            <span class="mono">{{ Math.floor((gold * 100 + silver * 10 + copper) / split) }}</span>
          </div>
          <div class="row">
            <span>Rest (in Kupfer)</span>
            <span class="mono">{{ (gold * 100 + silver * 10 + copper) % split }}</span>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.body {
  background: #0a0908;
  min-height: 100vh;
  font-family: 'Crimson Text', Georgia, serif;
  color: #9a9080;
  overflow-x: hidden;
  position: relative;
}

/* Nebeldrift + Grain */
.body::before {
  content: '';
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse at 28% 18%, rgba(60, 55, 50, 0.16) 0%, transparent 52%),
  radial-gradient(ellipse at 72% 78%, rgba(50, 50, 55, 0.22) 0%, transparent 45%),
  radial-gradient(ellipse at 50% 50%, rgba(40, 40, 45, 0.13) 0%, transparent 62%);
  pointer-events: none;
  z-index: 0;
  animation: fogDrift 18s ease-in-out infinite;
}

@keyframes fogDrift {
  0%, 100% {
    opacity: 0.72;
    transform: translateX(0px);
  }
  50% {
    opacity: 0.92;
    transform: translateX(12px);
  }
}

.body::after {
  content: '';
  position: fixed;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.045;
  pointer-events: none;
  z-index: 0;
}

/* Header */
header {
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 2rem 1rem 1.25rem;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.2) 65%, transparent 100%);
}

header::after {
  content: '─────────────────────────────';
  display: block;
  color: #3a3530;
  letter-spacing: 0.3em;
  margin-top: 1rem;
  opacity: 0.55;
}

h1 {
  font-family: 'Cinzel', serif;
  font-size: clamp(1.7rem, 3.7vw, 2.6rem);
  font-weight: 700;
  color: #c8b898;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.85);
  letter-spacing: 0.15em;
  margin-bottom: 0.55rem;
}

.subtitle {
  font-style: italic;
  color: #6a6050;
  font-size: 1rem;
  letter-spacing: 0.1em;
}

/* Layout */
.wrap {
  position: relative;
  z-index: 2;
  max-width: 1100px;
  margin: 0 auto;
  padding: 1rem 1rem 2rem;
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 1.25rem;
  align-items: start;
}

@media (max-width: 980px) {
  .wrap {
    grid-template-columns: 1fr;
  }
}

/* Panels */
.panel {
  background: linear-gradient(135deg, #151310 0%, #0f0e0c 100%);
  border: 1px solid #252018;
  border-radius: 8px;
  box-shadow: 0 10px 35px rgba(0, 0, 0, 0.65);
  padding: 1rem;
}

.panel-head {
  margin-bottom: 1rem;
}

.panel-head h2 {
  font-family: 'Cinzel', serif;
  font-size: 0.95rem;
  color: #a89878;
  letter-spacing: 0.12em;
  border-bottom: 1px solid #252018;
  padding-bottom: 0.35rem;
  margin-bottom: 0.5rem;
}

.panel-head p {
  color: #7a7060;
  font-size: 0.95rem;
  line-height: 1.4;
}

/* Input grid */
.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

.field label {
  display: block;
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  color: #9a8a70;
  margin-bottom: 0.35rem;
}

.input {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem 0.65rem;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.input:focus-within {
  border-color: rgba(217, 160, 64, 0.35);
  box-shadow: 0 0 0 3px rgba(217, 160, 64, 0.08);
}

.sigil {
  font-family: 'Cinzel', serif;
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  padding: 0.25rem 0.45rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  background: rgba(0, 0, 0, 0.25);
  color: #c8b898;
}

.sigil.gp {
  border-color: rgba(217, 160, 64, 0.22);
}

.sigil.sp {
  border-color: rgba(150, 170, 190, 0.22);
}

.sigil.cp {
  border-color: rgba(185, 120, 90, 0.22);
}

input[type="number"] {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: #c8b898;
  font-size: 1.05rem;
  font-family: 'Crimson Text', Georgia, serif;
}

/* Split */
.split {
  margin-top: 0.25rem;
  padding-top: 0.85rem;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

.split-top {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 0.65rem;
}

.split-label {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
  color: #7a7060;
}

.split-label strong {
  font-family: 'Cinzel', serif;
  color: #c8b898;
  letter-spacing: 0.08em;
}

.split-buttons {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.chip {
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.28);
  color: #a89878;
  border-radius: 999px;
  padding: 0.32rem 0.6rem;
  font-family: 'Cinzel', serif;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: transform 0.12s ease, filter 0.12s ease, border-color 0.12s ease;
}

.chip:hover {
  filter: brightness(1.12);
  border-color: rgba(217, 160, 64, 0.25);
  transform: translateY(-1px);
}

.range {
  width: 100%;
  margin: 0.15rem 0 0.6rem;
  accent-color: #d9a040; /* nur fürs native Slider-Thumb */
}

.hint {
  color: #6a6050;
  font-style: italic;
  letter-spacing: 0.06em;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-style: normal;
  letter-spacing: 0.02em;
}

/* Result cards */
.result .cards {
  display: grid;
  gap: 0.85rem;
}

.card {
  background: rgba(0, 0, 0, 0.26);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  padding: 0.85rem;
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.35);
}

.card.subtle {
  opacity: 0.95;
}

.card-title {
  font-family: 'Cinzel', serif;
  font-size: 0.82rem;
  letter-spacing: 0.12em;
  color: #9a8a70;
  margin-bottom: 0.65rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  padding-bottom: 0.35rem;
}

/* Coin rows */
.coins {
  display: grid;
  gap: 0.55rem;
}

.coin {
  border-radius: 10px;
  padding: 0.6rem 0.65rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.22);
  position: relative;
  overflow: hidden;
}

.coin-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.badge {
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  padding: 0.22rem 0.45rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.25);
  color: #c8b898;
}

.value {
  font-family: 'Cinzel', serif;
  font-size: 1.25rem;
  letter-spacing: 0.06em;
  color: #c8b898;
}

/* little underline bar */
.bar {
  height: 2px;
  margin-top: 0.45rem;
  opacity: 0.55;
  background: linear-gradient(90deg, rgba(217, 160, 64, 0.0), rgba(217, 160, 64, 0.55), rgba(217, 160, 64, 0.0));
}

/* color accents */
.coin.gp .badge {
  border-color: rgba(217, 160, 64, 0.22);
}

.coin.gp .bar {
  background: linear-gradient(90deg, rgba(217, 160, 64, 0.0), rgba(217, 160, 64, 0.6), rgba(217, 160, 64, 0.0));
}

.coin.sp .badge {
  border-color: rgba(150, 170, 190, 0.22);
  color: #bfc7cf;
}

.coin.sp .value {
  color: #bfc7cf;
}

.coin.sp .bar {
  background: linear-gradient(90deg, rgba(150, 170, 190, 0.0), rgba(150, 170, 190, 0.55), rgba(150, 170, 190, 0.0));
}

.coin.cp .badge {
  border-color: rgba(185, 120, 90, 0.22);
  color: #caa08f;
}

.coin.cp .value {
  color: #caa08f;
}

.coin.cp .bar {
  background: linear-gradient(90deg, rgba(185, 120, 90, 0.0), rgba(185, 120, 90, 0.55), rgba(185, 120, 90, 0.0));
}

/* Summary */
.summary {
  margin-top: 0.9rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  display: grid;
  gap: 0.45rem;
  color: #7a7060;
  font-size: 0.9rem;
}

.summary .row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

@media (max-width: 420px) {
  .summary .row {
    flex-direction: column;
  }
}
</style>
