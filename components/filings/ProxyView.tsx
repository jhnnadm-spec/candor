"use client";

/**
 * The proxy statement (DEF 14A), explained: the yearly meeting and what shareholders
 * vote on, how the boss is paid next to how the shares did, and the gap between the
 * boss's pay and a typical employee's.
 */
import { useState } from "react";
import type { PayYear, Proposal, ProxyFacts } from "@/lib/sec/proxy";
import { compact, niceDate } from "@/lib/statements/format";

const PROPOSAL_KINDS: [RegExp, string][] = [
  [/elect/i, "Shareholders vote on who sits on the board, the people who oversee the managers on their behalf."],
  [/auditor|accounting firm|ratif/i, "Shareholders confirm the outside firm that checks the accounts."],
  [/frequency/i, "How often shareholders get a say on executive pay: every one, two or three years."],
  [/compensation|say.on.pay|executive pay/i, "\"Say on pay\": shareholders give their view on how the top managers are paid. The vote is advisory, so the board doesn't have to follow it."],
  [/stock plan|incentive plan|equity plan|purchase plan/i, "Approving a plan that lets the company pay staff or directors in shares, which can add new shares over time."],
  [/charter|by-?law|certificate|majority vote|special meeting|written consent|declassif/i, "A change to the company's own rules, often about how shareholders vote or call meetings."],
];
const explainProposal = (p: Proposal) =>
  p.byShareholder ? "Put forward by one or more shareholders. The board says how it recommends voting, and explains why in the statement." : (PROPOSAL_KINDS.find(([re]) => re.test(p.title))?.[1] ?? "A matter the board asks shareholders to vote on.");

export function ProxyView({ p, company }: { p: ProxyFacts; company: string }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-3 rounded-sm border border-line bg-white px-5 py-5 sm:px-6">
          <h2 className="m-0 font-display text-[20px] font-semibold">The yearly meeting</h2>
          {p.meeting ? (
            <div className="flex items-center gap-4">
              <MeetingDate iso={p.meeting.date} />
              <p className="m-0 text-[15px] leading-relaxed">
                Shareholders meet on <strong>{niceDate(p.meeting.date)}</strong> to vote. Anyone who owns shares on the record date can vote, usually online,
                even without attending.
              </p>
            </div>
          ) : (
            <p className="m-0 text-[15px] text-muted">The meeting date wasn&apos;t found in the text. The statement itself gives it on its first pages.</p>
          )}
          {p.auditor && (
            <p className="m-0 text-[14px] text-muted">
              Audit firm put forward for approval: <strong className="text-ink">{p.auditor}</strong>
            </p>
          )}
          <p className="m-0 text-[12.5px] text-muted">Proxy statement filed {niceDate(p.filingDate)}.</p>
        </section>
        {p.payRatio && <PayRatio ratio={p.payRatio.ratio} quote={p.payRatio.quote} />}
      </div>

      {p.proposals.length > 0 && (
        <section className="flex flex-col gap-3 rounded-sm border border-line bg-white px-5 py-5 sm:px-6">
          <h2 className="m-0 font-display text-[20px] font-semibold">What shareholders vote on</h2>
          <ol className="m-0 flex list-none flex-col gap-2 p-0">
            {p.proposals.map((x) => (
              <li key={x.number} className="grid gap-3 rounded-sm border border-line px-4 py-3 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto]">
                <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-ink text-[15px] font-bold text-white">{x.number}</span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-[15.5px] font-semibold leading-snug">{x.title}</span>
                  <span className="text-[14px] leading-relaxed text-muted">{explainProposal(x)}</span>
                </span>
                <span className="flex flex-wrap items-start gap-1.5 sm:flex-col sm:items-end">
                  {x.byShareholder && <span className="rounded-sm bg-[#fef6e7] px-2 py-0.5 text-[12px] font-semibold text-[#8a5300]">From shareholders</span>}
                  {x.board && <span className={`rounded-sm px-2 py-0.5 text-[12px] font-semibold ${x.board === "AGAINST" ? "bg-[#feecef] text-[#b4233c]" : "bg-[#dff3ea] text-[#0f6b4c]"}`}>Board says: {x.board.toLowerCase()}</span>}
                </span>
              </li>
            ))}
          </ol>
          <p className="m-0 text-[12.5px] text-muted">Titles as written in the statement. The board&apos;s recommendation is shown only where candor found it clearly stated.</p>
        </section>
      )}

      {p.pay.length > 0 && <PayVsPerformance pay={p.pay} measureName={p.measureName} company={company} />}
    </div>
  );
}

function MeetingDate({ iso }: { iso: string }) {
  const d = new Date(`${iso}T00:00:00Z`);
  return (
    <span className="flex h-20 w-20 flex-none flex-col items-center justify-center rounded-sm bg-[#eef2ff] leading-none text-[#1f45d6]">
      <span className="text-[12px] font-semibold uppercase">{d.toLocaleString("en-US", { month: "short", timeZone: "UTC" })}</span>
      <span className="text-[28px] font-bold">{d.getUTCDate()}</span>
      <span className="text-[11px] font-semibold">{d.getUTCFullYear()}</span>
    </span>
  );
}

function PayRatio({ ratio, quote }: { ratio: number; quote: string }) {
  const shown = Math.min(ratio, 1200);
  const clean = !/•|\d,\d{3}\d|\d{4,}\d,/.test(quote) && quote.length < 420;
  return (
    <section className="flex flex-col gap-3 rounded-sm border border-line bg-white px-5 py-5 sm:px-6">
      <h2 className="m-0 font-display text-[20px] font-semibold">The boss&apos;s pay next to a typical employee&apos;s</h2>
      <p className="m-0 text-[15px] leading-relaxed">
        The chief executive was paid about <strong className="font-display text-[22px]">{ratio.toLocaleString("en-US")}×</strong> what the employee in the
        exact middle of the company&apos;s pay scale earned (the CEO pay ratio).
      </p>
      <div className="flex flex-wrap gap-[2px]" role="img" aria-label={`One square for the chief executive, ${ratio} for the typical employee's pay`}>
        {Array.from({ length: shown }, (_, i) => (
          <span key={i} className="h-[6px] w-[6px] rounded-[1px]" style={{ background: i === 0 ? "#f43f5e" : "#c3cfff" }} />
        ))}
      </div>
      <p className="m-0 text-[13px] text-muted">
        Each square is one typical employee&apos;s yearly pay; together they add up to the chief executive&apos;s{ratio > shown ? ` (first ${shown.toLocaleString("en-US")} shown)` : ""}. The red square is one employee for scale.
        Ratios vary a lot between industries: a company with many part-time or overseas workers has a lower middle wage.
      </p>
      {clean && <p className="m-0 border-l-[3px] border-line pl-3 text-[13.5px] leading-relaxed text-muted">&ldquo;{quote.replace(/\s+/g, " ")}&rdquo;</p>}
    </section>
  );
}

function PayVsPerformance({ pay, measureName, company }: { pay: PayYear[]; measureName?: string; company: string }) {
  const years = [...pay].reverse();
  const [sel, setSel] = useState(years.length - 1);
  const maxPay = Math.max(1, ...years.flatMap((y) => [y.ceoTotal ?? 0, y.ceoActuallyPaid ?? 0]));
  const maxTsr = Math.max(100, ...years.flatMap((y) => [y.tsr ?? 0, y.peerTsr ?? 0]));
  const y = years[sel];
  const label = (iso: string) => `Year to ${niceDate(iso)}`;
  const hasNeg = years.some((x) => (x.ceoActuallyPaid ?? 0) < 0);
  const span = Math.max(maxPay, ...years.map((x) => Math.abs(x.ceoActuallyPaid ?? 0))) || 1;
  const h = (v: number) => (Math.abs(v) / span) * 150;

  return (
    <section className="flex flex-col gap-4 rounded-sm border border-line bg-white px-5 py-5 sm:px-6">
      <div>
        <h2 className="m-0 font-display text-[20px] font-semibold">Pay next to how the shares did</h2>
        <p className="m-0 max-w-3xl text-[15px] leading-relaxed text-muted">
          Since 2022, companies must show their bosses&apos; pay next to how shareholders did. Two pay figures are given: the pay the board set for the year
          (from the summary pay table), and &ldquo;compensation actually paid&rdquo;, which re-values share awards at today&apos;s share price, so it rises and
          falls with the stock and can even be negative. Tap a year.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <figure className="m-0 flex flex-col gap-2">
          <figcaption className="text-[14px] font-semibold">Chief executive&apos;s pay</figcaption>
          <div className="relative flex h-[170px] items-end gap-3 border-b border-line">
            {years.map((x, i) => (
              <button key={x.year} type="button" onClick={() => setSel(i)} onMouseEnter={() => setSel(i)} aria-pressed={sel === i} aria-label={`${label(x.year)}: ${x.ceoTotal ? compact(x.ceoTotal) : "–"} set, ${x.ceoActuallyPaid !== undefined ? compact(x.ceoActuallyPaid) : "–"} actually paid`} className={`relative flex h-full flex-1 items-end justify-center gap-[3px] rounded-sm ${sel === i ? "bg-panel-2" : ""}`}>
                <span className="fathom-grow-up w-[38%] rounded-t-[2px] bg-[#2d5bff]" style={{ height: h(x.ceoTotal ?? 0) }} />
                <span
                  className="w-[38%] rounded-[2px]"
                  title={(x.ceoActuallyPaid ?? 0) < 0 ? "Negative: share awards lost value that year" : undefined}
                  style={{ height: h(x.ceoActuallyPaid ?? 0), background: (x.ceoActuallyPaid ?? 0) >= 0 ? "#f59e0b" : "#f43f5e" }}
                />
              </button>
            ))}
          </div>
          <div className="flex gap-3 text-center text-[11.5px] text-muted">
            {years.map((x) => (
              <span key={x.year} className="flex-1">
                {x.year.slice(0, 4)}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 text-[13px]">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-[#2d5bff]" /> Pay set for the year
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-[#f59e0b]" /> Actually paid (re-valued)
            </span>
            {hasNeg && (
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[2px] bg-[#f43f5e]" /> Negative: share awards lost value
              </span>
            )}
          </div>
        </figure>
        <figure className="m-0 flex flex-col gap-2">
          <figcaption className="text-[14px] font-semibold">What $100 put into the shares became</figcaption>
          <div className="flex h-[170px] items-end gap-3 border-b border-line">
            {years.map((x, i) => (
              <button key={x.year} type="button" onClick={() => setSel(i)} onMouseEnter={() => setSel(i)} aria-pressed={sel === i} aria-label={`${label(x.year)}: $${x.tsr?.toFixed(0)} for ${company}, $${x.peerTsr?.toFixed(0)} for similar companies`} className={`flex h-full flex-1 items-end justify-center gap-[3px] rounded-sm ${sel === i ? "bg-panel-2" : ""}`}>
                <span className="fathom-grow-up w-[38%] rounded-t-[2px] bg-[#0ea5a4]" style={{ height: ((x.tsr ?? 0) / maxTsr) * 160 }} />
                <span className="fathom-grow-up w-[38%] rounded-t-[2px] bg-[#c9ced8]" style={{ height: ((x.peerTsr ?? 0) / maxTsr) * 160 }} />
              </button>
            ))}
          </div>
          <div className="flex gap-3 text-center text-[11.5px] text-muted">
            {years.map((x) => (
              <span key={x.year} className="flex-1">
                {x.year.slice(0, 4)}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 text-[13px]">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-[#0ea5a4]" /> {company}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-[#c9ced8]" /> A group of similar companies it picked
            </span>
          </div>
        </figure>
      </div>
      {y && (
        <div className="grid gap-x-6 gap-y-2 rounded-sm bg-panel-2 px-4 py-3 text-[14.5px] sm:grid-cols-2" aria-live="polite">
          <p className="m-0 sm:col-span-2 font-semibold">
            {label(y.year)}
            {y.ceoName ? ` · chief executive: ${y.ceoName.split(" and ")[0]}` : ""}
          </p>
          <p className="m-0">Pay set for the chief executive: <strong>{y.ceoTotal !== undefined ? compact(y.ceoTotal) : "–"}</strong></p>
          <p className="m-0">Actually paid, re-valued: <strong>{y.ceoActuallyPaid !== undefined ? compact(y.ceoActuallyPaid) : "–"}</strong></p>
          <p className="m-0">Other top managers, on average: <strong>{y.othersTotal !== undefined ? compact(y.othersTotal) : "–"}</strong></p>
          <p className="m-0">$100 in its shares became: <strong>{y.tsr !== undefined ? `$${y.tsr.toFixed(0)}` : "–"}</strong> <span className="text-muted">(similar companies: {y.peerTsr !== undefined ? `$${y.peerTsr.toFixed(0)}` : "–"})</span></p>
          <p className="m-0">Profit (net income): <strong>{y.netIncome !== undefined ? compact(y.netIncome) : "–"}</strong></p>
          {measureName && y.measure !== undefined && (
            <p className="m-0">
              The measure it ties pay to ({measureName}): <strong>{Math.abs(y.measure) < 5 ? `${(y.measure * 100).toFixed(1)}%` : compact(y.measure)}</strong>
            </p>
          )}
        </div>
      )}
      <p className="m-0 text-[12.5px] text-muted">
        Read straight from the tagged &ldquo;pay versus performance&rdquo; table in the proxy statement. The $100 figures assume $100 was invested at the start of
        the first year shown, with dividends reinvested.
      </p>
    </section>
  );
}
