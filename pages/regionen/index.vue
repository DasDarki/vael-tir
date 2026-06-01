<script setup lang="ts">
import { realms } from '~/data/realms'

definePageMeta({ title: 'Regionen' })

useSeoMeta({
  title: 'Die Reiche Vael Tirs',
  ogTitle: 'Regionen · Vael Tir',
  description:
    'Calythar, Esh’Raen und Varkuun — die drei großen Reiche Vael Tirs im Überblick.',
})
</script>

<template>
  <div class="reg shell">
    <header class="reg__head" v-reveal>
      <p class="eyebrow">Die Reiche</p>
      <h1 class="reg__title">Drei Lande, ein Licht</h1>
      <p class="reg__lead">
        Vom geordneten Calythar über die alten Lehren Esh’Raens bis zu den brennenden Marken
        Varkuuns. Wähle ein Reich, um tiefer einzutreten.
      </p>
    </header>

    <div class="reg__grid">
      <NuxtLink
        v-for="(r, i) in realms"
        :key="r.slug"
        :to="`/regionen/${r.slug}`"
        class="realm"
        :style="{ '--tone': r.tone }"
        v-reveal="i * 80"
      >
        <div class="realm__band" aria-hidden="true" />
        <div class="realm__body">
          <span class="realm__kind">{{ r.kind }}</span>
          <h2 class="realm__name">{{ r.name }}</h2>
          <p class="realm__lead">{{ r.lead }}</p>
          <span class="realm__go">Eintreten →</span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped lang="scss">
.reg {
  padding-block: clamp(48px, 8vw, 90px);
}
.reg__head {
  text-align: center;
  max-width: 620px;
  margin: 0 auto 44px;
}
.reg__title {
  font-size: clamp(34px, 7vw, 60px);
  font-weight: 800;
  letter-spacing: 0.02em;
  margin-top: 12px;
}
.reg__lead {
  font-family: var(--font-lore);
  font-size: 19px;
  color: var(--muted);
  margin-top: 16px;
}
.reg__grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(3, 1fr);
  @include down(md) {
    grid-template-columns: 1fr;
  }
}
.realm {
  @include panel;
  overflow: hidden;
  color: var(--text);
  transition: transform 0.35s $ease, border-color 0.35s $ease;
  &:hover {
    color: var(--text);
    transform: translateY(-5px);
    border-color: color-mix(in srgb, var(--tone) 50%, var(--border));
    .realm__go {
      color: var(--tone);
      transform: translateX(3px);
    }
  }
}
.realm__band {
  height: 110px;
  background:
    radial-gradient(120% 160% at 80% -30%, color-mix(in srgb, var(--tone) 55%, transparent), transparent 60%),
    linear-gradient(135deg, color-mix(in srgb, var(--tone) 30%, var(--surface-inset)), var(--surface-inset));
  border-bottom: 1px solid var(--border-soft);
}
.realm__body {
  padding: 20px 24px 26px;
}
.realm__kind {
  font-family: var(--font-data);
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--tone) 70%, var(--muted));
}
.realm__name {
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: 600;
  margin: 6px 0 8px;
}
.realm__lead {
  font-family: var(--font-lore);
  font-size: 16px;
  color: var(--muted);
}
.realm__go {
  display: inline-block;
  margin-top: 16px;
  font-family: var(--font-data);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--faint);
  transition: color 0.25s $ease, transform 0.25s $ease;
}
</style>
