/**
 * Fathom's accent colours: the logo's ocean blues plus the bright colours of a reef.
 * Each accent has three shades:
 *   solid: the bright colour itself (dots, bars, icon circles)
 *   soft:  a pale tint for backgrounds
 *   ink:   a darker shade that is easy to read as text on white or on `soft`
 * Components set them as CSS variables (--a, --a-soft, --a-ink) with `accentVars()`,
 * so one class list can be painted in any colour.
 */
import type { CSSProperties } from "react";

export type Accent = { name: string; solid: string; soft: string; ink: string };

export const ACCENTS = {
  ocean: { name: "ocean", solid: "#2f8fb3", soft: "#e3f2f8", ink: "#0b4f6c" },
  coral: { name: "coral", solid: "#ff6f59", soft: "#ffece8", ink: "#b2361f" },
  sun: { name: "sun", solid: "#ffb23e", soft: "#fff4dc", ink: "#8a4f00" },
  kelp: { name: "kelp", solid: "#1fb58c", soft: "#e2f6ef", ink: "#0b6e52" },
  lilac: { name: "lilac", solid: "#8b6cf2", soft: "#efeafe", ink: "#5434c0" },
  pink: { name: "pink", solid: "#ef5f9a", soft: "#fde9f1", ink: "#a8245b" },
  teal: { name: "teal", solid: "#16b3c7", soft: "#e0f6f9", ink: "#0a6b78" },
} satisfies Record<string, Accent>;

export type AccentName = keyof typeof ACCENTS;

/** A fixed order, so neighbours on a page never share a colour. */
export const ACCENT_ORDER: AccentName[] = ["ocean", "coral", "kelp", "sun", "lilac", "pink", "teal"];

/** The nth accent, wrapping round. */
export function accentAt(i: number): Accent {
  return ACCENTS[ACCENT_ORDER[((i % ACCENT_ORDER.length) + ACCENT_ORDER.length) % ACCENT_ORDER.length]];
}

/** Each type of business keeps its own colour everywhere it appears. */
const SECTOR_ACCENT: Record<string, AccentName> = {
  technology: "lilac",
  health: "pink",
  banks: "ocean",
  insurance: "teal",
  "real-estate": "sun",
  energy: "coral",
  utilities: "sun",
  media: "pink",
  shops: "coral",
  consumer: "kelp",
  industrials: "ocean",
  materials: "kelp",
  services: "lilac",
};

export function sectorAccent(id: string): Accent {
  return ACCENTS[SECTOR_ACCENT[id] ?? "ocean"];
}

/** The menu: one colour per page. */
export const NAV_ACCENT: Record<string, AccentName> = {
  "/sectors": "kelp",
  "/compare": "coral",
  "/watchlist": "sun",
  "/terms": "lilac",
};

/** The seven questions on a company page, each in its own colour. */
export function stepAccent(i: number): Accent {
  return accentAt(i);
}

/** Inline style that sets --a, --a-soft and --a-ink for everything inside. */
export function accentVars(a: Accent): CSSProperties {
  return { "--a": a.solid, "--a-soft": a.soft, "--a-ink": a.ink } as CSSProperties;
}
