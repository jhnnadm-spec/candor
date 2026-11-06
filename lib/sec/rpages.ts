/**
 * The financial statements and notes exactly as the company filed them.
 *
 * Every modern annual and quarterly report comes with tagged data, and SEC turns
 * that data into one simple web page per statement and per note (R2.htm, R4.htm …),
 * listed in the filing's FilingSummary.xml. Reading those pages gives every line of
 * every statement, in the company's own order and wording, with the official tag
 * of each line (which candor uses to explain it plainly).
 */
import * as cheerio from "cheerio";
import { secFetchText } from "./client";

export type ReportCategory = "Cover" | "Statements" | "Notes" | "Policies" | "Tables" | "Details" | "Other";

/** One page listed in FilingSummary.xml. */
export type RPage = {
  file: string; // "R4.htm"
  shortName: string; // "CONSOLIDATED STATEMENTS OF OPERATIONS"
  longName: string; // "0000002 - Statement - CONSOLIDATED STATEMENTS OF OPERATIONS"
  category: ReportCategory;
  position: number;
};

export type StatementKind = "income" | "comprehensive" | "balance" | "cashflow" | "equity";

/** The folder that holds every document of one filing. */
export function filingFolder(cik: string | number, accessionNumber: string): string {
  return `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accessionNumber.replace(/-/g, "")}`;
}

const CATEGORIES = new Set<ReportCategory>(["Cover", "Statements", "Notes", "Policies", "Tables", "Details"]);

export function parseFilingSummary(xml: string): RPage[] {
  const $ = cheerio.load(xml, { xml: true });
  const pages: RPage[] = [];
  $("Report").each((i, el) => {
    const r = $(el);
    const file = r.children("HtmlFileName").text().trim() || r.children("XmlFileName").text().trim();
    if (!file || !/^R\d+\.(htm|xml)$/i.test(file)) return;
    const cat = r.children("MenuCategory").text().trim() as ReportCategory;
    pages.push({
      file,
      shortName: r.children("ShortName").text().trim(),
      longName: r.children("LongName").text().trim(),
      category: CATEGORIES.has(cat) ? cat : "Other",
      position: Number(r.children("Position").text()) || i + 1,
    });
  });
  return pages;
}

/** Which of the main statements a page is, from its title. Parenthetical pages (share counts, par values) are left out. */
export function statementKind(shortName: string): StatementKind | undefined {
  const t = shortName.toLowerCase();
  if (/parenthetical/.test(t)) return undefined;
  if (/cash\s*flow/.test(t)) return "cashflow";
  if (!/balance sheet|financial (position|condition)/.test(t) && /\bequity\b|(stockholders|shareholders|shareowners)['’]?\s*(deficit|investment)|changes in (net assets|capital|partners|members|deficit)|partners['’]? capital|members['’]? capital/.test(t))
    return "equity";
  if (/balance sheet|financial (position|condition)|assets and liabilities|statements? of condition/.test(t)) return "balance";
  if (/comprehensive/.test(t) && !/operations|earnings|statements? of income and|income and comprehensive|loss and comprehensive/.test(t)) return "comprehensive";
  if (/operations|income|earnings|loss/.test(t)) return "income";
  return undefined;
}

/** The main statements in a filing, the first page of each kind (in the order filed). */
export function pickStatements(pages: RPage[]): Partial<Record<StatementKind, RPage>> {
  const out: Partial<Record<StatementKind, RPage>> = {};
  const candidates = pages.filter((p) => p.category === "Statements").sort((a, b) => a.position - b.position);
  for (const p of candidates) {
    const kind = statementKind(p.shortName);
    if (kind && !out[kind]) out[kind] = p;
  }
  // Some quarterly reports put the changes in equity in a note instead of a statement.
  if (!out.equity) {
    const note = pages.find((p) => p.category === "Details" && /^(changes in|statements? of changes in)\s+(stockholders['’]?|shareholders['’]?|shareowners['’]?)?\s*equity\b/i.test(p.shortName));
    if (note) out.equity = note;
  }
  return out;
}

// ---------------------------------------------------------------- one R page as a table

export type Column = {
  label: string; // "12 months to Sep 28, 2024", "Sep 28, 2024", "Retained earnings"
  heading: string; // the original heading text, joined
  months?: number; // 3, 6, 9, 12 for periods; undefined for a single date
  date?: string; // "YYYY-MM-DD" when the heading has a date
};

export type Row = {
  label: string; // the company's own wording, tidied
  concept: string; // the official tag, e.g. "us-gaap_NetIncomeLoss" ("" when none)
  header: boolean; // a heading row with no numbers ("Current assets:")
  member: boolean; // starts a split of the figures above, e.g. by product ("Products", "Services")
  total: boolean; // a total or subtotal
  unit: "money" | "shares" | "perShare" | "percent" | "pure" | "text";
  values: (number | null)[]; // one per column, already in whole units (dollars, shares)
  texts: (string | null)[]; // what was printed, for text cells
};

export type RTable = {
  title: string; // the page title, e.g. "CONSOLIDATED STATEMENTS OF OPERATIONS"
  units: string; // e.g. "$ in Millions, shares in Thousands"
  columns: Column[];
  rows: Row[];
  definitions: Record<string, string>; // tag -> official definition
};

const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

/** "Sep. 28, 2024" -> "2024-09-28" */
export function parseHeadingDate(text: string): string | undefined {
  const m = text.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2}),\s*(\d{4})/i);
  if (!m) return undefined;
  return `${m[3]}-${MONTHS[m[1].slice(0, 3).toLowerCase()]}-${m[2].padStart(2, "0")}`;
}

function scaleOf(units: string, what: "money" | "shares"): number {
  const re = what === "money" ? /\$\s*in\s+(thousands|millions|billions)/i : /shares\s+in\s+(thousands|millions|billions)/i;
  const m = units.match(re);
  if (!m) return 1;
  return { thousands: 1e3, millions: 1e6, billions: 1e9 }[m[1].toLowerCase() as "thousands" | "millions" | "billions"];
}

/** "$ 391,035" -> 391035, "(1,234)" -> -1234, "—" -> null */
export function parseNumber(text: string): number | null {
  const t = text.replace(/\[\d+\]/g, "").replace(/[$\s,]|USD/g, "");
  if (!t || /^[—–-]+$/.test(t)) return null;
  const neg = /^\(.*\)$/.test(t);
  const n = Number(t.replace(/[()%]/g, ""));
  if (!Number.isFinite(n)) return null;
  return neg ? -n : n;
}

function unitOf(label: string, concept: string): Row["unit"] {
  const l = label.toLowerCase();
  const local = concept.replace(/^[a-z-]+_/, "");
  if (/\((in )?(dollars|usd|\$) per share\)/.test(l) || /PerShare/.test(local)) return "perShare";
  if (/\(in shares\)|\(shares\)/.test(l)) return "shares";
  if (/\(percent\)|\(in percent\)/.test(l) || /Percent|Percentage|Rate$/.test(local)) return "percent";
  if (/Shares/.test(local) && !/Value|Amount|Payments?|Proceeds|ShareBased/.test(local.replace(/SharesPaidForTaxWithholding/, "Shares"))) return "shares";
  return "money";
}

function tidyLabel(label: string): string {
  return label
    .replace(/\s*\((in )?(dollars|usd|\$) per share\)/gi, "")
    .replace(/\s*\(in shares\)/gi, "")
    .replace(/\s*[[{](Abstract|Line Items|Table|Axis|Member|Domain|Roll Forward)[\]}]/gi, "")
    .replace(/\s+/g, " ")
    .replace(/:$/, "")
    .trim();
}

/** Read one R page into a table of rows and columns. */
export function parseRPage(html: string): RTable {
  const $ = cheerio.load(html);
  const table = $("table.report").first();
  const definitions: Record<string, string> = {};
  $("table.authRefData").each((_, el) => {
    const id = ($(el).attr("id") ?? "").replace(/^defref_/, "");
    const def = $(el).find("div.body > div").first().text().trim() || $(el).find("p").first().text().trim();
    if (id && def) definitions[id] = def.replace(/^Definition\s*/i, "").slice(0, 600);
  });

  // ---- headings: a grid that respects colspan and rowspan.
  const headRows = table.find("tr").filter((_, tr) => $(tr).children("th").length > 0);
  const grid: string[][] = [];
  let title = "";
  let units = "";
  headRows.each((r, tr) => {
    grid[r] ??= [];
    let c = 0;
    $(tr)
      .children("th")
      .each((_, th) => {
        const cell = $(th);
        const colspan = Number(cell.attr("colspan")) || 1;
        const rowspan = Number(cell.attr("rowspan")) || 1;
        while (grid[r][c] !== undefined) c++;
        const text = cell.text().replace(/\s+/g, " ").trim();
        if (cell.hasClass("tl")) {
          const strong = cell.find("strong").first();
          const parts = (strong.html() ?? cell.html() ?? "").split(/<br\s*\/?>/i).map((p) => cheerio.load(p).text().replace(/\s+/g, " ").trim());
          title = parts[0]?.replace(/\s*-\s*(USD|\$).*$/i, "").trim() ?? text;
          units = [parts[0]?.match(/-\s*((USD|\$).*)$/i)?.[1], ...parts.slice(1)].filter(Boolean).join(", ");
        }
        for (let dr = 0; dr < rowspan; dr++) {
          grid[r + dr] ??= [];
          for (let dc = 0; dc < colspan; dc++) grid[r + dr][c + dc] = cell.hasClass("tl") ? "\u0000" : text;
        }
        c += colspan;
      });
  });
  const width = Math.max(0, ...grid.map((g) => g.length));
  const columns: Column[] = [];
  for (let c = 0; c < width; c++) {
    const parts = grid.map((g) => g[c]).filter((t): t is string => Boolean(t) && t !== "\u0000");
    if (parts.length === 0 && grid.every((g) => g[c] === "\u0000" || g[c] === undefined)) continue;
    const heading = [...new Set(parts)].join(" · ");
    const months = Number(heading.match(/(\d{1,2})\s+Months?\s+Ended/i)?.[1]) || undefined;
    const date = parseHeadingDate(heading);
    columns.push({ label: columnLabel(heading, months, date), heading, months, date });
  }

  const moneyScale = scaleOf(units, "money");
  const shareScale = scaleOf(units, "shares");

  // ---- rows
  const rows: Row[] = [];
  table.find("tr").each((_, tr) => {
    const cells = $(tr).children("td");
    if (cells.length === 0) return;
    const first = cells.first();
    if (!first.hasClass("pl")) return;
    const link = first.find("a").first();
    const onclick = link.attr("onclick") ?? "";
    const concept = onclick.match(/defref_([\w-]+)/)?.[1] ?? "";
    const rawLabel = first.text().replace(/\s+/g, " ").trim();
    const label = tidyLabel(rawLabel);
    const unit = unitOf(rawLabel, concept);
    const scale = unit === "money" ? moneyScale : unit === "shares" ? shareScale : 1;
    const values: (number | null)[] = [];
    const texts: (string | null)[] = [];
    cells.slice(1).each((_, td) => {
      const cell = $(td);
      // Footnote markers sit in their own narrow cells between the label and the figures.
      if (cell.hasClass("th") || cell.hasClass("fn")) return;
      cell.find("sup").remove();
      const text = cell.text().replace(/\s+/g, " ").trim();
      if (cell.hasClass("text")) {
        values.push(null);
        texts.push(text && text !== " " ? text : null);
      } else {
        const n = parseNumber(text);
        values.push(n === null ? null : unit === "percent" ? n / 100 : n * scale);
        texts.push(null);
      }
    });
    const empty = values.every((v) => v === null) && texts.every((t) => !t);
    const member = /(Axis|Member|Domain)$/.test(concept) && empty;
    const header = !member && empty && (first.find("strong").length > 0 || /Abstract$|RollForward$/.test(concept));
    const cls = $(tr).attr("class") ?? "";
    const total = !header && (/^total\b/i.test(label) || /u$/.test(cls.trim()));
    rows.push({ label, concept, header, total, member, unit: texts.some(Boolean) && values.every((v) => v === null) ? "text" : unit, values, texts });
  });

  // Footnote rows ("[1] ...") at the bottom aren't part of the statement.
  return { title, units, columns: columns.slice(0, Math.max(0, ...rows.map((r) => r.values.length))), rows: rows.filter((r) => r.label && !/^\[\d+\]/.test(r.label)), definitions };
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${d}, ${y}`;
}

function columnLabel(heading: string, months?: number, date?: string): string {
  if (months && date) return `${months} months to ${shortDate(date)}`;
  if (date && !/[a-z]{4,}/i.test(heading.replace(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?/gi, ""))) return shortDate(date);
  return heading.replace(/\s*\[Member\]/gi, "").replace(/ · /g, ", ");
}

export async function loadFilingSummary(cik: string, accessionNumber: string): Promise<RPage[]> {
  return parseFilingSummary(await secFetchText(`${filingFolder(cik, accessionNumber)}/FilingSummary.xml`));
}

export async function loadRPage(cik: string, accessionNumber: string, file: string): Promise<RTable> {
  return parseRPage(await secFetchText(`${filingFolder(cik, accessionNumber)}/${file}`));
}
