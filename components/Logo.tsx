/**
 * The cand0r mark: a solid circle with one slot cut into it, so it reads as a "C"
 * and as an opening: nothing hidden. One shape, one colour, so it holds up from a
 * favicon to a billboard. It takes its colour from the text around it.
 */
export const MARK_PATH = "M95.21 41.5A46 46 0 1 0 95.21 58.5H53.5A8.5 8.5 0 0 1 53.5 41.5Z";

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <path d={MARK_PATH} fill="currentColor" />
    </svg>
  );
}

/** The mark with the name "cand0r" on its right (lowercase, with a zero for the o). */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center text-ink" style={{ gap: size * 0.3 }}>
      <LogoMark size={size} />
      <span className="font-display font-semibold leading-none tracking-[-0.045em]" style={{ fontSize: size * 1.06 }}>
        cand0r
      </span>
    </span>
  );
}
