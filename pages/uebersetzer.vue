<script setup lang="ts">
definePageMeta({ title: 'Übersetzer' })

useSeoMeta({
  title: 'Übersetzer · Deutsch ↔ Aelthîr & Vethran',
  ogTitle: 'Übersetzer · Vael Tir',
  description:
    'Übersetze zwischen Deutsch und den Sprachen Vael Tirs — Aelthîr und Vethran. Ein regelbasierter Kern, der unbekannte Worte stilgerecht neu prägt.',
})

// ---- API-Typen (spiegeln das Go-Backend) ----
interface Token {
  source: string
  result: string
  origin: 'lexicon' | 'coined' | 'passthrough' | string
  note?: string
  alternatives?: string[]
}
interface Coinage {
  id: number
  language: string
  german: string
  conlang: string
  pos: string
  status: string
}
interface TranslateResponse {
  translation: string
  tokens: Token[]
  coined?: Coinage[]
}

const LANGS = {
  aelthir: { id: 'aelthir', name: 'Aelthîr', sub: 'Sprache der alten Lehren' },
  vethran: { id: 'vethran', name: 'Vethran', sub: 'Zunge der brennenden Marken' },
} as const
type LangId = keyof typeof LANGS

const DE = { id: 'de', name: 'Deutsch', sub: 'Gemeinsprache' }

const config = useRuntimeConfig()
const endpoint = `${config.public.translateApi}/translate`

const lang = ref<LangId>('aelthir')
const deFirst = ref(true) // true: Deutsch → Conlang
const input = ref('')
const response = ref<TranslateResponse | null>(null)
const loading = ref(false)
const error = ref('')
const showTokens = ref(false)
const copied = ref(false)

const source = computed(() => (deFirst.value ? DE : LANGS[lang.value]))
const target = computed(() => (deFirst.value ? LANGS[lang.value] : DE))
const from = computed(() => source.value.id)
const to = computed(() => target.value.id)

const examples = computed(() =>
  deFirst.value
    ? ['Töte den Feind nicht!', 'Das Licht bringt Ordnung.', 'Wo ist der Mond?']
    : [],
)

// ---- Lade-Botschaften (rotierend, da KI-Prägung dauern kann) ----
const WEAVE_MESSAGES = [
  'Bekannte Wurzeln werden gesucht …',
  'Die Grammatik wird gewoben …',
  'Unbekannte Worte werden geprägt …',
  'Der Phonologie-Wächter prüft den Klang …',
]
const weaveIndex = ref(0)
let weaveTimer: ReturnType<typeof setInterval> | null = null
const RUNES = ['ᚠ', 'ᚱ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚨ', 'ᚾ']

function swap() {
  deFirst.value = !deFirst.value
  if (response.value) {
    input.value = response.value.translation
    response.value = null
  }
}

function setLang(id: LangId) {
  if (lang.value === id) return
  lang.value = id
  response.value = null
  error.value = ''
}

async function translate() {
  const text = input.value.trim()
  if (!text || loading.value) return

  loading.value = true
  error.value = ''
  response.value = null
  weaveIndex.value = 0
  weaveTimer = setInterval(() => {
    weaveIndex.value = (weaveIndex.value + 1) % WEAVE_MESSAGES.length
  }, 2600)

  try {
    response.value = await $fetch<TranslateResponse>(endpoint, {
      method: 'POST',
      body: { text, from: from.value, to: to.value },
    })
  } catch (e: any) {
    if (e?.statusCode === 429) error.value = 'Zu viele Anfragen — bitte einen Moment warten.'
    else if (e?.data?.error) error.value = e.data.error
    else error.value = 'Die Übersetzung ist fehlgeschlagen. Ist der Dienst erreichbar?'
  } finally {
    loading.value = false
    if (weaveTimer) {
      clearInterval(weaveTimer)
      weaveTimer = null
    }
  }
}

function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    translate()
  }
}

async function copyResult() {
  if (!response.value) return
  try {
    await navigator.clipboard.writeText(response.value.translation)
    copied.value = true
    setTimeout(() => (copied.value = false), 1400)
  } catch {
    /* ignore */
  }
}

function originLabel(o: string) {
  return o === 'lexicon' ? 'Lexikon' : o === 'coined' ? 'Geprägt' : o === 'passthrough' ? 'Unverändert' : o
}
function originTone(o: string) {
  return o === 'coined' ? 'var(--celest)' : o === 'passthrough' ? 'var(--faint)' : 'var(--gold)'
}

onMounted(() => {
  try {
    const raw = localStorage.getItem('vaeltir-translator')
    if (raw) {
      const s = JSON.parse(raw)
      if (s.lang in LANGS) lang.value = s.lang
      if (typeof s.deFirst === 'boolean') deFirst.value = s.deFirst
    }
  } catch {
    /* ignore */
  }
})
watch([lang, deFirst], () => {
  try {
    localStorage.setItem('vaeltir-translator', JSON.stringify({ lang: lang.value, deFirst: deFirst.value }))
  } catch {
    /* ignore */
  }
})

onBeforeUnmount(() => {
  if (weaveTimer) clearInterval(weaveTimer)
})
</script>

<template>
  <div class="tr shell">
    <header class="tr__head" v-reveal>
      <p class="eyebrow">Werkzeuge · Sprache</p>
      <h1 class="tr__title">Übersetzer</h1>
      <p class="tr__lead">
        Zwischen der Gemeinsprache und den Zungen Vael Tirs. Ein regelbasierter Kern übersetzt
        bekannte Worte — unbekannte werden stilgerecht neu geprägt.
      </p>
    </header>

    <!-- Sprachwahl -->
    <div class="tr__langpick" v-reveal>
      <button
        v-for="l in LANGS"
        :key="l.id"
        type="button"
        class="tr__langbtn"
        :class="{ active: lang === l.id }"
        @click="setLang(l.id as LangId)"
      >
        <span class="tr__langname">{{ l.name }}</span>
        <span class="tr__langsub">{{ l.sub }}</span>
      </button>
    </div>

    <!-- Übersetzer-Panel -->
    <div class="tr__panel" v-reveal>
      <div class="tr__panes">
        <!-- Quelle -->
        <section class="tr__pane">
          <div class="tr__paneHead">
            <span class="tr__paneLang">{{ source.name }}</span>
            <span class="tr__paneSub">{{ source.sub }}</span>
          </div>
          <textarea
            v-model="input"
            class="tr__input"
            :placeholder="deFirst ? 'Gib deutschen Text ein …' : `Gib ${source.name}-Text ein …`"
            rows="5"
            spellcheck="false"
            @keydown="onKeydown"
          />
          <div v-if="examples.length" class="tr__examples">
            <button v-for="ex in examples" :key="ex" type="button" class="tr__example" @click="input = ex">
              {{ ex }}
            </button>
          </div>
        </section>

        <!-- Tausch -->
        <button class="tr__swap" type="button" aria-label="Richtung tauschen" title="Richtung tauschen" @click="swap">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5" />
          </svg>
        </button>

        <!-- Ziel -->
        <section class="tr__pane tr__pane--target">
          <div class="tr__paneHead">
            <span class="tr__paneLang">{{ target.name }}</span>
            <button v-if="response && !loading" class="tr__copy" type="button" @click="copyResult">
              {{ copied ? '✓ kopiert' : 'kopieren' }}
            </button>
          </div>

          <div class="tr__output">
            <!-- Lade-Animation: Runenweberei -->
            <Transition name="fade">
              <div v-if="loading" class="weave" aria-live="polite">
                <div class="weave__runes" aria-hidden="true">
                  <span
                    v-for="(r, i) in RUNES"
                    :key="i"
                    class="weave__rune"
                    :style="{ animationDelay: `${i * 0.13}s` }"
                  >{{ r }}</span>
                </div>
                <div class="weave__bar" aria-hidden="true"><span /></div>
                <p class="weave__msg">{{ WEAVE_MESSAGES[weaveIndex] }}</p>
              </div>
            </Transition>

            <p v-if="!loading && response" class="tr__result">{{ response.translation }}</p>
            <p v-else-if="!loading && error" class="tr__error">{{ error }}</p>
            <p v-else-if="!loading" class="tr__placeholder">Die Übersetzung erscheint hier.</p>
          </div>
        </section>
      </div>

      <div class="tr__actions">
        <span class="tr__hint">Strg/⌘ + ↵ übersetzt</span>
        <button class="tr__go" type="button" :disabled="loading || !input.trim()" @click="translate">
          <span v-if="!loading">Übersetzen</span>
          <span v-else>Wird gewoben …</span>
        </button>
      </div>
    </div>

    <!-- Neu geprägte Worte -->
    <div v-if="response?.coined?.length" class="tr__coined" v-reveal>
      <p class="eyebrow">Neu geprägt · als Entwurf gespeichert</p>
      <div class="tr__coinedList">
        <div v-for="c in response.coined" :key="c.id" class="tr__coin">
          <span class="tr__coinWord">{{ c.conlang }}</span>
          <span class="tr__coinDe">für „{{ c.german }}"</span>
          <LoreBadge :color="'var(--celest)'" :dot="false">{{ c.pos || c.status }}</LoreBadge>
        </div>
      </div>
    </div>

    <!-- Aufschlüsselung -->
    <div v-if="response?.tokens?.length" class="tr__breakdown" v-reveal>
      <button class="tr__breakToggle" type="button" @click="showTokens = !showTokens">
        {{ showTokens ? '− Aufschlüsselung verbergen' : '+ Wort-für-Wort-Aufschlüsselung' }}
      </button>
      <Transition name="expand">
        <div v-if="showTokens" class="tr__tokens">
          <div v-for="(t, i) in response.tokens" :key="i" class="tr__token">
            <div class="tr__tokenMain">
              <span class="tr__tokenSrc">{{ t.source }}</span>
              <span class="tr__tokenArrow">→</span>
              <span class="tr__tokenRes">{{ t.result }}</span>
              <LoreBadge :color="originTone(t.origin)" :dot="false" class="tr__tokenBadge">
                {{ originLabel(t.origin) }}
              </LoreBadge>
            </div>
            <p v-if="t.note" class="tr__tokenNote">{{ t.note }}</p>
            <p v-if="t.alternatives?.length" class="tr__tokenAlts">
              auch: {{ t.alternatives.join(' · ') }}
            </p>
          </div>
        </div>
      </Transition>
    </div>

    <p class="tr__footnote" v-reveal>
      Unterstützt: Deutsch ↔ Aelthîr und Deutsch ↔ Vethran. Geprägte Worte sind Entwürfe und
      werden erst nach Kuratierung Teil des Lexikons.
    </p>
  </div>
</template>

<style scoped lang="scss">
.tr {
  padding-block: clamp(40px, 7vw, 80px) clamp(40px, 6vw, 70px);
}
.tr__head {
  text-align: center;
  max-width: 600px;
  margin: 0 auto 32px;
}
.tr__title {
  font-size: clamp(34px, 7vw, 58px);
  font-weight: 800;
  letter-spacing: 0.05em;
  margin-top: 12px;
}
.tr__lead {
  font-family: var(--font-lore);
  font-style: italic;
  font-size: 18px;
  color: var(--muted);
  margin-top: 14px;
}

// ---- Sprachwahl ----
.tr__langpick {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 22px;
  flex-wrap: wrap;
}
.tr__langbtn {
  display: grid;
  gap: 2px;
  padding: 12px 22px;
  border-radius: $r-md;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  text-align: center;
  transition: border-color 0.2s $ease, background 0.2s $ease, transform 0.2s $ease;
  &:hover {
    border-color: var(--hairline);
    transform: translateY(-2px);
  }
  &.active {
    border-color: var(--gold);
    background: color-mix(in srgb, var(--gold) 12%, var(--surface));
  }
}
.tr__langname {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
}
.tr__langsub {
  font-family: var(--font-lore);
  font-size: 13px;
  color: var(--muted);
}

// ---- Panel ----
.tr__panel {
  @include panel;
  padding: clamp(18px, 3vw, 28px);
}
.tr__panes {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 18px;
  align-items: stretch;
  @include down(md) {
    grid-template-columns: 1fr;
  }
}
.tr__pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.tr__paneHead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}
.tr__paneLang {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
  color: var(--gold);
}
.tr__paneSub {
  font-family: var(--font-data);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--faint);
}
.tr__input {
  flex: 1;
  resize: vertical;
  min-height: 150px;
  padding: 14px 16px;
  border-radius: $r-md;
  border: 1px solid var(--border);
  background: var(--surface-inset);
  color: var(--text);
  font-family: var(--font-lore);
  font-size: 18px;
  line-height: 1.5;
  outline: 0;
  transition: border-color 0.2s $ease, box-shadow 0.2s $ease;
  &:focus {
    border-color: var(--hairline);
    box-shadow: 0 0 0 4px rgba(var(--gold-raw), 0.1);
  }
}
.tr__examples {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}
.tr__example {
  font-family: var(--font-lore);
  font-size: 13px;
  color: var(--muted);
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px dashed var(--border);
  background: transparent;
  cursor: pointer;
  transition: border-color 0.2s $ease, color 0.2s $ease;
  &:hover {
    border-color: var(--hairline);
    color: var(--text);
  }
}

// ---- Swap ----
.tr__swap {
  align-self: center;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: transform 0.3s $ease, border-color 0.2s $ease, color 0.2s $ease;
  &:hover {
    border-color: var(--hairline);
    color: var(--gold);
    transform: rotate(180deg);
  }
  @include down(md) {
    justify-self: center;
    &:hover {
      transform: rotate(90deg);
    }
  }
}

// ---- Ziel/Output ----
.tr__pane--target .tr__output {
  position: relative;
  flex: 1;
  min-height: 150px;
  padding: 16px;
  border-radius: $r-md;
  border: 1px solid var(--border);
  background:
    radial-gradient(120% 120% at 100% 0%, rgba(var(--gold-raw), 0.06), transparent 60%),
    var(--surface-inset);
  display: flex;
  align-items: flex-start;
}
.tr__result {
  font-family: var(--font-display);
  font-size: clamp(20px, 2.6vw, 26px);
  font-weight: 500;
  line-height: 1.4;
  color: var(--text);
  letter-spacing: 0.01em;
}
.tr__placeholder {
  font-family: var(--font-lore);
  font-style: italic;
  font-size: 17px;
  color: var(--faint);
}
.tr__error {
  font-family: var(--font-lore);
  font-size: 16px;
  color: #d4646e;
}
.tr__copy {
  font-family: var(--font-data);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
  background: transparent;
  border: 0;
  cursor: pointer;
  &:hover {
    color: var(--gold);
  }
}

// ---- Aktionen ----
.tr__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 18px;
  margin-top: 18px;
}
.tr__hint {
  font-family: var(--font-data);
  font-size: 10.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--faint);
}
.tr__go {
  font-family: var(--font-data);
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-weight: 600;
  padding: 14px 28px;
  border-radius: $r-sm;
  border: 0;
  background: linear-gradient(180deg, var(--gold), color-mix(in srgb, var(--gold) 78%, #000));
  color: var(--gold-ink);
  cursor: pointer;
  box-shadow: 0 8px 22px rgba(var(--gold-raw), 0.28);
  transition: box-shadow 0.25s $ease, transform 0.12s $ease, opacity 0.2s $ease;
  &:hover:not(:disabled) {
    box-shadow: 0 10px 30px rgba(var(--gold-raw), 0.42);
  }
  &:active:not(:disabled) {
    transform: translateY(1px);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// ---- Lade-Animation: Runenweberei ----
.weave {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 16px;
  padding: 16px;
  text-align: center;
}
.weave__runes {
  display: flex;
  gap: 10px;
}
.weave__rune {
  font-family: var(--font-display);
  font-size: 26px;
  color: var(--gold);
  opacity: 0.25;
  animation: rune-glow 1.4s ease-in-out infinite;
}
@keyframes rune-glow {
  0%,
  100% {
    opacity: 0.2;
    transform: translateY(0) scale(0.92);
    text-shadow: none;
  }
  50% {
    opacity: 1;
    transform: translateY(-4px) scale(1.1);
    text-shadow: 0 0 16px rgba(var(--gold-raw), 0.7);
  }
}
.weave__bar {
  width: 180px;
  max-width: 60vw;
  height: 2px;
  border-radius: 2px;
  background: var(--border);
  overflow: hidden;
  position: relative;
  span {
    position: absolute;
    inset: 0;
    width: 40%;
    border-radius: 2px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
    animation: weave-slide 1.3s ease-in-out infinite;
  }
}
@keyframes weave-slide {
  0% {
    transform: translateX(-120%);
  }
  100% {
    transform: translateX(320%);
  }
}
.weave__msg {
  font-family: var(--font-lore);
  font-style: italic;
  font-size: 15px;
  color: var(--muted);
}

// ---- Neu geprägt ----
.tr__coined {
  margin-top: 22px;
  padding: 20px 22px;
  border-radius: $r-md;
  border: 1px solid color-mix(in srgb, var(--celest) 30%, var(--border));
  background: color-mix(in srgb, var(--celest) 6%, transparent);
}
.tr__coinedList {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 14px;
}
.tr__coin {
  display: inline-flex;
  align-items: baseline;
  gap: 9px;
  padding: 8px 14px;
  border-radius: $r-sm;
  background: var(--surface);
  border: 1px solid var(--border);
}
.tr__coinWord {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  color: var(--celest);
}
.tr__coinDe {
  font-family: var(--font-lore);
  font-size: 14px;
  color: var(--muted);
}

// ---- Aufschlüsselung ----
.tr__breakdown {
  margin-top: 20px;
}
.tr__breakToggle {
  font-family: var(--font-data);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
  background: transparent;
  border: 0;
  cursor: pointer;
  padding: 6px 0;
  &:hover {
    color: var(--gold);
  }
}
.tr__tokens {
  margin-top: 12px;
  display: grid;
  gap: 8px;
}
.tr__token {
  padding: 12px 16px;
  border-radius: $r-sm;
  border: 1px solid var(--border-soft);
  background: var(--surface);
}
.tr__tokenMain {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.tr__tokenSrc {
  font-family: var(--font-lore);
  font-size: 16px;
  color: var(--muted);
}
.tr__tokenArrow {
  color: var(--faint);
}
.tr__tokenRes {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
}
.tr__tokenBadge {
  margin-left: auto;
}
.tr__tokenNote {
  font-family: var(--font-lore);
  font-size: 14px;
  color: var(--muted);
  margin-top: 6px;
}
.tr__tokenAlts {
  font-family: var(--font-data);
  font-size: 12px;
  color: var(--faint);
  margin-top: 4px;
}

.tr__footnote {
  margin-top: 30px;
  text-align: center;
  font-family: var(--font-lore);
  font-size: 14px;
  color: var(--faint);
}

// ---- Transitions ----
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s $ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.expand-enter-active,
.expand-leave-active {
  transition: opacity 0.3s $ease, transform 0.3s $ease;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
