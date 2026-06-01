<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title: string
  desc?: string
  center?: boolean
}>()
</script>

<template>
  <div class="sh" :class="{ 'sh--center': center }">
    <p v-if="eyebrow" class="eyebrow sh__eyebrow">{{ eyebrow }}</p>
    <h2 class="sh__title">{{ title }}</h2>
    <p v-if="desc" class="sh__desc">
      <slot name="desc">{{ desc }}</slot>
    </p>
    <slot />
  </div>
</template>

<style scoped lang="scss">
.sh {
  max-width: 660px;
  &--center {
    margin-inline: auto;
    text-align: center;
  }
}
.sh__eyebrow {
  margin-bottom: 14px;
}
.sh__title {
  font-size: clamp(28px, 5vw, 46px);
  font-weight: 700;
  letter-spacing: 0.01em;
}
.sh__desc {
  font-family: var(--font-lore);
  font-size: 19px;
  color: var(--muted);
  margin-top: 14px;
}
</style>
