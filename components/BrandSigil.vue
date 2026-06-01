<script setup lang="ts">
// Das Luminoxische Siegel — Strahlen + konzentrische Ringe, Licht als Ordnung.
withDefaults(
  defineProps<{
    size?: number | string
    spin?: boolean
    glow?: boolean
  }>(),
  { size: 48, spin: false, glow: true },
)
</script>

<template>
  <svg
    viewBox="0 0 200 200"
    :width="size"
    :height="size"
    class="sigil"
    :class="{ 'sigil--glow': glow }"
    aria-hidden="true"
  >
    <g style="color: var(--gold)">
      <g :class="{ 'sigil--spin': spin }" stroke="currentColor">
        <g stroke-width="2" opacity="0.85">
          <line x1="100" y1="8" x2="100" y2="38" />
          <line x1="100" y1="162" x2="100" y2="192" />
          <line x1="8" y1="100" x2="38" y2="100" />
          <line x1="162" y1="100" x2="192" y2="100" />
        </g>
        <g stroke-width="1.4" opacity="0.55">
          <line x1="35" y1="35" x2="56" y2="56" />
          <line x1="165" y1="35" x2="144" y2="56" />
          <line x1="35" y1="165" x2="56" y2="144" />
          <line x1="165" y1="165" x2="144" y2="144" />
        </g>
      </g>
      <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" stroke-width="1.4" opacity="0.35" />
      <circle cx="100" cy="100" r="44" fill="none" stroke="currentColor" stroke-width="2" />
      <circle cx="100" cy="100" r="26" fill="none" stroke="currentColor" stroke-width="1.4" opacity="0.6" />
      <circle class="sigil__core" cx="100" cy="100" r="13" fill="currentColor" />
    </g>
  </svg>
</template>

<style scoped lang="scss">
.sigil {
  display: block;
}
.sigil--glow {
  filter: drop-shadow(0 0 22px rgba(var(--gold-raw), 0.35));
}
.sigil__core {
  transform-origin: center;
  animation: sigil-pulse 4.5s ease-in-out infinite;
}
.sigil--spin {
  transform-origin: center;
  animation: sigil-spin 90s linear infinite;
}
@keyframes sigil-pulse {
  0%,
  100% {
    opacity: 0.55;
  }
  50% {
    opacity: 1;
  }
}
@keyframes sigil-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
