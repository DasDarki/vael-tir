<script setup lang="ts">
definePageMeta({ title: 'Kalender' })

useSeoMeta({
  title: 'Der Luminoxische Kalender',
  ogTitle: 'Kalender · Vael Tir',
  description:
    'Die geordnete Zeitrechnung Calythars — 360 Tage, zehn Monate zu je 36 Tagen, vier Jahreszeiten, sechs Wochentage und das seltene Nyxrun.',
})

type Season = 'Frühling' | 'Sommer' | 'Herbst' | 'Winter' | 'Übergang'

interface MonthDef {
  roman: string
  name: string
  fn: string
  season: Season
  motto: string
  text: string
}

const months: MonthDef[] = [
  { roman: 'I', name: 'Domyra', fn: 'Monat der Setzung', season: 'Übergang', motto: 'Fundament des Jahres.', text: 'Gesetze werden erneuert, Ämter bestätigt, Loyalität öffentlich bekräftigt. Verwaltungsakte haben besondere Bindungskraft.' },
  { roman: 'II', name: 'Lethain', fn: 'Monat des Lichts', season: 'Übergang', motto: 'Zweifel gilt als gefährlich.', text: 'Religiöse Zeremonien, Weihen und Glaubensbekundungen. Tempelaktivität ist hoch, Predigten für manche Stände verpflichtend.' },
  { roman: 'III', name: 'Elisar', fn: 'Monat des Erhalts', season: 'Frühling', motto: 'Leben wird verwaltet.', text: 'Bevölkerungszählungen, Heilrituale und landwirtschaftliche Planung. Geburt und Krankheit werden dokumentiert, nicht romantisiert.' },
  { roman: 'IV', name: 'Helvarn', fn: 'Monat der Pflicht', season: 'Frühling', motto: 'Pflicht vor Wunsch.', text: 'Familie, Dienst und Bindung. Ehen, Schwüre und Standeszuweisungen werden bevorzugt jetzt vollzogen.' },
  { roman: 'V', name: 'Kaldor', fn: 'Monat der Disziplin', season: 'Sommer', motto: 'Ordnung muss verteidigt werden.', text: 'Der militärischste Monat. Rekrutierungen, Manöver, Grenzsicherung — die Luminare Garde ist sichtbar erhöht präsent.' },
  { roman: 'VI', name: 'Arkaelis', fn: 'Monat der Bewahrung', season: 'Sommer', motto: 'Wissen ist Besitz.', text: 'Dem Sichern des Wissens gewidmet. Archive werden geprüft, magische Praktiken kontrolliert, Lehrbefugnisse erneuert oder entzogen.' },
  { roman: 'VII', name: 'Velaris', fn: 'Monat der Dauer', season: 'Herbst', motto: 'Stillstand ist Stabilität.', text: 'Der ruhigste Monat. Reformen und Initiativen sind unerwünscht; Bestehendes soll fortgeführt, nicht hinterfragt werden.' },
  { roman: 'VIII', name: 'Mor’thal', fn: 'Monat des Übergangs', season: 'Herbst', motto: 'Der Tod wird akzeptiert.', text: 'Dem Tod und Gedenken gewidmet. Bestattungen, Seelenrituale und gelenkte Trauerzeremonien; öffentliche Feiern sind reduziert.' },
  { roman: 'IX', name: 'Caedryn', fn: 'Monat der Offenlegung', season: 'Winter', motto: 'Wahrheit ist Pflicht.', text: 'Prozesse werden geführt, Urteile verkündet, Geständnisse eingeholt. Rechtsprechung trägt besondere symbolische Bedeutung.' },
  { roman: 'X', name: 'Elyndor', fn: 'Monat der Ausdauer', season: 'Winter', motto: 'Man hat überstanden.', text: 'Der Jahresschluss. Rückblicke, Durchhalteappelle und gelenkte Hoffnungsfeste. Das Jahr endet mit Standhaftigkeit, nicht Erlösung.' },
]

const seasonTone: Record<Season, string> = {
  Frühling: '#7bbf6a',
  Sommer: '#e0a93a',
  Herbst: '#d2763a',
  Winter: '#6aa0e0',
  Übergang: 'var(--gold)',
}

const seasons = [
  { name: 'Frühling', months: 'Elisar & Helvarn', tone: '#7bbf6a' },
  { name: 'Sommer', months: 'Kaldor & Arkaelis', tone: '#e0a93a' },
  { name: 'Herbst', months: 'Velaris & Mor’thal', tone: '#d2763a' },
  { name: 'Winter', months: 'Caedryn & Elyndor', tone: '#6aa0e0' },
]

const week = [
  { day: 'Settag', use: 'Erlasse, Anweisungen, Beginn neuer Vorgänge' },
  { day: 'Bindtag', use: 'Dienste, Schwüre, Abgaben' },
  { day: 'Wahrtag', use: 'Tempelpflicht, Lehre, Unterweisung' },
  { day: 'Sichttag', use: 'Kontrollen, Patrouillen, Inspektionen' },
  { day: 'Lasttag', use: 'Pflichten, Strafen, Zwangsarbeiten' },
  { day: 'Stilltag', use: 'Arbeit in Stille, keine Versammlungen nach Sonnenuntergang' },
]

const holidays = [
  { name: 'Tag der Setzung', when: 'Domyra · 1', text: 'Erneuerung des Systems, öffentliche Loyalitätsbekundungen.' },
  { name: 'Tag des Lichts', when: 'Lethain · 18', text: 'Zentrale Zeremonien des Aurels, verpflichtend für Tempeldiener und Beamte.' },
  { name: 'Tag der Bewahrung', when: 'Arkaelis · 36', text: 'Archivversiegelungen, magische Revisionen, symbolische Schließungen.' },
  { name: 'Tag der Offenlegung', when: 'Caedryn · 36', text: 'Öffentliche Urteile, Generalamnestien oder exemplarische Strafen.' },
]
</script>

<template>
  <div class="kal">
    <!-- HERO -->
    <section class="kal__hero shell" v-reveal>
      <p class="eyebrow">Die geordnete Zeitrechnung Calythars</p>
      <h1 class="kal__title">Der Luminoxische<br />Kalender</h1>
      <p class="kal__lead">
        Zeit gilt in Calythar nicht als natürlicher Fluss, sondern als strukturierte Ressource.
        Ein Jahr umfasst 360 Tage — ohne Ausnahme.
      </p>
      <div class="kal__stats">
        <div class="kal__stat"><span class="kal__statNum">360</span><span class="kal__statLbl">Tage</span></div>
        <div class="kal__stat"><span class="kal__statNum">10</span><span class="kal__statLbl">Monate</span></div>
        <div class="kal__stat"><span class="kal__statNum">36</span><span class="kal__statLbl">Tage je Monat</span></div>
        <div class="kal__stat"><span class="kal__statNum">6</span><span class="kal__statLbl">Wochentage</span></div>
      </div>
      <p class="kal__whisper">Zeit wird nicht gefeiert. Sie wird durchlaufen.</p>
    </section>

    <!-- WERKZEUGE: Kalender & Monde -->
    <section class="kal__sec shell" id="werkzeuge">
      <SectionHead
        v-reveal
        eyebrow="Werkzeuge der Zeit"
        title="Kalender & Monde"
        desc="Wähle ein Jahr und einen Tag, um Jahreszeiten und Feiertage zu sehen — und gib einen Seed für Kazuns Wandel an, um die Mondphasen für den gewählten Tag zu lesen."
      />
      <ClientOnly>
        <CalendarTools />
        <template #fallback>
          <div class="kal__toolsLoading">
            <BrandSigil :size="48" spin />
            <p>Die Werkzeuge werden vorbereitet …</p>
          </div>
        </template>
      </ClientOnly>
    </section>

    <!-- MONATE -->
    <section class="kal__sec shell">
      <SectionHead v-reveal eyebrow="Aufbau des Jahres" title="Die zehn Monate"
        desc="Jeder Monat erfüllt eine festgelegte Funktion. Ihre Reihenfolge gilt als unveränderlich." />
      <div class="months">
        <article
          v-for="(m, i) in months"
          :key="m.name"
          class="month"
          :style="{ '--tone': seasonTone[m.season] }"
          v-reveal="(i % 2) * 50"
        >
          <span class="month__glyph">{{ m.roman }}</span>
          <div class="month__head">
            <span class="month__num">{{ String(i + 1).padStart(2, '0') }} · 36 Tage</span>
            <LoreBadge :color="seasonTone[m.season]">{{ m.season }}</LoreBadge>
          </div>
          <h3 class="month__name">{{ m.name }}</h3>
          <p class="month__fn">{{ m.fn }}</p>
          <p class="month__text">{{ m.text }}</p>
          <p class="month__motto">„{{ m.motto }}“</p>
        </article>
      </div>
    </section>

    <!-- JAHRESZEITEN -->
    <section class="kal__sec shell">
      <SectionHead v-reveal eyebrow="Die Jahreszeiten" title="Vier gleiche Teile"
        desc="Die luminoxische Lehre verteilt vier Jahreszeiten gleichmäßig. Natur hat sich der Ordnung zu fügen — Domyra und Lethain bleiben strukturierende Übergangsmonate." />
      <div class="seasons">
        <div v-for="s in seasons" :key="s.name" class="season" :style="{ '--tone': s.tone }" v-reveal>
          <span class="season__orb" />
          <h3 class="season__name">{{ s.name }}</h3>
          <p class="season__months">{{ s.months }}</p>
        </div>
      </div>
    </section>

    <!-- WOCHE -->
    <section class="kal__sec shell">
      <SectionHead v-reveal eyebrow="Die Woche" title="Sechs Tage, kein Ruhetag"
        desc="Eine Woche zählt sechs Tage. Einen offiziellen Ruhetag kennt der Kalender nicht." />
      <ol class="week" v-reveal>
        <li v-for="(d, i) in week" :key="d.day" class="week__day">
          <span class="week__idx">{{ i + 1 }}</span>
          <span class="week__name">{{ d.day }}</span>
          <span class="week__use">{{ d.use }}</span>
        </li>
      </ol>
    </section>

    <!-- FEIERTAGE -->
    <section class="kal__sec shell">
      <SectionHead v-reveal eyebrow="Staatliche Feiertage" title="Bestätigung der Ordnung"
        desc="Feiertage gelten nicht der Freude, sondern der Bestätigung der Ordnung." />
      <div class="holidays">
        <div v-for="h in holidays" :key="h.name" class="holiday" v-reveal>
          <span class="holiday__when">{{ h.when }}</span>
          <h3 class="holiday__name">{{ h.name }}</h3>
          <p class="holiday__text">{{ h.text }}</p>
        </div>
      </div>
    </section>

    <!-- NYXRUN -->
    <section class="kal__sec shell">
      <div class="nyx" v-reveal>
        <div class="nyx__sigil" aria-hidden="true">
          <span class="nyx__moon" />
          <span class="nyx__shadow" />
        </div>
        <div class="nyx__body">
          <p class="eyebrow nyx__eyebrow">Nyxrun · Tag des Schattendurchbruchs</p>
          <h3 class="nyx__title">Wenn der Gefangene Mond im Schatten steht</h3>
          <p class="nyx__text">
            Nyxrun ist kein eigener Tag, sondern ein seltenes kosmisches Ereignis — etwa alle 36 Jahre.
            Der Gefangene Mond Nyxun tritt kurz in den Schatten eines Zwillingsmondes.
          </p>
          <ul class="nyx__effects">
            <li>Magie wird instabil</li>
            <li>Träume sind intensiv und fremd</li>
            <li>Rituale entgleiten</li>
            <li>Geburten gelten als „berührt“</li>
          </ul>
          <p class="nyx__voices">
            Das Aurel erklärt Nyxrun für Aberglauben. Das Arkanum archiviert still.
            Der Ferran-Orden verstärkt die Überwachung.
          </p>
        </div>
      </div>
    </section>

    <!-- ZEITRECHNUNGEN -->
    <section class="kal__sec shell">
      <SectionHead v-reveal eyebrow="Zeitrechnungen" title="LZ und der verbotene Schleier" />
      <div class="eras" v-reveal>
        <div class="era">
          <span class="era__abbr">LZ</span>
          <h3 class="era__name">Luminoxische Zeit</h3>
          <p class="era__text">Seit Gründung des Luminar Paktes (0 LZ) aufwärts gezählt — je höher, desto jünger. Die einzig gültige Rechnung.</p>
        </div>
        <div class="era era--forbidden">
          <span class="era__abbr">ZS</span>
          <h3 class="era__name">Zeitrechnung des Schleiers</h3>
          <p class="era__text">In alten Schriften erhalten, größtenteils verboten. Sie zählt von 0 LZ abwärts — je höher, desto älter.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.kal__hero {
  text-align: center;
  padding: clamp(56px, 9vw, 110px) 22px clamp(30px, 5vw, 50px);
}
.kal__title {
  font-size: clamp(38px, 8vw, 76px);
  font-weight: 800;
  letter-spacing: 0.03em;
  line-height: 1.02;
  margin: 14px 0 0;
}
.kal__lead {
  font-family: var(--font-lore);
  font-style: italic;
  font-size: clamp(18px, 2.4vw, 22px);
  color: var(--muted);
  max-width: 560px;
  margin: 22px auto 0;
}
.kal__stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 14px 40px;
  margin: 36px 0 26px;
}
.kal__stat {
  display: grid;
  justify-items: center;
}
.kal__statNum {
  font-family: var(--font-display);
  font-size: clamp(30px, 6vw, 46px);
  font-weight: 800;
  color: var(--gold);
  line-height: 1;
}
.kal__statLbl {
  font-family: var(--font-data);
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--faint);
  margin-top: 6px;
}
.kal__whisper {
  font-family: var(--font-display);
  font-size: clamp(16px, 3vw, 22px);
  color: var(--muted);
  letter-spacing: 0.04em;
}

.kal__sec {
  padding: clamp(40px, 6vw, 72px) 22px;
}
.kal__toolsLoading {
  display: grid;
  place-items: center;
  gap: 16px;
  min-height: 260px;
  margin-top: 36px;
  p {
    font-family: var(--font-data);
    font-size: 12px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--faint);
  }
}

// ---------- Monate ----------
.months {
  margin-top: 40px;
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, 1fr);
  @include down(md) {
    grid-template-columns: 1fr;
  }
}
.month {
  @include panel;
  position: relative;
  padding: 24px 26px 26px;
  overflow: hidden;
  border-left: 2px solid color-mix(in srgb, var(--tone) 60%, transparent);
}
.month__glyph {
  position: absolute;
  top: 14px;
  right: 22px;
  font-family: var(--font-display);
  font-size: 54px;
  font-weight: 800;
  color: var(--hairline);
  opacity: 0.45;
  line-height: 1;
}
.month__head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}
.month__num {
  font-family: var(--font-data);
  font-size: 10.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--faint);
}
.month__name {
  font-size: 28px;
  font-weight: 600;
}
.month__fn {
  font-family: var(--font-lore);
  font-style: italic;
  font-size: 17px;
  color: color-mix(in srgb, var(--tone) 60%, var(--muted));
  margin-top: 2px;
}
.month__text {
  font-family: var(--font-lore);
  font-size: 16px;
  color: var(--muted);
  margin: 14px 0;
  max-width: 46ch;
}
.month__motto {
  font-family: var(--font-display);
  font-size: 15px;
  letter-spacing: 0.02em;
  color: var(--text);
}

// ---------- Jahreszeiten ----------
.seasons {
  margin-top: 40px;
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(4, 1fr);
  @include down(md) {
    grid-template-columns: repeat(2, 1fr);
  }
}
.season {
  @include panel;
  text-align: center;
  padding: 28px 18px;
}
.season__orb {
  display: block;
  width: 46px;
  height: 46px;
  margin: 0 auto 16px;
  border-radius: 999px;
  background: radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--tone) 90%, white), var(--tone));
  box-shadow: 0 0 26px color-mix(in srgb, var(--tone) 55%, transparent);
}
.season__name {
  font-size: 22px;
  font-weight: 600;
}
.season__months {
  font-family: var(--font-lore);
  font-size: 15px;
  color: var(--muted);
  margin-top: 4px;
}

// ---------- Woche ----------
.week {
  margin: 40px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 2px;
  @include panel;
  overflow: hidden;
}
.week__day {
  display: grid;
  grid-template-columns: 44px 130px 1fr;
  align-items: center;
  gap: 16px;
  padding: 16px 22px;
  border-bottom: 1px solid var(--border-soft);
  &:last-child {
    border-bottom: 0;
  }
  @include down(sm) {
    grid-template-columns: 34px 1fr;
    grid-template-areas: 'idx name' 'idx use';
    gap: 2px 14px;
  }
}
.week__idx {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  color: var(--gold);
  @include down(sm) {
    grid-area: idx;
    align-self: center;
  }
}
.week__name {
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 600;
  @include down(sm) {
    grid-area: name;
  }
}
.week__use {
  font-family: var(--font-lore);
  font-size: 16px;
  color: var(--muted);
  @include down(sm) {
    grid-area: use;
  }
}

// ---------- Feiertage ----------
.holidays {
  margin-top: 40px;
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, 1fr);
  @include down(md) {
    grid-template-columns: 1fr;
  }
}
.holiday {
  @include panel;
  padding: 22px 24px;
}
.holiday__when {
  font-family: var(--font-data);
  font-size: 10.5px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gold);
}
.holiday__name {
  font-size: 23px;
  font-weight: 600;
  margin: 8px 0 6px;
}
.holiday__text {
  font-family: var(--font-lore);
  font-size: 16px;
  color: var(--muted);
}

// ---------- Nyxrun ----------
.nyx {
  @include panel;
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 30px;
  padding: 38px;
  align-items: center;
  background:
    radial-gradient(120% 120% at 12% 20%, rgba(var(--celest-raw), 0.1), transparent 55%),
    linear-gradient(180deg, var(--surface-2), var(--surface));
  @include down(md) {
    grid-template-columns: 1fr;
    text-align: center;
    padding: 30px 24px;
  }
}
.nyx__sigil {
  position: relative;
  width: 130px;
  height: 130px;
  margin: 0 auto;
}
.nyx__moon {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: radial-gradient(circle at 38% 32%, #e9ecf5, #aeb6c8 70%);
  box-shadow: 0 0 40px rgba(var(--celest-raw), 0.4);
}
.nyx__shadow {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: radial-gradient(circle at 70% 60%, rgba(8, 10, 16, 0.92) 40%, transparent 72%);
}
.nyx__eyebrow {
  margin-bottom: 12px;
}
.nyx__title {
  font-size: clamp(22px, 3.4vw, 30px);
  font-weight: 600;
}
.nyx__text {
  font-family: var(--font-lore);
  font-size: 17px;
  color: var(--muted);
  margin: 12px 0 16px;
}
.nyx__effects {
  margin: 0 0 16px;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  @include down(md) {
    justify-content: center;
  }
  li {
    font-family: var(--font-data);
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid var(--border);
    color: var(--muted);
  }
}
.nyx__voices {
  font-family: var(--font-lore);
  font-style: italic;
  font-size: 16px;
  color: var(--faint);
}

// ---------- Zeitrechnungen ----------
.eras {
  margin-top: 36px;
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, 1fr);
  @include down(md) {
    grid-template-columns: 1fr;
  }
}
.era {
  @include panel;
  padding: 26px 28px;
  &--forbidden {
    border-style: dashed;
    opacity: 0.9;
    .era__abbr {
      color: #d4646e;
    }
  }
}
.era__abbr {
  font-family: var(--font-display);
  font-size: 40px;
  font-weight: 800;
  color: var(--gold);
  letter-spacing: 0.05em;
}
.era__name {
  font-size: 22px;
  font-weight: 600;
  margin: 4px 0 8px;
}
.era__text {
  font-family: var(--font-lore);
  font-size: 16px;
  color: var(--muted);
}
</style>
