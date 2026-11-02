/**
 * Recent news headlines about a company from major publishers (The Wall Street
 * Journal, Reuters, Bloomberg, CNBC and others), found through the GDELT Project's
 * free news index (https://www.gdeltproject.org, open for any use with credit).
 *
 * candor shows only each headline, its publisher, date and a link to the original
 * article; it never copies article text. Some publishers need a subscription to read.
 * If the index can't be reached, the page still offers search links to each publisher.
 */
import { cacheLife, cacheTag } from "next/cache";

export type Headline = { title: string; url: string; source: string; domain: string; date: string };

/** Publishers searched, with the name readers know them by. */
export const OUTLETS: Record<string, string> = {
  "wsj.com": "The Wall Street Journal",
  "reuters.com": "Reuters",
  "bloomberg.com": "Bloomberg",
  "cnbc.com": "CNBC",
  "ft.com": "Financial Times",
  "marketwatch.com": "MarketWatch",
  "barrons.com": "Barron's",
  "apnews.com": "AP News",
  "nytimes.com": "The New York Times",
  "washingtonpost.com": "The Washington Post",
  "forbes.com": "Forbes",
  "fortune.com": "Fortune",
  "businessinsider.com": "Business Insider",
  "finance.yahoo.com": "Yahoo Finance",
  "investors.com": "Investor's Business Daily",
  "economist.com": "The Economist",
  "axios.com": "Axios",
  "theverge.com": "The Verge",
};

/** Where to search each big publisher for more, always available even when headlines aren't. */
export function searchLinks(name: string, ticker: string): { name: string; url: string }[] {
  const q = encodeURIComponent(name);
  const t = encodeURIComponent(ticker);
  return [
    { name: "The Wall Street Journal", url: `https://www.wsj.com/search?query=${q}` },
    { name: "Reuters", url: `https://www.reuters.com/site-search/?query=${q}` },
    { name: "Bloomberg", url: `https://www.bloomberg.com/search?query=${q}` },
    { name: "CNBC", url: `https://www.cnbc.com/quotes/${t}?tab=news` },
    { name: "Yahoo Finance", url: `https://finance.yahoo.com/quote/${t}/news/` },
    { name: "Google News", url: `https://news.google.com/search?q=${encodeURIComponent(`${name} ${ticker}`)}` },
  ];
}

/** The search sent to GDELT: the company's name, only from the publishers above, in English. */
export function gdeltQuery(name: string): string {
  const domains = Object.keys(OUTLETS).map((d) => `domain:${d}`);
  return `"${name.replace(/"/g, "")}" (${domains.join(" OR ")}) sourcelang:english`;
}

/** The GDELT address for a search; `wide` drops the publisher filter (candor then filters the results itself). */
export function gdeltUrl(name: string, wide = false): string {
  const query = wide ? `"${name.replace(/"/g, "")}" sourcelang:english` : gdeltQuery(name);
  const params = new URLSearchParams({ query, mode: "ArtList", format: "json", maxrecords: wide ? "250" : "75", sort: "DateDesc", timespan: "14d" });
  return `https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`;
}

/** "20261101T153000Z" → "2026-11-01T15:30:00Z" */
function isoFromSeen(seen: string): string | undefined {
  const m = seen.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z` : undefined;
}

/** The publisher for an article's web address, if it's one candor searches. */
function outletFor(url: string, domain?: string): { domain: string; name: string } | undefined {
  let host = (domain ?? "").toLowerCase();
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    // keep GDELT's own domain
  }
  host = host.replace(/^www\./, "");
  const match = Object.keys(OUTLETS).find((d) => host === d || host.endsWith(`.${d}`));
  return match ? { domain: match, name: OUTLETS[match] } : undefined;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Headlines from GDELT's answer that are really about the company: the name (or a
 * ticker of three letters or more) must be in the headline itself. Newest first,
 * one per story, at most `limit`.
 */
export function parseGdelt(body: string, name: string, ticker: string, limit = 8): Headline[] | null {
  let json: { articles?: { url?: string; title?: string; seendate?: string; domain?: string; language?: string }[] };
  try {
    json = JSON.parse(body);
  } catch {
    return null; // GDELT answers in plain text when it's busy or the search can't run
  }
  const wanted = [norm(name), ticker.length >= 3 ? norm(ticker) : ""].filter(Boolean);
  const seen = new Set<string>();
  const out: Headline[] = [];
  for (const a of json.articles ?? []) {
    if (!a.url || !a.title || !a.seendate) continue;
    const title = a.title.replace(/\s+/g, " ").trim();
    const words = ` ${norm(title)} `;
    if (!wanted.some((w) => words.includes(` ${w} `))) continue;
    const outlet = outletFor(a.url, a.domain);
    const date = isoFromSeen(a.seendate);
    if (!outlet || !date) continue;
    const key = norm(title).slice(0, 60);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ title, url: a.url, source: outlet.name, domain: outlet.domain, date });
  }
  return out.sort((x, y) => y.date.localeCompare(x.date)).slice(0, limit);
}

async function gdelt(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "candor/1.0 (plain-English company explainer; https://github.com/jhnnadm-spec/fathom)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`${res.status} from GDELT`);
  return res.text();
}

async function fetchHeadlines(name: string, ticker: string): Promise<Headline[]> {
  const first = parseGdelt(await gdelt(gdeltUrl(name)), name, ticker);
  if (first) return first;
  // The publisher-filtered search couldn't run: wait out GDELT's one-request-per-5-seconds rule, then search wide.
  await new Promise((r) => setTimeout(r, 5500));
  return parseGdelt(await gdelt(gdeltUrl(name, true)), name, ticker) ?? [];
}

/** Recent headlines about one company, kept for an hour; a failed or empty look is retried within minutes. */
export async function getHeadlines(name: string, ticker: string): Promise<Headline[]> {
  "use cache";
  cacheTag(`news:${ticker}`);
  let found: Headline[] = [];
  try {
    found = await fetchHeadlines(name, ticker);
  } catch (err) {
    console.warn("News headlines unavailable:", (err as Error)?.message ?? err);
  }
  if (found.length > 0) cacheLife("hours");
  else cacheLife("minutes");
  return found;
}
