/**
 * The key figures from a company's latest yearly report, as compact tiles: the
 * real term (point at it for the full explanation), the figure, and one line on
 * what it says. Every other figure is one tap away, in a tidy table.
 */
import Link from "next/link";
import { FUNDAMENTAL_GROUPS, type FundamentalData, type FundamentalGroupId, type FundamentalMetricId, type MetricRow } from "@/lib/lens/fundamental";
import { figureValue, periodText } from "@/lib/lens/format";
import type { LensResult } from "@/lib/lens/types";
import { ACCENTS, type Accent } from "@/lib/accents";
import { SourceChips } from "./Lite";
import { TermName } from "./TermName";

const HEADLINE: FundamentalMetricId[] = ["revenue", "revenueGrowth", "netMargin", "freeCashFlow", "debtToEquity", "returnOnEquity"];

/** One colour per group of figures, used the same way on Compare. */
export const GROUP_ACCENT: Record<FundamentalGroupId, Accent> = {
  size: ACCENTS.blue,
  profitability: ACCENTS.teal,
  cash: ACCENTS.amber,
  safety: ACCENTS.violet,
  returns: ACCENTS.rose,
};

export function FundamentalGlance({ result }: { result: LensResult<FundamentalData> }) {
  const { rows } = result.data;
  const headline = HEADLINE.map((id) => rows.find((r) => r.id === id)!).filter(Boolean);
  return (
    <section id="fundamentals" data-part="Key numbers" aria-labelledby="fundamentals-title" className="flex scroll-mt-20 flex-col overflow-hidden rounded-2xl border border-line bg-white">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <div>
          <h2 id="fundamentals-title" className="font-display text-[22px] font-semibold tracking-[-0.03em]">
            Key numbers
          </h2>
          <p className="text-[14px] text-muted">From its latest yearly report. Point at a term to see exactly what it means.</p>
        </div>
        <Link href={`/compare?t=${encodeURIComponent(result.ticker)}`} className="text-[14px] font-semibold no-underline hover:underline">
          Compare with other companies →
        </Link>
      </header>

      <div className="flex flex-col gap-5 px-5 py-5 sm:px-6">
        {result.summary.length > 0 && <p className="text-[16px] leading-[1.6]">{result.summary.join(" ")}</p>}

        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
          {headline.map((r) => (
            <Tile key={r.id} row={r} />
          ))}
        </ul>

        <details className="group rounded-xl border border-line">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 text-[15px] font-semibold">
            All {rows.length} figures, grouped
            <svg className="transition-transform group-open:rotate-180" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </summary>
          <div className="flex flex-col gap-6 border-t border-line p-4">
            {FUNDAMENTAL_GROUPS.map((g) => {
              const list = rows.filter((r) => r.group === g.id);
              if (list.length === 0) return null;
              const a = GROUP_ACCENT[g.id];
              return (
                <div key={g.id} className="flex flex-col gap-1">
                  <h3 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.06em]" style={{ color: a.ink }}>
                    <span aria-hidden="true" className="h-2 w-2 rounded-sm" style={{ background: a.solid }} />
                    {g.title}
                  </h3>
                  <ul className="m-0 flex list-none flex-col p-0">
                    {list.map((r) => (
                      <li key={r.id} className="grid gap-x-4 gap-y-0.5 border-t border-line py-2.5 first:border-t-0 sm:grid-cols-[200px_120px_minmax(0,1fr)]">
                        <span className="text-[14.5px] font-semibold">
                          <TermName k={r.term} full label={r.name} />
                        </span>
                        <span className="font-display text-[17px] font-semibold tabular-nums sm:text-right">{figureValue(r.figure)}</span>
                        <span className="text-[13.5px] leading-snug text-muted">
                          {r.reading ?? (r.figure.status !== "reported" ? r.figure.reason : "")}
                          {r.figure.status === "reported" && <span className="block text-[12px]">{periodText(r.figure.period)}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            <p className="text-[12.5px] leading-relaxed text-muted">
              US dollars, as the company reported them under US accounting rules (US GAAP). candor only combines figures that cover exactly the same
              period or date, and shows &quot;Not reported&quot; rather than a zero when one is missing.
            </p>
          </div>
        </details>
      </div>
    </section>
  );
}

function Tile({ row }: { row: MetricRow }) {
  const f = row.figure;
  const a = GROUP_ACCENT[row.group];
  return (
    <li className="flex flex-col gap-1.5 rounded-xl border border-line p-4" style={{ borderTop: `3px solid ${a.solid}` }}>
      <span className="text-[14px] font-semibold">
        <TermName k={row.term} full label={row.name} />
      </span>
      <span className={`font-display font-semibold tabular-nums leading-none tracking-tight ${f.status === "reported" ? "text-[30px]" : "text-[18px] text-muted"}`} style={f.status === "reported" ? { color: a.ink } : undefined}>
        {figureValue(f)}
      </span>
      <p className="text-[14px] leading-snug">{row.reading ?? (f.status !== "reported" ? f.reason : "")}</p>
      {f.status === "reported" && (
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="text-[12px] text-muted">{periodText(f.period)}</span>
          <SourceChips sources={f.sources.slice(0, 1).map((s) => ({ url: s.url, label: s.name }))} />
        </div>
      )}
    </li>
  );
}
