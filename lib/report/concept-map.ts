/**
 * The company map: the main figures in a company's reports, laid out in four
 * columns, and the exact sums that link them ("Revenue − all costs = Net income").
 * Each link is worked out with this company's own figures where SEC data has them,
 * so a first-timer can see precisely how one number turns into the next.
 *
 * Figures are only combined when they cover exactly the same year or date;
 * otherwise the link shows the rule in words and says why the sum is left out.
 */
import { formatDate, formatMoney, formatPerShare, formatShare } from "../financials/format";
import type { CompanyNumbers, Figure } from "../financials/metrics";
import { lookupTerm, type TwoSides } from "../glossary";

export type MapGroup = "forces" | "sales" | "cash" | "balance" | "owners" | "market";

export type MapNode = {
  id: string;
  label: string; // the real finance term, as shown on the box
  plain: string; // a precise everyday-words explanation of what it is
  term: string; // the real name
  key: string; // its glossary entry
  definition: string;
  why?: string;
  analyst?: string;
  reading?: string;
  caveat?: string;
  sides?: TwoSides;
  group: MapGroup;
  x: number;
  y: number;
  value?: string; // this company's figure in full, e.g. "$46.4 billion"
  short?: string; // the same figure, short enough for the box, e.g. "$46.4bn"
  when?: string; // the year or date the figure covers
  step: string; // which research step explains it
};

export const GROUPS: Record<MapGroup, { name: string; color: string; soft: string; ink: string }> = {
  sales: { name: "Sales and profit", color: "#2d5bff", soft: "#eef2ff", ink: "#1f45d6" },
  cash: { name: "Cash flow", color: "#0ea5a4", soft: "#e6f7f7", ink: "#0b6f6e" },
  balance: { name: "Owns and owes", color: "#7c5cff", soft: "#f1edff", ink: "#5b3fd6" },
  owners: { name: "For shareholders", color: "#f59e0b", soft: "#fef6e7", ink: "#8a5300" },
  market: { name: "The share price", color: "#64748b", soft: "#f1f3f6", ink: "#3f4a5a" },
  forces: { name: "Outside drivers", color: "#64748b", soft: "#f1f3f6", ink: "#3f4a5a" },
};

/** The columns shown on the map, left to right. */
export const MAP_COLUMNS: Exclude<MapGroup, "forces" | "market">[] = ["sales", "cash", "balance", "owners"];

const LAYOUT: { id: string; label: string; plain: string; key: string; group: MapGroup; step: string }[] = [
  // Sales and profit
  { id: "revenue", label: "Revenue", key: "revenue", group: "sales", step: "performance", plain: "All the money customers paid it over the year for its products and services, before any costs are taken off." },
  { id: "costs", label: "Costs and expenses", key: "costs-and-expenses", group: "sales", step: "performance", plain: "Everything it spent over the year: making or buying what it sold, wages, rent, marketing, research, interest and tax." },
  { id: "profit", label: "Net income", key: "net-income", group: "sales", step: "performance", plain: "What's left of the year's sales after every cost, including interest and tax: its final profit." },
  { id: "margin", label: "Net profit margin", key: "profit-margin", group: "sales", step: "performance", plain: "Net income as a share of sales: how many dollars of every $100 of sales ended up as final profit." },
  // Cash
  { id: "opcash", label: "Operating cash flow", key: "cash-from-operations", group: "cash", step: "cash", plain: "The cash its day-to-day business actually took in over the year, after paying suppliers, staff, interest and tax." },
  { id: "capex", label: "Capital expenditure", key: "capital-expenditure", group: "cash", step: "cash", plain: "Cash spent on things it will use for years, such as factories, stores, computers and machines." },
  { id: "fcf", label: "Free cash flow", key: "free-cash-flow", group: "cash", step: "cash", plain: "Operating cash flow minus capital expenditure: the cash left over that it can pay to owners, use to repay debt or keep." },
  { id: "dividends", label: "Dividends", key: "dividend", group: "cash", step: "management", plain: "Cash it paid out to its shareholders during the year." },
  { id: "buybacks", label: "Share buybacks", key: "share-buyback", group: "cash", step: "management", plain: "Cash it spent buying its own shares back from investors, leaving fewer shares to share future profit." },
  // What it owns and owes
  { id: "cash", label: "Cash", key: "cash-and-equivalents", group: "balance", step: "health", plain: "Money in the bank plus very safe short-term investments it can turn into cash within days, on the date shown." },
  { id: "debt", label: "Long-term debt", key: "long-term-debt", group: "balance", step: "health", plain: "Money it has borrowed through loans and bonds that doesn't have to be repaid for more than a year." },
  { id: "netdebt", label: "Net debt", key: "net-debt", group: "balance", step: "health", plain: "Long-term debt minus cash. Below zero means it holds more cash than it owes long-term (net cash)." },
  { id: "current", label: "Current ratio", key: "current-ratio", group: "balance", step: "health", plain: "What it expects to turn into cash within a year, divided by the bills it must pay within a year." },
  // What it means for owners
  { id: "equity", label: "Shareholders' equity", key: "shareholders-equity", group: "owners", step: "health", plain: "What the accounts say belongs to the shareholders: everything it owns minus everything it owes (book value)." },
  { id: "dte", label: "Debt-to-equity", key: "debt-to-equity", group: "owners", step: "health", plain: "Long-term debt divided by shareholders' equity: how many dollars it has borrowed for each $1 that belongs to its owners." },
  { id: "roe", label: "Return on equity", key: "return-on-equity", group: "owners", step: "management", plain: "The year's net income divided by the average shareholders' equity over the year: profit made on each $100 of owners' money." },
  { id: "eps", label: "Earnings per share", key: "eps", group: "owners", step: "performance", plain: "The year's net income divided by the number of shares, counting shares that could still be created from staff stock awards (diluted)." },
  // Not drawn on the map (no figure from SEC data); kept so the key drivers can name them.
  { id: "price", label: "Share price", key: "share-price", group: "market", step: "value", plain: "What one share costs on the stock market. It changes every trading day." },
  { id: "pe", label: "P/E ratio", key: "pe-ratio", group: "market", step: "value", plain: "The share price divided by earnings per share: how many dollars buyers pay for each $1 of yearly profit per share." },
  { id: "mcap", label: "Market value", key: "market-cap", group: "market", step: "value", plain: "The share price multiplied by the number of shares: what the stock market values the whole company at." },
];

// ---------------------------------------------------------------- the links

export type LinkKind = "sum" | "compare" | "uses";

/**
 * One rule that links figures on the map: the boxes it involves, which way each link
 * runs, the box it works out (if any), and the rule in words.
 */
export type Relation = { id: string; result?: string; nodes: string[]; edges: [string, string][]; kind: LinkKind; rule: string; op: string };

const rel = (id: string, result: string | undefined, edges: [string, string][], kind: LinkKind, op: string, rule: string): Relation => ({
  id,
  result,
  nodes: [...new Set(edges.flat())],
  edges,
  kind,
  op,
  rule,
});

export const RELATIONS: Relation[] = [
  rel("net-income", "profit", [["revenue", "profit"], ["costs", "profit"]], "sum", "−", "Net income = revenue − all costs and expenses"),
  rel("net-margin", "margin", [["profit", "margin"], ["revenue", "margin"]], "sum", "÷", "Net profit margin = net income ÷ revenue"),
  rel("profit-to-cash", undefined, [["profit", "opcash"]], "compare", "vs", "Net income and operating cash flow measure the same year in two ways"),
  rel("free-cash", "fcf", [["opcash", "fcf"], ["capex", "fcf"]], "sum", "−", "Free cash flow = operating cash flow − capital expenditure"),
  rel("payouts", undefined, [["fcf", "dividends"], ["fcf", "buybacks"]], "uses", "→", "Dividends + buybacks, compared with free cash flow"),
  rel("net-debt", "netdebt", [["debt", "netdebt"], ["cash", "netdebt"]], "sum", "−", "Net debt = long-term debt − cash"),
  rel("current-ratio", "current", [["cash", "current"]], "sum", "÷", "Current ratio = current assets (cash is one part) ÷ bills due within a year"),
  rel("equity-change", undefined, [["profit", "equity"], ["dividends", "equity"], ["buybacks", "equity"]], "sum", "±", "Net income adds to shareholders' equity; dividends and buybacks take from it"),
  rel("debt-to-equity", "dte", [["debt", "dte"], ["equity", "dte"]], "sum", "÷", "Debt-to-equity = long-term debt ÷ shareholders' equity"),
  rel("roe", "roe", [["profit", "roe"], ["equity", "roe"]], "sum", "÷", "Return on equity = net income ÷ average shareholders' equity"),
  rel("eps", "eps", [["profit", "eps"]], "sum", "÷", "Earnings per share = net income ÷ number of shares (diluted)"),
];

export type MapEdge = { from: string; to: string; label: string; op: string; relation: string };

/** Every link on the map. */
export const EDGES: MapEdge[] = RELATIONS.flatMap((r) => r.edges.map(([from, to]) => ({ from, to, label: r.rule, op: r.op, relation: r.id })));

/** One piece of a worked sum: a figure (linked to its box when it has one) or an operator. */
export type SumPart = { kind: "figure"; label: string; value?: string; node?: string } | { kind: "op"; text: string };

/** A rule worked out for one company: the sum with its figures, and what it says in plain words. */
export type WorkedLink = Relation & { sum: SumPart[]; says: string; period?: string };

// ---------------------------------------------------------------- figures

const year = (f?: Figure) => (f?.end ? `year ended ${formatDate(f.end)}` : undefined);
const on = (f?: Figure) => (f?.end ? `on ${formatDate(f.end)}` : undefined);
const sameYear = (a?: Figure, b?: Figure) => Boolean(a && b && a.start === b.start && a.end === b.end);
const sameDay = (a?: Figure, b?: Figure) => Boolean(a && b && a.end === b.end);

/** "$46.4bn", "−$684m": short enough for a box on the map. */
export function shortMoney(v: number): string {
  const a = Math.abs(v);
  const sign = v < 0 ? "−" : "";
  if (a >= 1e12) return `${sign}$${(a / 1e12).toFixed(2).replace(/\.?0+$/, "")}tn`;
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(1).replace(/\.0$/, "")}bn`;
  if (a >= 1e6) return `${sign}$${Math.round(a / 1e6).toLocaleString("en-US")}m`;
  return `${sign}$${Math.round(a).toLocaleString("en-US")}`;
}
const money = (v: number) => formatMoney(v).replace(/^-/, "−");

type Fig = { value: number; full: string; short: string; when?: string };

/** This company's figure for every box, keyed by box id. */
function figures(n?: CompanyNumbers): Record<string, Fig | undefined> {
  if (!n) return {};
  const a = n.annual;
  const b = n.balance;
  const r = n.ratios;
  const m = (f: Figure | undefined, when: (f?: Figure) => string | undefined): Fig | undefined =>
    f ? { value: f.value, full: money(f.value), short: shortMoney(f.value), when: when(f) } : undefined;
  const rev = a.revenue?.latest;
  const ni = a.netIncome?.latest;
  const debt = b.longTermDebt?.latest;
  const cash = b.cash?.latest;
  const eps = a.eps?.latest;
  return {
    revenue: m(rev, year),
    costs: rev && ni && sameYear(rev, ni) ? { value: rev.value - ni.value, full: money(rev.value - ni.value), short: shortMoney(rev.value - ni.value), when: year(rev) } : undefined,
    profit: m(ni, year),
    margin:
      n.margins.net !== undefined && sameYear(rev, ni)
        ? { value: n.margins.net, full: formatShare(n.margins.net), short: formatShare(n.margins.net), when: year(rev) }
        : undefined,
    opcash: m(a.operatingCashFlow?.latest, year),
    capex: m(a.capex?.latest, year),
    fcf: r.freeCashFlow ? { value: r.freeCashFlow.value, full: money(r.freeCashFlow.value), short: shortMoney(r.freeCashFlow.value), when: year(r.freeCashFlow.figures[0]) } : undefined,
    dividends: m(a.dividends?.latest, year),
    buybacks: m(a.buybacks?.latest, year),
    cash: m(cash, on),
    debt: m(debt, on),
    // Below zero, net debt means more cash than long-term debt: say so rather than show a bare minus sign.
    netdebt:
      debt && cash && sameDay(debt, cash)
        ? {
            value: debt.value - cash.value,
            full: debt.value < cash.value ? `${money(debt.value - cash.value)} (net cash)` : money(debt.value - cash.value),
            short: debt.value < cash.value ? `${shortMoney(debt.value - cash.value)} · net cash` : shortMoney(debt.value - cash.value),
            when: on(debt),
          }
        : undefined,
    current: r.currentRatio ? { value: r.currentRatio.value, full: r.currentRatio.value.toFixed(2), short: r.currentRatio.value.toFixed(2), when: `on ${formatDate(r.currentRatio.end)}` } : undefined,
    equity: m(b.equity?.latest, on),
    dte: r.debtToEquity ? { value: r.debtToEquity.value, full: r.debtToEquity.value.toFixed(2), short: r.debtToEquity.value.toFixed(2), when: `on ${formatDate(r.debtToEquity.end)}` } : undefined,
    roe: r.returnOnEquity ? { value: r.returnOnEquity.value, full: formatShare(r.returnOnEquity.value), short: formatShare(r.returnOnEquity.value), when: `year ended ${formatDate(r.returnOnEquity.end)}` } : undefined,
    eps: eps ? { value: eps.value, full: formatPerShare(eps.value), short: formatPerShare(eps.value), when: year(eps) } : undefined,
  };
}

/** The map's boxes for one company, with its own figures from SEC data. */
export function conceptMap(n?: CompanyNumbers): MapNode[] {
  const f = figures(n);
  const cols: Record<string, number> = {};
  return LAYOUT.map((l) => {
    const g = lookupTerm(l.key);
    const row = (cols[l.group] = (cols[l.group] ?? -1) + 1);
    const fig = f[l.id];
    return {
      id: l.id,
      label: l.label,
      plain: l.plain,
      term: g?.short ?? l.key,
      key: l.key,
      definition: g?.definition ?? "",
      why: g?.why,
      analyst: g?.analyst,
      reading: g?.reading,
      caveat: g?.caveat,
      sides: g?.sides,
      group: l.group,
      x: Math.max(0, MAP_COLUMNS.indexOf(l.group as (typeof MAP_COLUMNS)[number])),
      y: row,
      value: fig?.full,
      short: fig?.short,
      when: fig?.when,
      step: l.step,
    };
  });
}

/** The boxes drawn on the map: everything with a figure from the company's reports. */
export function mapNodes(nodes: MapNode[]): MapNode[] {
  return nodes.filter((x) => MAP_COLUMNS.includes(x.group as (typeof MAP_COLUMNS)[number]));
}

// ---------------------------------------------------------------- each link, worked out

const fig = (label: string, value?: string, node?: string): SumPart => ({ kind: "figure", label, value, node });
const op = (text: string): SumPart => ({ kind: "op", text });

/** Every rule on the map, worked out with this company's figures where they line up. */
export function workedLinks(n?: CompanyNumbers): WorkedLink[] {
  const f = figures(n);
  const a = n?.annual;
  const b = n?.balance;
  const r = n?.ratios;
  const v = (id: string) => f[id]?.full;
  const out: WorkedLink[] = [];
  const add = (id: string, sum: SumPart[], says: string, period?: string) => {
    const relation = RELATIONS.find((x) => x.id === id);
    if (relation) out.push({ ...relation, sum, says, period });
  };
  const notLined = "Its figures for these don't cover exactly the same period, so candor doesn't put them in one sum.";

  // Net income = revenue − costs
  {
    const ok = f.revenue && f.costs && f.profit;
    add(
      "net-income",
      [fig("Revenue", v("revenue"), "revenue"), op("−"), fig("All costs and expenses", v("costs"), "costs"), op("="), fig("Net income", v("profit"), "profit")],
      ok
        ? `Of the ${v("revenue")} customers paid it, ${v("costs")} went on costs of every kind: making or buying what it sold, running the business, interest and tax. The ${v("profit")} left over is its net income.`
        : f.revenue && f.profit
          ? notLined
          : "Net income is what remains of revenue once every cost, including interest and tax, has been paid.",
      ok ? f.revenue!.when : undefined,
    );
  }
  // Net profit margin = net income ÷ revenue
  {
    const ok = f.margin && f.revenue && f.profit;
    const per100 = ok ? Math.round(f.margin!.value * 100) : undefined;
    add(
      "net-margin",
      [fig("Net income", v("profit"), "profit"), op("÷"), fig("Revenue", v("revenue"), "revenue"), op("="), fig("Net profit margin", v("margin"), "margin")],
      ok
        ? f.margin!.value >= 0
          ? `${v("profit")} of profit out of ${v("revenue")} of sales is ${v("margin")}: about $${per100} of every $100 customers paid ended up as profit.`
          : `It lost money: costs were bigger than sales by ${formatShare(Math.abs(f.margin!.value))} of sales.`
        : "The margin turns profit into a share of sales, so companies of different sizes can be compared.",
      ok ? f.revenue!.when : undefined,
    );
  }
  // Net income vs operating cash flow
  {
    const ni = a?.netIncome?.latest;
    const ocf = a?.operatingCashFlow?.latest;
    const ok = ni && ocf && sameYear(ni, ocf);
    const gap = ok ? ocf!.value - ni!.value : 0;
    add(
      "profit-to-cash",
      [fig("Net income", v("profit"), "profit"), op("vs"), fig("Operating cash flow", v("opcash"), "opcash")],
      ok
        ? `Profit counts a sale when it's made and spreads the cost of equipment over many years; cash counts money only when it actually moves. This year the business brought in ${money(Math.abs(gap))} ${gap >= 0 ? "more" : "less"} cash than its net income${
            gap >= 0 ? ", for example because yearly wear-and-tear charges on equipment lower profit but aren't paid in cash." : ", for example because customers had not paid yet or it built up stock."
          }`
        : "Profit and cash rarely match: profit follows accounting rules, while cash counts money only when it actually changes hands.",
      ok ? year(ni) : undefined,
    );
  }
  // Free cash flow = operating cash flow − capex
  {
    const ok = r?.freeCashFlow;
    add(
      "free-cash",
      [fig("Operating cash flow", v("opcash"), "opcash"), op("−"), fig("Capital expenditure", v("capex"), "capex"), op("="), fig("Free cash flow", v("fcf"), "fcf")],
      ok
        ? r!.freeCashFlow!.value >= 0
          ? `The business brought in ${v("opcash")} of cash and spent ${v("capex")} of it on long-lasting things like buildings and equipment, leaving ${v("fcf")} of free cash flow.`
          : `It spent ${money(Math.abs(r!.freeCashFlow!.value))} more on buildings and equipment than its business brought in, so free cash flow was below zero.`
        : f.opcash && f.capex
          ? notLined
          : "Free cash flow is the cash left after the business pays for the long-lasting things it needs to keep going and grow.",
      ok ? f.fcf!.when : undefined,
    );
  }
  // Free cash flow → dividends and buybacks
  {
    const fcf = r?.freeCashFlow;
    const yr = fcf?.figures[0];
    const div = a?.dividends?.latest;
    const bb = a?.buybacks?.latest;
    const d = div && sameYear(div, yr) ? div.value : undefined;
    const bv = bb && sameYear(bb, yr) ? bb.value : undefined;
    const paid = (d ?? 0) + (bv ?? 0);
    const ok = fcf && (d !== undefined || bv !== undefined);
    const share = ok && fcf!.value > 0 ? Math.round((paid / fcf!.value) * 100) : undefined;
    add(
      "payouts",
      [
        fig("Dividends", d !== undefined ? money(d) : v("dividends"), "dividends"),
        op("+"),
        fig("Share buybacks", bv !== undefined ? money(bv) : v("buybacks"), "buybacks"),
        op("="),
        fig("Paid to owners", ok ? money(paid) : undefined),
        op("vs"),
        fig("Free cash flow", v("fcf"), "fcf"),
      ],
      ok
        ? share !== undefined
          ? share <= 100
            ? `It paid ${money(paid)} to its owners, about ${share}% of its ${v("fcf")} of free cash flow, so the payouts were covered by spare cash with ${money(fcf!.value - paid)} left over.`
            : `It paid ${money(paid)} to its owners, about ${share}% of its ${v("fcf")} of free cash flow. Paying out more than its spare cash means the difference came from elsewhere, such as cash it already held or new borrowing.`
          : `It paid ${money(paid)} to its owners in a year when free cash flow was below zero, so the money came from elsewhere, such as cash it already held or borrowing.`
        : "Dividends and buybacks are cash paid to owners. Paid out of free cash flow, they're covered by what the business produces; paid out of more than that, the difference comes from savings or borrowing.",
      ok ? year(yr) : undefined,
    );
  }
  // Net debt = long-term debt − cash
  {
    const ok = f.netdebt;
    add(
      "net-debt",
      [fig("Long-term debt", v("debt"), "debt"), op("−"), fig("Cash", v("cash"), "cash"), op("="), fig("Net debt", v("netdebt"), "netdebt")],
      ok
        ? f.netdebt!.value >= 0
          ? `It owed ${v("debt")} long-term and held ${v("cash")} in cash, so even if it used all its cash to repay debt, ${money(f.netdebt!.value)} would still be owed.`
          : `It held ${v("cash")} in cash against ${v("debt")} of long-term debt: ${money(Math.abs(f.netdebt!.value))} more cash than long-term borrowing (net cash).`
        : f.debt && f.cash
          ? "Its cash and debt figures are from different dates, so candor doesn't put them in one sum."
          : "Net debt shows what the company would still owe long-term if it used all its cash to repay borrowing.",
      ok ? f.netdebt!.when : undefined,
    );
  }
  // Current ratio = current assets ÷ current liabilities
  {
    const cr = r?.currentRatio;
    const [ca, cl] = cr?.figures ?? [];
    add(
      "current-ratio",
      [fig("Current assets", ca ? money(ca.value) : undefined), op("÷"), fig("Bills due within a year", cl ? money(cl.value) : undefined), op("="), fig("Current ratio", v("current"), "current")],
      cr
        ? `Its current assets (cash${b?.cash?.latest && sameDay(b.cash.latest, ca) ? ` of ${money(b.cash.latest.value)}` : ""}, money customers owe it, stock and other things it expects to turn into cash within a year) came to ${money(ca!.value)}, against ${money(cl!.value)} of bills due within a year: $${cr.value.toFixed(2)} for every $1 due.`
        : "Cash is part of current assets: the things a company expects to turn into cash within a year, compared with what it must pay within a year.",
      cr ? `on ${formatDate(cr.end)}` : undefined,
    );
  }
  // Equity grows with profit, shrinks with payouts
  {
    const ni = a?.netIncome?.latest;
    const div = a?.dividends?.latest;
    const bb = a?.buybacks?.latest;
    const d = div && sameYear(div, ni) ? div.value : 0;
    const bv = bb && sameYear(bb, ni) ? bb.value : 0;
    const ok = ni && (d || bv);
    const kept = ok ? ni!.value - d - bv : 0;
    add(
      "equity-change",
      [
        fig("Net income", v("profit"), "profit"),
        op("−"),
        fig("Dividends", d ? money(d) : v("dividends"), "dividends"),
        op("−"),
        fig("Share buybacks", bv ? money(bv) : v("buybacks"), "buybacks"),
        op("="),
        fig(kept >= 0 ? "Added to equity" : "Taken from equity", ok ? money(Math.abs(kept)) : undefined),
      ],
      ok
        ? `Profit belongs to the owners, so it adds to shareholders' equity; cash paid out to them takes it away. This year: ${v("profit")} of profit minus ${money(d + bv)} paid out ${kept >= 0 ? `added about ${money(kept)}` : `took about ${money(Math.abs(kept))}`} to equity, before smaller items such as shares given to staff and currency changes.`
        : "Profit the company keeps adds to shareholders' equity; dividends and buybacks take money out of it.",
      ok ? year(ni) : undefined,
    );
  }
  // Debt-to-equity = debt ÷ equity
  {
    const de = r?.debtToEquity;
    const [d, e] = de?.figures ?? [];
    add(
      "debt-to-equity",
      [fig("Long-term debt", d ? money(d.value) : undefined, "debt"), op("÷"), fig("Shareholders' equity", e ? money(e.value) : undefined, "equity"), op("="), fig("Debt-to-equity", v("dte"), "dte")],
      de
        ? `${money(d!.value)} of long-term debt against ${money(e!.value)} of shareholders' equity is ${de.value.toFixed(2)}: it had borrowed about $${de.value.toFixed(2)} long-term for every $1 that belongs to its owners.`
        : n?.negativeEquity
          ? "Its shareholders' equity is below zero, so this ratio can't be read sensibly and is left out."
          : "Debt-to-equity compares money borrowed with money that belongs to the owners.",
      de ? `on ${formatDate(de.end)}` : undefined,
    );
  }
  // ROE = net income ÷ average equity
  {
    const roe = r?.returnOnEquity;
    const [ni, end, start] = roe?.figures ?? [];
    const avg = end && start ? (end.value + start.value) / 2 : undefined;
    add(
      "roe",
      [fig("Net income", ni ? money(ni.value) : undefined, "profit"), op("÷"), fig("Average shareholders' equity", avg !== undefined ? money(avg) : undefined, "equity"), op("="), fig("Return on equity", v("roe"), "roe")],
      roe
        ? `Equity was ${money(start!.value)} at the start of the year and ${money(end!.value)} at the end, an average of ${money(avg!)}. ${money(ni!.value)} of profit on that is ${formatShare(roe.value)}: about $${Math.round(roe.value * 100)} of profit for every $100 of owners' money.`
        : "Return on equity shows how much profit the company made with the money that belongs to its owners.",
      roe ? `year ended ${formatDate(roe.end)}` : undefined,
    );
  }
  // EPS = net income ÷ shares
  {
    const ni = a?.netIncome?.latest;
    const eps = a?.eps?.latest;
    const ok = ni && eps && sameYear(ni, eps) && eps.value !== 0;
    const shares = ok ? ni!.value / eps!.value : undefined;
    const sharesText = shares !== undefined && shares > 0 ? `${(shares / 1e9 >= 1 ? `${(shares / 1e9).toFixed(2).replace(/\.?0+$/, "")} billion` : `${Math.round(shares / 1e6).toLocaleString("en-US")} million`)} shares` : undefined;
    add(
      "eps",
      [fig("Net income", v("profit"), "profit"), op("÷"), fig("Number of shares", sharesText ? `about ${sharesText.replace(" shares", "")}` : undefined), op("="), fig("Earnings per share", v("eps"), "eps")],
      ok && sharesText
        ? `${v("profit")} of profit shared across about ${sharesText} (counting shares that could still be created from staff awards) is ${v("eps")} per share. The share count is worked out from those two reported figures.`
        : "Earnings per share splits the year's profit across every share, so one share's slice can be followed over time.",
      ok ? year(ni) : undefined,
    );
  }
  return out;
}
