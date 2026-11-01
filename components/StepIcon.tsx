/**
 * A small flat picture for each of the seven parts of a company page: a plain tile
 * in that part's own colour with a simple white line drawing. Decoration only: the
 * words beside it say the same thing.
 */
import type { ReactNode } from "react";
import { stepAccent } from "@/lib/accents";

// One weight of line, no fills or shading, so every icon reads as part of one flat set.
const ICONS: Record<string, ReactNode> = {
  // The business: a shop front.
  business: (
    <>
      <path d="M4 10 5.5 4h13L20 10" />
      <path d="M4 10h16" />
      <path d="M5.5 10v10h13V10" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  // Growth and profit: three rising bars.
  performance: (
    <>
      <path d="M5 20v-6" />
      <path d="M12 20V9" />
      <path d="M19 20V4" />
    </>
  ),
  // Financial health: a shield with a tick.
  health: (
    <>
      <path d="M12 3 5 6v5.5c0 4.4 3 7.8 7 9.5 4-1.7 7-5.1 7-9.5V6z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  // Cash: a banknote.
  cash: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  // How it's run: a person at the head of a table.
  management: (
    <>
      <circle cx="12" cy="7.5" r="3" />
      <path d="M6 20c.6-3.6 3-5.8 6-5.8s5.4 2.2 6 5.8" />
    </>
  ),
  // Industry and risks: a compass.
  outlook: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8z" />
    </>
  ),
  // The share price: a line going up and down.
  value: (
    <>
      <path d="M3 16 8.5 10.5l4 3.5L21 6" />
      <path d="M15 6h6v6" />
    </>
  ),
};

export function StepIcon({ id, size = 48 }: { id: string; size?: number }) {
  const icon = ICONS[id];
  if (!icon) return null;
  const a = stepAccent(id);
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, background: a.solid, borderRadius: Math.round(size * 0.28) }}
      className="inline-flex flex-none items-center justify-center text-white"
    >
      <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {icon}
      </svg>
    </span>
  );
}
