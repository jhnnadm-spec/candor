"use client";

/**
 * The four financial statements, one at a time: pick the yearly or quarterly report,
 * pick a statement, see it as a picture, then read every line in plain English.
 */
import { useEffect, useMemo, useState } from "react";
import type { ReportStatements } from "@/lib/statements/load";
import type { Line, StatementView } from "@/lib/statements/model";
import { yearEarlier } from "@/lib/statements/model";
import { GUIDES } from "@/lib/statements/guide";
import { change, compact, niceDate } from "@/lib/statements/format";
import type { StatementKind } from "@/lib/sec/rpages";
import { BalanceBars, Waterfall } from "./Pictures";

export type ReportLite = Omit<ReportStatements, "pages">;
type Which = "annual" | "quarterly";

const KINDS: StatementKind[] = ["income", "balance", "cashflow", "equity"];
const COLORS: Record<StatementKind, { solid: string; soft: string; ink: string }> = {
  income: { solid: "#0ea5a4", soft: "#e6f7f7", ink: "#0b6f6e" },
  balance: { solid: "#7c5cff", soft: "#f1edff", ink: "#5b3fd6" },
  cashflow: { solid: "#f59e0b", soft: "#fef6e7", ink: "#8a5300" },
  equity: { solid: "#16a34a", soft: "#e8f6ec", ink: "#15803d" },
  comprehensive: { solid: "#64748b", soft: "#f1f3f6", ink: "#3f4a5a" },
};

const tag = (l: Line) => l.concept.replace(/^us-gaap_/, "");
function find(s: StatementView | undefined, tags: string[]): Line | undefined {
  if (!s) return undefined;
  for (const t of tags) {
    const l = s.lines.find((x) => tag(x) === t && !x.split && x.values[0] !== null);
    if (l) return l;
  }
  return undefined;
}

/** The one number on each statement's card. */
function headline(kind: StatementKind, r: ReportLite): { value?: number; caption: string } {
  const s = r.statements[kind];
  const label = s?.columns[0]?.label ?? "";
  const when = label.charAt(0).toLowerCase() + label.slice(1);
  switch (kind) {
    case "income": {
      const l = find(s, ["NetIncomeLoss", "ProfitLoss"]);
      return { value: l?.values[0] ?? undefined, caption: `${(l?.values[0] ?? 0) < 0 ? "loss" : "profit"}, ${when}` };
    }
    case "balance": {
      const l = find(s, ["Assets"]);
      return { value: l?.values[0] ?? undefined, caption: `owned on ${label}` };
    }
    case "cashflow": {
      const l = find(s, ["NetCashProvidedByUsedInOperatingActivities", "NetCashProvidedByUsedInOperatingActivitiesContinuingOperations"]);
      return { value: l?.values[0] ?? undefined, caption: `from the main business, ${when}` };
    }
    case "equity": {
      const p = s?.equity?.[0];
      return p ? { value: p.closing, caption: `shareholders' equity on ${niceDate(p.end)}` } : { caption: "shareholders' equity" };
    }
    default:
      return { caption: "" };
  }
}

export function StatementsExplorer({ company, annual, quarterly }: { company: string; annual?: ReportLite; quarterly?: ReportLite }) {
  const [which, setWhich] = useState<Which>(annual ? "annual" : "quarterly");
  const [kind, setKind] = useState<StatementKind>("income");
  const report = which === "annual" ? annual : quarterly;

  // Deep links: #balance, #cashflow … open that statement.
  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.replace("#", "") as StatementKind;
      if ((KINDS as string[]).includes(h) || h === "comprehensive") setKind(h);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);
  const pick = (k: StatementKind) => {
    setKind(k);
    history.replaceState(null, "", `#${k}`);
  };

  if (!report) return <p className="text-[16px] text-muted">No tagged annual or quarterly report was found for {company}.</p>;
  const s = report.statements[kind];
  const g = GUIDES[kind];
  const c = COLORS[kind];

  return (
    <div className="flex flex-col gap-5">
      {/* Yearly or quarterly */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Which report" className="inline-flex rounded-sm border border-line bg-white p-1">
          {(
            [
              ["annual", annual, "Yearly", "10-K"],
              ["quarterly", quarterly, "Latest quarter", "10-Q"],
            ] as const
          ).map(([id, r, label, form]) =>
            r ? (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={which === id}
                onClick={() => setWhich(id)}
                className={`flex min-h-10 flex-col items-start rounded-sm px-4 py-1 text-left transition-colors ${which === id ? "bg-ink text-white" : "text-muted hover:bg-panel-2 hover:text-ink"}`}
              >
                <span className="text-[14px] font-semibold leading-tight">
                  {label} <span className="font-normal opacity-70">({form})</span>
                </span>
                <span className="text-[11.5px] leading-tight opacity-80">period ending {r.periodEnd ? niceDate(r.periodEnd) : "—"}</span>
              </button>
            ) : null,
          )}
        </div>
        <p className="m-0 text-[13px] text-muted">
          As filed with the SEC on {niceDate(report.filingDate)} ·{" "}
          <a href={report.url} target="_blank" rel="noopener noreferrer">
            the full report
          </a>{" "}
          ·{" "}
          <a href={report.viewerUrl} target="_blank" rel="noopener noreferrer">
            SEC&apos;s figures viewer
          </a>
        </p>
      </div>

      {/* The four statements */}
      <div role="tablist" aria-label="Statements" className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {KINDS.map((k) => {
          const h = headline(k, report);
          const on = kind === k;
          const col = COLORS[k];
          const has = Boolean(report.statements[k]);
          return (
            <button
              key={k}
              role="tab"
              type="button"
              aria-selected={on}
              onClick={() => pick(k)}
              className="fathom-lift flex flex-col gap-1.5 rounded-sm border bg-white p-4 text-left"
              style={{ borderColor: on ? col.solid : "var(--color-line)", boxShadow: on ? `inset 0 0 0 1px ${col.solid}` : undefined, background: on ? col.soft : "#fff" }}
            >
              <span className="flex items-center gap-2 text-[12.5px] font-semibold" style={{ color: col.ink }}>
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[2px]" style={{ background: col.solid }} />
                {GUIDES[k].name}
              </span>
              <span className="font-display text-[17px] font-semibold leading-snug text-ink">{GUIDES[k].question}</span>
              {has && h.value !== undefined ? (
                <span className="flex flex-col">
                  <span className="font-display text-[22px] font-bold tabular-nums" style={{ color: col.ink }}>
                    {compact(h.value)}
                  </span>
                  <span className="text-[12px] text-muted">{h.caption}</span>
                </span>
              ) : (
                <span className="text-[12.5px] text-muted">{has ? "Open to see every line" : "Not in this report"}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* The chosen statement */}
      <section key={`${which}-${kind}`} className="fathom-fade flex flex-col overflow-hidden rounded-sm border border-line bg-white" aria-label={g.name}>
        <header className="flex flex-col gap-2 border-b border-line px-5 py-5 sm:px-6" style={{ background: c.soft }}>
          <p className="m-0 text-[13px] font-semibold" style={{ color: c.ink }}>
            {g.name} <span className="font-normal text-muted">· {g.aka}</span>
          </p>
          <h2 className="m-0 font-display text-[26px] font-semibold leading-tight tracking-[-0.03em]">{g.question}</h2>
          <p className="m-0 max-w-3xl text-[15.5px] leading-relaxed text-ink/80">{g.read}</p>
          <ul className="m-0 mt-1 flex list-none flex-col gap-1 p-0 text-[14.5px]">
            {g.lookFor.map((x) => (
              <li key={x} className="flex gap-2">
                <span aria-hidden="true" className="mt-[8px] h-1.5 w-1.5 flex-none rounded-[1px]" style={{ background: c.solid }} />
                <span>
                  <span className="text-muted">People usually check: </span>
                  {x}
                </span>
              </li>
            ))}
          </ul>
        </header>

        {s ? (
          <StatementBody s={s} kind={kind} />
        ) : (
          <p className="m-0 px-6 py-6 text-[16px] text-muted">
            This {which === "annual" ? "yearly" : "quarterly"} report doesn&apos;t include a separate {g.name.toLowerCase()} in its tagged data.{" "}
            {kind === "equity" && which === "quarterly" ? "Some companies only show it once a year. Switch to the yearly report to see it." : ""}
          </p>
        )}
      </section>

      {report.statements.comprehensive && (
        <details className="group rounded-sm border border-line bg-white px-5 py-3">
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3">
            <span className="flex flex-col">
              <span className="text-[15px] font-semibold">Extra: {GUIDES.comprehensive.question.toLowerCase().replace(/^./, (x) => x.toUpperCase())}</span>
              <span className="text-[13px] text-muted">{GUIDES.comprehensive.name}: {GUIDES.comprehensive.short}</span>
            </span>
            <span aria-hidden="true" className="text-xl transition-transform group-open:rotate-45">+</span>
          </summary>
          <div className="flex flex-col gap-3 pb-3 pt-2">
            <p className="m-0 max-w-3xl text-[15px] leading-relaxed text-ink/80">{GUIDES.comprehensive.read}</p>
            <LineTable s={report.statements.comprehensive} />
          </div>
        </details>
      )}
    </div>
  );
}

function StatementBody({ s, kind }: { s: StatementView; kind: StatementKind }) {
  const g = GUIDES[kind];
  const durationCols = s.columns.map((col, i) => ({ col, i })).filter(({ i }) => (kind === "income" || kind === "cashflow" ? (s.steps?.[i]?.length ?? 0) > 0 : true));
  const [col, setCol] = useState(durationCols[0]?.i ?? 0);
  const [period, setPeriod] = useState(0);

  let picture: React.ReactNode = null;
  let chips: { label: string; on: boolean; go: () => void }[] = [];
  if ((kind === "income" || kind === "cashflow") && s.steps?.[col]?.length) {
    chips = durationCols.map(({ col: c, i }) => ({ label: c.label, on: i === col, go: () => setCol(i) }));
    picture = <Waterfall steps={s.steps[col]} caption={g.picture} />;
  } else if (kind === "balance" && s.balance?.[col]) {
    chips = s.balance.map((_, i) => ({ label: s.columns[i].label, on: i === col, go: () => setCol(i) }));
    const b = s.balance[col];
    picture = <BalanceBars assets={b.assets} owed={b.owed} equity={b.equity} totalAssets={b.totalAssets} />;
  } else if (kind === "equity" && s.equity?.length) {
    const p = s.equity[Math.min(period, s.equity.length - 1)];
    chips = s.equity.map((e, i) => ({ label: `${e.months} months to ${niceDate(e.end)}`, on: i === period, go: () => setPeriod(i) }));
    picture = (
      <Waterfall
        caption={g.picture}
        steps={[
          { key: "open", label: `At the start (${niceDate(p.start)})`, value: p.opening, anchor: true, lines: [], note: "Shareholders' equity when the period began." },
          ...p.steps.map((x, i) => ({ key: `m${i}`, label: x.plain, value: x.value, anchor: false, lines: [{ plain: x.plain, label: x.label, value: x.value }], note: x.value >= 0 ? "This added to shareholders' equity." : "This took away from shareholders' equity." })),
          { key: "close", label: `At the end (${niceDate(p.end)})`, value: p.closing, anchor: true, lines: [], note: "Shareholders' equity when the period finished." },
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 px-5 py-5 sm:px-6">
      {picture && (
        <div className="flex flex-col gap-3">
          {chips.length > 1 && (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Period shown in the picture">
              {chips.map((ch) => (
                <button
                  key={ch.label}
                  type="button"
                  aria-pressed={ch.on}
                  onClick={ch.go}
                  className={`min-h-8 rounded-sm px-3 text-[13px] font-semibold transition-colors ${ch.on ? "bg-ink text-white" : "bg-panel-2 text-muted hover:text-ink"}`}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          )}
          {picture}
        </div>
      )}
      {kind === "income" && s.steps?.[col] && <PerHundred s={s} col={col} />}
      {kind === "cashflow" && <FreeCash s={s} col={col} />}
      <LineTable s={s} highlight={kind === "equity" ? undefined : col} />
      <p className="m-0 text-[12.5px] text-muted">
        {s.fromNote ? "From the notes to the financial statements. " : ""}Every line as the company filed it ({s.units}), shown in full dollars.{" "}
        <a href={s.url} target="_blank" rel="noopener noreferrer">
          See this statement on SEC
        </a>
        .
      </p>
    </div>
  );
}

/** "Out of every $100 of sales": the income statement as shares of sales. */
function PerHundred({ s, col }: { s: StatementView; col: number }) {
  const steps = s.steps?.[col] ?? [];
  const sales = steps.find((x) => x.key === "sales")?.value;
  if (!sales || sales <= 0) return null;
  const parts = steps.filter((x) => !x.anchor || x.key === "net");
  return (
    <div className="flex flex-col gap-2 rounded-sm bg-panel-2 px-4 py-3">
      <p className="m-0 text-[14px] font-semibold">Out of every $100 of sales</p>
      <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-1 p-0 text-[14px]">
        {parts.map((p) => (
          <li key={p.key}>
            <span className="text-muted">{p.key === "net" ? "kept as profit" : p.label.toLowerCase()}: </span>
            <strong className="tabular-nums">${(Math.abs(p.value / sales) * 100).toFixed(p.key === "net" ? 1 : 0)}</strong>
            {p.key !== "net" && p.value > 0 && <span className="text-muted"> added</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Cash from the business minus spending on equipment: worked out from two filed lines. */
function FreeCash({ s, col }: { s: StatementView; col: number }) {
  const ops = s.lines.find((l) => /^(NetCashProvidedByUsedInOperatingActivities|NetCashProvidedByUsedInOperatingActivitiesContinuingOperations)$/.test(tag(l)))?.values[col];
  const capex = s.lines.find((l) => /^(PaymentsToAcquirePropertyPlantAndEquipment|PaymentsToAcquireProductiveAssets)$/.test(tag(l)))?.values[col];
  if (ops === null || ops === undefined || capex === null || capex === undefined) return null;
  const spent = Math.abs(capex);
  return (
    <div className="flex flex-col gap-1 rounded-sm bg-panel-2 px-4 py-3 text-[14.5px]">
      <p className="m-0">
        <strong className="font-semibold">Spare cash (free cash flow): {compact(ops - spent)}</strong>
        <span className="text-muted">
          {" "}
          = {compact(ops)} from the main business − {compact(spent)} spent on buildings and equipment. It&apos;s what was left to pay dividends, buy back
          shares, pay down debt or save. Worked out by candor from the two lines above.
        </span>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------- every line

function LineTable({ s, highlight }: { s: StatementView; highlight?: number }) {
  const [q, setQ] = useState("");
  const [words, setWords] = useState<"plain" | "filed">("plain");
  const [open, setOpen] = useState<string | null>(null);
  const prev = highlight !== undefined ? yearEarlier(s.columns, highlight) : undefined;
  const main = s.lines.filter((l) => !l.split);
  const splits = s.lines.filter((l) => l.split);
  const query = q.trim().toLowerCase();
  const match = (l: Line) => !query || `${l.plain} ${l.label} ${l.what}`.toLowerCase().includes(query);
  const shown = useMemo(() => main.filter((l) => (query ? !l.header && match(l) : true)), [main, query]); // eslint-disable-line react-hooks/exhaustive-deps
  const splitGroups = [...new Set(splits.map((l) => l.split!))];
  const cols = s.columns;

  const row = (l: Line) => {
    if (l.header) {
      return (
        <tr key={l.id}>
          <th colSpan={cols.length + 1} scope="colgroup" className="pb-1 pt-4 text-left text-[12px] font-semibold uppercase tracking-wide text-muted">
            {l.plain && l.how !== "place" && !/abstract|roll forward|statement of/i.test(l.label) ? l.label : l.label}
          </th>
        </tr>
      );
    }
    const isOpen = open === l.id;
    const ch = highlight !== undefined && prev !== undefined ? change(l.values[highlight], l.values[prev]) : undefined;
    const name = words === "plain" ? l.plain : l.shortLabel;
    const other = words === "plain" ? l.shortLabel : l.plain;
    return [
      <tr key={l.id} className={`border-t border-line ${l.total ? "bg-mist font-semibold" : ""}`}>
        <td className="py-0">
          <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : l.id)} className="flex w-full items-start gap-2 py-2 pr-3 text-left">
            <svg className={`mt-1 flex-none text-muted transition-transform ${isOpen ? "rotate-90" : ""}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 6 6 6-6 6" />
            </svg>
            <span className="flex min-w-0 flex-col">
              <span className={`text-[14.5px] leading-snug ${l.total ? "font-semibold" : "font-medium"}`}>{name}</span>
              {other.toLowerCase() !== name.toLowerCase() && <span className="text-[12.5px] font-normal leading-snug text-muted">{words === "plain" ? `Filed as: ${other}` : other}</span>}
            </span>
          </button>
        </td>
        {cols.map((c, i) => (
          <td key={c.heading + i} className={`whitespace-nowrap py-2 pl-3 text-right align-top text-[14px] tabular-nums ${i === highlight ? "text-ink" : "text-ink/75"}`}>
            {l.values[i] === null ? <span className="text-muted/60">–</span> : compact(l.values[i]!, l.unit)}
            {i === highlight && ch !== undefined && Math.abs(ch) >= 0.001 && (
              <span className="block text-[11.5px] font-medium text-muted" title="Change from a year earlier">
                {ch > 0 ? "▲" : "▼"} {Math.abs(ch * 100).toFixed(Math.abs(ch) < 0.1 ? 1 : 0)}%
              </span>
            )}
          </td>
        ))}
      </tr>,
      isOpen ? (
        <tr key={`${l.id}-open`} className="bg-panel-2/60">
          <td colSpan={cols.length + 1} className="px-3 pb-3 pt-1">
            <div className="flex max-w-3xl flex-col gap-1.5 text-[14px] leading-relaxed">
              <p className="m-0">
                <strong className="font-semibold">{l.plain}.</strong> {l.what}
              </p>
              <p className="m-0 text-muted">
                The company calls it &ldquo;{l.label}&rdquo;
                {l.concept ? (
                  <>
                    {" "}
                    and tags it <code className="rounded-sm bg-white px-1 text-[12.5px]">{l.concept.replace("_", ":")}</code>
                  </>
                ) : null}
                .
              </p>
              {l.definition && (
                <details className="text-[13px] text-muted">
                  <summary className="cursor-pointer font-semibold">The official definition (technical)</summary>
                  <p className="m-0 mt-1">{l.definition}</p>
                </details>
              )}
            </div>
          </td>
        </tr>
      ) : null,
    ];
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="m-0 font-display text-[19px] font-semibold">Every line, explained</h3>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative">
            <span className="sr-only">Find a line</span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Find a line, e.g. debt"
              className="min-h-9 w-52 rounded-sm border border-line bg-white px-3 text-[14px] outline-none focus:border-ocean"
            />
          </label>
          <div role="group" aria-label="Names shown" className="inline-flex rounded-sm bg-panel-2 p-0.5 text-[13px] font-semibold">
            {(
              [
                ["plain", "Plain English"],
                ["filed", "Company's words"],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" aria-pressed={words === id} onClick={() => setWords(id)} className={`min-h-8 rounded-sm px-3 ${words === id ? "bg-white text-ink shadow-sm" : "text-muted"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <caption className="sr-only">{s.title}, every line</caption>
          <thead>
            <tr className="border-b-2 border-line text-[12.5px] text-muted">
              <th scope="col" className="py-2 text-left font-semibold">
                Line <span className="font-normal">(tap for what it means)</span>
              </th>
              {s.columns.map((c, i) => (
                <th key={c.heading + i} scope="col" className={`py-2 pl-3 text-right font-semibold ${i === highlight ? "text-ink" : ""}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{shown.flatMap(row)}</tbody>
        </table>
        {shown.length === 0 && <p className="py-3 text-[14px] text-muted">No line matches &ldquo;{q}&rdquo;.</p>}
      </div>
      {splitGroups.length > 0 && !query && (
        <details className="rounded-sm bg-mist px-4 py-2">
          <summary className="cursor-pointer py-1 text-[14.5px] font-semibold">
            Split by {splitGroups.slice(0, 4).join(", ")}
            {splitGroups.length > 4 ? " and more" : ""}
          </summary>
          <div className="overflow-x-auto">
            <table className="mt-2 w-full min-w-[560px] border-collapse">
              <tbody>
                {splitGroups.map((gname) => [
                  <tr key={`g-${gname}`}>
                    <th colSpan={cols.length + 1} className="pb-1 pt-3 text-left text-[13px] font-semibold text-ink">
                      {gname}
                    </th>
                  </tr>,
                  ...splits
                    .filter((l) => l.split === gname && !l.header)
                    .map((l) => (
                      <tr key={l.id} className="border-t border-line">
                        <td className="py-1.5 pr-3 text-[14px]">
                          {l.plain} <span className="text-[12.5px] text-muted">({l.shortLabel})</span>
                        </td>
                        {cols.map((c, i) => (
                          <td key={c.heading + i} className="whitespace-nowrap py-1.5 pl-3 text-right text-[14px] tabular-nums">
                            {l.values[i] === null ? "–" : compact(l.values[i]!, l.unit)}
                          </td>
                        ))}
                      </tr>
                    )),
                ])}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
