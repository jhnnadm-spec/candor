"use client";

/**
 * The company at a glance as a map: the company in the middle, and around it the
 * key ideas from its reports (sales, profit, cash, debt, the share price) with this
 * company's own figures. It stays quiet until you point at an idea; then the ideas it
 * feeds into light up, the links between them say how, and the panel explains it.
 * On phones the same ideas are a tidy set of chips above the same panel.
 */
import { useMemo, useState } from "react";
import { EDGES, type MapGroup, type MapNode } from "@/lib/report/concept-map";

const GROUP: Record<Exclude<MapGroup, "forces">, { name: string; color: string; soft: string; ink: string }> = {
  sales: { name: "Sales and profit", color: "#2d5bff", soft: "#eef2ff", ink: "#1f45d6" },
  cash: { name: "Cash", color: "#0ea5a4", soft: "#e6f7f7", ink: "#0b6f6e" },
  balance: { name: "What it owns and owes", color: "#7c5cff", soft: "#f1edff", ink: "#5b3fd6" },
  market: { name: "The share price", color: "#f59e0b", soft: "#fef6e7", ink: "#8a5300" },
};
const ORDER: Exclude<MapGroup, "forces">[] = ["sales", "cash", "balance", "market"];
// The few ideas everyone should see first sit on the inner ring.
const INNER = new Set(["revenue", "profit", "margin", "fcf", "cash", "debt", "eps", "pe"]);

const W = 1200;
const H = 560;
const CX = W / 2;
const CY = H / 2;

type Placed = MapNode & { px: number; py: number; inner: boolean };

function layout(nodes: MapNode[]): Placed[] {
  const core = ORDER.flatMap((g) => nodes.filter((n) => n.group === g));
  const ring = (list: MapNode[], rx: number, ry: number, offset: number, inner: boolean) =>
    list.map((n, i) => {
      const a = offset + (i / list.length) * Math.PI * 2;
      return { ...n, px: CX + Math.cos(a) * rx, py: CY + Math.sin(a) * ry, inner };
    });
  const inner = core.filter((n) => INNER.has(n.id));
  const outer = core.filter((n) => !INNER.has(n.id));
  return [...ring(inner, 270, 150, -Math.PI * 0.62, true), ...ring(outer, 500, 232, -Math.PI * 0.55, false)];
}

export function KeyMap({ nodes, company, ticker, stepTitles }: { nodes: MapNode[]; company: string; ticker: string; stepTitles: Record<string, string> }) {
  const placed = useMemo(() => layout(nodes.filter((n) => n.group !== "forces")), [nodes]);
  const byId = useMemo(() => new Map(placed.map((n) => [n.id, n])), [placed]);
  const [hover, setHover] = useState<string | null>(null);
  const [picked, setPicked] = useState<string>("revenue");
  const focus = hover ?? picked;
  const sel = byId.get(focus) ?? placed[0];
  const links = EDGES.filter((e) => (e.from === focus || e.to === focus) && byId.has(e.from) && byId.has(e.to));
  const near = new Set(links.flatMap((e) => [e.from, e.to]));
  const g = GROUP[sel.group as Exclude<MapGroup, "forces">];
  // Each link bows gently away from the middle. What it means is written in the panel, so the map stays uncluttered.
  const curves = links.map((e) => {
    const a = byId.get(e.from)!;
    const b = byId.get(e.to)!;
    const mx = (a.px + b.px) / 2 + (CY - (a.py + b.py) / 2) * 0.18;
    const my = (a.py + b.py) / 2 + ((a.px + b.px) / 2 - CX) * 0.08;
    return { key: `${e.from}-${e.to}`, d: `M${a.px},${a.py} Q${mx},${my} ${b.px},${b.py}` };
  });

  const chip = (n: Placed, compact = false) => {
    const gg = GROUP[n.group as Exclude<MapGroup, "forces">];
    const on = n.id === focus;
    const lit = near.has(n.id);
    return (
      <button
        type="button"
        onMouseEnter={() => setHover(n.id)}
        onMouseLeave={() => setHover(null)}
        onFocus={() => setHover(n.id)}
        onBlur={() => setHover(null)}
        onClick={() => setPicked(n.id)}
        aria-pressed={n.id === picked}
        className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border transition-[background-color,border-color,box-shadow,opacity,transform] duration-200 ${
          compact ? "px-3 py-1.5 text-[13px]" : n.inner ? "px-3.5 py-2 text-[14.5px] font-semibold" : "px-3 py-1.5 text-[13px] font-medium"
        }`}
        style={{
          background: on ? gg.ink : lit ? gg.soft : "rgba(255,255,255,0.92)",
          borderColor: on ? gg.ink : lit ? gg.color : "#e7e9ee",
          color: on ? "#fff" : "#0c0f14",
          boxShadow: on ? `0 12px 24px -12px ${gg.color}` : "0 6px 16px -14px rgba(12,15,20,0.5)",
          opacity: focus && !on && !lit && hover ? 0.45 : 1,
        }}
      >
        <span aria-hidden="true" className="h-2 w-2 flex-none rounded-full" style={{ background: on ? "#fff" : gg.color }} />
        {n.label}
      </button>
    );
  };

  return (
    <section aria-labelledby="keymap-title" className="overflow-hidden rounded-[28px] border border-line bg-white/80 backdrop-blur">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-5 py-4 sm:px-7">
        <div>
          <h2 id="keymap-title" className="font-display text-[22px] font-semibold tracking-[-0.03em]">
            {company} at a glance
          </h2>
          <p className="text-[14px] text-muted">The key ideas in its reports and how they connect. Point at any one, or tap it to keep it open.</p>
        </div>
        <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-[13px] text-muted">
          {ORDER.map((k) => (
            <li key={k} className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: GROUP[k].color }} />
              {GROUP[k].name}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* The map (tablets and up) */}
        <div className="relative hidden aspect-[1200/560] sm:block">
          <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
            <defs>
              <radialGradient id="km-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0" stopColor={g.color} stopOpacity="0.16" />
                <stop offset="1" stopColor={g.color} stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse cx={CX} cy={CY} rx="500" ry="232" fill="none" stroke="#eef0f3" strokeDasharray="2 8" />
            <ellipse cx={CX} cy={CY} rx="270" ry="150" fill="none" stroke="#eef0f3" strokeDasharray="2 8" />
            <circle cx={CX} cy={CY} r="150" fill="url(#km-glow)" className="transition-[fill] duration-500" />
            {/* quiet spokes from the company to every idea */}
            {placed.map((n) => (
              <line key={`s-${n.id}`} x1={CX} y1={CY} x2={n.px} y2={n.py} stroke="#e9ecf1" strokeWidth="1" />
            ))}
            {/* how the focused idea connects to others */}
            {curves.map((c) => (
              <path key={c.key} d={c.d} fill="none" stroke={g.color} strokeWidth="2" strokeLinecap="round" strokeDasharray="6 6" className="km-flow fathom-pop" />
            ))}
          </svg>
          {/* the company in the middle */}
          <div className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1" style={{ left: "50%", top: "50%" }}>
            <span className="flex h-[78px] w-[78px] items-center justify-center rounded-full bg-ink font-display text-[17px] font-semibold tracking-[-0.02em] text-white shadow-[0_18px_40px_-18px_rgba(12,15,20,0.7)]">
              {ticker}
            </span>
          </div>
          {placed.map((n, i) => (
            <div
              key={n.id}
              className="km-in absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${(n.px / W) * 100}%`, top: `${(n.py / H) * 100}%`, animationDelay: `${i * 40}ms`, zIndex: n.id === focus ? 3 : near.has(n.id) ? 2 : 1 }}
            >
              {chip(n)}
            </div>
          ))}
        </div>

        {/* Phones: the same ideas as chips, grouped by colour */}
        <div className="flex flex-col gap-3 px-5 pt-5 sm:hidden">
          {ORDER.map((k) => (
            <div key={k} className="flex flex-wrap gap-1.5">
              {placed.filter((n) => n.group === k).map((n) => (
                <span key={n.id}>{chip(n, true)}</span>
              ))}
            </div>
          ))}
        </div>

        {/* What the focused idea means, and this company's figure */}
        <aside aria-live="polite" className="flex flex-col gap-3 border-line p-5 sm:p-7 lg:border-l">
          <span className="inline-flex items-center gap-2 self-start rounded-full px-2.5 py-1 text-[12px] font-semibold" style={{ background: g.soft, color: g.ink }}>
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: g.color }} />
            {g.name}
          </span>
          <h3 className="font-display text-[24px] font-semibold leading-tight tracking-[-0.03em]">{sel.label}</h3>
          <p className="-mt-1 text-[14px] text-muted">In plain words: {sel.plain.toLowerCase()}</p>
          {sel.value && (
            <p className="rounded-2xl px-4 py-3 text-[16px] leading-snug" style={{ background: g.soft }}>
              <span className="block text-[12px] font-semibold uppercase tracking-wide" style={{ color: g.ink }}>
                {company}
              </span>
              <strong className="font-semibold text-ink">{sel.value}</strong>
            </p>
          )}
          <p className="text-[15px] leading-relaxed">{sel.definition}</p>
          {links.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold uppercase tracking-wide text-muted">How it connects</span>
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {links.map((e) => {
                  const other = e.from === sel.id ? e.to : e.from;
                  const og = GROUP[byId.get(other)!.group as Exclude<MapGroup, "forces">];
                  return (
                    <li key={`${e.from}-${e.to}`}>
                      <button
                        type="button"
                        onClick={() => setPicked(other)}
                        className="group flex w-full items-start gap-2 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-panel-2"
                      >
                        <span aria-hidden="true" className="mt-[7px] h-2 w-2 flex-none rounded-full" style={{ background: og.color }} />
                        <span className="text-[13.5px] leading-snug">
                          <span className="font-semibold">
                            {byId.get(e.from)?.label} <span aria-label="leads to">→</span> {byId.get(e.to)?.label}
                          </span>
                          {e.label && <span className="block text-muted">{e.label}</span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {stepTitles[sel.step] && (
            <a href={`#step-${sel.step}`} className="mt-auto self-start text-[14px] font-semibold no-underline hover:underline">
              Read more in “{stepTitles[sel.step]}” →
            </a>
          )}
        </aside>
      </div>
    </section>
  );
}
