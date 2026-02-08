<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import router from "@/router";
import PageTree from "@/components/nav/PageTree.vue";

export interface Page {
  title: string;
  link?: string;
  children: Page[];
}

const pages = ref<Page[]>([]);
const query = ref("");
const open = ref<Record<string, boolean>>({});

const keyOf = (p: Page, parentKey = "") =>
  `${parentKey}/${p.title}${p.link ? `@${p.link}` : ""}`;

const toggle = (key: string) => {
  open.value[key] = !open.value[key];
};

const setAllExpanded = (value: boolean) => {
  const next: Record<string, boolean> = {};
  const walk = (list: Page[], parentKey = "") => {
    for (const p of list) {
      const k = keyOf(p, parentKey);
      if (p.children?.length) next[k] = value;
      walk(p.children || [], k);
    }
  };
  walk(pages.value);
  open.value = next;
};

onMounted(() => {
  const pageMap: Record<string, Page> = {};
  const routes = router.getRoutes();

  for (const route of routes) {
    if (!route.meta?.title) continue;

    const title = route.meta.title as string;

    const page =
      pageMap[title] ??
      (pageMap[title] = {
        title,
        link: route.path,
        children: [],
      });

    page.link = route.path;

    if (route.meta.parent) {
      const parentTitle = route.meta.parent as string;
      const parent =
        pageMap[parentTitle] ??
        (pageMap[parentTitle] = { title: parentTitle, children: [] });
      parent.children.push(page);
    } else {
      pages.value.push(page);
    }
  }

  setAllExpanded(true);
});

const matches = (p: Page, q: string): boolean => {
  const qq = q.trim().toLowerCase();
  if (!qq) return true;
  if (p.title.toLowerCase().includes(qq)) return true;
  return (p.children || []).some((c) => matches(c, qq));
};

const filterTree = (list: Page[], q: string): Page[] => {
  const qq = q.trim();
  if (!qq) return list;

  const walk = (items: Page[]): Page[] =>
    items
      .filter((p) => matches(p, qq))
      .map((p) => ({
        ...p,
        children: walk(p.children || []),
      }));

  return walk(list);
};

const filteredPages = computed(() => filterTree(pages.value, query.value));

const ensureExpandedForSearch = () => {
  const qq = query.value.trim();
  if (!qq) return;

  const next = { ...open.value };
  const walk = (items: Page[], parentKey = "") => {
    for (const p of items) {
      const k = keyOf(p, parentKey);
      if (p.children?.length && matches(p, qq)) next[k] = true;
      walk(p.children || [], k);
    }
  };
  walk(pages.value);
  open.value = next;
};
</script>

<template>
  <div class="vt">
    <header class="vt__header">
      <div class="vt__brand">
        <div class="vt__sigil" aria-hidden="true">
          <span class="vt__sigilDot" />
        </div>
        <div class="vt__titles">
          <h1 class="vt__title">Vael Tir</h1>
          <p class="vt__subtitle">Atlas • Routenverzeichnis</p>
        </div>
      </div>

      <div class="vt__controls">
        <label class="vt__search">
          <span class="vt__searchIcon" aria-hidden="true">⌕</span>
          <input
            v-model="query"
            @input="ensureExpandedForSearch"
            type="search"
            placeholder="Suchen…"
            autocomplete="off"
          />
          <button
            v-if="query"
            class="vt__clear"
            type="button"
            @click="
              query = '';
              setAllExpanded(false);
            "
            aria-label="Suche leeren"
            title="Leeren"
          >
            ×
          </button>
        </label>

        <div class="vt__actions">
          <button class="vt__btn" type="button" @click="setAllExpanded(true)">
            Alles öffnen
          </button>
          <button class="vt__btn" type="button" @click="setAllExpanded(false)">
            Alles schließen
          </button>
        </div>
      </div>
    </header>

    <main class="vt__main">
      <div v-if="!filteredPages.length" class="vt__empty">
        <p class="vt__emptyTitle">Keine Treffer.</p>
        <p class="vt__emptyHint">Versuch einen anderen Begriff.</p>
      </div>

      <PageTree
        v-else
        :pages="filteredPages"
        :open="open"
        :key-of="keyOf"
        @toggle="toggle"
      />
    </main>

    <footer class="vt__footer">
      <span class="vt__footerText">Im Licht liegt die Ordnung.</span>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.vt {
  --bg: #0a0c10;
  --panel: rgba(255, 255, 255, 0.04);
  --border: rgba(255, 255, 255, 0.08);
  --text: rgba(255, 255, 255, 0.92);
  --muted: rgba(255, 255, 255, 0.64);
  --faint: rgba(255, 255, 255, 0.42);
  --gold: rgba(229, 200, 120, 0.9);
  --glow: rgba(229, 200, 120, 0.22);

  min-height: 100dvh;
  background: radial-gradient(900px 500px at 20% -10%, rgba(229, 200, 120, 0.12), transparent 60%),
  radial-gradient(700px 450px at 90% 0%, rgba(120, 170, 255, 0.08), transparent 55%),
  linear-gradient(180deg, #07090d, var(--bg));
  color: var(--text);
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.vt__header {
  padding: 18px 16px 12px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent);

  @media (min-width: 900px) {
    padding: 22px 22px 14px;
  }
}

.vt__brand {
  display: flex;
  gap: 12px;
  align-items: center;
}

.vt__sigil {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: radial-gradient(circle at 40% 30%, rgba(255, 255, 255, 0.09), transparent 60%),
  linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  display: grid;
  place-items: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0, 0, 0, 0.4) inset;
}

.vt__sigilDot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--gold);
  box-shadow: 0 0 0 6px var(--glow), 0 0 22px rgba(229, 200, 120, 0.35);
}

.vt__titles {
  min-width: 0;
}
.vt__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}
.vt__subtitle {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--muted);
}

.vt__controls {
  margin-top: 14px;
  display: grid;
  gap: 10px;

  @media (min-width: 700px) {
    grid-template-columns: 1fr auto;
    align-items: center;
  }
}

.vt__search {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 10px 12px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
}
.vt__searchIcon {
  color: var(--faint);
  font-size: 14px;
  user-select: none;
}
.vt__search input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
  font-size: 14px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
}
.vt__clear {
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 18px;
  line-height: 1;
  padding: 0 6px;
  cursor: pointer;
  &:hover {
    color: var(--text);
  }
}

.vt__actions {
  display: flex;
  gap: 10px;
  justify-content: flex-start;
  @media (min-width: 700px) {
    justify-content: flex-end;
  }
}

.vt__btn {
  border: 1px solid var(--border);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.03));
  color: var(--text);
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 13px;
  cursor: pointer;
  transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;

  &:hover {
    border-color: rgba(229, 200, 120, 0.35);
    background: linear-gradient(180deg, rgba(229, 200, 120, 0.10), rgba(255, 255, 255, 0.03));
  }
  &:active {
    transform: translateY(1px);
  }
}

.vt__main {
  padding: 14px 12px 22px;
  @media (min-width: 900px) {
    padding: 16px 22px 26px;
  }
}

.vt__empty {
  max-width: 720px;
  margin: 28px auto 0;
  padding: 18px;
  border-radius: 16px;
  border: 1px dashed var(--border);
  background: rgba(0, 0, 0, 0.18);
}
.vt__emptyTitle {
  margin: 0;
  font-weight: 650;
}
.vt__emptyHint {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.vt__footer {
  padding: 12px 16px 16px;
  border-top: 1px solid var(--border);
  color: rgba(255, 255, 255, 0.55);
  text-align: center;
}
.vt__footerText {
  font-size: 12px;
}
</style>
