/**
 * The yearly report (10-K) and quarterly report (10-Q), part by part.
 *
 * Every part ("Item") gets a plain explanation of what it is and why it matters,
 * written once by candor. Then candor pulls out what can be found reliably in the
 * company's own text: how many people it employs, the list of risks it names, who
 * audits it and whether the auditor raised a warning, whether its controls worked,
 * trading plans set up by its leaders, and the headings of the managers' discussion.
 * Anything quoted is the company's own words, labelled as such.
 */
import * as cheerio from "cheerio";
import { secFetchText } from "./client";
import { htmlToText, splitSections, type Section } from "./sections";
import type { RPage } from "./rpages";

export type Fact = { label: string; value: string; tone?: "ok" | "warn" | "info"; quote?: string };
export type RiskGroup = { title: string; risks: { text: string; theme: string }[] };

export type GuideItem = {
  id: string; // "1A", "II-1A"
  part?: string;
  title: string; // official title
  name: string; // plain name
  what: string; // what this part is
  why: string; // why people read it
  chars: number;
  minutes: number; // reading time of the original
  facts: Fact[];
  excerpt?: string; // the company's own opening words
  outline?: string[]; // headings inside the part
  risks?: RiskGroup[];
  points?: string[]; // quoted sentences (trading plans, etc.)
  link?: "statements" | "proxy" | "notes";
  empty: boolean; // "None", "Not applicable", "[Reserved]"
};

export type ReportGuide = {
  form: "10-K" | "10-Q";
  filingDate: string;
  periodEnd: string;
  url: string;
  items: GuideItem[];
  checks: Fact[]; // the quick checks shown at the top
  themes: { theme: string; count: number }[]; // what the risks are about
  totalChars: number;
};

type ItemInfo = { name: string; what: string; why: string; link?: GuideItem["link"] };
const I = (name: string, what: string, why: string, link?: GuideItem["link"]): ItemInfo => ({ name, what, why, link });

/** What each part of a yearly report (10-K) is. */
export const TEN_K: Record<string, ItemInfo> = {
  "1": I("What the company does", "The company describing itself: what it sells, who its customers are, where it operates, its competitors, how many people work there, and the rules it must follow.", "The best place to start: it's the company explaining its own business in its own words."),
  "1A": I("What could go wrong", "Every significant risk the company thinks could hurt its business or its share price, each with a one-sentence heading.", "Companies must list these by law. New risks, or risks that move up the list, are worth noticing. The list is long by design, so not every risk is likely."),
  "1B": I("Open questions from the SEC", "Any comments from SEC staff about earlier reports that are still unresolved.", "Usually says \"None\". Anything else means the regulator raised a question that hasn't been settled."),
  "1C": I("Cyber security", "How the company finds and manages cyber risks, who is responsible, and whether attacks have hurt it.", "Required since 2023. Shows how seriously the board takes hacking and data risks."),
  "2": I("Buildings and land it uses", "Its main offices, factories, stores and data centres, and whether it owns or rents them.", "Shows where the real-world business happens."),
  "3": I("Court cases", "Significant lawsuits and investigations involving the company.", "Big legal cases can bring fines, payouts or forced changes to how it does business."),
  "4": I("Mine safety", "Safety violations at mines it runs.", "Only matters for mining companies; most say \"Not applicable\"."),
  "5": I("Its shares: buybacks, dividends and shareholders", "Where its shares trade, roughly how many shareholders it has, its dividend policy, and shares it bought back in the last few months.", "Shows how the company hands money back to its owners."),
  "6": I("(Left empty by the rules)", "This part is reserved and no longer used.", ""),
  "7": I("Managers explain the year", "Management's Discussion and Analysis (MD&A): the managers explaining what changed in sales, costs and cash, and why, plus what they expect.", "The single most useful read after the statements: it's where managers explain the numbers in their own words."),
  "7A": I("How interest rates, currencies and prices affect it", "How much moves in interest rates, exchange rates and prices of things it buys could change its results.", "Shows how exposed it is to markets it doesn't control."),
  "8": I("The financial statements and the auditor's report", "The four financial statements, the notes that explain every figure, and the independent auditor's opinion.", "The heart of the report. candor shows every line of the statements on the Financial statements tab, and every note below.", "statements"),
  "9": I("Disagreements with its accountants", "Any changes of auditor or disagreements with them.", "Usually says \"None\". A disagreement would be a warning sign."),
  "9A": I("Do its money controls work?", "Whether managers and the auditor think the company's checks on its accounts (internal controls) work.", "A \"material weakness\" means a serious gap in those checks, so mistakes in the accounts are more likely."),
  "9B": I("Other news, including leaders' trading plans", "Anything that should have been announced but wasn't, and any pre-arranged plans by directors and top managers to buy or sell shares.", "Trading plans set up in advance (Rule 10b5-1) explain many insider sales."),
  "9C": I("Foreign audit inspections", "Whether its auditor is in a country that blocks US audit inspections.", "Mostly relevant to companies with auditors in China."),
  "10": I("Directors and top managers", "Who runs the company and sits on its board, and its code of ethics.", "Usually points to the proxy statement, where the detail is.", "proxy"),
  "11": I("How the top people are paid", "Pay for the chief executive and other top managers.", "Usually points to the proxy statement, where the detail is.", "proxy"),
  "12": I("Who owns the shares", "Big shareholders, what directors and managers own, and share plans for staff.", "Usually points to the proxy statement.", "proxy"),
  "13": I("Deals with insiders, and board independence", "Business between the company and its directors or managers, and which directors are independent.", "Usually points to the proxy statement.", "proxy"),
  "14": I("What it pays its auditor", "Fees paid to the audit firm, for the audit and for other work.", "Large fees for non-audit work can raise questions about the auditor's independence. Usually in the proxy statement.", "proxy"),
  "15": I("Attached documents", "A list of every document filed with the report: contracts, company rules, subsidiaries and more.", "Where to find the actual contracts and legal documents."),
  "16": I("Summary", "An optional summary of the report.", ""),
};

/** What each part of a quarterly report (10-Q) is. */
export const TEN_Q: Record<string, ItemInfo> = {
  "I-1": I("The financial statements", "The four statements for the quarter and the year so far, with notes. Quarterly statements aren't fully audited, only reviewed.", "candor shows every line on the Financial statements tab.", "statements"),
  "I-2": I("Managers explain the quarter", "Management's Discussion and Analysis (MD&A) for the quarter: what changed and why.", "The quickest way to understand what moved this quarter."),
  "I-3": I("How interest rates, currencies and prices affect it", "Changes since the yearly report in its exposure to interest rates, exchange rates and prices.", "Often says nothing much has changed."),
  "I-4": I("Do its money controls work?", "Whether managers think the checks on its accounts worked this quarter.", "A \"material weakness\" would be a warning sign."),
  "II-1": I("Court cases", "New or changed lawsuits and investigations.", "Big legal cases can bring fines, payouts or forced changes."),
  "II-1A": I("New risks", "Any changes to the risks listed in the yearly report.", "Usually \"no material changes\". Anything new is worth reading."),
  "II-2": I("Shares bought back", "Shares it bought back during the quarter, and shares sold without a public offering.", "Shows how much money went back to shareholders."),
  "II-3": I("Missed debt payments", "Any failure to pay what it owes on its debt.", "Usually \"None\"."),
  "II-4": I("Mine safety", "Mine safety violations.", "Only matters for mining companies."),
  "II-5": I("Other news, including leaders' trading plans", "Other information, including plans by directors and top managers to buy or sell shares.", "Pre-arranged trading plans (Rule 10b5-1) explain many insider sales."),
  "II-6": I("Attached documents", "Contracts and other documents filed with the report.", ""),
};

/** What a risk is about, from words in its heading. First match wins. */
const THEMES: [string, RegExp][] = [
  ["Cyber and data", /cyber|hack|breach|data (security|privacy|protection)|privacy|personal (data|information)|information technology systems|ransomware|outage|network disruption/i],
  ["Laws and regulators", /\blaws?\b|regulat|government|legal|litigation|antitrust|competition authorit|\btax|tariff|sanction|compliance|investigation|enforcement|legislation|scrutiny/i],
  ["Economy and markets", /econom|recession|inflation|interest rate|currenc|exchange rate|u\.s\. dollar|market conditions|demand|consumer spending|capital markets|credit risk|volatility/i],
  ["Competition", /compet|rival|market share|pricing pressure/i],
  ["Suppliers and operations", /supplier|supply|manufactur|component|logistic|outsourc|disrupt|capacity|facilit|third[- ]part|carrier|reseller|distribut|bottl|franchis/i],
  ["Products and technology", /product|technolog|innovation|artificial intelligence|\bai\b|software|quality|defect|research|intellectual property|patent|content/i],
  ["People", /employee|talent|personnel|key (people|executives|management)|workforce|labor|labour|team members/i],
  ["Debt, money and the stock", /debt|borrow|liquidity|stock price|share price|dividend|capital|credit rating|indebtedness|write-down|impairment|inventory/i],
  ["World events and climate", /geopolit|war\b|conflict|terror|pandemic|natural disaster|climate|weather|catastroph|political/i],
  ["Reputation and brand", /reputation|brand|public perception|social media|stakeholder/i],
  ["Deals and investments", /acqui|merger|investment|joint venture|divest|strateg/i],
];

export function themeOf(text: string): string {
  return THEMES.find(([, re]) => re.test(text))?.[0] ?? "Other";
}

const norm = (s: string) => s.replace(/\s+/g, " ").trim();

/** Text blocks written entirely in bold or italics: the headings inside each part. */
export function emphasisedBlocks(html: string): Set<string> {
  const $ = cheerio.load(html);
  const out = new Set<string>();
  const isEmph = (el: cheerio.Cheerio<never>): boolean => {
    const style = (el.attr("style") ?? "").toLowerCase();
    if (/font-weight:\s*(bold|[6-9]00)|font-style:\s*italic/.test(style)) return true;
    const tag = (el.get(0) as { tagName?: string } | undefined)?.tagName?.toLowerCase();
    return tag === "b" || tag === "strong" || tag === "i" || tag === "em";
  };
  $("p, div").each((_, node) => {
    const block = $(node);
    if (block.find("p, div, table").length > 0) return; // only innermost blocks
    const text = norm(block.text());
    if (text.length < 8 || text.length > 600) return;
    // Every piece of text in the block sits inside something bold or italic (or the block itself is).
    let plain = 0;
    let emph = 0;
    const walk = (n: cheerio.Cheerio<never>, inherited: boolean) => {
      n.contents().each((__, child) => {
        if (child.type === "text") {
          const t = norm((child as { data?: string }).data ?? "");
          if (t) {
            if (inherited) emph += t.length;
            else plain += t.length;
          }
        } else if (child.type === "tag") {
          const c = $(child) as unknown as cheerio.Cheerio<never>;
          walk(c, inherited || isEmph(c));
        }
      });
    };
    walk(block as unknown as cheerio.Cheerio<never>, isEmph(block as unknown as cheerio.Cheerio<never>));
    if (emph > 0 && plain <= 2) out.add(text);
  });
  return out;
}

function firstParagraph(text: string, min = 160, max = 700): string | undefined {
  const line = text.split("\n").slice(1).find((l) => l.length >= min && !/^item\s+\d/i.test(l) && !/form 10-[kq]\s*\|?\s*\d+$/i.test(l));
  if (!line) return undefined;
  return line.length > max ? `${line.slice(0, line.lastIndexOf(" ", max - 10))} …` : line;
}

function sentencesWith(text: string, re: RegExp, max = 8): string[] {
  return norm(text)
    .split(/(?<=[a-z0-9)”"]{2}[.;])\s+(?=[A-Z(“"])/)
    .filter((s) => re.test(s) && s.length < 700)
    .slice(0, max);
}

const isEmptyItem = (s: Section) => {
  const t = norm(s.text);
  return (t.length < 260 && /\b(none|not applicable|n\/a|\[?reserved\]?|not required)\.?\)?\s*$/i.test(t)) || t.length < 40;
};

export function buildGuide(html: string, form: "10-K" | "10-Q", meta: { filingDate: string; periodEnd: string; url: string }): ReportGuide {
  const text = htmlToText(html);
  const sections = splitSections(text, form);
  const emph = emphasisedBlocks(html);
  const table = form === "10-K" ? TEN_K : TEN_Q;
  const checks: Fact[] = [];
  const themeCount = new Map<string, number>();

  const items: GuideItem[] = sections
    .filter((s) => table[s.id])
    .map((s) => {
      const info = table[s.id];
      const lines = s.text.split("\n").map(norm).filter(Boolean);
      const item: GuideItem = {
        id: s.id,
        part: s.part,
        title: s.title,
        name: info.name,
        what: info.what,
        why: info.why,
        chars: s.text.length,
        minutes: Math.max(1, Math.round(s.text.length / 1200)),
        facts: [],
        link: info.link,
        empty: isEmptyItem(s),
      };
      const id = s.id;
      const incorporated = /incorporated (herein )?by reference/i.test(s.text) && s.text.length < 3000;

      if (id === "1") {
        item.excerpt = firstParagraph(s.text, 200);
        const emp = s.text.match(/(?:approximately|about|had|employed)\s+([\d,]{3,})\s+(?:full-time\s+)?(?:equivalent\s+)?(?:employees|people|team members|associates)/i);
        if (emp) item.facts.push({ label: "People working there", value: `About ${emp[1]}`, tone: "info", quote: norm(emp[0]) });
      }
      if (id === "1A" || id === "II-1A") {
        const groups: RiskGroup[] = [];
        let current: RiskGroup = { title: "General", risks: [] };
        for (const l of lines.slice(1)) {
          if (!emph.has(l)) continue;
          if (l.length <= 90 && !/[.:]$/.test(l) && !/form 10-|^\d+$/i.test(l)) {
            if (current.risks.length) groups.push(current);
            current = { title: l, risks: [] };
          } else if (l.length > 40 && /[.]$/.test(l)) {
            const theme = themeOf(l);
            current.risks.push({ text: l, theme });
            themeCount.set(theme, (themeCount.get(theme) ?? 0) + 1);
          }
        }
        if (current.risks.length) groups.push(current);
        if (groups.length) item.risks = groups;
        const n = groups.reduce((a, g) => a + g.risks.length, 0);
        if (n) item.facts.push({ label: "Risks it lists", value: String(n), tone: "info" });
        if (!n || id === "II-1A") item.excerpt = firstParagraph(s.text, 60);
      }
      if (id === "1B" || id === "9") item.facts.push(item.empty ? { label: "Status", value: "Nothing to report", tone: "ok" } : { label: "Status", value: "Something reported: read it", tone: "warn" });
      if (["1C", "2", "3", "7A", "I-3", "II-1", "II-2", "5", "II-5", "9B", "15", "II-6", "4", "II-4", "II-3", "16"].includes(id)) item.excerpt = firstParagraph(s.text, id === "2" ? 60 : 120, id === "3" || id === "II-1" ? 900 : 700);
      if (id === "5") {
        const holders = s.text.match(/([\d,]{3,})\s+(?:share|stock)?holders of record/i);
        if (holders) item.facts.push({ label: "Shareholders of record", value: holders[1], tone: "info", quote: norm(holders[0]) });
      }
      if (id === "7" || id === "I-2") {
        const heads = lines.filter((l) => emph.has(l) && l.length <= 80 && !/[.]$/.test(l) && !/^item\s/i.test(l) && !/form 10-|\|\s*\d+$/i.test(l));
        item.outline = [...new Set(heads)].slice(0, 40);
        item.excerpt = firstParagraph(s.text, 120);
      }
      if (id === "8") {
        const auditor = s.text.match(/\/s\/\s*([A-Z][A-Za-z&.,' -]{3,60}?(?:LLP|LLC|P\.?C\.?|Ltd\.?))/);
        const opinionOk = /present fairly, in all material respects/i.test(s.text);
        const goingConcern = /substantial doubt (about|regarding|as to) (the company['’]s|its|our) ability to continue as a going concern/i.test(s.text);
        const cams = (s.text.match(/critical audit matter/gi) ?? []).length;
        if (auditor) item.facts.push({ label: "Auditor", value: auditor[1].trim(), tone: "info" });
        item.facts.push(opinionOk ? { label: "Auditor's opinion", value: "Clean: the statements are fairly presented", tone: "ok" } : { label: "Auditor's opinion", value: "Couldn't find the standard wording: read the report", tone: "warn" });
        item.facts.push(goingConcern ? { label: "Can it keep going?", value: "The report raises doubt that it can continue as a going concern", tone: "warn" } : { label: "Can it keep going?", value: "No going-concern warning", tone: "ok" });
        if (cams) item.facts.push({ label: "Hardest areas the auditor checked", value: "Described as critical audit matters", tone: "info" });
        checks.push(...item.facts.filter((f) => f.label !== "Hardest areas the auditor checked"));
      }
      if (id === "9A" || id === "I-4") {
        const weakness = /material weakness(es)? (in|was|were|has been|have been) (identified|exist)|identified (a |two |three )?material weakness|not effective/i.test(s.text) && !/no material weakness/i.test(s.text);
        const effective = /(were|was|are|is) effective/i.test(s.text);
        const f: Fact = weakness ? { label: "Money controls", value: "A material weakness was reported", tone: "warn" } : effective ? { label: "Money controls", value: "Management says they worked", tone: "ok" } : { label: "Money controls", value: "Read the section", tone: "info" };
        item.facts.push(f);
        checks.push(f);
      }
      if (id === "9B" || id === "II-5") {
        const plans = sentencesWith(s.text, /10b5-1|trading arrangement/i, 10);
        if (plans.length) {
          item.points = plans;
          item.facts.push({ label: "Trading plans mentioned", value: String(plans.filter((p) => /adopt|terminat|enter/i.test(p)).length || plans.length), tone: "info" });
        }
      }
      if (["10", "11", "12", "13", "14"].includes(id) && incorporated) {
        item.facts.push({ label: "Where the detail is", value: "In the proxy statement (DEF 14A)", tone: "info" });
      }
      return item;
    });

  const totalChars = sections.reduce((a, s) => a + s.text.length, 0);
  const themes = [...themeCount.entries()].map(([theme, count]) => ({ theme, count })).sort((a, b) => b.count - a.count);
  return { form, ...meta, items, checks, themes, totalChars };
}

/** The original words of one part, for reading in full. */
export function sectionText(html: string, form: "10-K" | "10-Q", id: string): string | undefined {
  return splitSections(htmlToText(html), form).find((s) => s.id === id)?.text;
}

export async function loadGuide(url: string, form: "10-K" | "10-Q", meta: { filingDate: string; periodEnd: string }): Promise<ReportGuide> {
  return buildGuide(await secFetchText(url), form, { ...meta, url });
}

// ---------------------------------------------------------------- notes to the financial statements

export type NoteRef = { file: string; title: string; plain: string; details: { file: string; title: string }[] };

const NOTE_TOPICS: [RegExp, string][] = [
  [/summary of significant accounting|accounting policies|basis of presentation/i, "The rules it follows to count things: when a sale is counted, how stock is valued, and so on."],
  [/revenue/i, "Where its sales come from: by product, region or type of customer, and when it counts them."],
  [/segment/i, "The business split into its main parts, with sales and profit for each."],
  [/earnings per share|net income per share/i, "How profit per share is worked out, and how many shares are counted."],
  [/income tax/i, "What it pays in tax, where, and why its tax rate is what it is."],
  [/lease/i, "Offices, stores and equipment it rents on long contracts, and what it still owes on them."],
  [/debt|borrowing|notes payable|credit facilit|financing arrangement/i, "What it has borrowed, at what interest rate, and when it must pay it back."],
  [/fair value/i, "How it values its investments and other items at today's market prices."],
  [/financial instrument|investment|marketable|securities/i, "The investments it holds and what they're worth."],
  [/derivative|hedg/i, "Contracts it uses to protect itself from moves in currencies, interest rates or prices."],
  [/goodwill|intangible/i, "Goodwill and intangibles (patents, brands, customer lists), mostly from businesses it bought."],
  [/acquisition|business combination|merger|divest|disposal|held for sale/i, "Businesses it bought or sold, and what it paid or received."],
  [/property|plant|equipment/i, "Its buildings, machines and equipment, and their wear and tear."],
  [/inventor/i, "The stock it holds: raw materials, work in progress and finished products."],
  [/stock-based|share-based|equity incentive|compensation plan|benefit plan/i, "Pay given to staff in shares and options, and how it's valued."],
  [/pension|retirement|postretirement/i, "Pensions and retirement benefits it has promised to staff."],
  [/(stockholders|shareholders|shareowners)['’]? equity|capital stock|share repurchase|equity/i, "Its shares: buybacks, dividends and other changes."],
  [/commitment|contingenc|legal|litigation/i, "Promises it has made (to buy, to pay) and possible costs from lawsuits."],
  [/restructuring/i, "Costs of reorganising: job cuts, closing sites."],
  [/subsequent event/i, "Important things that happened after the period ended, before the report was filed."],
  [/related part/i, "Business it does with its own directors, managers or big owners."],
  [/comprehensive income/i, "Gains and losses that skip the income statement, such as currency moves."],
  [/receivable|credit loss|allowance/i, "Money owed to it and how much it expects won't be paid."],
  [/loan/i, "The loans it has made and how likely they are to be repaid."],
  [/deposit/i, "Money customers keep with it."],
  [/cash flow|supplemental/i, "Extra detail behind the cash flow statement."],
  [/concentration|major customer/i, "Customers or suppliers it depends on heavily."],
];

export function plainNote(title: string): string {
  return NOTE_TOPICS.find(([re]) => re.test(title))?.[1] ?? "More detail behind the figures in the statements.";
}

/** The notes in a filing, each with the detail tables that belong to it. */
export function notesFrom(pages: RPage[]): NoteRef[] {
  const notes = pages.filter((p) => p.category === "Notes");
  const details = pages.filter((p) => p.category === "Details" || p.category === "Tables");
  const key = (s: string) => s.replace(/\s*\((Tables|Details|Narrative)\)\s*$/i, "").split(/\s+-\s+/)[0].trim().toLowerCase();
  return notes.map((n) => ({
    file: n.file,
    title: n.shortName,
    plain: plainNote(n.shortName),
    details: details.filter((d) => d.category === "Details" && key(d.shortName) === key(n.shortName)).map((d) => ({ file: d.file, title: d.shortName.replace(/\s*\(Details(?: Narrative)?\)\s*$/i, "").replace(/^[^-]+-\s*/, "") || d.shortName })),
  }));
}
