/**
 * Download a sample of real SEC files for a few companies, so the filing pages can be
 * built and checked offline. Run on GitHub Actions (SEC can't be reached from everywhere):
 *
 *   FATHOM_CACHE_DIR=out/.sec-cache npx tsx scripts/fetch-sample.ts AAPL KO
 *
 * Everything goes through the normal SEC client, so the raw responses land in the
 * offline cache. A readable copy of each file is also kept under out/raw/<TICKER>/.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { cachePath } from "../lib/offline-cache";
import { secFetchText, SEC_URLS } from "../lib/sec/client";
import { loadFilings, type Filing } from "../lib/sec/filings";
import { findCompanies, loadTickers } from "../lib/sec/tickers";

const manifest: Record<string, string> = {};

async function grab(url: string, ticker: string, name: string): Promise<string | undefined> {
  try {
    const body = await secFetchText(url);
    const file = path.join("out", "raw", ticker, name.replace(/[^\w./-]/g, "_"));
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, body);
    manifest[url] = cachePath("out/.sec-cache", url);
    return body;
  } catch (err) {
    console.log(`  failed ${url}: ${(err as Error).message}`);
    return undefined;
  }
}

function folder(cik: string, acc: string): string {
  return `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${acc.replace(/-/g, "")}`;
}

async function report(cik: string, f: Filing, ticker: string, label: string, maxR: number) {
  console.log(`  ${label}: ${f.form} filed ${f.filingDate}`);
  await grab(f.url, ticker, `${label}/main.htm`);
  await grab(`${folder(cik, f.accessionNumber)}/index.json`, ticker, `${label}/index.json`);
  const summary = await grab(`${folder(cik, f.accessionNumber)}/FilingSummary.xml`, ticker, `${label}/FilingSummary.xml`);
  if (!summary) return;
  const files = [...summary.matchAll(/<HtmlFileName>([^<]+)<\/HtmlFileName>/g)].map((m) => m[1]);
  console.log(`    ${files.length} R pages`);
  for (const r of files.slice(0, maxR)) await grab(`${folder(cik, f.accessionNumber)}/${r}`, ticker, `${label}/${r}`);
}

async function run(query: string) {
  const all = await loadTickers();
  const ref = findCompanies(all, query)[0];
  if (!ref) return console.log(`No company for ${query}`);
  const t = ref.ticker;
  console.log(`\n=== ${ref.name} (${t}) ===`);
  await grab(SEC_URLS.submissions(ref.cik), t, "submissions.json");
  await grab(SEC_URLS.companyFacts(ref.cik), t, "companyfacts.json");
  const filings = await loadFilings(ref.cik);
  const pick = (form: string) => filings.filings.find((f) => f.form === form);

  const tenK = pick("10-K");
  const tenQ = pick("10-Q");
  if (tenK) await report(ref.cik, tenK, t, "10-K", 400);
  if (tenQ) await report(ref.cik, tenQ, t, "10-Q", 400);

  const proxy = pick("DEF 14A");
  if (proxy) {
    console.log(`  DEF 14A filed ${proxy.filingDate}`);
    await grab(proxy.url, t, "DEF14A/main.htm");
    await grab(`${folder(ref.cik, proxy.accessionNumber)}/index.json`, t, "DEF14A/index.json");
  }

  const eightKs = filings.filings.filter((f) => f.form === "8-K" || f.form === "8-K/A").slice(0, 16);
  console.log(`  ${eightKs.length} 8-Ks`);
  for (const f of eightKs) {
    await grab(f.url, t, `8-K/${f.accessionNumber}/main.htm`);
    const idx = await grab(`${folder(ref.cik, f.accessionNumber)}/index.json`, t, `8-K/${f.accessionNumber}/index.json`);
    // The first attached press release, if any (exhibit 99.1 is usually named ...ex99...).
    const ex = idx ? [...idx.matchAll(/"name":"([^"]*ex[-_]?99[^"]*\.htm)"/gi)].map((m) => m[1])[0] : undefined;
    if (ex) await grab(`${folder(ref.cik, f.accessionNumber)}/${ex}`, t, `8-K/${f.accessionNumber}/${ex}`);
  }

  const form4s = filings.filings.filter((f) => f.form === "4" || f.form === "4/A").slice(0, 40);
  console.log(`  ${form4s.length} Form 4s`);
  for (const f of form4s) {
    const xml = f.primaryDocument.replace(/^xslF345X\d+\//, "");
    await grab(`${folder(ref.cik, f.accessionNumber)}/${xml}`, t, `form4/${f.accessionNumber}.xml`);
  }
}

async function main() {
  const tickers = process.argv.slice(2);
  for (const t of tickers) await run(t);
  await mkdir("out", { recursive: true });
  await writeFile("out/raw/manifest.json", JSON.stringify(manifest, null, 1));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
