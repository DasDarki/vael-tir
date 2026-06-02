<script setup lang="ts">
const { primary } = useSiteNav()
const route = useRoute()
const open = ref(false)

// Menü bei Routenwechsel schließen
watch(() => route.fullPath, () => (open.value = false))
</script>

<template>
  <header class="hdr">
    <div class="hdr__inner">
      <NuxtLink to="/" class="brand" aria-label="Vael Tir — Startseite">
        <BrandSigil :size="28" :glow="false" />
        <span class="brand__name">Vael&nbsp;Tir</span>
        <span class="brand__tag">· Atlas</span>
      </NuxtLink>

      <nav class="nav" aria-label="Hauptnavigation">
        <NuxtLink
          v-for="l in primary"
          :key="l.to"
          :to="l.to"
          class="nav__link"
          :target="l.external ? '_blank' : undefined"
          :rel="l.external ? 'noopener noreferrer' : undefined"
        >
          {{ l.label }}<span v-if="l.external" class="nav__ext" aria-hidden="true">↗</span>
        </NuxtLink>
      </nav>

      <div class="hdr__right">
        <ThemeToggle />
        <button
          class="burger"
          type="button"
          :aria-expanded="open"
          aria-label="Menü"
          @click="open = !open"
        >
          <span :class="{ x: open }" />
        </button>
      </div>
    </div>

    <Transition name="sheet">
      <nav v-if="open" class="sheet" aria-label="Mobile Navigation">
        <NuxtLink
          v-for="l in primary"
          :key="l.to"
          :to="l.to"
          class="sheet__link"
          :target="l.external ? '_blank' : undefined"
          :rel="l.external ? 'noopener noreferrer' : undefined"
        >
          <span class="sheet__glyph">{{ l.glyph }}</span>
          <span>
            <span class="sheet__label">{{ l.label }}<span v-if="l.external" aria-hidden="true"> ↗</span></span>
            <span class="sheet__desc">{{ l.desc }}</span>
          </span>
        </NuxtLink>
      </nav>
    </Transition>
  </header>
</template>

<style scoped lang="scss">
.hdr {
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(14px) saturate(1.1);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--bg) 80%, transparent),
    color-mix(in srgb, var(--bg) 32%, transparent)
  );
  border-bottom: 1px solid var(--border-soft);
}
.hdr__inner {
  max-width: var(--maxw);
  margin: 0 auto;
  min-height: var(--header-h);
  padding: 10px 22px;
  display: flex;
  align-items: center;
  gap: 18px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
  &:hover {
    color: var(--text);
  }
}
.brand__name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.brand__tag {
  font-family: var(--font-data);
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--faint);
  @include down(md) {
    display: none;
  }
}

.nav {
  display: flex;
  gap: 4px;
  margin-left: auto;
  @include down(lg) {
    display: none;
  }
}
.nav__link {
  font-family: var(--font-data);
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
  padding: 9px 13px;
  border-radius: $r-sm;
  transition:
    color 0.2s $ease,
    background 0.2s $ease;
  &:hover {
    color: var(--text);
    background: var(--surface);
  }
  &.router-link-active {
    color: var(--gold);
  }
}
.nav__ext {
  margin-left: 4px;
  font-size: 9px;
  vertical-align: super;
  color: var(--faint);
}

.hdr__right {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  @include up(lg) {
    margin-left: 0;
  }
}

.burger {
  --w: 20px;
  position: relative;
  width: 40px;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: $r-sm;
  background: var(--surface);
  cursor: pointer;
  display: none;
  @include down(lg) {
    display: grid;
    place-items: center;
  }
  span,
  span::before,
  span::after {
    content: '';
    position: absolute;
    width: var(--w);
    height: 1.6px;
    background: var(--text);
    border-radius: 2px;
    transition: transform 0.3s $ease, opacity 0.2s $ease;
  }
  span::before {
    transform: translateY(-6px);
  }
  span::after {
    transform: translateY(6px);
  }
  span.x {
    background: transparent;
    &::before {
      transform: rotate(45deg);
    }
    &::after {
      transform: rotate(-45deg);
    }
  }
}

.sheet {
  @include up(lg) {
    display: none;
  }
  border-top: 1px solid var(--border-soft);
  background: color-mix(in srgb, var(--bg) 94%, transparent);
  padding: 10px;
  display: grid;
  gap: 4px;
}
.sheet__link {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: $r-md;
  color: var(--text);
  &:hover {
    background: var(--surface);
    color: var(--text);
  }
  &.router-link-active .sheet__label {
    color: var(--gold);
  }
}
.sheet__glyph {
  font-family: var(--font-display);
  font-size: 22px;
  color: var(--gold);
  width: 26px;
  text-align: center;
}
.sheet__label {
  display: block;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 17px;
}
.sheet__desc {
  display: block;
  font-family: var(--font-lore);
  font-size: 14px;
  color: var(--muted);
}

.sheet-enter-active,
.sheet-leave-active {
  transition:
    opacity 0.25s $ease,
    transform 0.25s $ease;
  transform-origin: top;
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
  transform: scaleY(0.96) translateY(-6px);
}
</style>
