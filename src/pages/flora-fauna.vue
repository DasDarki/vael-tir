<script setup lang="ts">
import { computed, ref } from "vue";
import {
  floraFauna,
  enrichedEntries,
  SEASONS,
  MONTHS,
  MONTH_SEASON,
  type EnrichedEntry,
  type Season,
  type Month,
} from "@/data/flora-fauna";

definePage({
  meta: {
    title: "Flora & Fauna",
  },
});

const { meta } = floraFauna;
const entries = enrichedEntries;

type ActivityMode = "all" | "bloom" | "harvest";

const query = ref("");
const selectedCategories = ref<Set<string>>(new Set());
const selectedTypes = ref<Set<string>>(new Set());
const selectedContinents = ref<Set<string>>(new Set());
const selectedRegions = ref<Set<string>>(new Set());
const selectedLocations = ref<Set<string>>(new Set());
const selectedDanger = ref<Set<number>>(new Set());
const selectedSeasons = ref<Set<Season>>(new Set());
const selectedMonths = ref<Set<Month>>(new Set());
const activityMode = ref<ActivityMode>("all");
const expanded = ref<Set<string>>(new Set());
const filtersOpen = ref(false);

const toggle = <T,>(set: Set<T>, value: T) => {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
};

const toggleCategory = (v: string) => (selectedCategories.value = toggle(selectedCategories.value, v));
const toggleType = (v: string) => (selectedTypes.value = toggle(selectedTypes.value, v));
const toggleContinent = (v: string) => (selectedContinents.value = toggle(selectedContinents.value, v));
const toggleRegion = (v: string) => (selectedRegions.value = toggle(selectedRegions.value, v));
const toggleLocation = (v: string) => (selectedLocations.value = toggle(selectedLocations.value, v));
const toggleDanger = (v: number) => (selectedDanger.value = toggle(selectedDanger.value, v));
const toggleSeason = (v: Season) => (selectedSeasons.value = toggle(selectedSeasons.value, v));
const toggleMonth = (v: Month) => (selectedMonths.value = toggle(selectedMonths.value, v));

const toggleExpanded = (key: string) => (expanded.value = toggle(expanded.value, key));

const clearAll = () => {
  selectedCategories.value = new Set();
  selectedTypes.value = new Set();
  selectedContinents.value = new Set();
  selectedRegions.value = new Set();
  selectedLocations.value = new Set();
  selectedDanger.value = new Set();
  selectedSeasons.value = new Set();
  selectedMonths.value = new Set();
  activityMode.value = "all";
  query.value = "";
};

const activeFilterCount = computed(
  () =>
    selectedCategories.value.size +
    selectedTypes.value.size +
    selectedContinents.value.size +
    selectedRegions.value.size +
    selectedLocations.value.size +
    selectedDanger.value.size +
    selectedSeasons.value.size +
    selectedMonths.value.size +
    (activityMode.value === "all" ? 0 : 1)
);

const ACTIVITY_MODES: { value: ActivityMode; label: string }[] = [
  { value: "all", label: "Beides" },
  { value: "bloom", label: "Nur Blüte" },
  { value: "harvest", label: "Nur Ernte" },
];

// Region options depend on selected continents
const visibleContinents = computed(() => {
  if (selectedContinents.value.size === 0) return meta.geography;
  return meta.geography.filter((c) => selectedContinents.value.has(c.continent));
});

const visibleRegions = computed(() =>
  visibleContinents.value.flatMap((c) => c.regions.map((r) => r.name))
);

// Location options depend on selected regions (or fall back to all visible regions)
const visibleLocations = computed(() => {
  const regions = visibleContinents.value.flatMap((c) => c.regions);
  const filtered =
    selectedRegions.value.size === 0
      ? regions
      : regions.filter((r) => selectedRegions.value.has(r.name));
  return Array.from(new Set(filtered.flatMap((r) => r.locations)));
});

const typeOptions = computed(() => {
  if (selectedCategories.value.size === 0) {
    return [...meta.types.flora, ...meta.types.fauna];
  }
  const out: string[] = [];
  if (selectedCategories.value.has("flora")) out.push(...meta.types.flora);
  if (selectedCategories.value.has("fauna")) out.push(...meta.types.fauna);
  return out;
});

const typeLabel = (t: string) => meta.typeLabels[t] ?? t;

const matchesQuery = (e: EnrichedEntry, q: string) => {
  if (!q) return true;
  const needle = q.toLowerCase();
  const hay = [
    e.name,
    e.scientificName,
    e.habitat ?? "",
    e.appearance ?? "",
    e.notes ?? "",
    (e.effects ?? []).join(" "),
    (e.tags ?? []).join(" "),
    e.regions.join(" "),
    e.locations.join(" "),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
};

function activitySeasons(e: EnrichedEntry): Season[] {
  if (activityMode.value === "bloom") return e.bloomSeasons;
  if (activityMode.value === "harvest") return e.harvestSeasons;
  return Array.from(new Set([...e.bloomSeasons, ...e.harvestSeasons]));
}

function activityMonths(e: EnrichedEntry): Month[] {
  if (activityMode.value === "bloom") return e.bloomMonths;
  if (activityMode.value === "harvest") return e.harvestMonths;
  return Array.from(new Set([...e.bloomMonths, ...e.harvestMonths]));
}

const filtered = computed<EnrichedEntry[]>(() => {
  const q = query.value.trim();
  return entries.filter((e) => {
    if (selectedCategories.value.size && !selectedCategories.value.has(e.category)) return false;
    if (selectedTypes.value.size && !selectedTypes.value.has(e.type)) return false;
    if (selectedContinents.value.size && !e.continents.some((c) => selectedContinents.value.has(c)))
      return false;
    if (selectedRegions.value.size && !e.regions.some((r) => selectedRegions.value.has(r)))
      return false;
    if (selectedLocations.value.size && !e.locations.some((l) => selectedLocations.value.has(l)))
      return false;
    if (selectedDanger.value.size) {
      const d = e.dangerLevel ?? 0;
      if (!selectedDanger.value.has(d)) return false;
    }
    if (activityMode.value === "bloom" && !e.bloom) return false;
    if (activityMode.value === "harvest" && !e.harvest) return false;
    if (selectedSeasons.value.size) {
      const ss = activitySeasons(e);
      if (!ss.some((s) => selectedSeasons.value.has(s))) return false;
    }
    if (selectedMonths.value.size) {
      const ms = activityMonths(e);
      if (!ms.some((m) => selectedMonths.value.has(m))) return false;
    }
    return matchesQuery(e, q);
  });
});

const groupedByType = computed(() => {
  const map = new Map<string, EnrichedEntry[]>();
  for (const e of filtered.value) {
    if (!map.has(e.type)) map.set(e.type, []);
    map.get(e.type)!.push(e);
  }
  return Array.from(map.entries())
    .map(([type, items]) => ({
      type,
      label: typeLabel(type),
      items: items.sort((a, b) => a.name.localeCompare(b.name, "de")),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "de"));
});

const skulls = (n: number) => "☠".repeat(Math.max(0, Math.min(5, n)));

const keyOf = (e: EnrichedEntry) => `${e.type}:${e.name}`;

const monthSeason = (m: Month) => MONTH_SEASON[m];
const seasonsFor = (e: EnrichedEntry) =>
  Array.from(new Set([...e.bloomSeasons, ...e.harvestSeasons]));
const monthBloomState = (e: EnrichedEntry, m: Month) => ({
  bloom: e.bloomMonths.includes(m),
  harvest: e.harvestMonths.includes(m),
});
const hasAnyActivity = (e: EnrichedEntry) =>
  e.bloomMonths.length > 0 || e.harvestMonths.length > 0;
</script>

<template>
  <div class="ff">
    <header class="ff__header">
      <div class="ff__brand">
        <RouterLink to="/" class="ff__back" aria-label="Zurück zur Übersicht">‹</RouterLink>
        <div class="ff__titles">
          <h1 class="ff__title">Flora & Fauna</h1>
          <p class="ff__subtitle">
            Kompendium · {{ entries.length }} Einträge · {{ filtered.length }} sichtbar
          </p>
        </div>
      </div>

      <label class="ff__search">
        <span class="ff__searchIcon" aria-hidden="true">⌕</span>
        <input
          v-model="query"
          type="search"
          placeholder="Suchen… (Name, Wirkung, Ort, Tag)"
          autocomplete="off"
        />
        <button v-if="query" class="ff__clear" type="button" @click="query = ''">×</button>
      </label>

      <div class="ff__actions">
        <button
          class="ff__btn ff__btn--ghost ff__filtersToggle"
          type="button"
          @click="filtersOpen = !filtersOpen"
        >
          {{ filtersOpen ? "Filter schließen" : "Filter" }}
          <span v-if="activeFilterCount" class="ff__badge">{{ activeFilterCount }}</span>
        </button>
        <button
          v-if="activeFilterCount || query"
          class="ff__btn ff__btn--ghost"
          type="button"
          @click="clearAll"
        >
          Alle Filter zurücksetzen
        </button>
      </div>
    </header>

    <div class="ff__body">
      <aside class="ff__filters" :class="{ 'ff__filters--open': filtersOpen }">
        <section class="ff__group">
          <h3 class="ff__groupTitle">Kategorie</h3>
          <div class="ff__chips">
            <button
              v-for="c in ['flora', 'fauna']"
              :key="c"
              type="button"
              class="ff__chip"
              :class="{ 'ff__chip--active': selectedCategories.has(c) }"
              @click="toggleCategory(c)"
            >
              {{ c === "flora" ? "Flora" : "Fauna" }}
            </button>
          </div>
        </section>

        <section class="ff__group">
          <h3 class="ff__groupTitle">Art</h3>
          <div class="ff__chips">
            <button
              v-for="t in typeOptions"
              :key="t"
              type="button"
              class="ff__chip"
              :class="{ 'ff__chip--active': selectedTypes.has(t) }"
              @click="toggleType(t)"
            >
              {{ typeLabel(t) }}
            </button>
          </div>
        </section>

        <section class="ff__group">
          <h3 class="ff__groupTitle">Kontinent</h3>
          <div class="ff__chips">
            <button
              v-for="c in meta.geography"
              :key="c.continent"
              type="button"
              class="ff__chip"
              :class="{ 'ff__chip--active': selectedContinents.has(c.continent) }"
              @click="toggleContinent(c.continent)"
            >
              {{ c.continent }}
            </button>
          </div>
        </section>

        <section class="ff__group">
          <h3 class="ff__groupTitle">Region</h3>
          <div class="ff__chips">
            <button
              v-for="r in visibleRegions"
              :key="r"
              type="button"
              class="ff__chip ff__chip--sm"
              :class="{ 'ff__chip--active': selectedRegions.has(r) }"
              @click="toggleRegion(r)"
            >
              {{ r }}
            </button>
          </div>
        </section>

        <section class="ff__group">
          <h3 class="ff__groupTitle">Ort</h3>
          <div class="ff__chips">
            <button
              v-for="l in visibleLocations"
              :key="l"
              type="button"
              class="ff__chip ff__chip--sm"
              :class="{ 'ff__chip--active': selectedLocations.has(l) }"
              @click="toggleLocation(l)"
            >
              {{ l }}
            </button>
          </div>
        </section>

        <section class="ff__group">
          <h3 class="ff__groupTitle">Aktivität</h3>
          <div class="ff__chips">
            <button
              v-for="mode in ACTIVITY_MODES"
              :key="mode.value"
              type="button"
              class="ff__chip"
              :class="{ 'ff__chip--active': activityMode === mode.value }"
              @click="activityMode = mode.value"
            >
              {{ mode.label }}
            </button>
          </div>
        </section>

        <section class="ff__group">
          <h3 class="ff__groupTitle">Jahreszeit</h3>
          <div class="ff__chips">
            <button
              v-for="s in SEASONS"
              :key="s"
              type="button"
              class="ff__chip"
              :class="[
                { 'ff__chip--active': selectedSeasons.has(s) },
                `ff__chip--season-${s.toLowerCase()}`,
              ]"
              @click="toggleSeason(s)"
            >
              {{ s }}
            </button>
          </div>
        </section>

        <section class="ff__group">
          <h3 class="ff__groupTitle">Monat</h3>
          <div class="ff__chips">
            <button
              v-for="m in MONTHS"
              :key="m"
              type="button"
              class="ff__chip ff__chip--sm"
              :class="{ 'ff__chip--active': selectedMonths.has(m) }"
              :title="monthSeason(m)"
              @click="toggleMonth(m)"
            >
              {{ m }}
              <span class="ff__chipHint">{{ monthSeason(m) }}</span>
            </button>
          </div>
        </section>

        <section class="ff__group">
          <h3 class="ff__groupTitle">Gefahrenstufe</h3>
          <div class="ff__chips">
            <button
              v-for="n in [0, 2, 3, 4, 5]"
              :key="n"
              type="button"
              class="ff__chip"
              :class="{ 'ff__chip--active': selectedDanger.has(n) }"
              @click="toggleDanger(n)"
            >
              <span v-if="n === 0">Ungefährlich</span>
              <span v-else class="ff__skulls">{{ skulls(n) }}</span>
            </button>
          </div>
        </section>
      </aside>

      <main class="ff__results">
        <div v-if="!filtered.length" class="ff__empty">
          <p class="ff__emptyTitle">Keine Treffer.</p>
          <p class="ff__emptyHint">Lockere deine Filter oder versuche einen anderen Suchbegriff.</p>
        </div>

        <section v-for="group in groupedByType" :key="group.type" class="ff__section">
          <h2 class="ff__sectionTitle">
            {{ group.label }}
            <span class="ff__sectionCount">{{ group.items.length }}</span>
          </h2>

          <div class="ff__grid">
            <article
              v-for="entry in group.items"
              :key="keyOf(entry)"
              class="ff__card"
              :class="{ 'ff__card--open': expanded.has(keyOf(entry)) }"
              @click="toggleExpanded(keyOf(entry))"
            >
              <header class="ff__cardHead">
                <div class="ff__cardTitles">
                  <h3 class="ff__cardName">{{ entry.name }}</h3>
                  <p class="ff__cardSci">{{ entry.scientificName }}</p>
                </div>
                <div v-if="entry.dangerLevel" class="ff__danger" :title="`Gefahrenstufe ${entry.dangerLevel}`">
                  {{ skulls(entry.dangerLevel) }}
                </div>
              </header>

              <div class="ff__cardMeta">
                <span class="ff__tag ff__tag--type">{{ typeLabel(entry.type) }}</span>
                <span
                  v-for="c in entry.continents"
                  :key="c"
                  class="ff__tag ff__tag--continent"
                >{{ c }}</span>
                <span
                  v-for="s in seasonsFor(entry)"
                  :key="`season-${s}`"
                  class="ff__tag ff__tag--season"
                  :class="`ff__tag--season-${s.toLowerCase()}`"
                >{{ s }}</span>
                <span
                  v-for="t in entry.tags"
                  :key="t"
                  class="ff__tag"
                >{{ t }}</span>
              </div>

              <div v-if="expanded.has(keyOf(entry))" class="ff__cardBody" @click.stop>
                <dl class="ff__props">
                  <template v-if="entry.regions.length">
                    <dt>Regionen</dt>
                    <dd>{{ entry.regions.join(" · ") }}</dd>
                  </template>
                  <template v-if="entry.locations.length">
                    <dt>Orte</dt>
                    <dd class="ff__locs">
                      <span v-for="l in entry.locations" :key="l" class="ff__loc">{{ l }}</span>
                    </dd>
                  </template>
                  <template v-if="entry.habitat">
                    <dt>Habitat</dt>
                    <dd>{{ entry.habitat }}</dd>
                  </template>
                  <template v-if="entry.appearance">
                    <dt>Aussehen</dt>
                    <dd>{{ entry.appearance }}</dd>
                  </template>
                  <template v-if="entry.bloom">
                    <dt>Blüte</dt>
                    <dd>{{ entry.bloom }}</dd>
                  </template>
                  <template v-if="entry.harvest">
                    <dt>Ernte / Aktivität</dt>
                    <dd>{{ entry.harvest }}</dd>
                  </template>
                  <template v-if="entry.cost">
                    <dt>Kosten</dt>
                    <dd>{{ entry.cost }}</dd>
                  </template>
                </dl>

                <div v-if="hasAnyActivity(entry)" class="ff__calendar">
                  <div class="ff__calendarLegend">
                    <span class="ff__calendarDot ff__calendarDot--bloom"></span> Blüte
                    <span class="ff__calendarDot ff__calendarDot--harvest"></span> Ernte
                    <span
                      v-if="entry.bloomInferred || entry.harvestInferred"
                      class="ff__calendarLegendNote"
                    >
                      · gestrichelt = abgeleitet
                    </span>
                  </div>
                  <div class="ff__calendarStrip">
                    <div
                      v-for="m in MONTHS"
                      :key="m"
                      class="ff__calendarCell"
                      :class="{
                        'ff__calendarCell--bloom': monthBloomState(entry, m).bloom,
                        'ff__calendarCell--harvest': monthBloomState(entry, m).harvest,
                        'ff__calendarCell--both':
                          monthBloomState(entry, m).bloom && monthBloomState(entry, m).harvest,
                        'ff__calendarCell--inferred':
                          (monthBloomState(entry, m).bloom && entry.bloomInferred) ||
                          (monthBloomState(entry, m).harvest && entry.harvestInferred),
                      }"
                      :title="`${m} · ${monthSeason(m)}`"
                    >
                      <span class="ff__calendarMonth">{{ m }}</span>
                      <span class="ff__calendarSeason">{{ monthSeason(m) }}</span>
                    </div>
                  </div>
                </div>

                <div v-if="entry.effects?.length" class="ff__effects">
                  <h4>Wirkung & Verwendung</h4>
                  <ul>
                    <li v-for="(x, i) in entry.effects" :key="i">{{ x }}</li>
                  </ul>
                </div>

                <p v-if="entry.notes" class="ff__note">{{ entry.notes }}</p>
                <p v-if="entry.warning" class="ff__warn">⚠ {{ entry.warning }}</p>
              </div>

              <footer class="ff__cardFoot">
                <span class="ff__expandHint">
                  {{ expanded.has(keyOf(entry)) ? "Einklappen" : "Details ansehen" }}
                </span>
              </footer>
            </article>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.ff {
  --bg: #0a0c10;
  --panel: rgba(255, 255, 255, 0.04);
  --panel-2: rgba(255, 255, 255, 0.06);
  --border: rgba(255, 255, 255, 0.08);
  --border-2: rgba(255, 255, 255, 0.14);
  --text: rgba(255, 255, 255, 0.92);
  --muted: rgba(255, 255, 255, 0.64);
  --faint: rgba(255, 255, 255, 0.42);
  --gold: rgba(229, 200, 120, 0.9);
  --gold-2: rgba(229, 200, 120, 0.35);
  --glow: rgba(229, 200, 120, 0.22);
  --danger: rgba(240, 128, 128, 0.85);

  min-height: 100dvh;
  background:
    radial-gradient(900px 500px at 20% -10%, rgba(229, 200, 120, 0.12), transparent 60%),
    radial-gradient(700px 450px at 90% 0%, rgba(120, 170, 255, 0.08), transparent 55%),
    linear-gradient(180deg, #07090d, var(--bg));
  color: var(--text);
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  display: grid;
  grid-template-rows: auto 1fr;
}

.ff__header {
  padding: 18px 16px 14px;
  border-bottom: 1px solid var(--border);
  display: grid;
  gap: 12px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent);

  @media (min-width: 900px) {
    grid-template-columns: minmax(240px, auto) 1fr auto;
    align-items: center;
    padding: 22px 22px 16px;
    gap: 18px;
  }
}

.ff__brand {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
}

.ff__back {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid var(--border);
  color: var(--muted);
  text-decoration: none;
  font-size: 22px;
  line-height: 1;
  background: var(--panel);
  transition: border-color 120ms ease, color 120ms ease, background 120ms ease;

  &:hover {
    color: var(--text);
    border-color: var(--gold-2);
    background: rgba(229, 200, 120, 0.08);
  }
}

.ff__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.01em;
}
.ff__subtitle {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--muted);
}

.ff__search {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 10px 12px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);

  input {
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
}
.ff__searchIcon {
  color: var(--faint);
  font-size: 14px;
  user-select: none;
}
.ff__clear {
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 18px;
  padding: 0 6px;
  cursor: pointer;
  &:hover {
    color: var(--text);
  }
}

.ff__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-start;
  flex-wrap: wrap;
  @media (min-width: 900px) {
    justify-content: flex-end;
  }
}

.ff__btn {
  border: 1px solid var(--border);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.03));
  color: var(--text);
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 13px;
  cursor: pointer;
  transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &:hover {
    border-color: var(--gold-2);
    background: linear-gradient(180deg, rgba(229, 200, 120, 0.1), rgba(255, 255, 255, 0.03));
  }
  &:active {
    transform: translateY(1px);
  }
}

.ff__btn--ghost {
  background: transparent;
}

.ff__filtersToggle {
  @media (min-width: 1100px) {
    display: none;
  }
}

.ff__badge {
  display: grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  background: var(--gold);
  color: #111;
}

.ff__body {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding: 14px;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;

  @media (min-width: 1100px) {
    grid-template-columns: 280px 1fr;
    padding: 18px 22px 26px;
    gap: 22px;
  }
}

.ff__filters {
  display: none;
  gap: 14px;
  flex-direction: column;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.22);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
  align-self: flex-start;
  position: sticky;
  top: 16px;
  max-height: calc(100dvh - 32px);
  overflow-y: auto;

  @media (min-width: 1100px) {
    display: flex;
  }
}

.ff__filters--open {
  display: flex;
  position: static;
  max-height: none;
}

.ff__group {
  display: grid;
  gap: 8px;
}
.ff__groupTitle {
  margin: 0;
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--faint);
}

.ff__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ff__chip {
  border: 1px solid var(--border);
  background: var(--panel);
  color: var(--text);
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease, color 120ms ease;

  &:hover {
    border-color: var(--border-2);
    background: var(--panel-2);
  }
}
.ff__chip--sm {
  font-size: 11.5px;
  padding: 5px 9px;
}
.ff__chip--active {
  border-color: var(--gold-2);
  background: rgba(229, 200, 120, 0.14);
  color: var(--gold);
}
.ff__skulls {
  letter-spacing: 0.05em;
  color: var(--danger);
}

.ff__chipHint {
  display: block;
  font-size: 9.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--faint);
  margin-top: 1px;
}
.ff__chip--active .ff__chipHint {
  color: var(--gold-2);
}

.ff__chip--season-frühling {
  &.ff__chip--active {
    border-color: rgba(150, 220, 150, 0.45);
    background: rgba(150, 220, 150, 0.12);
    color: rgba(190, 240, 190, 0.95);
  }
}
.ff__chip--season-sommer {
  &.ff__chip--active {
    border-color: rgba(255, 210, 120, 0.5);
    background: rgba(255, 210, 120, 0.14);
    color: rgba(255, 225, 160, 0.95);
  }
}
.ff__chip--season-herbst {
  &.ff__chip--active {
    border-color: rgba(230, 150, 90, 0.5);
    background: rgba(230, 150, 90, 0.14);
    color: rgba(245, 180, 130, 0.95);
  }
}
.ff__chip--season-winter {
  &.ff__chip--active {
    border-color: rgba(160, 200, 245, 0.5);
    background: rgba(160, 200, 245, 0.12);
    color: rgba(200, 225, 255, 0.95);
  }
}

.ff__results {
  display: grid;
  gap: 22px;
  min-width: 0;
}

.ff__empty {
  padding: 18px;
  border-radius: 16px;
  border: 1px dashed var(--border);
  background: rgba(0, 0, 0, 0.18);
}
.ff__emptyTitle {
  margin: 0;
  font-weight: 650;
}
.ff__emptyHint {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.ff__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ff__sectionTitle {
  margin: 0;
  font-size: 13px;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  display: flex;
  align-items: baseline;
  gap: 10px;
  height: fit-content;
}
.ff__sectionCount {
  font-size: 11px;
  color: var(--faint);
  letter-spacing: 0;
  text-transform: none;
}

.ff__grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  align-items: start;
}

.ff__card {
  display: grid;
  gap: 8px;
  padding: 14px;
  border: 1px solid var(--border);
  background: var(--panel);
  border-radius: 14px;
  height: fit-content;
  cursor: pointer;
  transition: border-color 150ms ease, background 150ms ease, transform 150ms ease;

  &:hover {
    border-color: var(--border-2);
    background: var(--panel-2);
  }
}

.ff__card--open {
  border-color: var(--gold-2);
  background: linear-gradient(180deg, rgba(229, 200, 120, 0.05), rgba(255, 255, 255, 0.02));
  grid-column: span 1;
  @media (min-width: 900px) {
    grid-column: span 2;
  }
}

.ff__cardHead {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}
.ff__cardTitles {
  min-width: 0;
}
.ff__cardName {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
}
.ff__cardSci {
  margin: 2px 0 0;
  font-size: 12px;
  font-style: italic;
  color: var(--muted);
}
.ff__danger {
  font-size: 14px;
  color: var(--danger);
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.ff__cardMeta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ff__tag {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: var(--muted);
}
.ff__tag--type {
  color: var(--gold);
  border-color: var(--gold-2);
  background: rgba(229, 200, 120, 0.08);
}
.ff__tag--continent {
  color: rgba(170, 200, 255, 0.9);
  border-color: rgba(170, 200, 255, 0.25);
  background: rgba(120, 170, 255, 0.08);
}
.ff__tag--season-frühling {
  color: rgba(190, 240, 190, 0.9);
  border-color: rgba(150, 220, 150, 0.3);
  background: rgba(150, 220, 150, 0.08);
}
.ff__tag--season-sommer {
  color: rgba(255, 225, 160, 0.9);
  border-color: rgba(255, 210, 120, 0.3);
  background: rgba(255, 210, 120, 0.08);
}
.ff__tag--season-herbst {
  color: rgba(245, 180, 130, 0.9);
  border-color: rgba(230, 150, 90, 0.3);
  background: rgba(230, 150, 90, 0.08);
}
.ff__tag--season-winter {
  color: rgba(200, 225, 255, 0.9);
  border-color: rgba(160, 200, 245, 0.3);
  background: rgba(160, 200, 245, 0.08);
}

.ff__cardBody {
  margin-top: 4px;
  padding-top: 10px;
  border-top: 1px dashed var(--border);
  display: grid;
  gap: 12px;
  cursor: default;
}

.ff__props {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 4px 14px;
  margin: 0;
  font-size: 13px;

  dt {
    color: var(--faint);
    font-weight: 500;
  }
  dd {
    margin: 0;
    color: var(--text);
  }
}

.ff__locs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.ff__loc {
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
}

.ff__effects {
  h4 {
    margin: 0 0 4px;
    font-size: 11px;
    font-weight: 650;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--faint);
  }
  ul {
    margin: 0;
    padding: 0 0 0 16px;
    font-size: 13px;
    display: grid;
    gap: 2px;
  }
}

.ff__calendar {
  display: grid;
  gap: 6px;
}
.ff__calendarLegend {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  color: var(--faint);
  letter-spacing: 0.04em;
}
.ff__calendarDot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 3px;
  margin-right: 4px;
  vertical-align: -1px;
  border: 1px solid var(--border);

  &.ff__calendarDot--bloom {
    background: rgba(150, 220, 150, 0.45);
    border-color: rgba(150, 220, 150, 0.6);
  }
  &.ff__calendarDot--harvest {
    background: rgba(255, 190, 120, 0.45);
    border-color: rgba(255, 190, 120, 0.6);
  }
}
.ff__calendarStrip {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 3px;

  @media (min-width: 560px) {
    grid-template-columns: repeat(10, minmax(0, 1fr));
  }
}
.ff__calendarCell {
  display: grid;
  gap: 1px;
  padding: 6px 4px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.025);
  text-align: center;
  min-width: 0;
}
.ff__calendarMonth {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ff__calendarSeason {
  font-size: 9px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--faint);
}
.ff__calendarCell--bloom {
  border-color: rgba(150, 220, 150, 0.5);
  background: rgba(150, 220, 150, 0.12);
  .ff__calendarMonth {
    color: rgba(200, 245, 200, 0.95);
  }
}
.ff__calendarCell--harvest {
  border-color: rgba(255, 190, 120, 0.5);
  background: rgba(255, 190, 120, 0.12);
  .ff__calendarMonth {
    color: rgba(255, 220, 170, 0.95);
  }
}
.ff__calendarCell--both {
  border-color: rgba(229, 200, 120, 0.6);
  background: linear-gradient(
    135deg,
    rgba(150, 220, 150, 0.18),
    rgba(255, 190, 120, 0.18)
  );
  .ff__calendarMonth {
    color: var(--gold);
  }
}
.ff__calendarCell--inferred {
  border-style: dashed;
  opacity: 0.78;
}
.ff__calendarLegendNote {
  color: var(--faint);
  font-style: italic;
}

.ff__note {
  margin: 0;
  padding: 8px 10px;
  font-size: 12.5px;
  color: var(--muted);
  border-left: 2px solid var(--gold-2);
  background: rgba(229, 200, 120, 0.05);
  border-radius: 0 8px 8px 0;
}

.ff__warn {
  margin: 0;
  padding: 8px 10px;
  font-size: 12.5px;
  color: var(--danger);
  border-left: 2px solid var(--danger);
  background: rgba(240, 128, 128, 0.06);
  border-radius: 0 8px 8px 0;
}

.ff__cardFoot {
  display: flex;
  justify-content: flex-end;
}
.ff__expandHint {
  font-size: 11px;
  color: var(--faint);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
</style>
