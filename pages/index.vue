<script setup lang="ts">
definePageMeta({ title: 'Atlas' })

useSeoMeta({
  title: 'Atlas des Luminoxischen Zeitalters',
  ogTitle: 'Vael Tir · Atlas des Luminoxischen Zeitalters',
  description:
    'Eine geordnete Welt im Licht. Weltkarte, Kompendium der Flora & Fauna, der luminoxische Kalender und Werkzeuge für den Spieltisch.',
})

interface Tile {
  to: string
  glyph: string
  name: string
  desc: string
  tone: string
  featured?: boolean
}

const tiles: Tile[] = [
  { to: '/karte', glyph: '◎', name: 'Weltkarte', desc: 'Orte, Regionen und Wege Vael Tirs — zoombar bis ins Detail.', tone: '#60a5fa', featured: true },
  { to: '/kompendium', glyph: '❧', name: 'Kompendium', desc: 'Flora & Fauna der bekannten Lande.', tone: '#34d399' },
  { to: '/kalender', glyph: '☉', name: 'Kalender', desc: 'Zehn Monate, 360 Tage.', tone: '#e8cd82' },
  { to: '/uebersetzer', glyph: '✶', name: 'Übersetzer', desc: 'Deutsch ↔ Aelthîr & Vethran.', tone: '#5ec8c8' },
  { to: '/regionen', glyph: '⛬', name: 'Regionen', desc: 'Calythar · Esh’Raen · Varkuun.', tone: '#a78bfa' },
  { to: '/werkzeuge/muenzteiler', glyph: '⚖', name: 'Werkzeuge', desc: 'Münzteiler & Spieltisch-Hilfen.', tone: '#f59e0b' },
]
</script>

<template>
  <div class="home shell">
    <!-- HERO -->
    <section class="hero">
      <BrandSigil :size="104" spin class="hero__sigil" />
      <p class="eyebrow hero__eyebrow">Anno Lux · Luminoxisches Zeitalter</p>
      <h1 class="hero__title">Vael&nbsp;Tir</h1>
      <p class="hero__lead">
        Eine Welt, die das Licht zur Ordnung erhob. Karten, Chroniken und das Wissen der
        bekannten Lande.
      </p>
    </section>

    <!-- KACHELN -->
    <section class="tiles">
      <NuxtLink
        v-for="(t, i) in tiles"
        :key="t.to"
        :to="t.to"
        class="tile"
        :class="{ 'tile--featured': t.featured }"
        :style="{ '--tone': t.tone }"
        v-reveal="i * 70"
      >
        <span class="tile__glyph">{{ t.glyph }}</span>
        <span class="tile__name">{{ t.name }}</span>
        <span class="tile__desc">{{ t.desc }}</span>
        <span class="tile__go" aria-hidden="true">→</span>
      </NuxtLink>
    </section>

    <p class="home__whisper">Im Licht liegt die Ordnung.</p>
  </div>
</template>

<style scoped lang="scss">
.home {
  padding-block: clamp(48px, 9vw, 110px) clamp(40px, 7vw, 80px);
}

// ---------- HERO ----------
.hero {
  text-align: center;
  margin-bottom: clamp(40px, 6vw, 64px);
}
.hero__sigil {
  margin: 0 auto 26px;
  animation: rise 0.9s $ease both;
}
.hero__eyebrow {
  animation: rise 0.9s $ease 0.1s both;
}
.hero__title {
  font-size: clamp(54px, 15vw, 132px);
  font-weight: 800;
  letter-spacing: 0.04em;
  line-height: 0.94;
  margin: 12px 0 0;
  background: linear-gradient(180deg, var(--text), color-mix(in srgb, var(--text) 66%, var(--gold)));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: rise 0.9s $ease 0.18s both;
}
.hero__lead {
  font-family: var(--font-lore);
  font-style: italic;
  font-size: clamp(18px, 2.5vw, 22px);
  color: var(--muted);
  max-width: 540px;
  margin: 20px auto 0;
  animation: rise 0.9s $ease 0.32s both;
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(26px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

// ---------- KACHELN ----------
.tiles {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(4, 1fr);
  @include down(lg) {
    grid-template-columns: repeat(2, 1fr);
  }
  @include down(sm) {
    grid-template-columns: 1fr;
  }
}
.tile {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 170px;
  padding: 24px;
  border-radius: $r-lg;
  border: 1px solid var(--border);
  color: var(--text);
  overflow: hidden;
  isolation: isolate;
  background:
    radial-gradient(130% 120% at 100% 0%, color-mix(in srgb, var(--tone) 38%, transparent), transparent 58%),
    linear-gradient(150deg, color-mix(in srgb, var(--tone) 16%, var(--surface-2)), var(--surface));
  box-shadow: var(--shadow);
  transition:
    transform 0.35s $ease,
    border-color 0.35s $ease,
    box-shadow 0.35s $ease;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: radial-gradient(80% 90% at 100% 0%, color-mix(in srgb, var(--tone) 30%, transparent), transparent 60%);
    opacity: 0;
    transition: opacity 0.35s $ease;
  }
  &:hover {
    color: var(--text);
    transform: translateY(-5px);
    border-color: color-mix(in srgb, var(--tone) 55%, var(--border));
    box-shadow: 0 30px 70px rgba(0, 0, 0, 0.4);
    &::after {
      opacity: 1;
    }
    .tile__go {
      transform: translateX(4px);
      color: var(--tone);
    }
  }
}
.tile--featured {
  grid-column: 1 / -1;
  min-height: 220px;
  justify-content: flex-end;
  padding: 30px;
  .tile__glyph {
    position: absolute;
    top: 22px;
    left: 30px;
    font-size: 60px;
  }
  .tile__name {
    font-size: 34px;
  }
  .tile__desc {
    max-width: 42ch;
    font-size: 17px;
  }
}
.tile__glyph {
  font-family: var(--font-display);
  font-size: 34px;
  line-height: 1;
  color: color-mix(in srgb, var(--tone) 72%, var(--text));
}
.tile__name {
  font-family: var(--font-display);
  font-size: 23px;
  font-weight: 600;
}
.tile__desc {
  font-family: var(--font-lore);
  font-size: 15.5px;
  color: var(--muted);
  flex: 1;
}
.tile__go {
  font-family: var(--font-data);
  font-size: 18px;
  color: var(--faint);
  transition:
    transform 0.3s $ease,
    color 0.3s $ease;
}
.tile--featured .tile__go {
  position: absolute;
  top: 30px;
  right: 30px;
}

// ---------- Abschluss ----------
.home__whisper {
  margin-top: clamp(40px, 6vw, 70px);
  text-align: center;
  font-family: var(--font-display);
  font-size: clamp(16px, 3vw, 22px);
  letter-spacing: 0.04em;
  color: var(--muted);
}
</style>
