/**
 * A small picture for each of the seven questions on a company page, on a tile in
 * that question's own colour. Decoration only: the question's words say the same.
 */
import type { ReactNode } from "react";
import { accentVars, stepAccent } from "@/lib/accents";

const ICONS: Record<string, ReactNode> = {
  // What does it do? A shop front.
  business: (
    <>
      <path d="M4 9.5 5.5 4h13L20 9.5" />
      <path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0" />
      <path d="M5.5 12v8h13v-8M10 20v-4.5h4V20" />
    </>
  ),
  // Is it growing? A line climbing.
  performance: (
    <>
      <path d="M3.5 17.5 9 12l3.5 3.5L20 8" />
      <path d="M15 8h5v5" />
    </>
  ),
  // Is it healthy? A pulse.
  health: <path d="M3 12h4l2.5-6 4 12 2.5-6H21" />,
  // Where does the cash go? Coins.
  cash: (
    <>
      <ellipse cx="9" cy="7" rx="5.5" ry="2.5" />
      <path d="M3.5 7v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5V7" />
      <path d="M9.5 16.4c.6.1 1.3.1 2 .1 3 0 5.5-1.1 5.5-2.5v-.3" />
      <ellipse cx="15" cy="13" rx="5.5" ry="2.5" />
      <path d="M9.5 13v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4" />
    </>
  ),
  // Who runs it? People.
  management: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19.5c.6-3.4 3-5.3 6-5.3s5.4 1.9 6 5.3" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M18 14.6c1.6.8 2.7 2.4 3 4.9" />
    </>
  ),
  // What's next? A compass.
  outlook: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8z" />
    </>
  ),
  // What is it worth? A price tag.
  value: (
    <>
      <path d="M3.5 12.6V4.5a1 1 0 0 1 1-1h8.1l8 8a1 1 0 0 1 0 1.4l-7.7 7.7a1 1 0 0 1-1.4 0z" />
      <circle cx="8" cy="8" r="1.4" />
    </>
  ),
};

export function StepIcon({ id, size = 48 }: { id: string; size?: number }) {
  const icon = ICONS[id];
  if (!icon) return null;
  return (
    <span
      aria-hidden="true"
      style={{ ...accentVars(stepAccent(id)), width: size, height: size }}
      className="inline-flex flex-none items-center justify-center rounded-[30%] bg-[var(--a-soft)] text-[var(--a-ink)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--a)_18%,transparent)]"
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {icon}
      </svg>
    </span>
  );
}
