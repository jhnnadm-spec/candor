/**
 * The candor mark: three flat black bars, lined up on the right and getting longer
 * downwards, like steps: one for each level of detail on a company page (Short,
 * Explained, Everything). Square corners and one colour, so it holds up from a
 * favicon to a billboard. Black on light backgrounds, white on dark ones.
 */
export const MARK_INK = "#0C0F14";
export const MARK_BARS = [
  { y: 0, width: 46 }, // Short
  { y: 36, width: 73 }, // Explained
  { y: 72, width: 100 }, // Everything
].map((b) => ({ ...b, x: 100 - b.width }));
export const MARK_BAR_HEIGHT = 28;

export function LogoMark({ size = 28, color = MARK_INK }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" shapeRendering="crispEdges">
      {MARK_BARS.map((b) => (
        <rect key={b.y} x={b.x} y={b.y} width={b.width} height={MARK_BAR_HEIGHT} fill={color} />
      ))}
    </svg>
  );
}

/**
 * The mark with the name "candor" on its right (all lowercase), both in one colour:
 * black on light backgrounds, white on dark ones (the header).
 */
export function Logo({ size = 28, tone = "light" }: { size?: number; tone?: "light" | "dark" }) {
  const color = tone === "dark" ? "#FFFFFF" : MARK_INK;
  return (
    <span className="inline-flex items-center" style={{ gap: size * 0.35, color }}>
      <LogoMark size={size} color={color} />
      <span className="font-display font-semibold leading-none tracking-[-0.04em]" style={{ fontSize: size * 1.09 }}>
        candor
      </span>
    </span>
  );
}
