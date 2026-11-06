"use client";

/**
 * A yearly (10-K) or quarterly (10-Q) report, part by part: quick checks, a map of
 * where its pages go, what its risks are about, then every part explained, with the
 * company's own words a tap away.
 */
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Fact, GuideItem, NoteRef, ReportGuide } from "@/lib/sec/report-guide";
import type { NotePage } from "@/lib/filings/load";
import { compact, niceDate } from "@/lib/statements/format";

const PART_COLORS = ["#2d5bff", "#7c5cff", "#0ea5a4", "#f59e0b", "#f43f5e", "#0ea5e9", "#16a34a", "#64748b"];

export function FactChip({ f }: { f: Fact }) {
  const tone = f.tone === "ok" ? "bg-[#dff3ea] text-[#0f6b4c]" : f.tone === "warn" ? "bg-[#fdecd8] text-[#8a4b0f]" : "bg-panel-2 text-ink";
  return (
    <span className={`inline-flex flex-col rounded-sm px-3 py-1.5 ${tone}`} title={f.quote ? `In the company's words: "${f.quote}"` : undefined}>
      <span className="text-[11.5px] font-semibold uppercase tracking-wide opacity-75">{f.label}</span>
      <span className="text-[14.5px] font-semibold leading-snug">{f.value}</span>
    </span>
  );
}

export function ReportGuideView({ guide, notes, ticker, company }: { guide: ReportGuide; notes: NoteRef[]; ticker: string; company: string }) {
  const [showEmpty, setShowEmpty] = useState(false);
  const items = guide.items.filter((i) => showEmpty || !i.empty);
  const mapItems = guide.items.filter((i) => !i.empty && i.chars > 200);
  const total = mapItems.reduce((a, i) => a + i.chars, 0) || 1;
  const [hover, setHover] = useState<GuideItem | null>(null);
  const pages = Math.round(guide.totalChars / 3500);
  const facts = guide.items.flatMap((i) => i.facts.filter((f) => ["People working there", "Shareholders of record", "Risks it lists"].includes(f.label)));
  const colorOf = (i: GuideItem) => PART_COLORS[guide.items.indexOf(i) % PART_COLORS.length];

  return (
    <div className="flex flex-col gap-6">
      {/* Quick checks */}
      {(guide.checks.length > 0 || facts.length > 0) && (
        <section className="flex flex-col gap-3 rounded-sm border border-line bg-white px-5 py-5 sm:px-6">
          <h2 className="m-0 font-display text-[20px] font-semibold">At a glance</h2>
          <div className="flex flex-wrap gap-2">
            {[...guide.checks, ...facts].map((f) => (
              <FactChip key={f.label + f.value} f={f} />
            ))}
          </div>
          <p className="m-0 text-[13px] text-muted">
            Found by candor in the report&apos;s own text. Green means the usual, reassuring wording was found; amber means read that part.
          </p>
        </section>
      )}

      {/* Where the pages go */}
      <section className="flex flex-col gap-3 rounded-sm border border-line bg-white px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="m-0 font-display text-[20px] font-semibold">Where the pages go</h2>
          <p className="m-0 text-[13.5px] text-muted">
            About {pages} pages, roughly {Math.round(guide.totalChars / 1200 / 60) || 1} hour{Math.round(guide.totalChars / 1200 / 60) > 1 ? "s" : ""} to read in full
          </p>
        </div>
        <div className="flex h-10 w-full gap-[2px] overflow-hidden rounded-sm" role="group" aria-label="Parts of the report by length">
          {mapItems.map((i) => (
            <a
              key={i.id}
              href={`#part-${i.id}`}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              aria-label={`${i.name}: about ${i.minutes} minutes`}
              className="fathom-grow-right block h-full min-w-[4px] transition-opacity hover:brightness-110"
              style={{ width: `${(i.chars / total) * 100}%`, background: colorOf(i), opacity: hover && hover.id !== i.id ? 0.45 : 1 }}
            />
          ))}
        </div>
        <p className="m-0 min-h-[1.5em] text-[14px]" aria-live="polite">
          {hover ? (
            <>
              <strong>{hover.name}</strong> <span className="text-muted">(Item {hover.id.replace(/^I+-/, "")}, {hover.title}): {Math.round((hover.chars / total) * 100)}% of the report, about {hover.minutes} min to read.</span>
            </>
          ) : (
            <span className="text-muted">Point at or tap a block to see which part it is. The longest parts are usually the risks, the managers&apos; discussion and the financial statements.</span>
          )}
        </p>
      </section>

      {guide.themes.length > 0 && <RiskThemes guide={guide} />}

      {/* Every part */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 font-display text-[22px] font-semibold">Every part, explained</h2>
          <label className="flex items-center gap-2 text-[14px] text-muted">
            <input type="checkbox" checked={showEmpty} onChange={(e) => setShowEmpty(e.target.checked)} className="h-4 w-4 accent-ink" />
            Also show parts that just say &ldquo;None&rdquo;
          </label>
        </div>
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {items.map((i) => (
            <li key={i.id}>
              <PartCard item={i} form={guide.form} ticker={ticker} color={colorOf(i)} />
            </li>
          ))}
        </ol>
      </section>

      {notes.length > 0 && <Notes notes={notes} ticker={ticker} form={guide.form} company={company} />}

      <p className="m-0 text-[12.5px] text-muted">
        Filed with the SEC on {niceDate(guide.filingDate)}
        {guide.periodEnd ? `, for the period ending ${niceDate(guide.periodEnd)}` : ""}.{" "}
        <a href={guide.url} target="_blank" rel="noopener noreferrer">
          Open the original report
        </a>
        . Plain-English names and explanations are candor&apos;s; anything in quotation marks is {company}&apos;s own words.
      </p>
    </div>
  );
}

function RiskThemes({ guide }: { guide: ReportGuide }) {
  const max = Math.max(...guide.themes.map((t) => t.count), 1);
  const total = guide.themes.reduce((a, t) => a + t.count, 0);
  return (
    <section className="flex flex-col gap-3 rounded-sm border border-line bg-white px-5 py-5 sm:px-6">
      <div>
        <h2 className="m-0 font-display text-[20px] font-semibold">What its {total} listed risks are about</h2>
        <p className="m-0 text-[14px] text-muted">Each risk heading sorted by the words it uses. Open &ldquo;What could go wrong&rdquo; below to read them all.</p>
      </div>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {guide.themes.map((t, i) => (
          <li key={t.theme} className="grid grid-cols-[minmax(0,11rem)_1fr_2rem] items-center gap-3 text-[14px]">
            <span className="truncate">{t.theme}</span>
            <span className="h-3 rounded-[2px] bg-panel-2">
              <span className="fathom-grow-right block h-full rounded-[2px]" style={{ width: `${(t.count / max) * 100}%`, background: PART_COLORS[i % PART_COLORS.length], animationDelay: `${i * 60}ms` }} />
            </span>
            <span className="text-right font-semibold tabular-nums">{t.count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PartCard({ item, form, ticker, color }: { item: GuideItem; form: string; ticker: string; color: string }) {
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState<{ state: "idle" | "loading" | "done" | "error"; text?: string }>({ state: "idle" });
  const [q, setQ] = useState("");
  const loadFull = async () => {
    setFull({ state: "loading" });
    try {
      const r = await fetch(`/api/filing?t=${encodeURIComponent(ticker)}&form=${form}&part=${encodeURIComponent(item.id)}`);
      const j = (await r.json()) as { text?: string };
      setFull(j.text ? { state: "done", text: j.text } : { state: "error" });
    } catch {
      setFull({ state: "error" });
    }
  };
  const risks = useMemo(() => {
    if (!item.risks) return undefined;
    const t = q.trim().toLowerCase();
    return item.risks.map((g) => ({ ...g, risks: g.risks.filter((r) => !t || r.text.toLowerCase().includes(t) || r.theme.toLowerCase().includes(t)) })).filter((g) => g.risks.length);
  }, [item.risks, q]);
  const label = form === "10-Q" ? `Part ${item.part ?? ""} · Item ${item.id.replace(/^I+-/, "")}` : `Item ${item.id}`;

  return (
    <article id={`part-${item.id}`} className="scroll-mt-24 overflow-hidden rounded-sm border border-line bg-white">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-start gap-4 px-5 py-4 text-left sm:px-6">
        <span aria-hidden="true" className="mt-1.5 h-3 w-3 flex-none rounded-[2px]" style={{ background: color }} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[12.5px] font-semibold text-muted">
            {label} · {item.title} · {item.empty ? "nothing to report" : `about ${item.minutes} min to read`}
          </span>
          <span className="font-display text-[19px] font-semibold leading-snug">{item.name}</span>
          <span className="text-[14.5px] leading-relaxed text-ink/75">{item.what}</span>
          {item.facts.length > 0 && (
            <span className="mt-1.5 flex flex-wrap gap-1.5">
              {item.facts.map((f) => (
                <FactChip key={f.label} f={f} />
              ))}
            </span>
          )}
        </span>
        <svg className={`mt-1 flex-none transition-transform ${open ? "rotate-180" : ""}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="fathom-fade flex flex-col gap-4 border-t border-line px-5 py-5 sm:px-6">
          {item.why && (
            <p className="m-0 rounded-sm bg-mist px-4 py-3 text-[15px] leading-relaxed">
              <strong className="font-semibold">Why people read it: </strong>
              {item.why}
            </p>
          )}
          {item.link === "statements" && (
            <Link href={`/stock/${encodeURIComponent(ticker)}/statements`} className="self-start rounded-sm bg-ink px-4 py-2 text-[14px] font-semibold text-white no-underline hover:text-white">
              See every line of the four statements →
            </Link>
          )}
          {item.link === "proxy" && (
            <Link href={`/stock/${encodeURIComponent(ticker)}/proxy`} className="self-start rounded-sm bg-ink px-4 py-2 text-[14px] font-semibold text-white no-underline hover:text-white">
              See pay and votes from the proxy statement →
            </Link>
          )}
          {item.excerpt && (
            <blockquote className="m-0 border-l-[3px] pl-4 text-[15.5px] leading-relaxed text-ink/85" style={{ borderColor: color }}>
              <span className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-muted">In the company&apos;s words</span>
              {item.excerpt}
            </blockquote>
          )}
          {item.outline && item.outline.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="m-0 text-[15px] font-semibold">What the managers cover, in order</h3>
              <ol className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                {item.outline.map((h, k) => (
                  <li key={h + k} className="rounded-sm bg-panel-2 px-2.5 py-1 text-[13.5px]">
                    {h}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {risks && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="m-0 text-[15px] font-semibold">Every risk it lists, by its own headings</h3>
                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search risks, e.g. China" className="min-h-9 w-56 rounded-sm border border-line px-3 text-[14px] outline-none focus:border-ocean" />
              </div>
              {risks.map((g) => (
                <div key={g.title} className="flex flex-col gap-1.5">
                  <h4 className="m-0 text-[13px] font-semibold uppercase tracking-wide text-muted">
                    {g.title} ({g.risks.length})
                  </h4>
                  <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
                    {g.risks.map((r) => (
                      <li key={r.text} className="flex flex-col gap-1 rounded-sm border border-line px-3 py-2 sm:flex-row sm:items-start sm:gap-3">
                        <span className="flex-none self-start rounded-sm bg-panel-2 px-2 py-0.5 text-[11.5px] font-semibold text-muted">{r.theme}</span>
                        <span className="text-[14.5px] leading-snug">&ldquo;{r.text}&rdquo;</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
              {risks.length === 0 && <p className="m-0 text-[14px] text-muted">No risk heading mentions &ldquo;{q}&rdquo;.</p>}
            </div>
          )}
          {item.points && item.points.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="m-0 text-[15px] font-semibold">Pre-arranged trading plans by its leaders (Rule 10b5-1)</h3>
              <p className="m-0 text-[14px] text-muted">
                Leaders can set up a plan in advance to buy or sell shares on set dates, so the trades aren&apos;t based on news they know and others don&apos;t.
              </p>
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                {item.points.map((p) => (
                  <li key={p} className="rounded-sm bg-mist px-3 py-2 text-[14px] leading-relaxed">
                    &ldquo;{p}&rdquo;
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!item.empty && (
            <div className="flex flex-col gap-2">
              {full.state !== "done" && (
                <button type="button" onClick={loadFull} disabled={full.state === "loading"} className="self-start rounded-sm border border-line px-4 py-2 text-[14px] font-semibold hover:border-ink disabled:opacity-60">
                  {full.state === "loading" ? "Opening…" : full.state === "error" ? "Couldn't open it. Try again" : `Read this part in full, in the company's words (${item.minutes} min)`}
                </button>
              )}
              {full.state === "done" && full.text && (
                <div className="max-h-[520px] overflow-y-auto rounded-sm border border-line bg-mist px-4 py-3 text-[14.5px] leading-relaxed">
                  {full.text
                    .split("\n")
                    .filter((l) => l.trim() && !/form 10-[kq]\s*\|\s*\d+$/i.test(l))
                    .map((l, k) => (
                      <p key={k} className={`m-0 mb-2 ${l.length < 90 && !/[.:;,]$/.test(l) ? "font-semibold" : ""}`}>
                        {l}
                      </p>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function Notes({ notes, ticker, form, company }: { notes: NoteRef[]; ticker: string; form: string; company: string }) {
  return (
    <section className="flex flex-col gap-3 rounded-sm border border-line bg-white px-5 py-5 sm:px-6">
      <div>
        <h2 className="m-0 font-display text-[22px] font-semibold">The notes behind the numbers</h2>
        <p className="m-0 max-w-3xl text-[15px] leading-relaxed text-muted">
          The statements only show totals. The {notes.length} notes explain each one: how {company} counts sales, what it owes and when, its tax bill,
          its leases, its business segments and more. Open a note to read it and see its tables.
        </p>
      </div>
      <ol className="m-0 flex list-none flex-col p-0">
        {notes.map((n, i) => (
          <li key={n.file} className="border-t border-line first:border-0">
            <NoteRow note={n} index={i + 1} ticker={ticker} form={form} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function usePage(ticker: string, form: string) {
  const [pages, setPages] = useState<Record<string, NotePage | "loading" | "error">>({});
  const load = async (file: string) => {
    if (pages[file] && pages[file] !== "error") return;
    setPages((p) => ({ ...p, [file]: "loading" }));
    try {
      const r = await fetch(`/api/filing?t=${encodeURIComponent(ticker)}&form=${form}&page=${file}`);
      if (!r.ok) throw new Error();
      const j = (await r.json()) as NotePage;
      setPages((p) => ({ ...p, [file]: j }));
    } catch {
      setPages((p) => ({ ...p, [file]: "error" }));
    }
  };
  return [pages, load] as const;
}

function NoteRow({ note, index, ticker, form }: { note: NoteRef; index: number; ticker: string; form: string }) {
  const [open, setOpen] = useState(false);
  const [pages, load] = usePage(ticker, form);
  const [table, setTable] = useState<string | null>(null);
  const text = pages[note.file];
  const toggle = () => {
    if (!open) load(note.file);
    setOpen(!open);
  };
  return (
    <div className="flex flex-col">
      <button type="button" aria-expanded={open} onClick={toggle} className="flex w-full items-start gap-3 py-3 text-left">
        <span className="mt-0.5 w-7 flex-none text-right text-[13px] font-semibold tabular-nums text-muted">{index}</span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[15.5px] font-semibold">{note.title}</span>
          <span className="text-[14px] text-muted">{note.plain}</span>
        </span>
        {note.details.length > 0 && <span className="flex-none rounded-sm bg-panel-2 px-2 py-0.5 text-[12px] font-semibold text-muted">{note.details.length} table{note.details.length > 1 ? "s" : ""}</span>}
        <span aria-hidden="true" className={`text-xl leading-none transition-transform ${open ? "rotate-45" : ""}`}>
          +
        </span>
      </button>
      {open && (
        <div className="fathom-fade mb-4 ml-10 flex flex-col gap-3">
          {note.details.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {note.details.map((d) => (
                <button
                  key={d.file}
                  type="button"
                  onClick={() => {
                    setTable(d.file);
                    load(d.file);
                  }}
                  className={`rounded-sm px-2.5 py-1 text-[13px] font-semibold ${table === d.file ? "bg-ink text-white" : "bg-panel-2 text-ink hover:bg-surface"}`}
                >
                  {d.title}
                </button>
              ))}
            </div>
          )}
          {table && <PageView page={pages[table]} />}
          <PageView page={text} />
        </div>
      )}
    </div>
  );
}

function PageView({ page }: { page?: NotePage | "loading" | "error" }) {
  if (!page || page === "loading") return <p className="m-0 text-[14px] text-muted">Opening…</p>;
  if (page === "error") return <p className="m-0 text-[14px] text-muted">Couldn&apos;t open it right now.</p>;
  if (page.kind === "text")
    return (
      <div className="max-h-[420px] overflow-y-auto rounded-sm bg-mist px-4 py-3 text-[14.5px] leading-relaxed">
        <p className="m-0 mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted">In the company&apos;s words</p>
        {page.paragraphs.map((p, k) => (
          <p key={k} className={`m-0 mb-2 ${p.length < 90 && !/[.:;]$/.test(p) ? "font-semibold" : ""}`}>
            {p}
          </p>
        ))}
      </div>
    );
  const rows = page.lines.filter((l) => !l.header || l.split);
  return (
    <div className="overflow-x-auto rounded-sm border border-line">
      <table className="w-full min-w-[520px] border-collapse text-[13.5px]">
        <caption className="px-3 pt-2 text-left text-[13px] font-semibold">{page.title}</caption>
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="px-3 py-1.5 text-left font-semibold">Line</th>
            {page.table.columns.map((c, i) => (
              <th key={c.heading + i} className="px-3 py-1.5 text-right font-semibold">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((l) =>
            l.header ? (
              <tr key={l.id}>
                <th colSpan={page.table.columns.length + 1} className="bg-panel-2 px-3 py-1 text-left text-[12.5px] font-semibold">
                  {l.label}
                </th>
              </tr>
            ) : (
              <tr key={l.id} className="border-t border-line">
                <td className="px-3 py-1.5">{l.shortLabel}</td>
                {l.values.map((v, i) => (
                  <td key={i} className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums">
                    {v === null ? (l.texts[i] ? <span className="whitespace-normal text-[12.5px]">{l.texts[i]}</span> : "–") : compact(v, l.unit)}
                  </td>
                ))}
              </tr>
            ),
          )}
        </tbody>
      </table>
      <p className="m-0 px-3 py-2 text-[12px] text-muted">
        As filed ({page.table.units}).{" "}
        <a href={page.url} target="_blank" rel="noopener noreferrer">
          See it on SEC
        </a>
      </p>
    </div>
  );
}
