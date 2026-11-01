/**
 * Compare 2 to 5 companies side by side, from their own SEC figures.
 * The companies are in the address (/compare?t=KO,PEP), so the link saves and shares it.
 */
import type { Metadata } from "next";
import { accentAt } from "@/lib/accents";
import Link from "next/link";
import { Suspense } from "react";
import { ComparePicker } from "@/components/ComparePicker";
import { CompareVisual, type CompareVizRow } from "@/components/CompareVisual";
import { Loader } from "@/components/Loader";
import { PageTitle } from "@/components/PageTitle";
import { SourceLink } from "@/components/SourceLink";
import { TermName } from "@/components/TermName";
import { buildComparison, MAX_COMPANIES, MIN_COMPANIES, parseTickers, type CompareCell, type CompareRow } from "@/lib/compare/compare";
import { FUNDAMENTAL_GROUPS, fundamentalLens, type FundamentalGroupId } from "@/lib/lens/fundamental";
import { GROUP_ACCENT } from "@/components/FundamentalGlance";
import { figureValue, periodText, yearEndText } from "@/lib/lens/format";
import { displayName, searchCompanies } from "@/lib/report/company";

export const metadata: Metadata = {
  title: "Compare companies",
  description: "Put 2 to 5 US companies side by side: sales, profit, cash, debt and returns from their own reports, explained in plain English.",
};

const EXAMPLES = [
  { label: "Coca-Cola and PepsiCo", t: "KO,PEP" },
  { label: "Apple, Microsoft and Alphabet", t: "AAPL,MSFT,GOOGL" },
  { label: "Nike and Lululemon", t: "NKE,LULU" },
  { label: "Walmart, Costco and Target", t: "WMT,COST,TGT" },
];

export default function ComparePage(props: PageProps<"/compare">) {
  return (
    <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-10 px-5 py-12 sm:py-16 lg:px-10">
      <PageTitle
        title="Compare companies"
        note="Put 2 to 5 companies side by side, using their own figures from their reports to the SEC. Each figure is explained in everyday words."
      />
      <Suspense fallback={<Loader label="Reading their latest reports…" />}>
        <Compare searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Compare({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const tickers = parseTickers((await searchParams).t);
  const results = await Promise.all(tickers.map((t) => fundamentalLens.run(t, "US").catch(() => null)));
  const found = results.filter((r) => r !== null);
  const missing = tickers.filter((_, i) => !results[i]);
  const missingNames = await Promise.all(
    missing.map(async (t) => {
      const m = (await searchCompanies(t).catch(() => [])).find((c) => c.ticker === t);
      return m ? `${displayName(m.name)} (${t})` : t;
    }),
  );
  const chosen = found.map((r) => ({ ticker: r.ticker, name: r.meta.company }));

  return (
    <>
      <ComparePicker chosen={chosen} max={MAX_COMPANIES} />
      {missing.length > 0 && (
        <p className="rounded-2xl bg-mist p-4 text-[15px]">
          cand0r can&apos;t compare {missingNames.join(", ")}: it either isn&apos;t a US-listed company, or it doesn&apos;t file the
          yearly and quarterly reports (10-K and 10-Q) cand0r reads.
        </p>
      )}
      {found.length < MIN_COMPANIES ? <Start /> : <Table comparison={buildComparison(found)} />}
      <p className="px-1 text-[12px] leading-relaxed text-muted">
        This comparison shows what each company reported in its public filings, for education only. It doesn&apos;t rank the companies and isn&apos;t a
        recommendation to buy, sell or hold any of them.
      </p>
    </>
  );
}

function Start() {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[17px] font-semibold">Add at least two companies, or try one of these:</h2>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {EXAMPLES.map((e) => (
          <li key={e.t}>
            <Link href={`/compare?t=${e.t}`} className="fathom-lift inline-flex min-h-10 items-center rounded-full border border-line bg-white px-4 text-[15px] font-medium text-ink no-underline">
              {e.label}
            </Link>
          </li>
        ))}
      </ul>
      <p className="max-w-3xl text-[15px] leading-relaxed text-muted">
        Comparing works best for companies in the same kind of business: what counts as a normal profit margin or level of
        debt differs a lot between, say, a software company and a supermarket.
      </p>
    </section>
  );
}

function Table({ comparison: c }: { comparison: ReturnType<typeof buildComparison> }) {
  const groups = FUNDAMENTAL_GROUPS.map((g) => ({ ...g, rows: c.rows.filter((r) => r.group === g.id) })).filter((g) => g.rows.length > 0);
  // The pictures only use figures at least two of the companies reported.
  const viz: CompareVizRow[] = groups.flatMap((g) =>
    g.rows
      .filter((r) => r.cells.filter((x) => x.figure.status === "reported").length >= 2)
      .map((r) => ({
        id: r.id,
        group: g.id,
        groupTitle: g.title,
        name: r.name,
        plain: r.plain,
        unit: (r.cells.find((x) => x.figure.status === "reported")?.figure as { unit: CompareVizRow["unit"] }).unit,
        cells: r.cells.map((x) => ({ ticker: x.ticker, value: x.figure.status === "reported" ? x.figure.value : null, display: figureValue(x.figure), mark: x.mark })),
      })),
  );
  return (
    <>
      {c.warnings.length > 0 && (
        <section aria-labelledby="warnings-title" className="flex flex-col gap-2 rounded-2xl border border-[#e8c9a6] bg-[#fdf6ee] p-5">
          <h2 id="warnings-title" className="text-[17px] font-semibold">
            Before you compare: these figures aren&apos;t exactly like for like
          </h2>
          <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-relaxed">
            {c.warnings.map((w) => (
              <li key={w.kind}>{w.text}</li>
            ))}
          </ul>
        </section>
      )}

      {c.summary.length > 0 && (
        <section aria-labelledby="summary-title" className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-5 sm:px-6">
          <h2 id="summary-title" className="text-[13px] font-semibold uppercase tracking-wide text-mid">
            The main differences
          </h2>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[17px] leading-[1.55]">
            {c.summary.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <p className="text-[13px] text-muted">Written from the figures below only.</p>
        </section>
      )}

      {viz.length > 0 && <CompareVisual companies={c.companies.map((m) => ({ ticker: m.ticker, company: m.company }))} rows={viz} />}

      <SideBySide groups={groups} companies={c.companies} />
    </>
  );
}

type Company = ReturnType<typeof buildComparison>["companies"][number];
type Group = { id: FundamentalGroupId; title: string; plain: string; rows: CompareRow[] };

/**
 * Every figure as one clean table: one row per figure, one column per company. Each
 * value has a slim bar drawn to the same scale across its row, and the highest and
 * lowest are named in words. Periods and sources are listed once underneath.
 */
function SideBySide({ groups, companies }: { groups: Group[]; companies: Company[] }) {
  return (
    <section aria-labelledby="table-title" className="overflow-hidden rounded-2xl border border-line bg-white">
      <header className="flex flex-col gap-1 border-b border-line px-5 py-4 sm:px-6">
        <h2 id="table-title" className="font-display text-[22px] font-semibold tracking-[-0.03em]">
          Every figure, side by side
        </h2>
        <p className="text-[14px] text-muted">
          In US dollars, from each company&apos;s latest reports. Point at a term for its full meaning. Highest and lowest only show where each one sits in
          this group; neither is better or worse on its own.
        </p>
      </header>

      {/* Tablets and up: one table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="w-[300px] px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-muted sm:px-6">
                Figure
              </th>
              {companies.map((m, i) => (
                <th key={m.ticker} scope="col" className="px-4 py-3 align-bottom">
                  <Link href={`/stock/${m.ticker}`} className="fathom-grow inline-flex items-center gap-2 text-[15px] font-semibold text-ink no-underline">
                    <span aria-hidden="true" className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: accentAt(i).solid }} />
                    {m.company}
                  </Link>
                  <span className="block pl-[18px] text-[12px] font-normal text-muted">{m.ticker}</span>
                </th>
              ))}
            </tr>
          </thead>
          {groups.map((g) => {
            const a = GROUP_ACCENT[g.id];
            return (
              <tbody key={g.id}>
                <tr>
                  <th colSpan={companies.length + 1} scope="colgroup" className="px-5 pb-1.5 pt-5 text-left sm:px-6" style={{ background: a.soft }}>
                    <span className="flex items-baseline gap-2">
                      <span className="text-[13px] font-semibold uppercase tracking-[0.06em]" style={{ color: a.ink }}>
                        {g.title}
                      </span>
                      <span className="text-[13px] font-normal text-muted">{g.plain}</span>
                    </span>
                  </th>
                </tr>
                {g.rows.map((r) => {
                  const top = rowMax(r);
                  return (
                    <tr key={r.id} className="border-t border-line">
                      <th scope="row" className="px-5 py-3 align-top font-normal sm:px-6">
                        <span className="block text-[14.5px] font-semibold">
                          <TermName k={r.term} full label={r.name} />
                        </span>
                        <span className="block text-[13px] leading-snug text-muted">{r.plain}</span>
                      </th>
                      {r.cells.map((cell, i) => (
                        <td key={cell.ticker} className="px-4 py-3 align-top">
                          <Value cell={cell} color={accentAt(i).solid} top={top} />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            );
          })}
        </table>
      </div>

      {/* Phones: one card per figure */}
      <div className="flex flex-col md:hidden">
        {groups.map((g) => (
          <div key={g.id} className="flex flex-col">
            <h3 className="px-5 pb-1.5 pt-4 text-[13px] font-semibold uppercase tracking-[0.06em]" style={{ background: GROUP_ACCENT[g.id].soft, color: GROUP_ACCENT[g.id].ink }}>
              {g.title}
            </h3>
            {g.rows.map((r) => {
              const top = rowMax(r);
              return (
                <div key={r.id} className="flex flex-col gap-2 border-t border-line px-5 py-3">
                  <span className="text-[15px] font-semibold">
                    <TermName k={r.term} full label={r.name} />
                  </span>
                  <span className="-mt-1 text-[13px] leading-snug text-muted">{r.plain}</span>
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {r.cells.map((cell, i) => (
                      <li key={cell.ticker} className="grid grid-cols-[110px_minmax(0,1fr)] items-start gap-3">
                        <span className="inline-flex items-center gap-1.5 pt-0.5 text-[13px] font-semibold">
                          <span aria-hidden="true" className="h-2 w-2 flex-none rounded-full" style={{ background: accentAt(i).solid }} />
                          {companies[i]?.company ?? cell.ticker}
                        </span>
                        <Value cell={cell} color={accentAt(i).solid} top={top} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <Sources groups={groups} companies={companies} />
    </section>
  );
}

/** The largest size of any reported figure in a row, so every bar in the row uses the same scale. */
function rowMax(row: CompareRow): number {
  return Math.max(0, ...row.cells.map((c) => (c.figure.status === "reported" ? Math.abs(c.figure.value) : 0)));
}

/** One company's figure: the value, a slim bar to the row's scale, and "highest" or "lowest" in words. */
function Value({ cell, color, top }: { cell: CompareCell; color: string; top: number }) {
  const f = cell.figure;
  if (f.status !== "reported") {
    return (
      <span className="flex flex-col">
        <span className="text-[14px] font-semibold text-muted">Not reported</span>
        <span className="text-[12px] leading-snug text-muted">{f.reason}</span>
      </span>
    );
  }
  return (
    <span className="flex flex-col gap-1">
      <span className="flex items-baseline gap-2">
        <span className="font-display text-[18px] font-semibold tabular-nums">{figureValue(f)}</span>
        {cell.mark && (
          <span className="text-[11.5px] font-semibold" style={{ color }}>
            {cell.mark === "highest" ? "Highest" : "Lowest"}
          </span>
        )}
      </span>
      {top > 0 && (
        <span aria-hidden="true" className="block h-1.5 w-full max-w-[150px] overflow-hidden rounded-full bg-panel-2">
          <span
            className="fathom-grow-right block h-full rounded-full"
            style={{ width: `${Math.max(3, (Math.abs(f.value) / top) * 100)}%`, background: f.value < 0 ? "#f43f5e" : color }}
          />
        </span>
      )}
    </span>
  );
}

/** Periods and documents for every figure, listed once per company instead of under every number. */
function Sources({ groups, companies }: { groups: Group[]; companies: Company[] }) {
  return (
    <footer className="flex flex-col gap-3 border-t border-line px-5 py-4 sm:px-6">
      <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-muted">Periods and sources</h3>
      <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map((m, i) => {
          const seen = new Map<string, { period: string; source?: { url: string; name: string } }>();
          for (const g of groups)
            for (const r of g.rows) {
              const f = r.cells[i]?.figure;
              if (f?.status !== "reported") continue;
              const period = periodText(f.period);
              const src = f.sources[0];
              const key = `${period}|${src?.url}`;
              if (!seen.has(key)) seen.set(key, { period, source: src ? { url: src.url, name: src.name } : undefined });
            }
          return (
            <li key={m.ticker} className="flex flex-col gap-1 text-[13px]">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: accentAt(i).solid }} />
                {m.company}
                {yearEndText(m.fiscalYearEnd) && <span className="font-normal text-muted">· year ends {yearEndText(m.fiscalYearEnd)}</span>}
              </span>
              {[...seen.values()].map((x) => (
                <span key={x.period + x.source?.url} className="flex flex-wrap gap-x-1.5 text-muted">
                  {x.period}:
                  {x.source && <SourceLink href={x.source.url} label={x.source.name} />}
                </span>
              ))}
            </li>
          );
        })}
      </ul>
    </footer>
  );
}
