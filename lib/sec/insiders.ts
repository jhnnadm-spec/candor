/**
 * Insider trades: Form 4 filings. Directors, top managers and anyone owning more than
 * 10% of a company must report when they buy or sell its shares, within two business
 * days. Each Form 4 comes as structured data, so every figure here is read straight
 * from it.
 */
import * as cheerio from "cheerio";
import { secFetchText } from "./client";
import type { Filing } from "./filings";
import { CODES } from "./insider-codes";
export { CODES } from "./insider-codes";

export type InsiderTrade = {
  date: string; // "YYYY-MM-DD"
  filed: string;
  person: string; // "Robyn M Denholm"
  role: string; // "Director", "Chief Financial Officer", "Owns over 10%"
  code: string; // SEC's one-letter code
  action: string; // plain English
  kind: "buy" | "sell" | "award" | "tax" | "exercise" | "gift" | "other";
  shares: number;
  price?: number; // per share, when there is one
  value?: number; // shares × price
  acquired: boolean; // came into their hands (true) or left them (false)
  after?: number; // shares they own afterwards
  direct: boolean; // owned directly, or through a trust, family member etc.
  planned: boolean; // made under a trading plan set up in advance (Rule 10b5-1)
  security: string; // "Common Stock", "Restricted Stock Units"
  derivative: boolean; // options or share units rather than shares
  url: string; // the filing
};

function titleCase(name: string): string {
  // SEC lists people surname first: "DENHOLM ROBYN M" -> "Robyn M Denholm". Firms and funds keep their order.
  const raw = name.trim().replace(/\s+/g, " ");
  const cap = (w: string) => (w.length <= 3 && /^[A-Z]+$/.test(w) && /^(II|III|IV|LLC|LP|JR|SR)$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).replace(/(['’-])(\w)/g, (_, a: string, b: string) => a + b.toUpperCase());
  const words = raw.includes(",") ? [raw.split(",")[0], ...raw.split(",").slice(1).join(" ").trim().split(" ")] : raw.split(" ");
  const shout = raw === raw.toUpperCase();
  const fix = (w: string) => (shout ? cap(w) : w);
  if (/\b(inc|llc|l\.?p|lp|trust|fund|corp|corporation|holdings?|capital|partners|foundation|ltd|co|company|group|management|advisors|bank)\b\.?/i.test(raw) || words.length < 2) return words.map(fix).join(" ");
  const [last, ...rest] = words;
  return [...rest, last].map(fix).join(" ").replace(/\bMc(\w)/g, (_, c: string) => `Mc${c.toUpperCase()}`);
}

const ROLE_WORDS: [RegExp, string][] = [
  [/chief executive|\bceo\b/i, "Chief executive"],
  [/chief financial|\bcfo\b/i, "Chief financial officer"],
  [/chief operating|\bcoo\b/i, "Chief operating officer"],
  [/general counsel|chief legal/i, "Chief lawyer"],
  [/chief accounting|controller/i, "Chief accountant"],
  [/chief technology|\bcto\b/i, "Chief technology officer"],
];

function roleOf(rel: cheerio.Cheerio<never>, $: cheerio.CheerioAPI): string {
  const flag = (t: string) => /^(1|true)$/i.test($(rel).find(t).first().text().trim());
  const title = $(rel).find("officerTitle").first().text().trim();
  const roles: string[] = [];
  if (flag("isOfficer") && title) {
    const plain = ROLE_WORDS.find(([re]) => re.test(title))?.[1];
    roles.push(plain ? `${plain} (${title})` : title);
  } else if (flag("isOfficer")) roles.push("Senior manager");
  if (flag("isDirector")) roles.push("Director");
  if (flag("isTenPercentOwner")) roles.push("Owns over 10%");
  if (roles.length === 0 && flag("isOther")) roles.push($(rel).find("otherText").first().text().trim() || "Other insider");
  return roles.join(" · ") || "Insider";
}

export function parseForm4(xml: string, filing: { url: string; filingDate: string }): InsiderTrade[] {
  const $ = cheerio.load(xml, { xml: true });
  const owners = $("reportingOwner");
  const person = owners
    .map((_, o) => titleCase($(o).find("rptOwnerName").first().text()))
    .get()
    .join(" and ");
  const role = roleOf(owners.first().find("reportingOwnerRelationship") as unknown as cheerio.Cheerio<never>, $);
  const flagPlan = /^(1|true)$/i.test($("aff10b5One").first().text().trim());
  const footnotes = $("footnote")
    .map((_, f) => $(f).text())
    .get()
    .join(" ");
  const plannedByNote = /10b5-1/i.test(footnotes);

  const out: InsiderTrade[] = [];
  $("nonDerivativeTransaction, derivativeTransaction").each((_, node) => {
    const t = $(node);
    const v = (sel: string) => t.find(sel).first().find("value").first().text().trim() || t.find(sel).first().text().trim();
    const code = t.find("transactionCode").first().text().trim();
    const shares = Number(v("transactionShares")) || 0;
    const price = Number(v("transactionPricePerShare")) || undefined;
    const ad = v("transactionAcquiredDisposedCode");
    const info = CODES[code] ?? { action: "Other kind of transaction", kind: "other" as const };
    const derivative = node.tagName === "derivativeTransaction";
    out.push({
      date: v("transactionDate").slice(0, 10),
      filed: filing.filingDate,
      person,
      role,
      code,
      action: info.action,
      kind: info.kind,
      shares,
      price,
      value: price && shares && !derivative ? price * shares : undefined,
      acquired: ad === "A",
      after: Number(v("sharesOwnedFollowingTransaction")) || undefined,
      direct: v("directOrIndirectOwnership") !== "I",
      planned: (flagPlan || plannedByNote) && (code === "S" || code === "P"),
      security: v("securityTitle"),
      derivative,
      url: filing.url,
    });
  });
  return out;
}

/** The raw data file of a Form 4 (its listed document is a styled copy in a sub-folder). */
export function form4DataUrl(f: Filing): string {
  return f.url.replace(/\/xslF345X\d+\//, "/");
}

export type InsiderSummary = {
  trades: InsiderTrade[]; // newest first
  since: string;
  filingsRead: number;
  filingsInPeriod: number;
  bought: { count: number; shares: number; value: number; people: number };
  sold: { count: number; shares: number; value: number; people: number; plannedShare: number };
  months: { month: string; bought: number; sold: number }[]; // value by month, oldest first
  people: { person: string; role: string; boughtValue: number; soldValue: number; netShares: number; trades: number; after?: number }[];
};

export function summarise(trades: InsiderTrade[], since: string, filingsRead: number, filingsInPeriod: number, today = new Date()): InsiderSummary {
  const market = trades.filter((t) => !t.derivative);
  const buys = market.filter((t) => t.code === "P");
  const sells = market.filter((t) => t.code === "S");
  const sum = (xs: InsiderTrade[], k: "shares" | "value") => xs.reduce((a, t) => a + (t[k] ?? 0), 0);
  const months: InsiderSummary["months"] = [];
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - i, 1));
    const key = d.toISOString().slice(0, 7);
    months.push({ month: key, bought: sum(buys.filter((t) => t.date.startsWith(key)), "value"), sold: sum(sells.filter((t) => t.date.startsWith(key)), "value") });
  }
  const byPerson = new Map<string, InsiderSummary["people"][number]>();
  for (const t of market) {
    const p = byPerson.get(t.person) ?? { person: t.person, role: t.role, boughtValue: 0, soldValue: 0, netShares: 0, trades: 0, after: t.after };
    p.trades++;
    if (t.code === "P") p.boughtValue += t.value ?? 0;
    if (t.code === "S") p.soldValue += t.value ?? 0;
    p.netShares += t.acquired ? t.shares : -t.shares;
    byPerson.set(t.person, p);
  }
  return {
    trades,
    since,
    filingsRead,
    filingsInPeriod,
    bought: { count: buys.length, shares: sum(buys, "shares"), value: sum(buys, "value"), people: new Set(buys.map((t) => t.person)).size },
    sold: { count: sells.length, shares: sum(sells, "shares"), value: sum(sells, "value"), people: new Set(sells.map((t) => t.person)).size, plannedShare: sells.length ? sells.filter((t) => t.planned).length / sells.length : 0 },
    months,
    people: [...byPerson.values()].sort((a, b) => b.soldValue + b.boughtValue - (a.soldValue + a.boughtValue)),
  };
}

const MAX_FILINGS = 30;

export async function loadInsiderTrades(filings: Filing[], today = new Date()): Promise<InsiderSummary> {
  const since = new Date(today.getTime() - 365 * 86_400_000).toISOString().slice(0, 10);
  const recent = filings.filter((f) => (f.form === "4" || f.form === "4/A") && f.filingDate >= since);
  const read = recent.slice(0, MAX_FILINGS);
  const trades: InsiderTrade[] = [];
  for (const f of read) {
    try {
      trades.push(...parseForm4(await secFetchText(form4DataUrl(f)), { url: f.url, filingDate: f.filingDate }));
    } catch {
      // A single unreadable filing is skipped; the count below says how many were read.
    }
  }
  trades.sort((a, b) => b.date.localeCompare(a.date) || b.filed.localeCompare(a.filed));
  return summarise(trades, since, read.length, recent.length, today);
}
