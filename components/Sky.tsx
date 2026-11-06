/**
 * candor's look, taken from its LinkedIn banner: a pale sky with soft brand colours
 * fading into one another, and a single dark dune in one flat shade.
 *
 * <Sky> sits behind the top of every page and fades out into the page colour further
 * down. <DuneEdge> is the dune itself, rising out of the page into the footer. Both are
 * decorative only: drawn in code (nothing to download), hidden from screen readers, and
 * still for anyone who has asked for less motion.
 */

// One colour per glow: blue, violet, teal, amber, rose (the chart palette), placed like the banner's.
const GLOWS = [
  { rgb: "45,91,255", a: 0.3, left: "-16%", top: "-38%", w: 52, h: "100%", dur: 30, delay: 0 },
  { rgb: "124,92,255", a: 0.26, left: "22%", top: "-46%", w: 42, h: "92%", dur: 36, delay: -9 },
  { rgb: "14,165,164", a: 0.24, left: "62%", top: "-34%", w: 50, h: "100%", dur: 33, delay: -17 },
  { rgb: "245,158,11", a: 0.15, left: "44%", top: "22%", w: 34, h: "62%", dur: 39, delay: -5 },
  { rgb: "244,63,94", a: 0.13, left: "6%", top: "26%", w: 30, h: "56%", dur: 34, delay: -23 },
];

// In the low strip above the dune, the same colours sit lower down, just over the crest.
const LOW_TOP = ["-10%", "-20%", "0%", "30%", "25%"];

function Glows({ strength = 1, low = false }: { strength?: number; low?: boolean }) {
  return (
    <>
      {GLOWS.map((g, i) => (
        <span
          key={g.rgb}
          className="candor-glow absolute"
          style={{
            left: g.left,
            top: low ? LOW_TOP[i] : g.top,
            // never narrower than a phone-sized glow, so small screens get soft clouds, not stripes
            width: `max(${g.w}%, ${g.w * 9}px)`,
            height: low ? "140%" : g.h,
            background: `radial-gradient(closest-side, rgba(${g.rgb},${g.a * strength}), rgba(${g.rgb},${g.a * strength * 0.5}) 45%, rgba(${g.rgb},0))`,
            animationDuration: `${g.dur}s`,
            animationDelay: `${g.delay}s`,
          }}
        />
      ))}
    </>
  );
}

/** The soft colours behind the top of a page. The parent needs `relative isolate`. */
export function Sky() {
  return (
    <div aria-hidden="true" className="candor-sky pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px] overflow-hidden sm:h-[780px]">
      <Glows />
    </div>
  );
}

// The dune's outline: one smooth crest on the left, a dip, and a rise again towards the
// right, the same curve as the banner. Worked out once here, as points on a 1440 x 120 box.
const W = 1440;
const H = 120;
function duneY(t: number) {
  const f = 0.64 - 0.08 * Math.sin(2 * Math.PI * 1.39 * t - 1.22) + 0.015 * Math.sin(2 * Math.PI * 2.6 * t + 0.8);
  return (H * (f - 0.5)) / 0.25;
}
const DUNE = (() => {
  const pts: string[] = [];
  for (let x = 0; x <= W; x += 12) pts.push(`${x} ${duneY(x / W).toFixed(1)}`);
  return `M${pts.join(" L")} L${W} ${H} L0 ${H} Z`;
})();

/** The dune rising out of the page, with the sky's colours just above it. Sits on top of the footer. */
export function DuneEdge() {
  return (
    <div aria-hidden="true" className="pointer-events-none relative h-20 overflow-x-clip sm:h-24 lg:h-28">
      <div className="candor-sky-low absolute inset-0 overflow-hidden">
        <Glows strength={1.5} low />
      </div>
      {/* One pixel taller than its box, so no hairline of page shows between the dune and the
          footer. At least 960px wide, so on a phone the crest keeps its gentle shape (the rest is cut off). */}
      <svg className="absolute left-0 top-0 h-[calc(100%+1px)] w-full min-w-[960px]" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <path d={DUNE} className="fill-dune" />
      </svg>
    </div>
  );
}
