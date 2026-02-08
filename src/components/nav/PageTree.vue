<script setup lang="ts">
import PageNode from "./PageNode.vue";
import type { Page } from "@/pages/index.vue";

const props = defineProps<{
  pages: Page[];
  open: Record<string, boolean>;
  keyOf: (p: Page, parentKey?: string) => string;
}>();

const emit = defineEmits<{
  (e: "toggle", key: string): void;
}>();
</script>

<template>
  <nav class="tree" aria-label="Seitenübersicht">
    <PageNode
      v-for="p in props.pages"
      :key="props.keyOf(p)"
      :page="p"
      :parent-key="''"
      :open="props.open"
      :key-of="props.keyOf"
      @toggle="emit('toggle', $event)"
    />
  </nav>
</template>

<style scoped lang="scss">
.tree {
  display: grid;
  gap: 10px;
  max-width: 980px;
  margin: 0 auto;
}
</style>
