/**
 * cand0r's accents. The brand is near-black ink plus one electric blue. A small set of
 * softer colours adds variety to pictures and icons (each question, each type of
 * business) and tells things apart on Compare. Text stays mostly ink.
 * Each accent has three shades:
 *   solid: the colour itself (dots, bars, icon fills)
 *   soft:  a pale tint for backgrounds
 *   ink:   a darker shade that is easy to read as text on white or on `soft`
 * Components set them as CSS variables (--a, --a-soft, --a-ink) with `accentVars()`,
 * so one class list can be painted in any colour.
 */
import type { CSSProperties } from "react";

export type Accent = { name: string; solid: string; soft: string; ink: string };

export const ACCENTS = {
  blue: { name: "blue", solid: "#2d5bff", soft: "#eef2ff", ink: "#1f45d6" },
  ink: { name: "ink", solid: "#0c0f14", soft: "#f4f5f7", ink: "#0c0f14" },
  violet: { name: "violet", solid: "#7c5cff", soft: "#f1edff", ink: "#5b3fd6" },
  teal: { name: "teal", solid: "#0ea5a4", soft: "#e6f7f7", ink: "#0b6f6e" },
  amber: { name: "amber", solid: "#f59e0b", soft: "#fef6e7", ink: "#8a5300" },
  rose: { name: "rose", solid: "#f43f5e", soft: "#feecef", ink: "#b4233c" },
  slate: { name: "slate", solid: "#64748b", soft: "#f1f3f6", ink: "#3f4a5a" },
  sky: { name: "sky", solid: "#0ea5e9", soft: "#e6f6fd", ink: "#0369a1" },
  green: { name: "green", solid: "#16a34a", soft: "#e8f6ec", ink: "#15803d" },
} satisfies Record<string, Accent>;

export type AccentName = keyof typeof ACCENTS;

/** For telling things apart (Compare): a fixed order, so neighbours never share a colour. */
export const ACCENT_ORDER: AccentName[] = ["blue", "amber", "teal", "rose", "violet", "sky", "green"];

/** The nth distinct accent, wrapping round. */
export function accentAt(i: number): Accent {
  return ACCENTS[ACCENT_ORDER[((i % ACCENT_ORDER.length) + ACCENT_ORDER.length) % ACCENT_ORDER.length]];
}

/** The brand accent, for everything that doesn't need telling apart. */
export const BRAND = ACCENTS.blue;

/** Each of the seven questions on a company page has its own colour for its icon. */
const STEP_ACCENT: Record<string, AccentName> = {
  business: "blue",
  performance: "teal",
  health: "violet",
  cash: "amber",
  management: "sky",
  outlook: "rose",
  value: "green",
};
export function stepAccent(id: string): Accent {
  return ACCENTS[STEP_ACCENT[id] ?? "blue"];
}

/** Each type of business keeps its own colour for its icon. */
const SECTOR_ACCENT: Record<string, AccentName> = {
  technology: "violet",
  health: "rose",
  banks: "blue",
  insurance: "teal",
  "real-estate": "amber",
  energy: "amber",
  utilities: "teal",
  media: "rose",
  shops: "amber",
  consumer: "teal",
  industrials: "slate",
  materials: "slate",
  services: "violet",
};
export function sectorAccent(id: string): Accent {
  return ACCENTS[SECTOR_ACCENT[id] ?? "blue"];
}

/** Inline style that sets --a, --a-soft and --a-ink for everything inside. */
export function accentVars(a: Accent): CSSProperties {
  return { "--a": a.solid, "--a-soft": a.soft, "--a-ink": a.ink } as CSSProperties;
}
