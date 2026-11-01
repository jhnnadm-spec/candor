/**
 * The Surface level: one question, one short answer, one small picture, and a
 * quiet link to where it came from. Pictures here are simple on purpose; the
 * full, interactive charts are one level down.
 */
import type { ReactNode } from "react";
import { Emph } from "./Emph";

export function LiteCard({
  question,
  term,
  children,
  sources = [],
  wide = false,
}: {
  question: string;
  term?: ReactNode;
  children: ReactNode;
  sources?: { url: string; label: string }[];
  wide?: boolean;
}) {
  return (
    <article className={`flex min-w-0 flex-col gap-4 rounded-xl border border-line bg-white p-5 ${wide ? "md:col-span-2" : ""}`}>
      <header className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <h3 className="text-[15px] font-semibold text-muted">{question}</h3>
        {term && <span className="text-[13px]">{term}</span>}
      </header>
      <div className="flex flex-1 flex-col gap-4">{children}</div>
      {sources.length > 0 && <SourceChips sources={sources} />}
    </article>
  );
}

/** The answer in a few words: a big figure and a short caption. */
export function BigAnswer({ value, caption, tone = "ocean" }: { value: string; caption: string; tone?: "ocean" | "good" | "warn" }) {
  // Each part of the page paints its big answers in its own colour (set by ResearchStep); good and warning tones keep theirs.
  const color = tone === "good" ? "text-[#0b6f6e]" : tone === "warn" ? "text-[#b4233c]" : "text-[var(--a-ink,#0c0f14)]";
  return (
    <p className="flex flex-col gap-1">
      <span className={`font-display text-[40px] font-bold leading-none tracking-tight tabular-nums ${color}`}>{value}</span>
      <span className="text-[16px] text-ink">{caption}</span>
    </p>
  );
}

/** The answer in one sentence, for questions about the business itself. */
export function SaidAnswer({ text }: { text: string }) {
  return (
    <p className="text-[19px] font-medium leading-[1.5] text-ink/85">
      <Emph text={text} />
    </p>
  );
}

/** Small "Source" links that open the original document. */
export function SourceChips({ sources }: { sources: { url: string; label: string }[] }) {
  const seen = new Set<string>();
  const unique = sources.filter((s) => (seen.has(s.url) ? false : (seen.add(s.url), true)));
  return (
    <div className="flex flex-wrap gap-1.5">
      {unique.map((s) => (
        <a
          key={s.url}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          title={`Source: ${s.label} (opens the original document)`}
          className="inline-flex items-center gap-1 rounded-sm bg-panel-2 px-2.5 py-1 text-[12px] font-semibold text-muted no-underline transition-colors hover:bg-surface hover:text-ocean"
        >
          {shortSource(s.label)}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 17 17 7M9 7h8v8" />
          </svg>
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ))}
    </div>
  );
}

/** "10-K filed February 20, 2026 · Item 1, Business" → "10-K, Feb 2026". */
function shortSource(label: string): string {
  const form = label.match(/\b(10-K|10-Q|8-K)\b/)?.[1];
  const date = label.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+(\d{4})/);
  if (form && date) return `${form}, ${date[1].slice(0, 3)} ${date[2]}`;
  return form ?? "Source";
}

// ---------------------------------------------------------------- small pictures

/** "$391.0bn" style, for the small labels on Surface pictures. */
function compactMoney(v: number): string {
  const a = Math.abs(v);
  const sign = v < 0 ? "−" : "";
  if (a >= 1e12) return `${sign}$${(a / 1e12).toFixed(2)}tn`;
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(1)}bn`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(0)}m`;
  return `${sign}$${Math.round(a).toLocaleString("en-US")}`;
}

/** Sales by year as bars: the latest one in full colour; point at any bar to see its figure. */
export function MiniBars({ bars }: { bars: { label: string; value: number }[] }) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <figure className="m-0 flex flex-col gap-1.5" aria-label={`Sales by year: ${bars.map((b) => `${b.label} ${compactMoney(b.value)}`).join(", ")}`}>
      <div className="flex h-24 items-end gap-1.5 pt-5">
        {bars.map((b, i) => {
          const last = i === bars.length - 1;
          return (
            <span key={b.label} className="group relative flex h-full flex-1 items-end">
              <span
                className="fathom-grow-up block w-full rounded-t-[1px] transition-[filter] duration-200 group-hover:brightness-95"
                style={{
                  height: `${Math.max(4, (b.value / max) * 100)}%`,
                  background: last ? "var(--a, #2d5bff)" : "color-mix(in srgb, var(--a, #2d5bff) 22%, white)",
                  animationDelay: `${i * 60}ms`,
                }}
              />
              <span
                className={`pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-1.5 py-0.5 text-[10.5px] font-semibold text-white transition-opacity duration-150 ${last ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                style={{ bottom: `calc(${Math.max(4, (b.value / max) * 100)}% + 4px)` }}
              >
                {compactMoney(b.value)}
              </span>
            </span>
          );
        })}
      </div>
      <div className="flex gap-1.5 text-[11px] text-muted">
        {bars.map((b) => (
          <span key={b.label} className="flex-1 text-center tabular-nums">
            {b.label}
          </span>
        ))}
      </div>
    </figure>
  );
}

/** One bar for $100 of sales: what went on costs, and the part kept as profit. */
export function KeepBar({ kept }: { kept: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(kept)));
  return (
    <figure className="m-0 flex flex-col gap-2" aria-label={`$${pct} kept as profit, $${100 - pct} spent on costs, out of every $100 of sales`}>
      <div className="flex h-5 gap-[3px] overflow-hidden rounded-sm">
        <span
          title={`$${100 - pct} of every $100 went on costs`}
          className="h-full rounded-l-sm bg-[#e5e7eb] transition-[filter] hover:brightness-95"
          style={{ width: `${100 - pct}%` }}
        />
        <span
          title={`$${pct} of every $100 was kept as profit`}
          className="fathom-grow-right h-full rounded-r-sm bg-[#0ea5a4] transition-[filter] hover:brightness-105"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[12px] text-muted">
        <span>${100 - pct} on costs</span>
        <span className="font-semibold text-[#0b6f6e]">${pct} kept</span>
      </div>
    </figure>
  );
}

/** Where a ratio sits from 0 to 2, with a mark at 1 (enough to cover what's due). */
export function MiniGauge({ value, mark = "$1 due" }: { value: number; mark?: string }) {
  const pos = (Math.max(0, Math.min(2, value)) / 2) * 100;
  const enough = value >= 1;
  return (
    <figure className="m-0 flex flex-col gap-1.5" aria-label={`${value.toFixed(2)} on a scale from 0 to 2`}>
      <div className="relative h-5">
        <div className="absolute inset-y-1 left-0 flex w-full gap-[2px] overflow-hidden rounded-sm">
          <span className="h-full w-1/2 bg-[#fde2e6]" />
          <span className="h-full w-1/2 bg-[#d5f2f1]" />
        </div>
        <span className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-white" />
        <span
          className="fathom-grow-right absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-sm border-[3px] border-white"
          style={{ left: `${pos}%`, background: enough ? "#0ea5a4" : "#f43f5e" }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-muted">
        <span>$0</span>
        <span>{mark}</span>
        <span>$2</span>
      </div>
    </figure>
  );
}

/** Two or three amounts as slim bars, with short names. */
export function MiniPair({ items }: { items: { label: string; value: number; display: string; color: string }[] }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {items.map((it) => (
        <li key={it.label} className="group flex flex-col gap-1">
          <span className="flex justify-between gap-3 text-[13px]">
            <span className="text-muted transition-colors group-hover:text-ink">{it.label.replace(/\s*\(.*\)$/, "")}</span>
            <span className="font-semibold tabular-nums">{it.display}</span>
          </span>
          <span className="h-2.5 overflow-hidden rounded-sm bg-panel-2">
            <span
              className="fathom-grow-right block h-full rounded-sm transition-[filter] group-hover:brightness-105"
              style={{ width: `${Math.max(3, (it.value / max) * 100)}%`, background: it.color }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** What the money went on, as one bar with a short key; point at a part to see it. */
export function UsesBar({ segments }: { segments: { label: string; value: number; display: string; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <figure className="m-0 flex flex-col gap-2.5">
      <div className="flex h-5 gap-[3px] overflow-hidden rounded-sm">
        {segments.map((s) => (
          <span
            key={s.label}
            title={`${s.label.replace(/\s*\(.*\)$/, "")}: ${s.display}`}
            className="fathom-grow-right h-full transition-[filter] first:rounded-l-sm last:rounded-r-sm hover:brightness-110"
            style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
          />
        ))}
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-[13px]">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="text-muted">{s.label.replace(/\s*\(.*\)$/, "")}</span>
            <span className="font-semibold tabular-nums">{s.display}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
