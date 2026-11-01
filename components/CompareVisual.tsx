"use client";

/**
 * The comparison as pictures. Pick a figure and each company's bar slides to its
 * place (with a zero line when any figure is below zero); point at a company to
 * follow it across every figure. Neutral throughout: it shows where each
 * company sits, never which is better. Bars stay still for anyone who asked for less motion.
 */
import { useMemo, useState } from "react";
import { accentAt } from "@/lib/accents";

export type CompareVizCell = { ticker: string; value: number | null; display: string; mark?: "highest" | "lowest" };
export type CompareVizRow = {
  id: string;
  group: string;
  groupTitle: string;
  name: string;
  plain: string;
  unit: "currency" | "percent" | "ratio" | "per-share";
  cells: CompareVizCell[];
};

const trim = (n: number) => (Math.round(n * 10) / 10).toLocaleString("en-US", { maximumFractionDigits: 1 });

/** How far apart the highest and lowest are, in plain words; nothing when it can't be said simply. */
function gapText(row: CompareVizRow, nameOf: (t: string) => string): string | null {
  const hi = row.cells.find((c) => c.mark === "highest");
  const lo = row.cells.find((c) => c.mark === "lowest");
  if (!hi || !lo || hi.value === null || lo.value === null) return null;
  if (row.unit === "percent") return `${nameOf(hi.ticker)} and ${nameOf(lo.ticker)} are ${trim(Math.abs(hi.value - lo.value) * 100)} percentage points apart.`;
  if (hi.value > 0 && lo.value > 0) {
    const x = hi.value / lo.value;
    if (x < 1.05) return `${nameOf(hi.ticker)} and ${nameOf(lo.ticker)} are within 5% of each other.`;
    return `${nameOf(hi.ticker)}'s figure is ${x >= 10 ? Math.round(x).toLocaleString("en-US") : trim(x)} times ${nameOf(lo.ticker)}'s.`;
  }
  return null;
}

/** Where each value sits on a scale that always includes zero: [start, width] as fractions. */
function scale(values: number[]) {
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const range = max - min || 1;
  return {
    zero: -min / range,
    bar: (v: number) => ({ left: (Math.min(v, 0) - min) / range, width: Math.abs(v) / range }),
    at: (v: number) => (v - min) / range,
  };
}

export function CompareVisual({ companies, rows }: { companies: { ticker: string; company: string }[]; rows: CompareVizRow[] }) {
  const [metric, setMetric] = useState(rows[0]?.id);
  const [hover, setHover] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const focus = hover ?? pinned;
  const colour = useMemo(() => new Map(companies.map((c, i) => [c.ticker, accentAt(i)])), [companies]);
  const nameOf = (t: string) => companies.find((c) => c.ticker === t)?.company ?? t;
  const row = rows.find((r) => r.id === metric) ?? rows[0];
  const groups = useMemo(() => {
    const out: { id: string; title: string; rows: CompareVizRow[] }[] = [];
    for (const r of rows) {
      const g = out.find((x) => x.id === r.group);
      if (g) g.rows.push(r);
      else out.push({ id: r.group, title: r.groupTitle, rows: [r] });
    }
    return out;
  }, [rows]);
  if (!row) return null;

  const reported = row.cells.filter((c): c is CompareVizCell & { value: number } => c.value !== null);
  const s = scale(reported.map((c) => c.value));
  const hasNegative = reported.some((c) => c.value < 0);
  const gap = gapText(row, nameOf);
  const dim = (t: string) => (focus && focus !== t ? 0.3 : 1);

  const pick = (id: string) => setMetric(id);

  return (
    <section aria-labelledby="viz-title" className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line px-5 py-4 sm:px-7">
        <div>
          <h2 id="viz-title" className="font-display text-[22px] font-semibold tracking-[-0.03em]">
            See the difference
          </h2>
          <p className="text-[14px] text-muted">Pick a figure to see how they line up. Point at a company, or tap it, to follow it through every figure.</p>
        </div>
        <div role="group" aria-label="Follow a company" className="flex flex-wrap gap-1.5">
          {companies.map((c) => {
            const a = colour.get(c.ticker)!;
            const on = pinned === c.ticker;
            return (
              <button
                key={c.ticker}
                type="button"
                aria-pressed={on}
                onMouseEnter={() => setHover(c.ticker)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(c.ticker)}
                onBlur={() => setHover(null)}
                onClick={() => setPinned(on ? null : c.ticker)}
                className="inline-flex min-h-9 items-center gap-2 rounded-sm border px-3 text-[13.5px] font-semibold transition-[background-color,border-color,color,opacity] duration-200"
                style={{
                  background: on ? a.ink : focus === c.ticker ? a.soft : "#fff",
                  borderColor: on ? a.ink : focus === c.ticker ? a.solid : "#e7e9ee",
                  color: on ? "#fff" : "#0c0f14",
                  opacity: dim(c.ticker) < 1 ? 0.55 : 1,
                }}
              >
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ background: on ? "#fff" : a.solid }} />
                {c.company}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Which figure */}
        <nav aria-label="Choose a figure" className="flex flex-col gap-4 border-line p-5 sm:p-7 lg:border-r">
          {groups.map((g) => (
            <div key={g.id} className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-mid">{g.title}</span>
              <div className="flex flex-wrap gap-1.5">
                {g.rows.map((r) => {
                  const on = r.id === row.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => pick(r.id)}
                      className={`rounded-sm border px-3 py-1.5 text-[13.5px] font-medium transition-[background-color,border-color,color,transform] duration-200 hover:-translate-y-0.5 ${
                        on ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-ink/40"
                      }`}
                    >
                      {r.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* The chosen figure, as bars */}
        <div className="flex flex-col gap-5 p-5 sm:p-7">
          <div aria-live="polite">
            <h3 className="font-display text-[26px] font-semibold leading-tight tracking-[-0.03em]">{row.name}</h3>
            <p className="text-[15px] text-muted">{row.plain}.</p>
          </div>

          <ul className="relative m-0 flex list-none flex-col gap-4 p-0">
            {hasNegative && (
              <span aria-hidden="true" className="pointer-events-none absolute bottom-0 top-0 w-px bg-ink/25 transition-[left] duration-700" style={{ left: `${s.zero * 100}%` }}>
                <span className="absolute -top-5 -translate-x-1/2 text-[11px] text-muted">0</span>
              </span>
            )}
            {row.cells.map((c) => {
              const a = colour.get(c.ticker)!;
              const b = c.value === null ? null : s.bar(c.value);
              return (
                <li
                  key={c.ticker}
                  className="flex flex-col gap-1.5 transition-opacity duration-200"
                  style={{ opacity: dim(c.ticker) }}
                  onMouseEnter={() => setHover(c.ticker)}
                  onMouseLeave={() => setHover(null)}
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-[15px] font-semibold">
                      <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ background: a.solid }} />
                      {nameOf(c.ticker)}
                      {c.mark && (
                        <span className="rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide" style={{ background: a.soft, color: a.ink }}>
                          {c.mark === "highest" ? "Highest" : "Lowest"}
                        </span>
                      )}
                    </span>
                    <span className={`font-display tabular-nums ${c.value === null ? "text-[14px] text-muted" : "text-[20px] font-semibold"}`}>{c.value === null ? "Not reported" : c.display}</span>
                  </span>
                  <span className="relative h-3.5 overflow-hidden rounded-sm bg-panel-2">
                    {b && (
                      <span
                        className="fathom-grow-right absolute inset-y-0 rounded-sm transition-[left,width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                        style={{
                          left: `${b.left * 100}%`,
                          width: `${Math.max(b.width * 100, 0.8)}%`,
                          background: a.solid,
                        }}
                      />
                    )}
                  </span>
                </li>
              );
            })}
          </ul>

          {gap && <p className="rounded-2xl bg-mist px-4 py-3 text-[15px] leading-snug">{gap}</p>}
        </div>
      </div>

    </section>
  );
}
