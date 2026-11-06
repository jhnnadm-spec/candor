/**
 * The proxy statement (DEF 14A): the document sent to shareholders before the yearly
 * meeting. It covers what they vote on, who sits on the board, and how the top
 * people are paid.
 *
 * Since 2022 the "pay versus performance" table is tagged (the "ecd" tags), so the
 * pay figures here are read straight from the tags, not guessed from the text.
 * A few other facts (the meeting date, the CEO pay ratio, the list of proposals) are
 * found in the text and shown in the company's own words, only when clearly found.
 */
import * as cheerio from "cheerio";
import { secFetchText } from "./client";
import { htmlToText } from "./sections";

export type PayYear = {
  year: string; // fiscal year end, "YYYY-MM-DD"
  ceoTotal?: number; // what the summary pay table says the chief executive was paid
  ceoActuallyPaid?: number; // "compensation actually paid": pay re-valued at today's share prices
  othersTotal?: number; // average for the other top executives
  othersActuallyPaid?: number;
  tsr?: number; // what $100 invested in the shares became
  peerTsr?: number; // the same for a group of similar companies
  netIncome?: number;
  measure?: number; // the measure the company picked to link pay to
  ceoName?: string;
};

export type Proposal = { number: number; title: string; byShareholder: boolean; board?: "FOR" | "AGAINST" | "ONE YEAR" };

export type ProxyFacts = {
  filingDate: string;
  url: string;
  pay: PayYear[]; // newest first
  measureName?: string;
  ceoNames: string[];
  payRatio?: { ratio: number; quote: string };
  meeting?: { date: string; quote: string };
  proposals: Proposal[];
  auditor?: string;
  sections: { title: string; chars: number }[]; // headings found, for a contents list
};

type Context = { end?: string; members: string[] };

function readContexts($: cheerio.CheerioAPI): Map<string, Context> {
  const out = new Map<string, Context>();
  $("xbrli\\:context").each((_, el) => {
    const c = $(el);
    const end = c.find("xbrli\\:enddate").first().text().trim() || c.find("xbrli\\:instant").first().text().trim() || undefined;
    const members = c
      .find("xbrldi\\:explicitmember")
      .map((__, m) => $(m).text().trim())
      .get();
    out.set(c.attr("id") ?? "", { end, members });
  });
  return out;
}

function factValue(el: cheerio.Cheerio<never>): number | undefined {
  const raw = el.text().replace(/[,$\s]/g, "");
  if (!raw || raw === "-" || raw === "—") return el.attr("format")?.includes("zerodash") ? 0 : undefined;
  let n = Number(raw.replace(/[()]/g, ""));
  if (!Number.isFinite(n)) return undefined;
  n *= 10 ** (Number(el.attr("scale")) || 0);
  if (el.attr("sign") === "-") n = -n;
  return n;
}

const PAY_TAGS: Record<string, keyof PayYear> = {
  "ecd:PeoTotalCompAmt": "ceoTotal",
  "ecd:PeoActuallyPaidCompAmt": "ceoActuallyPaid",
  "ecd:NonPeoNeoAvgTotalCompAmt": "othersTotal",
  "ecd:NonPeoNeoAvgCompActuallyPaidAmt": "othersActuallyPaid",
  "ecd:TotalShareholderRtnAmt": "tsr",
  "ecd:PeerGroupTotalShareholderRtnAmt": "peerTsr",
  "us-gaap:NetIncomeLoss": "netIncome",
  "ecd:CoSelectedMeasureAmt": "measure",
};

export function parseProxy(html: string, filingDate: string, url: string): ProxyFacts {
  const $ = cheerio.load(html);
  const contexts = readContexts($);
  const years = new Map<string, PayYear>();
  const ceoNames = new Set<string>();
  let measureName: string | undefined;

  $("ix\\:nonfraction").each((_, node) => {
    const el = $(node) as unknown as cheerio.Cheerio<never>;
    const name = $(node).attr("name") ?? "";
    const key = PAY_TAGS[name];
    if (!key) return;
    const ctx = contexts.get($(node).attr("contextref") ?? "");
    if (!ctx?.end) return;
    // Pay for one of several chief executives in the same year carries their name as a "member"; the plain figure is the total.
    const memberTag = ctx.members.find((m) => /IndividualAxis|Member/i.test(m));
    const v = factValue(el);
    if (v === undefined) return;
    const y = years.get(ctx.end) ?? { year: ctx.end };
    if (memberTag && (key === "ceoTotal" || key === "ceoActuallyPaid")) {
      // Several chief executives in one year: add them up, and keep their names.
      const prev = (y[key] as number | undefined) ?? 0;
      (y as Record<string, unknown>)[`${key}:${memberTag}`] = v;
      if (!(`${key}:${memberTag}:counted` in y)) {
        (y as Record<string, unknown>)[key] = prev + v;
        (y as Record<string, unknown>)[`${key}:${memberTag}:counted`] = true;
      }
    } else if (y[key] === undefined && !ctx.members.length) {
      (y as Record<string, unknown>)[key] = v;
    }
    years.set(ctx.end, y);
  });
  $("ix\\:nonnumeric").each((_, node) => {
    const name = $(node).attr("name") ?? "";
    const text = $(node).text().replace(/\s+/g, " ").trim();
    if (!text || text.length > 120) return;
    if (name === "ecd:PeoName") {
      text.split(/\s*(?:,| and |&)\s*/).filter((n) => /^[A-Z][\w.'’-]+(\s+[A-Z][\w.'’-]+)+$/.test(n)).forEach((n) => ceoNames.add(n));
      const ctx = contexts.get($(node).attr("contextref") ?? "");
      if (ctx?.end) {
        const y = years.get(ctx.end) ?? { year: ctx.end };
        y.ceoName = y.ceoName && !y.ceoName.includes(text) ? `${y.ceoName} and ${text}` : text;
        years.set(ctx.end, y);
      }
    }
    if (name === "ecd:CoSelectedMeasureName" || (name === "ecd:MeasureName" && !measureName)) measureName ??= text;
  });

  const pay = [...years.values()]
    .map((y) => Object.fromEntries(Object.entries(y).filter(([k]) => !k.includes(":"))) as PayYear)
    .filter((y) => y.ceoTotal !== undefined || y.tsr !== undefined)
    .sort((a, b) => b.year.localeCompare(a.year));

  const text = htmlToText(html);
  return {
    filingDate,
    url,
    pay,
    measureName,
    ceoNames: [...ceoNames],
    payRatio: findPayRatio(text),
    meeting: findMeeting(text),
    proposals: findProposals(text),
    auditor: findAuditor(text),
    sections: [],
  };
}

/** "the ratio ... was 533 to 1" or "533:1", near the words "pay ratio". */
export function findPayRatio(text: string): ProxyFacts["payRatio"] {
  const re = /pay ratio/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const window = text.slice(m.index, m.index + 2500);
    const r = window.match(/(?:approximately|was|of|is)?\s*(\d{1,3}(?:,\d{3})*|\d+)\s*(?:to|:)\s*1\b/i);
    if (r) {
      const ratio = Number(r[1].replace(/,/g, ""));
      if (ratio >= 2 && ratio < 100000) {
        const start = window.lastIndexOf(".", r.index ?? 0) + 1;
        const end = window.indexOf(".", (r.index ?? 0) + r[0].length);
        return { ratio, quote: window.slice(start, end > 0 ? end + 1 : undefined).trim().slice(0, 400) };
      }
    }
  }
  return undefined;
}

const MONTH_RE = "(January|February|March|April|May|June|July|August|September|October|November|December)\\s+\\d{1,2},\\s*\\d{4}";

/** The meeting date: "Annual Meeting of Shareholders ... will be held ... on Tuesday, February 24, 2026". */
export function findMeeting(text: string): ProxyFacts["meeting"] {
  const re = new RegExp(`annual meeting of (?:share|stock)(?:holders|owners)[^.]{0,200}?(?:held|take place)[^.]{0,120}?${MONTH_RE}`, "i");
  const m = text.match(re);
  if (!m) return undefined;
  const d = m[0].match(new RegExp(MONTH_RE, "i"))![0];
  const parsed = new Date(`${d} UTC`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return { date: parsed.toISOString().slice(0, 10), quote: m[0].replace(/\s+/g, " ").slice(0, 300) };
}

/** "Proposal 1: Election of Directors", "Item 4 — Shareholder Proposal …". Each number once, in order. */
export function findProposals(text: string): Proposal[] {
  const found = new Map<number, Proposal>();
  const re = /(?:^|\n)\s*(?:Proposal|Item)\s+(?:No\.\s*)?(\d{1,2})\s*[:.\-–—]?\s*([^\n]{6,160})/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const n = Number(m[1]);
    let title = m[2].replace(/\s+/g, " ").replace(/\s*\d{1,3}$/, "").trim();
    if (n < 1 || n > 20 || found.has(n)) continue;
    if (/^(of|to|in|and|the|is|was|are|will)\b/i.test(title) || title.length < 6) continue;
    title = title.replace(/[.\s]+$/, "");
    const after = text.slice(m.index, m.index + 1200).toUpperCase();
    const board = /RECOMMENDS? (?:A VOTE |THAT (?:YOU |SHAREHOLDERS )?VOTE )?[“"]?AGAINST/.test(after) ? "AGAINST" : /RECOMMENDS? (?:A VOTE |THAT (?:YOU |SHAREHOLDERS )?VOTE )?[“"]?FOR/.test(after) ? "FOR" : /ONE YEAR|EVERY YEAR|1 YEAR/.test(after) && /FREQUENCY/.test(after) ? "ONE YEAR" : undefined;
    found.set(n, { number: n, title: title.slice(0, 140), byShareholder: /shareholder proposal|stockholder proposal|shareowner proposal/i.test(title), board });
  }
  // Keep a clean run 1, 2, 3 … so stray matches elsewhere in the document don't sneak in.
  const out: Proposal[] = [];
  for (let i = 1; found.has(i); i++) out.push(found.get(i)!);
  return out;
}

/** The audit firm the board asks shareholders to approve. */
export function findAuditor(text: string): string | undefined {
  const firms = ["Ernst & Young LLP", "PricewaterhouseCoopers LLP", "Deloitte & Touche LLP", "KPMG LLP", "Grant Thornton LLP", "BDO USA", "RSM US LLP", "Crowe LLP", "Moss Adams LLP", "Marcum LLP"];
  let best: { firm: string; n: number } | undefined;
  for (const f of firms) {
    const n = text.split(f).length - 1;
    if (n > 0 && (!best || n > best.n)) best = { firm: f, n };
  }
  return best?.firm;
}

export async function loadProxy(url: string, filingDate: string): Promise<ProxyFacts> {
  return parseProxy(await secFetchText(url), filingDate, url);
}
