/**
 * Everything the filing pages need, each cached for a few hours so SEC is asked once,
 * not on every visit.
 */
import { cacheLife, cacheTag } from "next/cache";
import * as cheerio from "cheerio";
import { getTickerList } from "../report/company";
import { secFetchText } from "../sec/client";
import { loadFilings, type CompanyFilings, type Filing } from "../sec/filings";
import { loadFilingSummary, filingFolder, parseRPage, type RTable } from "../sec/rpages";
import { htmlToText, splitSections } from "../sec/sections";
import { loadGuide, notesFrom, type NoteRef, type ReportGuide } from "../sec/report-guide";
import { loadAnnouncements, type Announcement8K } from "../sec/announcements";
import { loadProxy, type ProxyFacts } from "../sec/proxy";
import { loadInsiderTrades, type InsiderSummary } from "../sec/insiders";
import { buildLines, type Line } from "../statements/model";

async function companyFilings(ticker: string): Promise<CompanyFilings | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(`filings:${ticker}`);
  const ref = (await getTickerList()).find((c) => c.ticker === ticker);
  if (!ref) return null;
  return loadFilings(ref.cik);
}

export type ReportForm = "10-K" | "10-Q";
const latest = (f: CompanyFilings, form: string): Filing | undefined => f.filings.find((x) => x.form === form);

export type GuidePageData = { guide: ReportGuide; notes: NoteRef[]; cik: string; accession: string } | null;

export async function getReportGuide(ticker: string, form: ReportForm): Promise<GuidePageData> {
  "use cache";
  cacheLife("hours");
  cacheTag(`guide:${ticker}:${form}`);
  const f = await companyFilings(ticker);
  const filing = f && latest(f, form);
  if (!f || !filing) return null;
  const guide = await loadGuide(filing.url, form, { filingDate: filing.filingDate, periodEnd: filing.reportDate });
  let notes: NoteRef[] = [];
  try {
    notes = notesFrom(await loadFilingSummary(f.cik, filing.accessionNumber));
  } catch {
    // Older filings have no tagged notes; the guide still works.
  }
  return { guide, notes, cik: f.cik, accession: filing.accessionNumber };
}

/** Every part of the latest report as text, downloaded once and kept for a few hours. */
async function allSectionTexts(ticker: string, form: ReportForm): Promise<Record<string, string>> {
  "use cache";
  cacheLife("hours");
  cacheTag(`sections:${ticker}:${form}`);
  const f = await companyFilings(ticker);
  const filing = f && latest(f, form);
  if (!filing) return {};
  const text = htmlToText(await secFetchText(filing.url));
  return Object.fromEntries(splitSections(text, form).map((s) => [s.id, s.text]));
}

/** The company's own words for one part of its latest report. */
export async function getSectionText(ticker: string, form: ReportForm, id: string): Promise<string | null> {
  return (await allSectionTexts(ticker, form))[id] ?? null;
}

export type NotePage =
  | { kind: "text"; title: string; paragraphs: string[]; url: string }
  | { kind: "table"; title: string; table: Pick<RTable, "columns" | "units">; lines: Line[]; url: string };

/** One note (its text) or one detail table from the latest report. */
export async function getNotePage(ticker: string, form: ReportForm, file: string): Promise<NotePage | null> {
  "use cache";
  cacheLife("hours");
  if (!/^R\d{1,4}\.htm$/.test(file)) return null;
  const f = await companyFilings(ticker);
  const filing = f && latest(f, form);
  if (!f || !filing) return null;
  const url = `${filingFolder(f.cik, filing.accessionNumber)}/${file}`;
  const html = await secFetchText(url);
  const table = parseRPage(html);
  const textRow = table.rows.find((r) => r.unit === "text" && r.texts.some(Boolean));
  if (textRow && table.rows.filter((r) => r.values.some((v) => v !== null)).length === 0) {
    // A note's text block: keep its paragraphs, drop its tables (the detail tables show those figures).
    const $ = cheerio.load(html);
    const cell = $("td.text").first();
    cell.find("table").remove();
    const paragraphs = htmlToText(`<body>${cell.html() ?? ""}</body>`)
      .split("\n")
      .map((t) => t.trim())
      .filter((t) => t.length > 1);
    return { kind: "text", title: table.title, paragraphs: paragraphs.length ? paragraphs : [textRow.texts.find(Boolean)!], url };
  }
  return { kind: "table", title: table.title, table: { columns: table.columns, units: table.units }, lines: buildLines(table, "income").map((l) => ({ ...l, definition: undefined })), url };
}

export async function getAnnouncements(ticker: string): Promise<{ list: Announcement8K[]; since: string } | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(`announcements:${ticker}`);
  const f = await companyFilings(ticker);
  if (!f) return null;
  return loadAnnouncements(f.filings, f.cik);
}

export async function getProxy(ticker: string): Promise<ProxyFacts | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(`proxy:${ticker}`);
  const f = await companyFilings(ticker);
  const p = f && latest(f, "DEF 14A");
  if (!p) return null;
  return loadProxy(p.url, p.filingDate);
}

export async function getInsiders(ticker: string): Promise<InsiderSummary | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(`insiders:${ticker}`);
  const f = await companyFilings(ticker);
  if (!f) return null;
  return loadInsiderTrades(f.filings);
}
