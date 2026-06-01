<script setup lang="ts">
const colorMode = useColorMode()

const isDark = computed(() => colorMode.value !== 'light')

function toggle() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <button
    class="toggle"
    type="button"
    :aria-pressed="isDark"
    aria-label="Hell-/Dunkelmodus wechseln"
    title="Licht wechseln"
    @click="toggle"
  >
    <ClientOnly>
      <span class="toggle__thumb" :class="{ 'toggle__thumb--light': !isDark }" aria-hidden="true" />
      <template #fallback><span class="toggle__thumb" aria-hidden="true" /></template>
    </ClientOnly>
    <span class="toggle__opt toggle__opt--dark" :class="{ active: isDark }" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
        <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
      </svg>
    </span>
    <span class="toggle__opt toggle__opt--light" :class="{ active: !isDark }" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
        <circle cx="12" cy="12" r="4.5" />
        <path
          d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"
        />
      </svg>
    </span>
  </button>
</template>

<style scoped lang="scss">
.toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 999px;
  padding: 5px;
  cursor: pointer;
}
.toggle__opt {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 32px;
  height: 30px;
  border-radius: 999px;
  color: var(--faint);
  transition: color 0.3s $ease;

  svg {
    width: 16px;
    height: 16px;
  }
  &.active {
    color: var(--gold-ink);
  }
}
.toggle__thumb {
  position: absolute;
  z-index: 0;
  top: 5px;
  left: 5px;
  width: 32px;
  height: 30px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(var(--gold-raw), 0.95), rgba(var(--gold-raw), 0.7));
  box-shadow:
    0 4px 14px rgba(var(--gold-raw), 0.4),
    inset 0 0 0 1px rgba(255, 255, 255, 0.2);
  transition: transform 0.45s $ease;
  transform: translateX(0);

  &--light {
    transform: translateX(40px);
  }
}
</style>
