/**
 * The cand0r mark: three flat bars that get longer, one for each level of detail on a
 * company page (Short, Explained, Everything). Square corners, one solid colour each,
 * so it holds up from a favicon to a billboard.
 */
export const MARK_BARS = [
  { y: 0, width: 46, color: "#2D5BFF" }, // Short
  { y: 36, width: 73, color: "#0EA5A4" }, // Explained
  { y: 72, width: 100, color: "#F59E0B" }, // Everything
] as const;
export const MARK_BAR_HEIGHT = 28;

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      {MARK_BARS.map((b) => (
        <rect key={b.y} x={0} y={b.y} width={b.width} height={MARK_BAR_HEIGHT} fill={b.color} />
      ))}
    </svg>
  );
}

/** The mark with the name "cand0r" on its right (lowercase, with a zero for the o), in grey. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center" style={{ gap: size * 0.35, color: "#4B5260" }}>
      <LogoMark size={size} />
      <span className="font-display font-semibold leading-none tracking-[-0.04em]" style={{ fontSize: size * 1.09 }}>
        cand0r
      </span>
    </span>
  );
}
