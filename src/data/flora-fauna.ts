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
}

const parsed = yaml.load(floraFaunaYaml) as FloraFaunaData;

export const floraFauna = parsed;

export const enrichedEntries: EnrichedEntry[] = parsed.entries.map((e) => {
  const bs = parseSeasons(e.bloom);
  const hs = parseSeasons(e.harvest);
  return {
    ...e,
    bloomSeasons: [...bs],
    harvestSeasons: [...hs],
    bloomMonths: [...monthsFromSeasons(bs)],
    harvestMonths: [...monthsFromSeasons(hs)],
  };
});
