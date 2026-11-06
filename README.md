# candor

candor helps anyone understand US public companies in plain English.
You search for a company, and candor gathers information from public sources
that allow it to be shared, explains it at three depths, and links every point
back to where it came from.

candor is for education only. It is not financial advice and never says buy,
sell or hold.

## How the project is organised

| Folder or file | What it is |
|---|---|
| `app/` | The website's pages. Each folder is a web address: `app/about/page.tsx` is `/about`. |
| `app/layout.tsx` | The frame around every page: header, footer and fonts. |
| `app/globals.css` | candor's colours and fonts, defined once. |
| `components/` | Reusable building blocks, such as the logo. |
| `.github/workflows/` | Instructions for GitHub's robot, which checks the code on every change. |
| `.env.example` | A list of the private settings (keys) the app needs, with no real values. |

More folders arrive as the build continues: `lib/` for data and AI code,
`content/` for the glossary, and `scripts/` for scheduled jobs.

## Where the information comes from

| Source | Used for |
|---|---|
| SEC EDGAR | Financial numbers, annual and quarterly reports, official announcements |
| The GDELT Project | Recent headlines from major publishers (WSJ, Reuters, Bloomberg, CNBC and others), with links to the original articles |
| Wikipedia | Company background |
| FRED | Economic context. This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis. |

## Running it on your own computer (optional)

1. Install [Node.js](https://nodejs.org) (the LTS version) and [Git](https://git-scm.com).
2. Download the project: `git clone https://github.com/jhnnadm-spec/fathom.git`
3. Open the folder in a terminal and install packages: `npm install`
4. Start the site: `npm run dev`, then open http://localhost:3000

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Runs the site on your computer, refreshing as you edit |
| `npm run lint` | Checks code style |
| `npm run typecheck` | Checks the code for type mistakes |
| `npm run build` | Builds the site exactly as it will be published |

## Publishing

The site is hosted on Vercel. Every time new code reaches the `main` branch on
GitHub, Vercel rebuilds and publishes it automatically.

## Explanations for any company (Supabase)

Companies without a saved explanation show a **Write the plain-English
explanation** button. candor then writes one with the free Cloudflare AI,
checks every point, and saves it in a free Supabase database.

- Limits (to stay free): about 6 new explanations a day in total, and 3 new
  companies per visitor per day. Requests over the daily total are queued.
- The **Daily explanations** workflow (GitHub Actions) runs at 23:10 UTC, just
  before the AI allowance resets. It writes queued companies, queues an update
  when a company files a newer report, and keeps Supabase from pausing.
- Database setup: paste `supabase/schema.sql` into Supabase → SQL Editor → Run.
- Settings needed on Vercel: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`,
  `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `VISITOR_SALT`.
  On GitHub (Actions secrets): `SUPABASE_URL`, `SUPABASE_SECRET_KEY`.

## Sectors, watchlist and background facts

- **Build sector list** (GitHub Actions): groups every US-listed company by the
  industry code it gives the SEC, with yearly sales from SEC data so bigger
  companies come first. Runs on the 2nd of each month (about 20 minutes) and
  saves `content/sectors.json`.
- **Watchlist**: saved in each visitor's browser only. No accounts, nothing stored by candor.
- **Background facts**: chief executive, founding year, headquarters, employees
  and website come from Wikidata (CC0, free to reuse); the short introduction
  comes from Wikipedia (CC BY-SA 4.0, credited on the page). They're labelled as
  background and never used for financial figures.

## Research lenses and comparing companies

Each lens lives in `lib/lens/` and returns the same shape (`LensResult` in `lib/lens/types.ts`): figures with their period, currency and source links, plus a plain-English summary written from those figures only. Numbers are always worked out in code; the AI never produces figures.

- **Fundamental** (`lib/lens/fundamental.ts`): sales, growth, margins, EBITDA, cash flow, net debt, debt-to-equity, current ratio, ROE and EPS from SEC filings. P/E and EV/EBITDA need a share price, which candor may not use in its own sums (the TradingView price is display only), so they're left out rather than shown empty.
- **Compare** (`lib/compare/compare.ts`, page `/compare?t=KO,PEP`): 2 to 5 companies side by side, highest and lowest marked (never "better" or "worse"), warnings when figures aren't like for like, and "Not reported" instead of zero. The link is the saved comparison.
- JSON for testing: `/api/lens/fundamental?t=KO` and `/api/lens/compare?t=KO,PEP`.

## The four financial statements and every filing, explained

Each company page has tabs (`components/company/CompanyTabs.tsx`). Every figure is read from SEC filings in code; candor's own words (plain names, what each part is) are written once and labelled as such, and anything quoted is the company's own wording.

| Tab | Address | Where it comes from |
|---|---|---|
| Financial statements | `/stock/AAPL/statements` | The income statement, balance sheet, cash flow statement and statement of shareholders' equity (plus comprehensive income), every line exactly as filed, from SEC's statement pages (`R2.htm` …) listed in each filing's `FilingSummary.xml` (`lib/sec/rpages.ts`). Each line gets a plain name and meaning from its official tag, its words, or where it sits (`lib/statements/lines.ts`); the pictures (sales to profit, owns vs owes, cash start to end, equity start to end) are worked out in `lib/statements/model.ts`. Yearly (10-K) and latest quarter (10-Q). |
| Yearly report | `/stock/AAPL/annual` | The latest 10-K, part by part (`lib/sec/report-guide.ts`): what each Item is, quick checks found in the text (auditor, clean opinion, going-concern warning, material weakness), every risk heading sorted into themes, the managers' discussion headings, leaders' 10b5-1 trading plans, and every note with its tables (loaded on demand from `/api/filing`). |
| Quarterly report | `/stock/AAPL/quarterly` | The same for the latest 10-Q. |
| Announcements | `/stock/AAPL/announcements` | Every 8-K from the last two years by kind, with the opening of each item in the company's words for the newest 12 (`lib/sec/announcements.ts`). |
| Pay and votes | `/stock/AAPL/proxy` | The latest DEF 14A: pay versus performance read from its tags (`ecd:`), CEO pay ratio, meeting date and proposals found in the text (`lib/sec/proxy.ts`). |
| Insider trades | `/stock/AAPL/insiders` | The newest 30 Form 4 filings from the last year, read from their XML (`lib/sec/insiders.ts`). |

To build and check these offline, the **Try SEC data** workflow can run `scripts/fetch-sample.ts` on a branch, which saves every raw file it reads into the offline cache (`FATHOM_CACHE_DIR`).

## The downloadable report

`/stock/AAPL/pdf` (`lib/pdf/ReportPdf.tsx`) is laid out like an equity research report in plain English: a front page with the company in one minute, key figures, what the figures show in its favour and what to keep an eye on, then numbered sections (business, growth and profit, financial health, cash, how it's run, industry and risks, how the numbers link, what changed, announcements), every figure with how it's worked out, the key terms (highlighted in the text) and numbered sources.
