<script setup lang="ts">
import { realms, findRealm } from '~/data/realms'

const route = useRoute()
const realm = computed(() => findRealm(String(route.params.slug)))

// Unbekannter Slug → 404
if (!realm.value) {
  throw createError({ statusCode: 404, statusMessage: 'Unbekanntes Reich', fatal: true })
}

// Reaktiv halten, damit Client-Navigation zwischen Reichen aktualisiert.
const r = computed(() => realm.value!)

definePageMeta({ title: 'Reich' })

useSeoMeta({
  title: () => r.value.name,
  ogTitle: () => `${r.value.name} · Vael Tir`,
  description: () => r.value.lead,
})
</script>

<template>
  <article v-if="realm" class="realm" :style="{ '--tone': r.tone }">
    <header class="realm__hero">
      <div class="realm__heroGlow" aria-hidden="true" />
      <div class="shell realm__heroInner" v-reveal>
        <NuxtLink to="/regionen" class="realm__crumb">‹ Alle Reiche</NuxtLink>
        <p class="realm__kind">{{ r.kind }}</p>
        <h1 class="realm__name">{{ r.name }}</h1>
        <p class="realm__tagline">„{{ r.tagline }}“</p>
      </div>
    </header>

    <div class="shell realm__content">
      <p class="realm__lead" v-reveal>{{ r.lead }}</p>

      <div class="realm__prose" v-reveal>
        <p v-for="(para, i) in r.body" :key="i">{{ para }}</p>
      </div>

      <section v-if="r.regions.length" class="realm__regions" v-reveal>
        <h2 class="realm__regionsTitle">Bekannte Landstriche</h2>
        <div class="realm__chips">
          <LoreBadge v-for="name in r.regions" :key="name" :color="r.tone">{{ name }}</LoreBadge>
        </div>
      </section>

      <div class="realm__actions" v-reveal>
        <NuxtLink to="/karte" class="btn btn--primary">Auf der Karte ansehen</NuxtLink>
        <NuxtLink to="/kompendium" class="btn">Flora &amp; Fauna</NuxtLink>
      </div>

      <nav class="realm__siblings" v-reveal>
        <NuxtLink
          v-for="other in realms.filter((x) => x.slug !== r.slug)"
          :key="other.slug"
          :to="`/regionen/${other.slug}`"
          class="realm__sibling"
          :style="{ '--tone': other.tone }"
        >
          <span class="realm__siblingKind">{{ other.kind }}</span>
          <span class="realm__siblingName">{{ other.name }} →</span>
        </NuxtLink>
      </nav>
    </div>
  </article>
</template>

<style scoped lang="scss">
.realm__hero {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--border-soft);
}
.realm__heroGlow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(800px 360px at 70% -30%, color-mix(in srgb, var(--tone) 40%, transparent), transparent 60%),
    linear-gradient(180deg, color-mix(in srgb, var(--tone) 10%, transparent), transparent);
  pointer-events: none;
}
.realm__heroInner {
  position: relative;
  padding: clamp(40px, 7vw, 86px) 22px clamp(34px, 5vw, 60px);
}
.realm__crumb {
  font-family: var(--font-data);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  &:hover {
    color: var(--tone);
  }
}
.realm__kind {
  margin-top: 22px;
  font-family: var(--font-data);
  font-size: 11px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--tone) 70%, var(--muted));
}
.realm__name {
  font-size: clamp(48px, 12vw, 110px);
  font-weight: 800;
  letter-spacing: 0.03em;
  line-height: 0.96;
  margin: 8px 0 0;
  background: linear-gradient(180deg, var(--text), color-mix(in srgb, var(--text) 60%, var(--tone)));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.realm__tagline {
  font-family: var(--font-lore);
  font-style: italic;
  font-size: clamp(18px, 3vw, 24px);
  color: var(--muted);
  margin-top: 18px;
}

.realm__content {
  max-width: 760px;
  padding: clamp(40px, 6vw, 70px) 22px 0;
}
.realm__lead {
  font-family: var(--font-lore);
  font-size: clamp(20px, 2.6vw, 25px);
  line-height: 1.5;
  color: var(--text);
}
.realm__prose {
  margin-top: 28px;
  display: grid;
  gap: 18px;
  p {
    font-family: var(--font-lore);
    font-size: 18px;
    color: var(--muted);
  }
}

.realm__regions {
  margin-top: 44px;
}
.realm__regionsTitle {
  @include eyebrow;
  margin-bottom: 16px;
}
.realm__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.realm__actions {
  margin-top: 44px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}
.btn {
  font-family: var(--font-data);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 14px 24px;
  border-radius: $r-sm;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  transition: transform 0.12s $ease, border-color 0.25s $ease, background 0.25s $ease;
  &:hover {
    color: var(--text);
    border-color: var(--hairline);
    background: color-mix(in srgb, var(--gold) 12%, var(--surface-2));
  }
  &:active {
    transform: translateY(1px);
  }
  &--primary {
    background: linear-gradient(180deg, var(--tone), color-mix(in srgb, var(--tone) 75%, #000));
    color: #0a0c10;
    border-color: transparent;
    font-weight: 600;
    &:hover {
      color: #0a0c10;
    }
  }
}

.realm__siblings {
  margin-top: 60px;
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr 1fr;
  @include down(sm) {
    grid-template-columns: 1fr;
  }
}
.realm__sibling {
  @include panel;
  padding: 18px 22px;
  color: var(--text);
  &:hover {
    color: var(--text);
    border-color: color-mix(in srgb, var(--tone) 50%, var(--border));
  }
}
.realm__siblingKind {
  display: block;
  font-family: var(--font-data);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--tone) 70%, var(--muted));
}
.realm__siblingName {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 600;
}
</style>
