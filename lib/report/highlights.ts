/**
 * The front page of a research report: what the figures show in a company's favour,
 * and what to keep an eye on. Every point is a plain fact worked out from the
 * company's own SEC figures (or, for risks, the company's own words), never an
 * opinion on the shares. Each comes with the glossary term it's about, so the report
 * can highlight it and explain it at the back.
 */
import type { CheckedClaim, SavedExplanation } from "../explain/types";
import { formatDate, formatMoney, formatPercent, formatShare } from "../financials/format";
import type { CompanyNumbers } from "../financials/metrics";

export type Highlight = { text: string; term?: string };

const sameYear = (a?: { start?: string; end: string }, b?: { start?: string; end: string }) => Boolean(a && b && a.start === b.start && a.end === b.end);

export function highlights(
  n: CompanyNumbers | undefined,
  governance: { since: string; events: unknown[] } | undefined,
  e?: SavedExplanation,
): { favour: Highlight[]; watch: Highlight[]; risks: CheckedClaim[] } {
  const favour: Highlight[] = [];
  const watch: Highlight[] = [];
  if (n) {
    const a = n.annual;
    const r = n.ratios;
    const rev = a.revenue;
    if (rev?.change !== undefined) {
      const line = `Sales ${rev.change >= 0 ? "grew" : "fell"} ${formatPercent(rev.change)} to ${formatMoney(rev.latest.value)} in the year ended ${formatDate(rev.latest.end)}.`;
      (rev.change >= 0 ? favour : watch).push({ text: line, term: "revenue" });
    }
    const h = n.marginHistory.filter((y) => y.net !== undefined);
    if (h.length >= 2) {
      const [prev, last] = h.slice(-2);
      const d = last.net! - prev.net!;
      if (Math.abs(d) >= 0.005) {
        const line = `Its net profit margin ${d > 0 ? "rose" : "fell"} from ${formatShare(prev.net!)} to ${formatShare(last.net!)}: $${Math.round(last.net! * 100)} of every $100 of sales was kept as profit, against $${Math.round(prev.net! * 100)} a year earlier.`;
        (d > 0 ? favour : watch).push({ text: line, term: "profit-margin" });
      }
    } else if (n.margins.net !== undefined && n.margins.net < 0) {
      watch.push({ text: `It made a loss: costs were bigger than sales by ${formatShare(Math.abs(n.margins.net))} of sales.`, term: "net-loss" });
    }
    const fcf = r.freeCashFlow;
    if (fcf) {
      if (fcf.value >= 0) favour.push({ text: `After paying for buildings and equipment, the business produced ${formatMoney(fcf.value)} of free cash flow.`, term: "free-cash-flow" });
      else watch.push({ text: `It spent ${formatMoney(Math.abs(fcf.value))} more on buildings and equipment than its business brought in (free cash flow below zero).`, term: "free-cash-flow" });
      const yr = fcf.figures[0];
      const div = sameYear(a.dividends?.latest, yr) ? a.dividends!.latest.value : 0;
      const bb = sameYear(a.buybacks?.latest, yr) ? a.buybacks!.latest.value : 0;
      const paid = div + bb;
      if (paid > 0 && fcf.value > 0) {
        if (paid <= fcf.value) favour.push({ text: `Dividends and share buybacks (${formatMoney(paid)}) were covered by free cash flow (${formatMoney(fcf.value)}).`, term: "dividend" });
        else watch.push({ text: `It paid ${formatMoney(paid)} to shareholders in dividends and buybacks, more than its ${formatMoney(fcf.value)} of free cash flow; the difference came from other sources such as cash it held or borrowing.`, term: "dividend" });
      }
    }
    const debt = n.balance.longTermDebt?.latest;
    const cash = n.balance.cash?.latest;
    if (debt && cash && debt.end === cash.end) {
      const net = debt.value - cash.value;
      if (net < 0) favour.push({ text: `It held ${formatMoney(Math.abs(net))} more cash than long-term debt on ${formatDate(debt.end)} (net cash).`, term: "net-debt" });
    }
    if (r.currentRatio) {
      const cr = r.currentRatio.value;
      (cr >= 1 ? favour : watch).push({
        text: `It had $${cr.toFixed(2)} of current assets for every $1 of bills due within a year on ${formatDate(r.currentRatio.end)}${cr >= 1 ? "" : ", so less coming in within a year than going out"}.`,
        term: "current-ratio",
      });
    }
    if (r.debtToEquity && r.debtToEquity.value > 1) {
      watch.push({ text: `Its long-term debt was bigger than its shareholders' equity: $${r.debtToEquity.value.toFixed(2)} borrowed for every $1 of owners' money.`, term: "debt-to-equity" });
    }
    if (n.negativeEquity) {
      watch.push({ text: `Its shareholders' equity was below zero on ${formatDate(n.negativeEquity.end)}: its accounts show it owing more than it owns.`, term: "shareholders-equity" });
    }
  }
  if (governance) {
    if (governance.events.length === 0) favour.push({ text: `No change of auditor and no restatement of past accounts has been filed since ${formatDate(governance.since)}.`, term: "auditor" });
    else watch.push({ text: `It has filed ${governance.events.length} notice${governance.events.length > 1 ? "s" : ""} of an auditor change or a restatement since ${formatDate(governance.since)}.`, term: "restatement" });
  }
  return { favour, watch, risks: (e?.topics.biggestRisks ?? []).slice(0, 2) };
}
