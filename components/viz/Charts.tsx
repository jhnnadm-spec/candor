"use client";

/**
 * candor's interactive charts. Every one answers to hover, tap and keyboard,
 * shows its values as text too (labels, a readout or a table), and draws gently
 * into place once when it first appears.
 *
 * Drawing rules, the same everywhere: slim bars (24px at most) with 4px rounded
 * ends and a square base, a 2px gap between touching pieces, 2px lines, hairline
 * grids, and numbers in ink rather than in the chart's colours.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/** True once the chart has scrolled into view, so it can draw in. */
function useAppeared<T extends Element>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    if (typeof IntersectionObserver === "undefined") {
      const t = setTimeout(() => setShown(true), 0);
      return () => clearTimeout(t);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);
  return [ref, shown] as const;
}

/** Light fills get near-black text, darker fills white. */
function inkOn(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return "#ffffff";
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.32 ? "#0c0f14" : "#ffffff";
}

/** Round numbers for an axis: 0, 100, 200 … */
function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

/** "$391B" style labels for axis ticks: short, no needless decimals. */
function tick(v: number, money = true): string {
  const a = Math.abs(v);
  const cur = money ? "$" : "";
  const f = (x: number, s: string) => `${cur}${Number.isInteger(x) ? x : x.toFixed(1)}${s}`;
  if (a >= 1e12) return f(v / 1e12, "T");
  if (a >= 1e9) return f(v / 1e9, "B");
  if (a >= 1e6) return f(v / 1e6, "M");
  if (a >= 1e3) return f(v / 1e3, "K");
  return `${cur}${v}`;
}

// ---------------------------------------------------------------- tall split bar: "where each $100 goes"

export type Segment = { label: string; value: number; display: string; color: string; note: string };

export function StackedBar({ segments, caption, selectHint = "Tap a part of the bar" }: { segments: Segment[]; caption?: string; selectHint?: string }) {
  const [ref, shown] = useAppeared<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const sel = active === null ? null : segments[active];
  return (
    <figure className="m-0 flex flex-col gap-3">
      {caption && <figcaption className="text-[13px] text-muted">{caption}</figcaption>}
      <div ref={ref} className="flex h-7 w-full gap-[2px]" role="group" aria-label="Parts of the bar">
        {segments.map((s, i) => {
          const share = s.value / total;
          return (
            <button
              key={s.label}
              type="button"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              aria-label={`${s.label}: ${s.display}`}
              aria-pressed={active === i}
              className="relative h-full min-w-[3px] cursor-pointer overflow-visible rounded-[4px] text-left transition-[width,opacity,filter] duration-700 ease-out hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean motion-reduce:transition-none"
              style={{
                width: shown ? `${share * 100}%` : "0%",
                transitionDelay: `${i * 90}ms`,
                background: s.color,
                opacity: active !== null && active !== i ? 0.4 : 1,
              }}
            >
              {/* The amount sits inside the block only when it fits. */}
              {share >= 0.09 && (
                <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-[12.5px] font-semibold tabular-nums" style={{ color: inkOn(s.color), opacity: shown ? 1 : 0, transition: "opacity 300ms 600ms" }}>
                  {s.display}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <ul className="m-0 grid list-none gap-x-5 gap-y-1.5 p-0 text-[14px] sm:grid-cols-2">
        {segments.map((s, i) => (
          <li key={s.label}>
            <button
              type="button"
              onClick={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className={`flex w-full items-center gap-2 rounded-sm px-1 py-0.5 text-left ${active === i ? "bg-panel-2 text-ink" : "text-muted"} hover:text-ink`}
            >
              <span aria-hidden="true" className="h-2.5 w-2.5 flex-none rounded-[2px]" style={{ background: s.color }} />
              <span className="flex-1">{s.label}</span>
              <span className="font-semibold tabular-nums text-ink">{s.display}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="m-0 min-h-[3em] rounded-sm bg-panel-2 px-3.5 py-2.5 text-[14px] leading-relaxed" aria-live="polite">
        {sel ? (
          <>
            <strong className="font-semibold text-ink">
              {sel.display} {sel.label.toLowerCase()}.
            </strong>{" "}
            <span className="text-muted">{sel.note}</span>
          </>
        ) : (
          <span className="text-muted">{selectHint} to see what it means.</span>
        )}
      </p>
    </figure>
  );
}

// ---------------------------------------------------------------- columns: sales by year

export type Bar = { label: string; value: number; display: string; detail: string };

export function Columns({ bars, color, highlight }: { bars: Bar[]; color: string; highlight: string }) {
  const [ref, shown] = useAppeared<HTMLDivElement>();
  const [active, setActive] = useState(bars.length - 1);
  const top = niceMax(Math.max(...bars.map((b) => b.value), 1));
  const ticks = [0, top / 2, top];
  const sel = bars[active];
  const prev = active > 0 ? bars[active - 1] : undefined;
  const change = prev && prev.value ? (sel.value - prev.value) / Math.abs(prev.value) : undefined;
  return (
    <figure className="m-0 flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-[14px]" aria-live="polite">
        <span className="text-muted">{sel.detail}</span>
        <span>
          <strong className="font-semibold tabular-nums">{sel.display}</strong>
          {change !== undefined && (
            <span className="ml-2 text-[13px] text-muted">
              {change >= 0 ? "▲" : "▼"} {Math.abs(change * 100).toFixed(1)}% on the year before
            </span>
          )}
        </span>
      </div>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
        {/* Axis ticks */}
        <div className="relative h-40 text-right text-[11px] tabular-nums text-muted" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 translate-y-1/2 whitespace-nowrap leading-none" style={{ bottom: `${(t / top) * 100}%` }}>
              {tick(t)}
            </span>
          ))}
        </div>
        <div ref={ref} className="relative h-40" role="group" aria-label="Sales by year">
          {ticks.map((t) => (
            <span key={t} aria-hidden="true" className="absolute inset-x-0 h-px bg-line" style={{ bottom: `${(t / top) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end">
            {bars.map((b, i) => {
              const h = Math.max(1.5, (b.value / top) * 100);
              const on = i === active;
              return (
                <button
                  key={b.label}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  aria-label={`${b.detail}: ${b.display}`}
                  aria-pressed={on}
                  className="group relative flex h-full flex-1 cursor-pointer items-end justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean"
                >
                  <span
                    className="relative block w-full max-w-6 rounded-t-[4px] transition-[height,background-color] duration-700 ease-out group-hover:brightness-105 motion-reduce:transition-none"
                    style={{ height: shown ? `${h}%` : "0%", transitionDelay: `${i * 70}ms`, background: on ? highlight : color }}
                  >
                    {on && (
                      <span className="fathom-pop absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-ink px-1.5 py-0.5 text-[11px] font-semibold text-white">
                        {b.display}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <span />
        <div className="flex pt-1.5 text-[12px] text-muted">
          {bars.map((b, i) => (
            <span key={b.label} className={`flex-1 text-center tabular-nums ${i === active ? "font-semibold text-ink" : ""}`}>
              {b.label}
            </span>
          ))}
        </div>
      </div>
      <details className="text-[13px] text-muted">
        <summary className="cursor-pointer">Show as a table</summary>
        <table className="mt-2 w-full text-[14px]">
          <tbody>
            {bars.map((b) => (
              <tr key={b.label} className="border-t border-line">
                <td className="py-1.5">{b.detail}</td>
                <td className="py-1.5 text-right tabular-nums text-ink">{b.display}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

// ---------------------------------------------------------------- gauge: can it pay its bills?

export function BillsGauge({ value }: { value: number }) {
  const [ref, shown] = useAppeared<HTMLDivElement>();
  const pos = Math.max(0, Math.min(2, value)) / 2; // 0 to 2 across the track
  return (
    <div className="flex flex-col gap-2 pt-8">
      <div ref={ref} className="relative h-3">
        <div className="absolute inset-0 flex gap-[2px]" aria-hidden="true">
          <span className="h-full w-1/4 rounded-l-[4px] bg-[#fbc8d1]" />
          <span className="h-full w-1/4 bg-[#fde3b6]" />
          <span className="h-full w-1/2 rounded-r-[4px] bg-[#b4e8e6]" />
        </div>
        {/* $1 for $1 marker */}
        <span aria-hidden="true" className="absolute -bottom-1 -top-1 left-1/2 w-px bg-muted/60" />
        <div
          className="absolute -top-[30px] flex flex-col items-center transition-[left] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ left: `${shown ? pos * 100 : 0}%`, transform: "translateX(-50%)" }}
          role="img"
          aria-label={`$${value.toFixed(2)} for every $1 due within a year`}
        >
          <span className="rounded-sm bg-ink px-1.5 py-0.5 text-[11.5px] font-semibold tabular-nums text-white">${value.toFixed(2)}</span>
          <span className="h-[30px] w-[3px] rounded-full bg-ink ring-2 ring-white" />
        </div>
      </div>
      <div className="flex justify-between text-[12px] text-muted">
        <span>Less than it owes soon</span>
        <span>$1 for $1</span>
        <span>More than enough</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- two labelled bars: cash vs debt

export function PairBars({ items }: { items: { label: string; value: number; display: string; color: string }[] }) {
  const [ref, shown] = useAppeared<HTMLDivElement>();
  const max = Math.max(...items.map((i) => i.value), 1);
  const [active, setActive] = useState<number | null>(null);
  return (
    <div ref={ref} className="flex flex-col gap-3">
      {items.map((it, i) => (
        <div
          key={it.label}
          className={`flex flex-col gap-1 rounded-sm px-1 py-0.5 transition-colors ${active === i ? "bg-panel-2" : ""}`}
          onMouseEnter={() => setActive(i)}
          onMouseLeave={() => setActive(null)}
        >
          <div className="flex justify-between gap-3 text-[14px]">
            <span className="flex items-center gap-2 text-muted">
              <span aria-hidden="true" className="h-2.5 w-2.5 flex-none rounded-[2px]" style={{ background: it.color }} />
              {it.label}
            </span>
            <span className="font-semibold tabular-nums">{it.display}</span>
          </div>
          <div className="h-3 rounded-r-[4px] bg-panel-2">
            <div
              className="h-3 rounded-r-[4px] transition-[width] duration-700 ease-out motion-reduce:transition-none"
              style={{ width: shown ? `${Math.max(1.5, (it.value / max) * 100)}%` : "0%", background: it.color, transitionDelay: `${i * 120}ms` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- line chart: margins over the years

export function Lines({
  years,
  series,
}: {
  years: { label: string; detail: string }[];
  series: { name: string; color: string; values: (number | undefined)[] }[];
}) {
  const [ref, shown] = useAppeared<SVGSVGElement>();
  const [active, setActive] = useState(years.length - 1);
  const [hovering, setHovering] = useState(false);
  const id = useId();
  const W = 760;
  const H = 270;
  const pad = { l: 44, r: 92, t: 16, b: 28 };
  const all = series.flatMap((s) => s.values.filter((v): v is number => v !== undefined));
  const top = Math.min(1, Math.ceil((Math.max(...all, 0.1) + 0.05) * 10) / 10);
  const bottom = Math.max(-0.5, Math.min(0, Math.floor(Math.min(...all) * 10) / 10));
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(1, years.length - 1);
  const y = (v: number) => pad.t + ((top - v) / (top - bottom)) * (H - pad.t - pad.b);
  const pct = (v?: number) => (v === undefined ? "–" : `${(Math.round(v * 1000) / 10).toLocaleString("en-US")}%`);

  function move(e: React.PointerEvent<SVGSVGElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * W;
    let best = 0;
    for (let i = 0; i < years.length; i++) if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    setActive(best);
    setHovering(true);
  }

  const gridValues = [bottom, (top + bottom) / 2, top];
  const tipLeft = (x(active) / W) * 100;

  return (
    <figure className="m-0 flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[14px]" aria-live="polite">
        <span className="text-muted">{years[active].detail}</span>
        {series.map((s) => (
          <span key={s.name} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-[2px] w-3.5 rounded" style={{ background: s.color }} />
            <strong className="font-semibold tabular-nums">{pct(s.values[active])}</strong>
            <span className="text-muted">{s.name.replace(" margin", "")}</span>
          </span>
        ))}
      </div>
      <div className="relative">
        <svg
          ref={ref}
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full touch-none"
          role="img"
          aria-labelledby={`${id}-t`}
          onPointerMove={move}
          onPointerDown={move}
          onPointerLeave={() => setHovering(false)}
        >
          <title id={`${id}-t`}>Margins year by year</title>
          {gridValues.map((g) => (
            <g key={g}>
              <line x1={pad.l} x2={W - pad.r} y1={y(g)} y2={y(g)} stroke="var(--color-line)" strokeWidth="1" />
              <text x={pad.l - 8} y={y(g) + 4} fontSize="11" textAnchor="end" fill="var(--color-muted)">
                {pct(g)}
              </text>
            </g>
          ))}
          {/* A soft wash under the top line, so the space each margin leaves reads at a glance */}
          {series[0] && (
            <polygon
              points={[
                ...series[0].values.map((v, i) => (v === undefined ? null : `${x(i)},${y(v)}`)).filter(Boolean),
                `${x(series[0].values.length - 1)},${y(bottom)}`,
                `${x(0)},${y(bottom)}`,
              ].join(" ")}
              fill={series[0].color}
              opacity={shown ? 0.08 : 0}
              style={{ transition: "opacity 900ms ease-out 400ms" }}
            />
          )}
          <line x1={x(active)} x2={x(active)} y1={pad.t} y2={H - pad.b} stroke="var(--color-muted)" strokeOpacity="0.55" strokeWidth="1" />
          {(() => {
            // Each line's name at its last point, nudged apart so names never overlap.
            const ends = series
              .map((s) => {
                const last = s.values.map((v, i) => (v === undefined ? -1 : i)).filter((i) => i >= 0).at(-1)!;
                return { name: s.name, color: s.color, x: x(last) + 10, y: y(s.values[last]!) + 4 };
              })
              .sort((a, b) => a.y - b.y);
            for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;
            return ends.map((l) => (
              <text key={`label-${l.name}`} x={l.x} y={l.y} fontSize="11.5" fill="var(--color-ink)">
                {l.name.replace(" margin", "")}
              </text>
            ));
          })()}
          {series.map((s, k) => {
            const pts = s.values.map((v, i) => (v === undefined ? null : `${x(i)},${y(v)}`)).filter(Boolean);
            return (
              <g key={s.name}>
                <polyline
                  points={pts.join(" ")}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray="1"
                  strokeDashoffset={shown ? 0 : 1}
                  style={{ transition: `stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1) ${k * 150}ms` }}
                  className="motion-reduce:[transition:none]"
                />
                {s.values[active] !== undefined && (
                  <circle cx={x(active)} cy={y(s.values[active]!)} r="4.5" fill={s.color} stroke="#ffffff" strokeWidth="2" style={{ transition: "cx 200ms ease-out, cy 200ms ease-out" }} />
                )}
              </g>
            );
          })}
          {years.map((yr, i) => (
            <text key={yr.label} x={x(i)} y={H - 8} fontSize="11.5" textAnchor="middle" fill={i === active ? "var(--color-ink)" : "var(--color-muted)"} fontWeight={i === active ? 600 : 400}>
              {yr.label}
            </text>
          ))}
        </svg>
        {/* Floating readout while pointing at the chart: values first, names second */}
        {hovering && (
          <div
            className="pointer-events-none absolute top-2 z-10 flex min-w-[9rem] flex-col gap-1 rounded-sm border border-line bg-white px-3 py-2 text-[12.5px] shadow-[0_10px_24px_-12px_rgba(12,15,20,0.35)]"
            style={{ left: `${tipLeft}%`, transform: tipLeft > 60 ? "translateX(calc(-100% - 12px))" : "translateX(12px)" }}
          >
            <span className="font-semibold text-muted">{years[active].label}</span>
            {series.map((s) => (
              <span key={s.name} className="flex items-center gap-2">
                <span aria-hidden="true" className="h-[2px] w-3 rounded" style={{ background: s.color }} />
                <strong className="tabular-nums text-ink">{pct(s.values[active])}</strong>
                <span className="text-muted">{s.name.replace(" margin", "").toLowerCase()}</span>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a year">
        {years.map((yr, i) => (
          <button
            key={yr.label}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            className={`min-h-9 rounded-sm px-3 text-[13px] font-semibold transition-colors ${i === active ? "bg-ink text-abyss" : "bg-panel-2 text-muted hover:text-ink"}`}
          >
            {yr.label}
          </button>
        ))}
      </div>
    </figure>
  );
}

/** A small headline number with a caption, for the top of a tile. */
export function Headline({ value, caption }: { value: string; caption?: ReactNode; tone?: "glow" | "plain" }) {
  return (
    <div className="flex flex-col">
      <span className="font-display text-3xl font-bold text-ink">{value}</span>
      {caption && <span className="text-[13px] text-muted">{caption}</span>}
    </div>
  );
}
