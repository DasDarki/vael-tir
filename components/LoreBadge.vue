<script setup lang="ts">
withDefaults(
  defineProps<{
    color?: string
    dot?: boolean
  }>(),
  { color: 'var(--gold)', dot: true },
)
</script>

<template>
  <span class="badge" :style="{ '--bdg': color }">
    <span v-if="dot" class="badge__dot" />
    <slot />
  </span>
</template>

<style scoped lang="scss">
.badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-family: var(--font-data);
  font-size: 10.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 6px 11px 6px 9px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--bdg) 45%, transparent);
  color: color-mix(in srgb, var(--bdg) 78%, var(--text));
  background: color-mix(in srgb, var(--bdg) 12%, transparent);
  white-space: nowrap;
}
.badge__dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--bdg);
  box-shadow: 0 0 8px color-mix(in srgb, var(--bdg) 70%, transparent);
}
</style>
