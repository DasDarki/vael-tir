<script setup lang="ts">
import type { Page } from "@/pages/index.vue";

const props = defineProps<{
  page: Page;
  parentKey: string;
  open: Record<string, boolean>;
  keyOf: (p: Page, parentKey?: string) => string;
}>();

const emit = defineEmits<{
  (e: "toggle", key: string): void;
}>();

const nodeKey = () => props.keyOf(props.page, props.parentKey);
const hasChildren = () => !!props.page.children?.length;
</script>

<template>
  <section class="node">
    <div class="node__row">
      <button
        v-if="hasChildren()"
        class="node__chev"
        type="button"
        :aria-expanded="props.open[nodeKey()] ? 'true' : 'false'"
        :title="props.open[nodeKey()] ? 'Einklappen' : 'Ausklappen'"
        @click="emit('toggle', nodeKey())"
      >
        <span class="node__chevGlyph" :class="{ 'is-open': props.open[nodeKey()] }">›</span>
      </button>
      <span v-else class="node__chev node__chev--spacer" aria-hidden="true"></span>

      <router-link v-if="props.page.link" class="node__link" :to="props.page.link">
        <span class="node__name">{{ props.page.title }}</span>
        <span class="node__path">{{ props.page.link }}</span>
      </router-link>

      <div v-else class="node__label">
        <span class="node__name">{{ props.page.title }}</span>
        <span class="node__path node__path--muted">—</span>
      </div>
    </div>

    <transition name="fold">
      <div v-if="hasChildren() && props.open[nodeKey()]" class="node__children">
        <PageNode
          v-for="c in props.page.children"
          :key="props.keyOf(c, nodeKey())"
          :page="c"
          :parent-key="nodeKey()"
          :open="props.open"
          :key-of="props.keyOf"
          @toggle="emit('toggle', $event)"
        />
      </div>
    </transition>
  </section>
</template>

<style scoped lang="scss">
.node {
  --panel: rgba(255, 255, 255, 0.04);
  --border: rgba(255, 255, 255, 0.08);
  --text: rgba(255, 255, 255, 0.92);
  --muted: rgba(255, 255, 255, 0.64);
  --gold: rgba(229, 200, 120, 0.9);

  border: 1px solid var(--border);
  background: var(--panel);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.32);
}

.node__row {
  display: grid;
  grid-template-columns: 42px 1fr;
  align-items: stretch;
}

.node__chev {
  border: 0;
  border-right: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.02);
  display: grid;
  place-items: center;
  cursor: pointer;
  padding: 0;
  min-height: 54px;

  &:hover {
    background: rgba(229, 200, 120, 0.06);
  }
}

.node__chev--spacer {
  cursor: default;
}

.node__chevGlyph {
  display: inline-block;
  transform: rotate(0deg);
  transition: transform 160ms ease;
  color: var(--muted);
  font-size: 18px;
  line-height: 1;

  &.is-open {
    transform: rotate(90deg);
    color: var(--gold);
  }
}

.node__link,
.node__label {
  padding: 12px;
  min-width: 0;
  display: grid;
  align-content: center;
  gap: 4px;
}

.node__link {
  text-decoration: none;
  color: var(--text);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent);

  &:hover {
    background: linear-gradient(180deg, rgba(229, 200, 120, 0.08), rgba(255, 255, 255, 0.02));
  }
}

.node__name {
  font-weight: 650;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node__path {
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.node__path--muted {
  color: rgba(255, 255, 255, 0.35);
}

.node__children {
  border-top: 1px solid var(--border);
  padding: 10px 10px 12px;
  display: grid;
  gap: 10px;
  background: rgba(0, 0, 0, 0.12);
}

.fold-enter-active,
.fold-leave-active {
  transition: max-height 220ms ease, opacity 200ms ease, transform 220ms ease;
}
.fold-enter-from,
.fold-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-2px);
}
.fold-enter-to,
.fold-leave-from {
  max-height: 900px;
  opacity: 1;
  transform: translateY(0);
}
</style>
