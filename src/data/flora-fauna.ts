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

const parsed = yaml.load(floraFaunaYaml) as FloraFaunaData;

export const floraFauna = parsed;
