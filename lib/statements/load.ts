/**
 * Loads the four financial statements (plus comprehensive income) from a company's
 * latest annual and quarterly reports, as filed, and prepares them for the page.
 */
import { cacheLife, cacheTag } from "next/cache";
import { filingFolder, loadFilingSummary, loadRPage, pickStatements, type RPage, type StatementKind } from "../sec/rpages";
import { loadFilings, type Filing } from "../sec/filings";
import { getTickerList } from "../report/company";
import { balanceParts, buildLines, cashSteps, equityPeriods, incomeSteps, type StatementView } from "./model";

export type ReportStatements = {
  form: "10-K" | "10-Q";
  filingDate: string;
  periodEnd: string;
  url: string; // the report itself
  viewerUrl: string; // SEC's interactive view of the figures
  statements: Partial<Record<StatementKind, StatementView>>;
  missing: StatementKind[];
  pages: RPage[]; // every page in the filing (notes, tables, details), for the report pages
};

export type CompanyStatements = { ticker: string; cik: string; annual?: ReportStatements; quarterly?: ReportStatements };

const ORDER: StatementKind[] = ["income", "balance", "cashflow", "equity", "comprehensive"];

export function buildView(kind: StatementKind, page: RPage, table: Awaited<ReturnType<typeof loadRPage>>, folder: string, form: "10-K" | "10-Q" = "10-K"): StatementView {
  const lines = buildLines(table, kind);
  const view: StatementView = {
    kind,
    title: table.title || page.shortName,
    file: page.file,
    url: `${folder}/${page.file}`,
    units: table.units,
    columns: table.columns,
    lines,
    fromNote: page.category !== "Statements",
  };
  const durationCols = table.columns.map((_, i) => i);
  if (kind === "income") view.steps = durationCols.map((c) => incomeSteps(lines, c));
  if (kind === "cashflow") view.steps = durationCols.map((c) => cashSteps(lines, c));
  if (kind === "balance") view.balance = table.columns.map((_, c) => balanceParts(lines, c)!).filter(Boolean);
  if (kind === "equity" && !view.fromNote) view.equity = equityPeriods(lines, table.columns, form === "10-K" ? [12] : [3, 6, 9]);
  return view;
}

export async function loadReportStatements(cik: string, filing: Filing): Promise<ReportStatements | undefined> {
  const form = filing.form.startsWith("10-K") ? "10-K" : "10-Q";
  let pages: RPage[];
  try {
    pages = await loadFilingSummary(cik, filing.accessionNumber);
  } catch {
    return undefined; // older filings without tagged data
  }
  const picked = pickStatements(pages);
  const folder = filingFolder(cik, filing.accessionNumber);
  const statements: ReportStatements["statements"] = {};
  for (const kind of ORDER) {
    const page = picked[kind];
    if (!page) continue;
    try {
      statements[kind] = buildView(kind, page, await loadRPage(cik, filing.accessionNumber, page.file), folder, form);
    } catch {
      // One unreadable page shouldn't hide the others.
    }
  }
  return {
    form,
    filingDate: filing.filingDate,
    periodEnd: filing.reportDate,
    url: filing.url,
    viewerUrl: `https://www.sec.gov/cgi-bin/viewer?action=view&cik=${Number(cik)}&accession_number=${filing.accessionNumber}&xbrl_type=v`,
    statements,
    missing: ORDER.filter((k) => k !== "comprehensive" && !statements[k]),
    pages,
  };
}

/** The statements from the latest annual (10-K) and quarterly (10-Q) reports. Cached for a few hours. */
export async function getCompanyStatements(ticker: string): Promise<CompanyStatements | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(`statements:${ticker}`);
  const ref = (await getTickerList()).find((c) => c.ticker === ticker);
  if (!ref) return null;
  const filings = await loadFilings(ref.cik);
  const latest = (form: string) => filings.filings.find((f) => f.form === form);
  const tenK = latest("10-K");
  const tenQ = latest("10-Q");
  const [annual, quarterly] = await Promise.all([tenK ? loadReportStatements(ref.cik, tenK) : undefined, tenQ ? loadReportStatements(ref.cik, tenQ) : undefined]);
  return { ticker, cik: ref.cik, annual, quarterly };
}
