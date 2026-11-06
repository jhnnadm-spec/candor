"use client";

/**
 * Official announcements (8-K), newest first: a strip showing how many came out each
 * month, filters by kind of news, and for each one what happened, why it matters,
 * and the opening of the company's own words.
 */
import { useMemo, useState } from "react";
import type { Announcement8K } from "@/lib/sec/announcements";
import type { AnnouncementTopic } from "@/lib/sec/announcement-topics";
import { TOPICS } from "@/lib/sec/announcement-topics";
import { niceDate } from "@/lib/statements/format";

export function AnnouncementsView({ list, since }: { list: Announcement8K[]; since: string }) {
  const [topic, setTopic] = useState<AnnouncementTopic | "all">("all");
  const counts = useMemo(() => {
    const c = new Map<AnnouncementTopic, number>();
    list.forEach((a) => a.topics.forEach((t) => c.set(t, (c.get(t) ?? 0) + 1)));
    return c;
  }, [list]);
  const shown = topic === "all" ? list : list.filter((a) => a.topics.includes(topic));

  // Announcements per month over the period, coloured by their first kind.
  const months = useMemo(() => {
    const out: { key: string; items: Announcement8K[] }[] = [];
    const start = new Date(`${since.slice(0, 7)}-01T00:00:00Z`);
    const last = new Date(`${(list[0]?.filingDate ?? since).slice(0, 7)}-01T00:00:00Z`);
    for (let d = new Date(start); d <= last; d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))) {
      const key = d.toISOString().slice(0, 7);
      out.push({ key, items: list.filter((a) => a.filingDate.startsWith(key)) });
    }
    return out;
  }, [list, since]);
  const most = Math.max(1, ...months.map((m) => m.items.length));

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3 rounded-sm border border-line bg-white px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="m-0 font-display text-[20px] font-semibold">{list.length} announcements in two years</h2>
          <p className="m-0 text-[13px] text-muted">Since {niceDate(since)}. Each bar is a month.</p>
        </div>
        <div className="flex h-28 items-end gap-[3px]" role="img" aria-label="Announcements per month">
          {months.map((m) => (
            <div key={m.key} className="flex flex-1 flex-col-reverse gap-[2px]" title={`${m.key}: ${m.items.length}`}>
              {m.items.map((a) => (
                <span key={a.url} className="fathom-grow-up block rounded-[1px]" style={{ height: Math.max(6, Math.min(22, Math.floor(100 / most) - 2)), background: TOPICS[a.topics[0]].color, opacity: topic === "all" || a.topics.includes(topic) ? 1 : 0.18 }} />
              ))}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[11.5px] text-muted">
          <span>{months[0]?.key}</span>
          <span>{months.at(-1)?.key}</span>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Show only">
          <button type="button" aria-pressed={topic === "all"} onClick={() => setTopic("all")} className={`min-h-9 rounded-sm px-3 text-[13.5px] font-semibold ${topic === "all" ? "bg-ink text-white" : "bg-panel-2 text-ink"}`}>
            All ({list.length})
          </button>
          {(Object.keys(TOPICS) as AnnouncementTopic[])
            .filter((t) => counts.get(t))
            .map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={topic === t}
                onClick={() => setTopic(t)}
                className="flex min-h-9 items-center gap-2 rounded-sm px-3 text-[13.5px] font-semibold"
                style={topic === t ? { background: TOPICS[t].color, color: "#fff" } : { background: TOPICS[t].soft, color: TOPICS[t].color }}
              >
                <span aria-hidden="true" className="h-2 w-2 rounded-[1px]" style={{ background: topic === t ? "#fff" : TOPICS[t].color }} />
                {TOPICS[t].label} ({counts.get(t)})
              </button>
            ))}
        </div>
      </section>

      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {shown.map((a) => (
          <li key={a.url}>
            <AnnouncementCard a={a} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function AnnouncementCard({ a }: { a: Announcement8K }) {
  const t = TOPICS[a.topics[0]];
  const d = new Date(`${a.filingDate}T00:00:00Z`);
  return (
    <article className="grid gap-4 rounded-sm border border-line bg-white px-5 py-4 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:px-6">
      <div className="flex h-16 w-16 flex-col items-center justify-center rounded-sm leading-none" style={{ background: t.soft, color: t.color }}>
        <span className="text-[11px] font-semibold uppercase">{d.toLocaleString("en-US", { month: "short", timeZone: "UTC" })}</span>
        <span className="text-[22px] font-bold">{d.getUTCDate()}</span>
        <span className="text-[10.5px] font-semibold opacity-80">{d.getUTCFullYear()}</span>
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {a.topics.map((tp) => (
            <span key={tp} className="rounded-sm px-2 py-0.5 text-[12px] font-semibold" style={{ background: TOPICS[tp].soft, color: TOPICS[tp].color }}>
              {TOPICS[tp].label}
            </span>
          ))}
          {a.form === "8-K/A" && <span className="rounded-sm bg-panel-2 px-2 py-0.5 text-[12px] font-semibold text-muted">Correction to an earlier announcement</span>}
        </div>
        {a.items.map((it) => (
          <div key={it.code} className="flex flex-col gap-1.5">
            <h3 className="m-0 font-display text-[18px] font-semibold leading-snug">
              {it.label} <span className="text-[12.5px] font-normal text-muted">(Item {it.code})</span>
            </h3>
            {it.why && <p className="m-0 text-[14.5px] leading-relaxed text-ink/75">{it.why}</p>}
            {it.excerpt && (
              <blockquote className="m-0 border-l-[3px] pl-3 text-[14.5px] leading-relaxed text-ink/85" style={{ borderColor: t.color }}>
                <span className="mb-0.5 block text-[11.5px] font-semibold uppercase tracking-wide text-muted">In the company&apos;s words</span>
                {it.excerpt}
              </blockquote>
            )}
          </div>
        ))}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13.5px]">
          <a href={a.url} target="_blank" rel="noopener noreferrer">
            Read the filing
          </a>
          {a.pressRelease && (
            <a href={a.pressRelease} target="_blank" rel="noopener noreferrer">
              Read the press release
            </a>
          )}
          <a href={a.indexUrl} target="_blank" rel="noopener noreferrer" className="text-muted">
            All attached documents
          </a>
        </div>
      </div>
    </article>
  );
}
