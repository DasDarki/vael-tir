<script setup lang="ts">
definePageMeta({
  title: 'Weltkarte',
  layout: 'fullscreen',
})

useSeoMeta({
  title: 'Weltkarte',
  ogTitle: 'Weltkarte · Vael Tir',
  description:
    'Die interaktive Weltkarte Vael Tirs — zoome durch Regionen und Orte, miss Entfernungen und teile Ansichten.',
})
</script>

<template>
  <ClientOnly>
    <WorldMap />
    <template #fallback>
      <div class="map-loading">
        <BrandSigil :size="64" spin />
        <p class="map-loading__text">Die Karte wird entfaltet …</p>
      </div>
    </template>
  </ClientOnly>
</template>

<style scoped lang="scss">
.map-loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 18px;
  background: #0a0c10;
}
.map-loading__text {
  font-family: var(--font-data);
  font-size: 12px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--faint);
}
</style>
