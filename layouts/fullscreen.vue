<template>
  <div class="full">
    <NuxtLink to="/" class="full__home" aria-label="Zurück zur Startseite" title="Vael Tir">
      <BrandSigil :size="22" :glow="false" />
    </NuxtLink>
    <slot />
  </div>
</template>

<style scoped lang="scss">
.full {
  position: relative;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
}
.full__home {
  position: absolute;
  bottom: 14px;
  left: 14px;
  z-index: 40;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg) 70%, transparent);
  backdrop-filter: blur(10px);
  transition: border-color 0.2s $ease, transform 0.2s $ease;
  &:hover {
    border-color: var(--hairline);
    transform: scale(1.05);
  }
}
</style>
