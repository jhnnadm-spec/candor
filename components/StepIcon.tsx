/**
 * A small two-tone picture for each of the seven parts of a company page, on a
 * glossy tile in that part's own colour. Inside a link or card marked `group`, the
 * picture lifts a little when pointed at. Decoration only: the words say the same.
 */
import type { ReactNode } from "react";
import { accentVars, stepAccent } from "@/lib/accents";

// Each picture has a soft filled layer (fill="currentColor" at low opacity) and a crisp outline.
const ICONS: Record<string, ReactNode> = {
  // The business: a shop with an awning.
  business: (
    <>
      <path d="M4 9.5 5.6 4h12.8L20 9.5z" fill="currentColor" fillOpacity=".28" />
      <path d="M4 9.5 5.6 4h12.8L20 9.5" />
      <path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0" />
      <path d="M5.5 12.2V20h13v-7.8" />
      <rect x="10" y="15" width="4" height="5" rx=".6" fill="currentColor" fillOpacity=".28" />
    </>
  ),
  // Growth and profit: bars rising, with an arrow.
  performance: (
    <>
      <rect x="4" y="13" width="3.4" height="7" rx="1" fill="currentColor" fillOpacity=".25" />
      <rect x="10.3" y="10" width="3.4" height="10" rx="1" fill="currentColor" fillOpacity=".4" />
      <rect x="16.6" y="6.5" width="3.4" height="13.5" rx="1" fill="currentColor" fillOpacity=".6" />
      <path d="M3.5 10.5 9 6l3 2.5L18.5 3" />
      <path d="M15 3h3.5v3.5" />
    </>
  ),
  // Financial health: a heart with a steady pulse.
  health: (
    <>
      <path d="M12 20.5s-8-4.8-8-10.6A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 8 2.5c0 5.8-8 10.6-8 10.6z" fill="currentColor" fillOpacity=".25" />
      <path d="M12 20.5s-8-4.8-8-10.6A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 8 2.5c0 5.8-8 10.6-8 10.6z" />
      <path d="M6.5 12.5h3l1.5-2.5 2 4.5 1.5-2h3" />
    </>
  ),
  // Cash: a stack of coins.
  cash: (
    <>
      <ellipse cx="12" cy="6.5" rx="6.5" ry="2.5" fill="currentColor" fillOpacity=".35" />
      <ellipse cx="12" cy="6.5" rx="6.5" ry="2.5" />
      <path d="M5.5 6.5v4c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-4" />
      <path d="M5.5 10.5v4c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-4" fill="currentColor" fillOpacity=".15" />
      <path d="M5.5 14.5v3c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-3" />
    </>
  ),
  // How it's run: a leader and a team.
  management: (
    <>
      <circle cx="12" cy="7" r="3.2" fill="currentColor" fillOpacity=".35" />
      <circle cx="12" cy="7" r="3.2" />
      <path d="M6.5 19.5c.5-3.6 2.7-5.6 5.5-5.6s5 2 5.5 5.6z" fill="currentColor" fillOpacity=".2" />
      <path d="M6.5 19.5c.5-3.6 2.7-5.6 5.5-5.6s5 2 5.5 5.6" />
      <circle cx="4.6" cy="10.4" r="1.8" />
      <circle cx="19.4" cy="10.4" r="1.8" />
    </>
  ),
  // Industry and risks: a compass for what lies ahead.
  outlook: (
    <>
      <circle cx="12" cy="12" r="8.5" fill="currentColor" fillOpacity=".14" />
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.6 8.4-2.3 4.9-4.9 2.3 2.3-4.9z" fill="currentColor" fillOpacity=".5" />
      <path d="m15.6 8.4-2.3 4.9-4.9 2.3 2.3-4.9z" />
      <path d="M12 3.5v1.6M12 18.9v1.6M3.5 12h1.6M18.9 12h1.6" />
    </>
  ),
  // The share price: a price tag.
  value: (
    <>
      <path d="M3.5 12.6V4.5a1 1 0 0 1 1-1h8.1l8 8a1 1 0 0 1 0 1.4l-7.7 7.7a1 1 0 0 1-1.4 0z" fill="currentColor" fillOpacity=".25" />
      <path d="M3.5 12.6V4.5a1 1 0 0 1 1-1h8.1l8 8a1 1 0 0 1 0 1.4l-7.7 7.7a1 1 0 0 1-1.4 0z" />
      <circle cx="8" cy="8" r="1.5" />
      <path d="m10 14 4-4" />
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
      style={{
        ...accentVars(a),
        width: size,
        height: size,
        background: `linear-gradient(150deg, #ffffff 0%, ${a.soft} 55%, color-mix(in srgb, ${a.solid} 22%, ${a.soft}) 100%)`,
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${a.solid} 22%, transparent), inset 0 1px 0 #ffffff, 0 8px 18px -12px ${a.solid}`,
      }}
      className="relative inline-flex flex-none items-center justify-center overflow-hidden rounded-[30%] text-[var(--a-ink)]"
    >
      {/* a soft highlight across the top, like a glossy app icon */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/70 to-transparent" />
      <svg
        width={size * 0.56}
        height={size * 0.56}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="relative transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:scale-110 motion-reduce:transition-none"
      >
        {icon}
      </svg>
    </span>
  );
}
