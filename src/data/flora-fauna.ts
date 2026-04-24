import yaml from "js-yaml";
import floraFaunaYaml from "./flora-fauna.yaml?raw";

export type Category = "flora" | "fauna";

export interface FloraFaunaEntry {
  name: string;
  scientificName: string;
  category: Category;
  type: string;
  regions: string[];
  locations: string[];
  continents: string[];
  habitat?: string;
  bloom?: string;
  harvest?: string;
  appearance?: string;
  effects?: string[];
  warning?: string;
  notes?: string;
  dangerLevel?: number;
  cost?: string;
  tags?: string[];
}

export interface RegionDef {
  name: string;
  locations: string[];
}

export interface ContinentDef {
  continent: string;
  regions: RegionDef[];
}

export interface FloraFaunaData {
  meta: {
    description: string;
    types: { flora: string[]; fauna: string[] };
    typeLabels: Record<string, string>;
    geography: ContinentDef[];
  };
  entries: FloraFaunaEntry[];
}

export const SEASONS = ["Frühling", "Sommer", "Herbst", "Winter"] as const;
export type Season = (typeof SEASONS)[number];

export const MONTHS = [
  "Domyra",
  "Lethain",
  "Elisar",
  "Helvarn",
  "Kaldor",
  "Arkaelis",
  "Velaris",
  "Mor'thal",
  "Caedryn",
  "Elyndor",
] as const;
export type Month = (typeof MONTHS)[number];

export const MONTH_SEASON: Record<Month, Season | "Übergang"> = {
  Domyra: "Übergang",
  Lethain: "Übergang",
  Elisar: "Frühling",
  Helvarn: "Frühling",
  Kaldor: "Sommer",
  Arkaelis: "Sommer",
  Velaris: "Herbst",
  "Mor'thal": "Herbst",
  Caedryn: "Winter",
  Elyndor: "Winter",
};

export const SEASON_MONTHS: Record<Season, Month[]> = {
  Frühling: ["Elisar", "Helvarn"],
  Sommer: ["Kaldor", "Arkaelis"],
  Herbst: ["Velaris", "Mor'thal"],
  Winter: ["Caedryn", "Elyndor"],
};

const SEASON_INDEX: Record<Season, number> = {
  Frühling: 0,
  Sommer: 1,
  Herbst: 2,
  Winter: 3,
};

function seasonOf(token: string): Season | null {
  const t = token.toLowerCase();
  if (t.includes("frühjahr") || t.includes("frühling") || t.includes("vorfrühling"))
    return "Frühling";
  if (t.includes("sommer")) return "Sommer";
  if (t.includes("herbst")) return "Herbst";
  if (t.includes("winter")) return "Winter";
  return null;
}

export function isYearRound(text: string | undefined | null): boolean {
  if (!text) return false;
  return /ganzjährig|immergrün/.test(text.toLowerCase());
}

export function parseSeasons(text: string | undefined | null): Set<Season> {
  const out = new Set<Season>();
  if (!text) return out;
  const t = text.toLowerCase();

  if (/ganzjährig|immergrün/.test(t)) {
    SEASONS.forEach((s) => out.add(s));
    return out;
  }

  // "X bis Y" ranges → fill seasons in between (cyclic forward walk, max 4 steps)
  const rangeRegex =
    /(vorfrühling|frühjahr|frühling|frühsommer|hochsommer|spätsommer|sommer|frühherbst|spätherbst|herbst|spätwinter|winter)[^]*?\bbis\b[^]*?(vorfrühling|frühjahr|frühling|frühsommer|hochsommer|spätsommer|sommer|frühherbst|spätherbst|herbst|spätwinter|winter)/g;
  let m: RegExpExecArray | null;
  while ((m = rangeRegex.exec(t)) !== null) {
    const a = m[1];
    const b = m[2];
    if (!a || !b) continue;
    const from = seasonOf(a);
    const to = seasonOf(b);
    if (from && to) {
      const fromIdx = SEASON_INDEX[from];
      const toIdx = SEASON_INDEX[to];
      let i = fromIdx;
      for (let step = 0; step < 4; step++) {
        const s = SEASONS[i];
        if (s) out.add(s);
        if (i === toIdx) break;
        i = (i + 1) % 4;
      }
    }
  }

  if (/frühjahr|frühling|vorfrühling/.test(t)) out.add("Frühling");
  if (/sommer/.test(t)) out.add("Sommer"); // covers Früh-/Hoch-/Spätsommer
  if (/herbst/.test(t)) out.add("Herbst"); // covers Früh-/Spätherbst
  if (/winter/.test(t)) out.add("Winter");

  // Phenological markers
  if (/\bfrost\b/.test(t)) {
    out.add("Herbst");
    out.add("Winter");
  }

  return out;
}

export function monthsFromSeasons(seasons: Iterable<Season>): Set<Month> {
  const out = new Set<Month>();
  for (const s of seasons) for (const m of SEASON_MONTHS[s]) out.add(m);
  return out;
}

export interface EnrichedEntry extends FloraFaunaEntry {
  bloomSeasons: Season[];
  harvestSeasons: Season[];
  bloomMonths: Month[];
  harvestMonths: Month[];
  bloomInferred: boolean;
  harvestInferred: boolean;
}

function seasonsFromMonthList(months: Iterable<Month>): Season[] {
  const set = new Set<Season>();
  for (const m of months) {
    const s = MONTH_SEASON[m];
    if (s !== "Übergang") set.add(s);
  }
  return [...set];
}

const parsed = yaml.load(floraFaunaYaml) as FloraFaunaData;

export const floraFauna = parsed;

export const enrichedEntries: EnrichedEntry[] = parsed.entries.map((e) => {
  const bloomYearRound = isYearRound(e.bloom);
  const harvestYearRound = isYearRound(e.harvest);

  const bs = parseSeasons(e.bloom);
  const hs = parseSeasons(e.harvest);

  const bloomMonths: Set<Month> = bloomYearRound
    ? new Set(MONTHS)
    : monthsFromSeasons(bs);
  const harvestMonths: Set<Month> = harvestYearRound
    ? new Set(MONTHS)
    : monthsFromSeasons(hs);

  let bloomInferred = false;
  let harvestInferred = false;

  // Infer missing bloom = month before first harvest month (unless harvest is year-round)
  if (bloomMonths.size === 0 && harvestMonths.size > 0 && !harvestYearRound) {
    const firstIdx = Math.min(
      ...[...harvestMonths].map((m) => MONTHS.indexOf(m))
    );
    const before = (firstIdx - 1 + MONTHS.length) % MONTHS.length;
    const inferred = MONTHS[before];
    if (inferred) {
      bloomMonths.add(inferred);
      bloomInferred = true;
    }
  }

  // Infer missing harvest = month after last bloom month (unless bloom is year-round)
  if (harvestMonths.size === 0 && bloomMonths.size > 0 && !bloomYearRound) {
    const lastIdx = Math.max(
      ...[...bloomMonths].map((m) => MONTHS.indexOf(m))
    );
    const after = (lastIdx + 1) % MONTHS.length;
    const inferred = MONTHS[after];
    if (inferred) {
      harvestMonths.add(inferred);
      harvestInferred = true;
    }
  }

  return {
    ...e,
    bloomSeasons: seasonsFromMonthList(bloomMonths),
    harvestSeasons: seasonsFromMonthList(harvestMonths),
    bloomMonths: [...bloomMonths],
    harvestMonths: [...harvestMonths],
    bloomInferred,
    harvestInferred,
  };
});
