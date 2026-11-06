/**
 * The four financial statements, ready to show: every line with its plain-English
 * name and meaning, plus the numbers behind each picture (worked out in code from
 * the filed figures, never estimated).
 */
import type { Column, RTable, Row, StatementKind } from "../sec/rpages";
import { plainLine, sectionAfter, standardTag, type Section } from "./lines";

export type Line = {
  id: string; // stable within a statement, for links and keys
  label: string; // the company's own wording
  shortLabel: string; // the same, without long notes in brackets
  plain: string; // plain-English name
  what: string; // one-line meaning
  how: "tag" | "words" | "place";
  concept: string;
  definition?: string; // the official definition of the tag
  section: Section;
  header: boolean;
  total: boolean;
  unit: Row["unit"];
  values: (number | null)[];
  texts: (string | null)[];
  split?: string; // part of a split by product, segment etc.: the part's name
};

export type Step = {
  key: string;
  label: string; // plain words
  value: number; // change (for steps) or level (for anchors)
  anchor: boolean; // a running total ("Gross profit") rather than a change
  lines: { plain: string; label: string; value: number }[]; // what it is made of
  note: string; // one plain sentence
};

export type BalancePart = { label: string; plain: string; value: number; group: "currentAssets" | "assets" | "currentLiabilities" | "liabilities" | "equity"; what: string };

export type EquityPeriod = { start: string; end: string; months: number; opening: number; closing: number; steps: { plain: string; label: string; value: number }[] };

export type StatementView = {
  kind: StatementKind;
  title: string; // as filed
  file: string; // R page
  url: string; // where to see it on SEC
  units: string;
  columns: Column[];
  lines: Line[];
  // pictures
  steps?: Step[][]; // income and cash flow: one list of steps per column
  balance?: { assets: BalancePart[]; owed: BalancePart[]; equity: number; totalAssets: number; totalLiabilities?: number }[]; // per column
  equity?: EquityPeriod[];
  fromNote?: boolean; // the equity changes came from a note, not a statement
};

const tagOf = (l: { concept: string }) => standardTag(l.concept);

/** "Securities borrowed (included $98,111 and $83,962 at fair value)" -> "Securities borrowed" */
function shorten(label: string): string {
  return label
    .replace(/\s*\((?:[^()]|\([^()]*\))*\)/g, (m) => (m.length > 28 ? "" : m))
    .replace(/,?\s*\$?\d[\d.,]*\s+par value.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildLines(table: RTable, kind: StatementKind): Line[] {
  let section: Section = kind === "balance" ? "currentAssets" : kind === "cashflow" ? "operating" : "none";
  let split: string | undefined;
  const seen = new Map<string, number>();
  return table.rows.map((r) => {
    if (r.member) split = r.label;
    if (r.header || r.total) section = sectionAfter(section, r.label, kind);
    if (kind === "balance" && !r.header) {
      // A total closes its part: "Total current assets" moves on to long-term assets.
      const t = tagOf(r);
      if (t === "AssetsCurrent") section = "assets";
      if (t === "Assets") section = "currentLiabilities";
      if (t === "LiabilitiesCurrent") section = "liabilities";
      if (t === "Liabilities") section = "equity";
    }
    const p = plainLine(r.concept, r.label, kind, section);
    const base = (r.concept || r.label).replace(/[^\w]+/g, "-");
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    const lineSection = kind === "balance" && /^(us-gaap_)?(AssetsCurrent)$/.test(r.concept.replace(/^us-gaap_/, "")) ? "currentAssets" : section;
    return {
      id: n > 1 ? `${base}-${n}` : base,
      label: r.label,
      shortLabel: shorten(r.label) || r.label,
      plain: p.plain,
      what: p.what,
      how: p.how,
      concept: r.concept,
      definition: table.definitions[r.concept],
      section: lineSection,
      header: r.header || r.member,
      total: r.total,
      unit: r.unit,
      values: r.values,
      texts: r.texts,
      split,
    };
  }).map((l) => {
    // A balance-sheet total belongs to the part it closes.
    if (kind === "balance" && l.total) {
      const t = tagOf(l);
      if (t === "AssetsCurrent") return { ...l, section: "currentAssets" as Section };
      if (t === "Assets" || t === "AssetsNoncurrent") return { ...l, section: "assets" as Section };
      if (t === "LiabilitiesCurrent") return { ...l, section: "currentLiabilities" as Section };
      if (t === "Liabilities" || t === "LiabilitiesNoncurrent") return { ...l, section: "liabilities" as Section };
    }
    return l;
  });
}

const main = (lines: Line[]) => lines.filter((l) => !l.split && !l.header && l.unit === "money");
const firstWith = (lines: Line[], tags: string[]) => {
  for (const t of tags) {
    const hit = lines.find((l) => tagOf(l) === t);
    if (hit) return hit;
  }
  return undefined;
};

// ---------------------------------------------------------------- income statement: from sales to profit

const REVENUE_TAGS = ["RevenuesNetOfInterestExpense", "Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax", "RevenueFromContractWithCustomerIncludingAssessedTax", "SalesRevenueNet", "SalesRevenueGoodsNet"];
const NET_TAGS = ["NetIncomeLoss", "ProfitLoss", "NetIncomeLossAvailableToCommonStockholdersBasic"];

function incomeAnchors(lines: Line[]): { key: string; label: string; line: Line }[] {
  const m = main(lines);
  const revenue =
    firstWith(m, REVENUE_TAGS) ?? m.find((l) => /^(total )?(net )?(revenues?|sales)( and other income)?$/i.test(l.shortLabel));
  const out: { key: string; label: string; line: Line }[] = [];
  if (revenue) out.push({ key: "sales", label: "Sales", line: revenue });
  const gross = firstWith(m, ["GrossProfit"]);
  if (gross) out.push({ key: "gross", label: "Profit after making costs", line: gross });
  const operating = firstWith(m, ["OperatingIncomeLoss"]);
  if (operating) out.push({ key: "operating", label: "Profit from the main business", line: operating });
  const pretax = m.find((l) => tagOf(l).startsWith("IncomeLossFromContinuingOperationsBeforeIncomeTaxes"));
  if (pretax) out.push({ key: "pretax", label: "Profit before tax", line: pretax });
  const net = firstWith(m, NET_TAGS);
  if (net) out.push({ key: "net", label: "Profit", line: net });
  // Keep them in the order they appear in the statement.
  return out.filter((a, i) => i === 0 || lines.indexOf(a.line) > lines.indexOf(out[i - 1].line));
}

const STEP_NAMES: Record<string, string> = {
  "sales>gross": "Cost of making what it sold",
  "gross>operating": "Running costs",
  "sales>operating": "Costs of running the business",
  "operating>pretax": "Other income and costs",
  "pretax>net": "Income tax",
  "sales>pretax": "Costs, and money set aside for bad loans",
  "operating>net": "Interest, other items and tax",
  "gross>pretax": "Running costs and other items",
  "sales>net": "All costs and tax",
};

export function incomeSteps(lines: Line[], col: number): Step[] {
  const anchors = incomeAnchors(lines).filter((a) => a.line.values[col] !== null && a.line.values[col] !== undefined);
  if (anchors.length < 2) return [];
  const steps: Step[] = [];
  anchors.forEach((a, i) => {
    if (i > 0) {
      const prev = anchors[i - 1];
      const from = lines.indexOf(prev.line);
      const to = lines.indexOf(a.line);
      const inside = lines
        .slice(from + 1, to)
        .filter((l) => !l.header && !l.split && l.unit === "money" && l.values[col] !== null && !l.total);
      if (inside.length === 0) inside.push(...lines.slice(from + 1, to).filter((l) => !l.header && !l.split && l.unit === "money" && l.values[col] !== null));
      const change = (a.line.values[col] ?? 0) - (prev.line.values[col] ?? 0);
      const name = STEP_NAMES[`${prev.key}>${a.key}`] ?? "Other items";
      steps.push({
        key: `${prev.key}-${a.key}`,
        label: name,
        value: change,
        anchor: false,
        lines: inside.map((l) => ({ plain: l.plain, label: l.shortLabel, value: l.values[col] ?? 0 })),
        note:
          change <= 0
            ? `${name} took ${money(Math.abs(change))} off.`
            : `${name} added ${money(change)}.`,
      });
    }
    steps.push({
      key: a.key,
      label: a.label,
      value: a.line.values[col] ?? 0,
      anchor: true,
      lines: [{ plain: a.line.plain, label: a.line.shortLabel, value: a.line.values[col] ?? 0 }],
      note: a.line.what,
    });
  });
  return steps;
}

// ---------------------------------------------------------------- cash flow: from cash at the start to cash at the end

const CASH_SECTIONS: { key: string; label: string; tags: string[]; section: Section }[] = [
  { key: "operating", label: "From the main business", tags: ["NetCashProvidedByUsedInOperatingActivities", "NetCashProvidedByUsedInOperatingActivitiesContinuingOperations"], section: "operating" },
  { key: "investing", label: "Investing", tags: ["NetCashProvidedByUsedInInvestingActivities", "NetCashProvidedByUsedInInvestingActivitiesContinuingOperations"], section: "investing" },
  { key: "financing", label: "Lenders and shareholders", tags: ["NetCashProvidedByUsedInFinancingActivities", "NetCashProvidedByUsedInFinancingActivitiesContinuingOperations"], section: "financing" },
];

export function cashSteps(lines: Line[], col: number): Step[] {
  const m = main(lines);
  const cashLines = m.filter((l) => /^(CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents|CashAndCashEquivalentsAtCarryingValue|CashAndDueFromBanks)$/.test(tagOf(l)) || (/cash/i.test(l.label) && /(beginning|end) of (the )?(year|period)|balances?$/i.test(l.label)));
  const start = cashLines.find((l) => /begin|start/i.test(l.label));
  const end = [...cashLines].reverse().find((l) => /end/i.test(l.label));
  const steps: Step[] = [];
  if (start && start.values[col] !== null) {
    steps.push({ key: "start", label: "Cash at the start", value: start.values[col]!, anchor: true, lines: [{ plain: start.plain, label: start.shortLabel, value: start.values[col]! }], note: "The cash it had when the period began." });
  }
  for (const s of CASH_SECTIONS) {
    const total = lines.find((l) => s.tags.includes(tagOf(l)) && l.values[col] !== null);
    if (!total) continue;
    const parts = lines.filter((l) => l.section === s.section && !l.header && !l.total && !l.split && l.unit === "money" && l.values[col] !== null && l !== total && !/^(NetIncomeLoss|ProfitLoss)$/.test(tagOf(l)) );
    const v = total.values[col]!;
    steps.push({
      key: s.key,
      label: s.label,
      value: v,
      anchor: false,
      lines: (s.key === "operating" ? [lines.find((l) => l.section === "operating" && /^(NetIncomeLoss|ProfitLoss)$/.test(tagOf(l)))].filter((x): x is Line => Boolean(x)) : [])
        .concat(parts)
        .map((l) => ({ plain: l.plain, label: l.shortLabel, value: l.values[col]! })),
      note: total.what,
    });
  }
  const fx = m.find((l) => /^EffectOfExchangeRate/.test(tagOf(l)) && l.values[col]);
  if (fx) steps.push({ key: "fx", label: "Currency moves", value: fx.values[col]!, anchor: false, lines: [{ plain: fx.plain, label: fx.shortLabel, value: fx.values[col]! }], note: fx.what });
  if (end && end.values[col] !== null) {
    steps.push({ key: "end", label: "Cash at the end", value: end.values[col]!, anchor: true, lines: [{ plain: end.plain, label: end.shortLabel, value: end.values[col]! }], note: "The cash it had when the period finished." });
  }
  return steps.length >= 3 ? steps : [];
}

// ---------------------------------------------------------------- balance sheet: what it owns, what it owes

export function balanceParts(lines: Line[], col: number): NonNullable<StatementView["balance"]>[number] | undefined {
  const m = lines.filter((l) => !l.split && !l.header && l.unit === "money");
  const totalAssets = firstWith(m, ["Assets"])?.values[col];
  if (!totalAssets) return undefined;
  const equityLine = firstWith(m, ["StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest", "StockholdersEquity"]);
  const totalLiabilities = firstWith(m, ["Liabilities"])?.values[col] ?? undefined;
  const equity = equityLine?.values[col] ?? (totalLiabilities !== undefined ? totalAssets - totalLiabilities : undefined);
  if (equity === undefined || equity === null) return undefined;

  /** The lines of one side, using a total instead of its parts when a part is negative (like a loan-loss cushion). */
  const side = (pick: (l: Line) => boolean, stopTags: string[]): BalancePart[] => {
    const out: BalancePart[] = [];
    let run: Line[] = [];
    for (const l of m) {
      if (!pick(l)) continue;
      if (stopTags.includes(tagOf(l))) break;
      if (l.total) {
        const negative = run.some((r) => (r.values[col] ?? 0) < 0);
        if (negative && l.values[col] !== null) run = [l];
        out.push(...run.filter((r) => r.values[col]).map((r) => toPart(r)));
        run = [];
      } else run.push(l);
    }
    out.push(...run.filter((r) => r.values[col]).map((r) => toPart(r)));
    return out.filter((p) => p.value > 0);
  };
  const toPart = (l: Line): BalancePart => ({
    label: l.shortLabel,
    plain: l.plain,
    value: l.values[col] ?? 0,
    group: (l.section === "currentAssets" || l.section === "assets" || l.section === "currentLiabilities" || l.section === "liabilities" ? l.section : "equity"),
    what: l.what,
  });
  const assets = side((l) => l.section === "currentAssets" || l.section === "assets", ["Assets"]);
  const owed = side((l) => l.section === "currentLiabilities" || l.section === "liabilities", ["Liabilities", "LiabilitiesAndStockholdersEquity"]).filter((p) => !/^(CommitmentsAndContingencies)$/.test(p.label));

  // If the parts don't add up to the totals, show the totals only rather than a wrong picture.
  const sum = (ps: BalancePart[]) => ps.reduce((a, p) => a + p.value, 0);
  const close = (a: number, b: number) => Math.abs(a - b) <= Math.max(1, Math.abs(b) * 0.015);
  // Parts that fall short of the total get an honest "not listed" piece; parts that overshoot mean the picture can't be trusted.
  const fit = (parts: BalancePart[], total: number, group: BalancePart["group"], whole: BalancePart): BalancePart[] => {
    const s = sum(parts);
    if (close(s, total)) return parts;
    if (s < total && parts.length > 0) return [...parts, { label: "Not listed line by line", plain: "Not listed line by line", value: total - s, group, what: "Part of the total that the filed data doesn't break down on its own line." }];
    return [whole];
  };
  const assetParts = fit(assets, totalAssets, "assets", { label: "Total assets", plain: "Everything it owns", value: totalAssets, group: "assets", what: "Every asset added up." });
  const owedTotal = totalLiabilities ?? totalAssets - equity;
  const owedParts = fit(owed, owedTotal, "liabilities", { label: "Total liabilities", plain: "Everything it owes", value: owedTotal, group: "liabilities", what: "Every debt and bill added up." });
  return { assets: assetParts, owed: owedParts, equity, totalAssets, totalLiabilities: owedTotal };
}

// ---------------------------------------------------------------- shareholders' equity: from the start of a period to its end

const DATE_IN_LABEL = /\bat\s+((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},\s*\d{4})\s*$/i;
const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
function labelDate(label: string): string | undefined {
  const m = label.match(DATE_IN_LABEL);
  if (!m) return undefined;
  const d = m[1].match(/([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),\s*(\d{4})/);
  if (!d) return undefined;
  return `${d[3]}-${String(MONTHS[d[1].toLowerCase()]).padStart(2, "0")}-${d[2].padStart(2, "0")}`;
}

const EQUITY_TOTAL_TAGS = new Set(["StockholdersEquity", "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest", "MinorityInterest", "PartnersCapital", "MembersEquity"]);

export function equityPeriods(lines: Line[], columns: Column[], allowedMonths?: number[]): EquityPeriod[] {
  const isTotalCol = (c: Column) => /^total$/i.test(c.label.trim());
  const skipCol = (c: Column) => /total|cumulative effect|adjustment|shares/i.test(c.label);
  const totalCol = columns.findIndex(isTotalCol);
  const valueOf = (l: Line): number | undefined => {
    if (totalCol >= 0 && l.values[totalCol] !== null && l.values[totalCol] !== undefined) return l.values[totalCol]!;
    const parts: number[] = [];
    l.values.forEach((v, i) => {
      if (v === null || v === 0 || !columns[i] || skipCol(columns[i])) return;
      // The same amount shown under two parts of equity (within 5%) is one movement, not two.
      if (parts.some((p) => Math.sign(p) === Math.sign(v) && Math.abs(p - v) <= Math.abs(v) * 0.05)) return;
      parts.push(v);
    });
    return parts.length ? parts.reduce((a, b) => a + b, 0) : l.values.some((v) => v === 0) ? 0 : undefined;
  };

  // Lines inside a roll-forward of "redeemable" interests (kept outside equity) don't count.
  let temporary = false;
  const usable = lines.map((l) => {
    if (l.header) temporary = /TemporaryEquity/.test(l.concept);
    return { l, ok: !temporary && !/TemporaryEquity/.test(l.concept) && l.unit === "money" && !l.split };
  });

  type Balance = { i: number; date: string };
  const balances: Balance[] = [];
  usable.forEach(({ l, ok }, i) => {
    if (!ok) return;
    const date = labelDate(l.label);
    if (date && (EQUITY_TOTAL_TAGS.has(tagOf(l)) || /balance/i.test(l.label))) balances.push({ i, date });
  });

  const byPeriod = new Map<string, { start: string; end: string; open?: number; close?: number; rows: Map<string, Line> }>();
  for (let k = 0; k + 1 < balances.length; k++) {
    const a = balances[k];
    const b = balances[k + 1];
    if (b.date <= a.date) continue;
    const key = `${a.date}|${b.date}`;
    const entry = byPeriod.get(key) ?? { start: a.date, end: b.date, rows: new Map<string, Line>() };
    const open = valueOf(lines[a.i]);
    const close = valueOf(lines[b.i]);
    if (open !== undefined && (entry.open === undefined || Math.abs(open) > Math.abs(entry.open))) entry.open = open;
    if (close !== undefined && (entry.close === undefined || Math.abs(close) > Math.abs(entry.close))) entry.close = close;
    for (let i = a.i + 1; i < b.i; i++) {
      const { l, ok } = usable[i];
      if (!ok || l.header || labelDate(l.label) || EQUITY_TOTAL_TAGS.has(tagOf(l)) || /^balance/i.test(l.label)) continue;
      const v = valueOf(l);
      if (v === undefined || v === 0) continue;
      // The same movement can be repeated under each part of equity; count it once.
      const sig = `${l.concept}|${l.values.join(",")}`;
      if (!entry.rows.has(sig)) entry.rows.set(sig, l);
    }
    byPeriod.set(key, entry);
  }

  const out: EquityPeriod[] = [];
  for (const p of byPeriod.values()) {
    if (p.open === undefined || p.close === undefined) continue;
    const merged = new Map<string, { plain: string; label: string; value: number }>();
    for (const l of p.rows.values()) {
      const v = valueOf(l) ?? 0;
      const k = l.plain;
      const prev = merged.get(k);
      merged.set(k, prev ? { ...prev, value: prev.value + v } : { plain: l.plain, label: l.shortLabel, value: v });
    }
    const steps = [...merged.values()].filter((s) => Math.round(s.value) !== 0);
    const explained = steps.reduce((a, s) => a + s.value, 0);
    const gap = p.close - p.open - explained;
    if (Math.abs(gap) > Math.max(1, Math.abs(p.close) * 0.002)) steps.push({ plain: "Other changes", label: "Smaller changes not shown on their own lines", value: gap });
    const months = Math.round((Date.parse(p.end) - Date.parse(p.start)) / (30.44 * 86_400_000));
    // Skip gaps between two periods (no movements of their own), and periods the report doesn't cover.
    if (!steps.some((x) => x.plain !== "Other changes")) continue;
    if (allowedMonths && allowedMonths.length && !allowedMonths.includes(months)) continue;
    out.push({ start: p.start, end: p.end, months, opening: p.open, closing: p.close, steps });
  }
  // Longest and newest first.
  return out.sort((a, b) => b.end.localeCompare(a.end) || b.months - a.months);
}

// ---------------------------------------------------------------- helpers

export function money(v: number): string {
  const a = Math.abs(v);
  const sign = v < 0 ? "−" : "";
  if (a >= 1e12) return `${sign}$${(a / 1e12).toFixed(2)} trillion`;
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(a >= 1e11 ? 0 : 1)} billion`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(a >= 1e8 ? 0 : 1)} million`;
  if (a >= 1e3) return `${sign}$${Math.round(a).toLocaleString("en-US")}`;
  return `${sign}$${a.toFixed(a % 1 ? 2 : 0)}`;
}

/** The column a year before this one, for "what changed": same length of period, about a year earlier. */
export function yearEarlier(columns: Column[], col: number): number | undefined {
  const c = columns[col];
  if (!c?.date) return undefined;
  const target = Date.parse(c.date) - 365.25 * 86_400_000;
  let best: number | undefined;
  let bestGap = Infinity;
  columns.forEach((o, i) => {
    if (i === col || !o.date || o.months !== c.months) return;
    const gap = Math.abs(Date.parse(o.date) - target);
    if (gap < 20 * 86_400_000 && gap < bestGap) {
      best = i;
      bestGap = gap;
    }
  });
  if (best === undefined && !c.months) {
    // Balance sheets in quarterly reports compare with the last year-end, not a year earlier.
    const other = columns.findIndex((o, i) => i !== col && o.date && !o.months && o.date < c.date!);
    return other >= 0 ? other : undefined;
  }
  return best;
}
