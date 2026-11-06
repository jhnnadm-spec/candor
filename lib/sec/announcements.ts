/**
 * Official announcements (8-K "current reports"). A company must file one within four
 * business days of anything big: results, a new boss, a big deal, new debt, a change
 * of auditor and so on. Each 8-K lists "items" saying what kind of event it is.
 *
 * For the newest ones, candor also reads the filing itself and shows the opening of
 * each item in the company's own words, plus a link to any attached press release.
 */
import { secFetchJson, secFetchText } from "./client";
import { describeAnnouncement, EVENT_WHY, eventCodes } from "./events";
import type { Filing } from "./filings";
import { htmlToText } from "./sections";
import type { AnnouncementTopic } from "./announcement-topics";
export { TOPICS, type AnnouncementTopic } from "./announcement-topics";

const TOPIC_OF: Record<string, AnnouncementTopic> = {
  "2.02": "results",
  "5.02": "people",
  "5.01": "people",
  "1.01": "deals",
  "1.02": "deals",
  "2.01": "deals",
  "2.03": "money",
  "2.04": "money",
  "3.02": "money",
  "3.03": "votes",
  "5.03": "votes",
  "5.07": "votes",
  "5.08": "votes",
  "5.05": "votes",
  "4.01": "accounts",
  "4.02": "accounts",
  "2.06": "accounts",
  "2.05": "other",
  "1.05": "other",
  "1.03": "money",
  "3.01": "money",
};

export type ItemText = { code: string; label: string; why: string; excerpt?: string };

export type Announcement8K = {
  filingDate: string;
  reportDate: string;
  form: string; // "8-K" or "8-K/A" (a correction)
  topics: AnnouncementTopic[];
  items: ItemText[];
  url: string;
  indexUrl: string;
  pressRelease?: string; // attached press release (exhibit 99.1), when there is one
  read: boolean; // whether candor read the filing's text
};

export function topicsFor(codes: string[]): AnnouncementTopic[] {
  const t = [...new Set(codes.map((c) => TOPIC_OF[c] ?? "other"))];
  return t.length ? t : ["other"];
}

/** The text under each "Item 5.02 …" heading, up to the next item or the signatures. */
export function itemExcerpts(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /(?:^|\n)\s*Item\s+(\d\.\d{2})\.?[^\n]*\n/gi;
  const marks: { code: string; start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) marks.push({ code: m[1], start: m.index, end: m.index + m[0].length });
  marks.forEach((mk, i) => {
    const stop = i + 1 < marks.length ? marks[i + 1].start : text.search(/\n\s*SIGNATURES?\s*\n/i) > mk.end ? text.search(/\n\s*SIGNATURES?\s*\n/i) : text.length;
    let body = text
      .slice(mk.end, stop)
      .replace(/\s+/g, " ")
      .trim();
    // Drop the official item title if it spilled over ("Arrangements of Certain Officers. On June 25 …").
    for (let k = 0; k < 2; k++) {
      const first = body.match(/^([^.]{3,250}\.)\s+/);
      if (!first) break;
      const words = first[1].split(/\s+/).filter((w) => /[a-z]/i.test(w));
      const capped = words.filter((w) => /^[A-Z(]/.test(w) || /^(of|and|or|the|a|an|to|for|in|on|with|under|by)$/.test(w)).length;
      if (words.length > 0 && capped / words.length >= 0.9 && !/\d{4}/.test(first[1])) body = body.slice(first[0].length);
      else break;
    }
    if (body.length < 20 || out[mk.code]) return;
    out[mk.code] = body.length > 700 ? `${body.slice(0, body.lastIndexOf(" ", 680))} …` : body;
  });
  return out;
}

type IndexJson = { directory?: { item?: { name: string; type?: string }[] } };

const READ_NEWEST = 12;

export async function loadAnnouncements(filings: Filing[], cik: string, today = new Date()): Promise<{ list: Announcement8K[]; since: string }> {
  const since = new Date(today.getTime() - 2 * 365 * 86_400_000).toISOString().slice(0, 10);
  const eightKs = filings.filter((f) => (f.form === "8-K" || f.form === "8-K/A") && f.filingDate >= since);
  const list: Announcement8K[] = [];
  for (const [i, f] of eightKs.entries()) {
    const codes = eventCodes(f.items);
    const labels = describeAnnouncement(f.items);
    const a: Announcement8K = {
      filingDate: f.filingDate,
      reportDate: f.reportDate,
      form: f.form,
      topics: topicsFor(codes),
      items: codes.map((c, k) => ({ code: c, label: labels[k], why: EVENT_WHY[c] ?? "" })),
      url: f.url,
      indexUrl: f.indexUrl,
      read: false,
    };
    if (i < READ_NEWEST) {
      try {
        const excerpts = itemExcerpts(htmlToText(await secFetchText(f.url)));
        a.items = a.items.map((it) => ({ ...it, excerpt: excerpts[it.code] }));
        a.read = true;
        if (codes.includes("2.02")) {
          const folder = f.url.slice(0, f.url.lastIndexOf("/"));
          const idx = await secFetchJson<IndexJson>(`${folder}/index.json`);
          const ex = idx.directory?.item?.find((x) => /ex(hibit)?[-_]?99/i.test(x.name) && /\.htm$/i.test(x.name));
          if (ex) a.pressRelease = `${folder}/${ex.name}`;
        }
      } catch {
        // The list still shows the kind of event even if the text can't be read.
      }
    }
    if (a.items.length === 0) a.items = [{ code: "9.01", label: "Shared documents", why: "Attached documents only, such as a press release." }];
    list.push(a);
  }
  void cik;
  return { list, since };
}
