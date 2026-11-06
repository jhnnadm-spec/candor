"use client";

/**
 * Insider trades (Form 4) over the last year: how much insiders bought and sold, month
 * by month, who traded, and every trade with what its code means. Never a verdict:
 * insiders sell for many ordinary reasons.
 */
import { useMemo, useState } from "react";
import type { InsiderSummary, InsiderTrade } from "@/lib/sec/insiders";
import { CODES } from "@/lib/sec/insider-codes";
import { compact, niceDate } from "@/lib/statements/format";

const BUY = "#0ea5a4";
const SELL = "#f43f5e";
const KIND_STYLE: Record<InsiderTrade["kind"], { bg: string; fg: string; label: string }> = {
  buy: { bg: "#e6f7f7", fg: "#0b6f6e", label: "Bought" },
  sell: { bg: "#feecef", fg: "#b4233c", label: "Sold" },
  award: { bg: "#eef2ff", fg: "#1f45d6", label: "Pay" },
  tax: { bg: "#f1f3f6", fg: "#3f4a5a", label: "Tax" },
  exercise: { bg: "#f1edff", fg: "#5b3fd6", label: "Options" },
  gift: { bg: "#fef6e7", fg: "#8a5300", label: "Gift" },
  other: { bg: "#f1f3f6", fg: "#3f4a5a", label: "Other" },
};

export function InsidersView({ s, company }: { s: InsiderSummary; company: string }) {
  const [kind, setKind] = useState<InsiderTrade["kind"] | "all">("all");
  const [person, setPerson] = useState<string | null>(null);
  const maxMonth = Math.max(1, ...s.months.flatMap((m) => [m.bought, m.sold]));
  const trades = useMemo(() => s.trades.filter((t) => (kind === "all" || t.kind === kind) && (!person || t.person === person)), [s.trades, kind, person]);
  const kinds = [...new Set(s.trades.map((t) => t.kind))];
  const [month, setMonth] = useState<number | null>(null);
  const m = month === null ? null : s.months[month];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Bought on the open market" value={compact(s.bought.value)} sub={`${s.bought.count} trade${s.bought.count === 1 ? "" : "s"} by ${s.bought.people} ${s.bought.people === 1 ? "person" : "people"}`} color={BUY} />
        <Stat label="Sold on the open market" value={compact(s.sold.value)} sub={`${s.sold.count} trade${s.sold.count === 1 ? "" : "s"} by ${s.sold.people} ${s.sold.people === 1 ? "person" : "people"}`} color={SELL} />
        <Stat label="Sales that were planned ahead" value={s.sold.count ? `${Math.round(s.sold.plannedShare * 100)}%` : "–"} sub="made under a pre-set trading plan (Rule 10b5-1)" color="#5b3fd6" />
        <Stat label="Filings read" value={String(s.filingsRead)} sub={s.filingsInPeriod > s.filingsRead ? `the newest ${s.filingsRead} of ${s.filingsInPeriod} in the last year` : "every Form 4 in the last year"} color="#0c0f14" />
      </div>

      <section className="flex flex-col gap-3 rounded-sm border border-line bg-white px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="m-0 font-display text-[20px] font-semibold">Buying and selling, month by month</h2>
          <p className="m-0 text-[13px] text-muted">Open-market trades only, by value. Tap a month.</p>
        </div>
        <div className="grid h-44 grid-cols-12 items-stretch gap-1.5">
          {s.months.map((mm, i) => (
            <button key={mm.month} type="button" onClick={() => setMonth(i)} onMouseEnter={() => setMonth(i)} aria-label={`${mm.month}: bought ${compact(mm.bought)}, sold ${compact(mm.sold)}`} className={`flex flex-col justify-center rounded-sm ${month === i ? "bg-panel-2" : ""}`}>
              <span className="flex flex-1 items-end justify-center">
                <span className="fathom-grow-up w-3/5 rounded-t-[2px]" style={{ height: `${(mm.bought / maxMonth) * 100}%`, background: BUY, minHeight: mm.bought ? 2 : 0 }} />
              </span>
              <span className="h-px w-full bg-line" />
              <span className="flex flex-1 items-start justify-center">
                <span className="w-3/5 rounded-b-[2px]" style={{ height: `${(mm.sold / maxMonth) * 100}%`, background: SELL, minHeight: mm.sold ? 2 : 0 }} />
              </span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-12 gap-1.5 text-center text-[11px] text-muted">
          {s.months.map((mm) => (
            <span key={mm.month}>{new Date(`${mm.month}-01T00:00:00Z`).toLocaleString("en-US", { month: "short", timeZone: "UTC" })}</span>
          ))}
        </div>
        <p className="m-0 min-h-[1.5em] text-[14px]" aria-live="polite">
          {m ? (
            <>
              <strong>{new Date(`${m.month}-01T00:00:00Z`).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}:</strong> bought {compact(m.bought)}, sold {compact(m.sold)}.
            </>
          ) : (
            <span className="text-muted">
              <span style={{ color: BUY }}>■</span> above the line: bought · <span style={{ color: SELL }}>■</span> below: sold
            </span>
          )}
        </p>
      </section>

      {s.people.length > 0 && (
        <section className="flex flex-col gap-3 rounded-sm border border-line bg-white px-5 py-5 sm:px-6">
          <h2 className="m-0 font-display text-[20px] font-semibold">Who traded</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-[14px]">
              <thead>
                <tr className="border-b-2 border-line text-left text-[12.5px] text-muted">
                  <th className="py-2 font-semibold">Person and role</th>
                  <th className="py-2 text-right font-semibold">Bought</th>
                  <th className="py-2 text-right font-semibold">Sold</th>
                  <th className="py-2 text-right font-semibold">Shares held after</th>
                  <th className="py-2 text-right font-semibold" />
                </tr>
              </thead>
              <tbody>
                {s.people.map((p) => (
                  <tr key={p.person} className={`border-t border-line ${person === p.person ? "bg-panel-2" : ""}`}>
                    <td className="py-2 pr-3">
                      <span className="font-semibold">{p.person}</span>
                      <span className="block text-[12.5px] text-muted">{p.role}</span>
                    </td>
                    <td className="py-2 text-right tabular-nums" style={{ color: p.boughtValue ? BUY : undefined }}>{p.boughtValue ? compact(p.boughtValue) : "–"}</td>
                    <td className="py-2 text-right tabular-nums" style={{ color: p.soldValue ? SELL : undefined }}>{p.soldValue ? compact(p.soldValue) : "–"}</td>
                    <td className="py-2 text-right tabular-nums">{p.after ? compact(p.after, "shares").replace(" shares", "") : "–"}</td>
                    <td className="py-2 pl-3 text-right">
                      <button type="button" onClick={() => setPerson(person === p.person ? null : p.person)} className="rounded-sm bg-panel-2 px-2.5 py-1 text-[12.5px] font-semibold hover:bg-surface">
                        {person === p.person ? "Show everyone" : "Their trades"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-sm border border-line bg-white px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="m-0 font-display text-[20px] font-semibold">
            Every trade{person ? ` by ${person}` : ""} ({trades.length})
          </h2>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" aria-pressed={kind === "all"} onClick={() => setKind("all")} className={`min-h-8 rounded-sm px-3 text-[13px] font-semibold ${kind === "all" ? "bg-ink text-white" : "bg-panel-2"}`}>
              All
            </button>
            {kinds.map((k) => (
              <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className="min-h-8 rounded-sm px-3 text-[13px] font-semibold" style={kind === k ? { background: KIND_STYLE[k].fg, color: "#fff" } : { background: KIND_STYLE[k].bg, color: KIND_STYLE[k].fg }}>
                {KIND_STYLE[k].label}
              </button>
            ))}
          </div>
        </div>
        <ol className="m-0 flex list-none flex-col p-0">
          {trades.slice(0, 120).map((t, i) => (
            <li key={`${t.url}-${i}`} className="grid gap-2 border-t border-line py-3 first:border-0 sm:grid-cols-[6.5rem_minmax(0,1fr)_auto] sm:gap-4">
              <span className="text-[13px] font-semibold tabular-nums text-muted">{niceDate(t.date)}</span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="rounded-sm px-2 py-0.5 text-[12px] font-semibold" style={{ background: KIND_STYLE[t.kind].bg, color: KIND_STYLE[t.kind].fg }}>
                    {t.action}
                  </span>
                  {t.planned && <span className="rounded-sm bg-[#f1edff] px-2 py-0.5 text-[12px] font-semibold text-[#5b3fd6]">Planned ahead</span>}
                  {!t.direct && <span className="rounded-sm bg-panel-2 px-2 py-0.5 text-[12px] font-semibold text-muted">Held indirectly (trust, family…)</span>}
                </span>
                <span className="text-[14.5px]">
                  <strong className="font-semibold">{t.person}</strong> <span className="text-muted">· {t.role}</span>
                </span>
                <span className="text-[13px] text-muted">
                  {CODES[t.code]?.why ?? ""} {t.derivative ? `(${t.security})` : ""}{" "}
                  <a href={t.url} target="_blank" rel="noopener noreferrer">
                    Form 4
                  </a>
                </span>
              </span>
              <span className="flex flex-col text-right tabular-nums sm:min-w-[9rem]">
                <span className="text-[15px] font-semibold" style={{ color: t.code === "S" ? SELL : t.code === "P" ? BUY : undefined }}>
                  {t.acquired ? "+" : "−"}
                  {t.shares.toLocaleString("en-US")} {t.derivative ? "units" : "shares"}
                </span>
                {t.price ? <span className="text-[12.5px] text-muted">at ${t.price.toFixed(2)}{t.value ? ` = ${compact(t.value)}` : ""}</span> : <span className="text-[12.5px] text-muted">no price (not a sale)</span>}
                {t.after !== undefined && <span className="text-[12px] text-muted">owns {t.after.toLocaleString("en-US")} after</span>}
              </span>
            </li>
          ))}
        </ol>
        {trades.length > 120 && <p className="m-0 text-[13px] text-muted">Showing the newest 120.</p>}
      </section>

      <p className="m-0 text-[12.5px] leading-relaxed text-muted">
        Read straight from the Form 4 filings {company}&apos;s directors, top managers and large owners sent to the SEC. Insiders sell for many reasons:
        taxes, diversifying, planned sales. Buying with their own money is rarer. None of this says whether to buy or sell the shares.
      </p>
    </div>
  );
}

function Stat({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-sm border border-line bg-white px-4 py-4">
      <span className="text-[12.5px] font-semibold text-muted">{label}</span>
      <span className="font-display text-[26px] font-bold tabular-nums" style={{ color }}>
        {value}
      </span>
      <span className="text-[12.5px] text-muted">{sub}</span>
    </div>
  );
}
