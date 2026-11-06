"use client";

/**
 * The pictures for the financial statements: a waterfall (from sales to profit, from
 * cash at the start to cash at the end, from equity at the start to the end) and the
 * balance sheet's two bars (what it owns, and who paid for it). Every part answers to
 * hover, tap and keyboard, and says in words what it is.
 */
import { useState } from "react";
import type { BalancePart, Step } from "@/lib/statements/model";
import { compact } from "@/lib/statements/format";
import { CountUp } from "@/components/viz/CountUp";

const INK = "#0c0f14";
const BLUE = "#2d5bff";
const UP = "#0ea5a4";
const DOWN = "#f43f5e";

/** Where each bar starts and ends on a shared scale: totals from zero, changes from the running level. */
function spansOf(steps: Step[]): { from: number; to: number }[] {
  const out: { from: number; to: number }[] = [];
  let level = 0;
  for (const s of steps) {
    if (s.anchor) {
      level = s.value;
      out.push({ from: Math.min(0, s.value), to: Math.max(0, s.value) });
    } else {
      const from = level;
      level += s.value;
      out.push({ from: Math.min(from, level), to: Math.max(from, level) });
    }
  }
  return out;
}

/** The running total after each bar. */
function levelsOf(steps: Step[]): number[] {
  const out: number[] = [];
  let level = 0;
  for (const s of steps) {
    level = s.anchor ? s.value : level + s.value;
    out.push(level);
  }
  return out;
}

export function Waterfall({ steps, caption, startHint, base }: { steps: Step[]; caption?: string; startHint?: string; base?: number }) {
  const [sel, setSel] = useState<number | null>(null);
  const spans = spansOf(steps);
  const lo = Math.min(0, ...spans.map((x) => x.from));
  const hi = Math.max(0, ...spans.map((x) => x.to));
  const range = hi - lo || 1;
  const pct = (v: number) => ((v - lo) / range) * 100;
  const chosen = sel === null ? null : steps[sel];
  const last = steps.length - 1;
  // Where the running total stood before each bar: a thin connector joins one bar to the next there.
  const levels = levelsOf(steps);
  const before = steps.map((_, i) => (i === 0 ? undefined : levels[i - 1]));

  return (
    <figure className="m-0 flex flex-col gap-3">
      {caption && <figcaption className="text-[13px] text-muted">{caption}</figcaption>}
      <ol className="m-0 flex list-none flex-col p-0" onMouseLeave={() => setSel(null)}>
        {steps.map((s, i) => {
          const sp = spans[i];
          const color = s.anchor ? (i === last ? BLUE : INK) : s.value >= 0 ? UP : DOWN;
          const on = sel === i;
          const share = base && s.anchor && base > 0 && i > 0 ? Math.round((s.value / base) * 1000) / 10 : undefined;
          return (
            <li key={s.key + i}>
              <button
                type="button"
                onClick={() => setSel(on ? null : i)}
                onMouseEnter={() => setSel(i)}
                onFocus={() => setSel(i)}
                aria-pressed={on}
                aria-label={`${s.label}: ${s.anchor ? compact(s.value) : `${s.value >= 0 ? "plus" : "minus"} ${compact(Math.abs(s.value))}`}`}
                className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-sm px-2 text-left transition-colors sm:grid-cols-[minmax(9rem,15rem)_minmax(0,1fr)_7.5rem] ${on ? "bg-panel-2" : "hover:bg-panel-2/70"}`}
              >
                <span className={`py-1 text-[14px] sm:py-0 ${s.anchor ? "font-semibold text-ink" : "text-ink/80"}`}>
                  {!s.anchor && <span aria-hidden="true" className="mr-1.5 inline-block w-3 text-center font-semibold text-muted">{s.value >= 0 ? "+" : "−"}</span>}
                  {s.label}
                </span>
                <span className="order-3 col-span-2 sm:order-none sm:col-span-1">
                  <span className="relative block h-9">
                    {/* recessive track and zero line */}
                    <span aria-hidden="true" className="absolute inset-x-0 top-[10px] h-4 rounded-[2px] bg-panel-2/70" />
                    {lo < 0 && <span aria-hidden="true" className="absolute inset-y-0 w-px bg-muted/50" style={{ left: `${pct(0)}%` }} />}
                    {before[i] !== undefined && (
                      <span aria-hidden="true" className="absolute top-[-10px] h-5 w-px bg-muted/45" style={{ left: `${pct(before[i]!)}%` }} />
                    )}
                    <span
                      className="fathom-grow-right absolute top-[10px] h-4"
                      style={{
                        left: `${pct(sp.from)}%`,
                        width: `${Math.max(0.6, pct(sp.to) - pct(sp.from))}%`,
                        background: color,
                        borderRadius: s.anchor ? "0 4px 4px 0" : "4px",
                        animationDelay: `${i * 80}ms`,
                        transformOrigin: !s.anchor && s.value < 0 ? "right" : "left",
                        boxShadow: on ? `0 0 0 2px #fff, 0 0 0 4px ${color}` : undefined,
                      }}
                    />
                  </span>
                </span>
                <span className="py-1 text-right text-[14px] font-semibold tabular-nums text-ink sm:py-0">
                  {s.anchor ? <CountUp text={compact(s.value)} /> : `${s.value >= 0 ? "+" : "−"}${compact(Math.abs(s.value))}`}
                  {share !== undefined && <span className="block text-[11.5px] font-normal text-muted">{share}% of sales</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-2 text-[12.5px] text-muted" aria-hidden="true">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: INK }} /> Running total</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: UP }} /> Added</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: DOWN }} /> Taken away</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: BLUE }} /> Where it ends</span>
      </div>
      <div className="min-h-[4.5em] rounded-sm bg-panel-2 px-4 py-3 text-[14.5px] leading-relaxed" aria-live="polite">
        {chosen ? <StepDetail step={chosen} /> : <span className="text-muted">{startHint ?? "Point at or tap a bar to see the lines inside it."}</span>}
      </div>
    </figure>
  );
}

function StepDetail({ step }: { step: Step }) {
  const max = Math.max(...step.lines.map((l) => Math.abs(l.value)), 1);
  const showLines = step.lines.length > 1 || (step.lines[0] && step.lines[0].plain !== step.label);
  return (
    <div className="flex flex-col gap-2">
      <p className="m-0">
        <strong className="font-semibold text-ink">{step.label}.</strong> <span className="text-muted">{step.note}</span>
      </p>
      {showLines && (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {step.lines.map((l, i) => (
            <li key={l.label + i} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 text-[13.5px]">
              <span className="min-w-0">
                <span className="text-ink">{l.plain}</span>
                {l.label.toLowerCase() !== l.plain.toLowerCase() && <span className="text-muted"> ({l.label})</span>}
              </span>
              <span className={`text-right font-semibold tabular-nums ${l.value < 0 ? "text-[#b4233c]" : "text-ink"}`}>{l.value < 0 ? `−${compact(-l.value)}` : compact(l.value)}</span>
              <span className="col-span-2 block h-1.5 rounded-[1px] bg-white">
                <span className="block h-full rounded-[1px]" style={{ width: `${(Math.abs(l.value) / max) * 100}%`, background: l.value < 0 ? DOWN : UP, opacity: 0.75 }} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- balance sheet

const GROUP_STYLE: Record<BalancePart["group"], { name: string; shades: string[] }> = {
  currentAssets: { name: "Short-term (within a year)", shades: ["#2d5bff", "#5577ff", "#7d97ff", "#a4b6ff", "#c3cfff", "#3a4fd0"] },
  assets: { name: "Long-term", shades: ["#7c5cff", "#9a80ff", "#b6a3ff", "#5b3fd6", "#cfc2ff", "#8e70f0"] },
  currentLiabilities: { name: "Due within a year", shades: ["#f59e0b", "#f7b23f", "#fac56e", "#d98a06", "#fcd99b", "#e8a530"] },
  liabilities: { name: "Due later", shades: ["#f43f5e", "#f76a82", "#fa95a6", "#d42c4a", "#fcbfca", "#e85570"] },
  equity: { name: "Shareholders' equity", shades: ["#16a34a"] },
};

type Piece = BalancePart & { color: string; key: string };

/** Light fills get near-black text, darker fills white. */
function inkOn(hex: string): string {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.32 ? "#0c0f14" : "#ffffff";
}

function colourise(parts: BalancePart[]): Piece[] {
  const used: Record<string, number> = {};
  return parts.map((p, i) => {
    const n = used[p.group] ?? 0;
    used[p.group] = n + 1;
    const shades = GROUP_STYLE[p.group].shades;
    return { ...p, color: p.plain === "Not listed line by line" ? "#c9ced8" : shades[n % shades.length], key: `${p.group}-${i}` };
  });
}

export function BalanceBars({ assets, owed, equity, totalAssets }: { assets: BalancePart[]; owed: BalancePart[]; equity: number; totalAssets: number }) {
  const [sel, setSel] = useState<Piece | null>(null);
  const left = colourise(assets);
  const right = colourise([...owed, ...(equity > 0 ? [{ label: "Total shareholders' equity", plain: "Shareholders' equity", value: equity, group: "equity" as const, what: "What would be left for shareholders if everything it owns paid off everything it owes, at book values." }] : [])]);
  const owedTotal = owed.reduce((a, p) => a + p.value, 0);
  const scale = Math.max(totalAssets, owedTotal + Math.max(0, equity)) || 1;
  const perDollar = owedTotal > 0 ? totalAssets / owedTotal : undefined;

  const bar = (pieces: Piece[], title: string, sub: string, total: number) => (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-[14px]">
        <span>
          <span className="font-semibold">{title}</span> <span className="text-muted">{sub}</span>
        </span>
        <span className="font-semibold tabular-nums">{compact(total)}</span>
      </div>
      <div className="flex h-7 w-full gap-[2px]" role="group" aria-label={title}>
        {pieces.map((p, i) => {
          const share = p.value / scale;
          return (
            <button
              key={p.key}
              type="button"
              title={`${p.plain}: ${compact(p.value)}`}
              aria-label={`${p.plain}: ${compact(p.value)}, ${Math.round(share * 100)}%`}
              aria-pressed={sel?.key === p.key}
              onMouseEnter={() => setSel(p)}
              onFocus={() => setSel(p)}
              onClick={() => setSel(p)}
              className="fathom-grow-right relative h-full min-w-[3px] cursor-pointer rounded-[4px] transition-opacity hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean"
              style={{ width: `${share * 100}%`, background: p.color, opacity: sel && sel.key !== p.key ? 0.4 : 1, animationDelay: `${i * 45}ms` }}
            >
              {share >= 0.07 && (
                <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-[12px] font-semibold tabular-nums" style={{ color: inkOn(p.color) }}>
                  {Math.round(share * 100)}%
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <figure className="m-0 flex flex-col gap-4">
      {bar(left, "What it owns", "(assets)", totalAssets)}
      {bar(right, "How it was paid for", "(what it owes, plus shareholders' equity)", owedTotal + Math.max(0, equity))}
      {equity <= 0 && (
        <p className="m-0 rounded-sm bg-[#fef6e7] px-3 py-2 text-[14px] text-[#8a5300]">
          It owes more than it owns at book values, so shareholders&apos; equity is negative ({compact(equity)}). This happens at some companies that have
          handed back a lot of cash through buybacks and dividends; it isn&apos;t always a sign of trouble.
        </p>
      )}
      <div className="min-h-[3.5em] rounded-sm bg-panel-2 px-4 py-3 text-[14.5px] leading-relaxed" aria-live="polite">
        {sel ? (
          <p className="m-0">
            <strong className="font-semibold text-ink">
              {sel.plain}: {compact(sel.value)}
            </strong>{" "}
            <span className="text-muted">
              ({Math.round((sel.value / scale) * 1000) / 10}% of the total){sel.label.toLowerCase() !== sel.plain.toLowerCase() ? `, filed as "${sel.label}"` : ""}. {sel.what}
            </span>
          </p>
        ) : (
          <span className="text-muted">Tap or point at any piece to see what it is.</span>
        )}
      </div>
      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        <Legend pieces={left} onPick={setSel} sel={sel} total={scale} />
        <Legend pieces={right} onPick={setSel} sel={sel} total={scale} />
      </div>
      {perDollar !== undefined && (
        <p className="m-0 text-[14px] text-muted">
          For every <strong className="text-ink">$1</strong> it owes, it owns <strong className="text-ink">${perDollar.toFixed(2)}</strong>.
        </p>
      )}
    </figure>
  );
}

function Legend({ pieces, onPick, sel, total }: { pieces: Piece[]; onPick: (p: Piece) => void; sel: Piece | null; total: number }) {
  const groups = [...new Set(pieces.map((p) => p.group))];
  return (
    <div className="flex flex-col gap-3">
      {groups.map((g) => (
        <div key={g} className="flex flex-col gap-1">
          <p className="m-0 text-[12px] font-semibold uppercase tracking-wide text-muted">{GROUP_STYLE[g].name}</p>
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
            {pieces
              .filter((p) => p.group === g)
              .map((p) => (
                <li key={p.key}>
                  <button type="button" onClick={() => onPick(p)} onMouseEnter={() => onPick(p)} className={`flex w-full items-center gap-2 rounded-sm px-1 py-0.5 text-left text-[13.5px] ${sel?.key === p.key ? "bg-panel-2 text-ink" : "text-ink/80 hover:text-ink"}`}>
                    <span aria-hidden="true" className="h-2.5 w-2.5 flex-none rounded-[2px]" style={{ background: p.color }} />
                    <span className="min-w-0 flex-1 truncate">{p.plain}</span>
                    <span className="tabular-nums text-muted">{Math.round((p.value / total) * 100)}%</span>
                    <span className="w-[4.5rem] text-right font-semibold tabular-nums">{compact(p.value)}</span>
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
