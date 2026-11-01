/**
 * Candor's accents. The brand is near-black ink plus one electric blue, so almost
 * everything uses `blue`. The other colours exist only where things must be told
 * apart at a glance, such as the companies side by side on Compare.
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
} satisfies Record<string, Accent>;

export type AccentName = keyof typeof ACCENTS;

/** For telling things apart (Compare): a fixed order, so neighbours never share a colour. */
export const ACCENT_ORDER: AccentName[] = ["blue", "violet", "teal", "amber", "rose", "slate", "ink"];

/** The nth distinct accent, wrapping round. */
export function accentAt(i: number): Accent {
  return ACCENTS[ACCENT_ORDER[((i % ACCENT_ORDER.length) + ACCENT_ORDER.length) % ACCENT_ORDER.length]];
}

/** The brand accent, for everything that doesn't need telling apart. */
export const BRAND = ACCENTS.blue;

/** Inline style that sets --a, --a-soft and --a-ink for everything inside. */
export function accentVars(a: Accent): CSSProperties {
  return { "--a": a.solid, "--a-soft": a.soft, "--a-ink": a.ink } as CSSProperties;
}
