/**
 * The side column on a company page: what's coming up, what the company announced
 * lately, today's headlines about it, and the week's big economic releases.
 * Dates "coming up" are estimates from last year's timing and say so.
 */
import type { Expected } from "@/lib/sec/filings";
import type { Announcement } from "@/lib/report/company";
import { formatDate } from "@/lib/financials/format";
import { CompanyNews, EconomicCalendar } from "./MarketWidgets";
import { SourceLink } from "./SourceLink";

const KIND: Record<Expected["kind"], { title: string; what: string; color: string; soft: string }> = {
  results: { title: "Results announcement", what: "Sales and profit for the latest quarter, usually with a call for investors.", color: "#2d5bff", soft: "#eef2ff" },
  quarterly: { title: "Quarterly report (10-Q)", what: "The full quarterly report filed with the SEC.", color: "#0ea5a4", soft: "#e6f7f7" },
  annual: { title: "Annual report (10-K)", what: "The full yearly report: the most detailed document a company publishes.", color: "#7c5cff", soft: "#f1edff" },
};

function daysUntil(date: string): number {
  return Math.max(0, Math.round((Date.parse(date) - Date.now()) / 86_400_000));
}

function Panel({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-[20px] border border-line bg-white/85 p-4 backdrop-blur sm:p-5">
      <div className="flex flex-col">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
        {note && <p className="text-[12.5px] leading-snug text-muted">{note}</p>}
      </div>
      {children}
    </section>
  );
}

export function CompanySidebar({
  company,
  symbol,
  expected = [],
  announcements = [],
}: {
  company: string;
  symbol: string;
  expected?: Expected[];
  announcements?: Announcement[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <Panel title="Coming up" note={`Estimated from when ${company} published the same thing last year.`}>
        {expected.length === 0 ? (
          <p className="text-[14px] text-muted">Nothing expected in the next few months from last year&apos;s pattern.</p>
        ) : (
          <ol className="m-0 flex list-none flex-col gap-3 p-0">
            {expected.map((x) => {
              const k = KIND[x.kind];
              const d = daysUntil(x.date);
              return (
                <li key={x.kind} className="flex gap-3">
                  <span
                    className="flex h-14 w-14 flex-none flex-col items-center justify-center rounded-2xl leading-none"
                    style={{ background: k.soft, color: k.color }}
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wide">{new Date(x.date).toLocaleString("en-US", { month: "short", timeZone: "UTC" })}</span>
                    <span className="mt-0.5 font-display text-[22px] font-semibold text-ink">{new Date(x.date).getUTCDate()}</span>
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[14.5px] font-semibold">{k.title}</span>
                    <span className="text-[13px] text-muted">
                      Around {formatDate(x.date)} · <strong className="font-semibold text-ink">{d === 0 ? "any day now" : `in about ${d} day${d === 1 ? "" : "s"}`}</strong>
                    </span>
                    <span className="text-[12.5px] leading-snug text-muted">{k.what}</span>
                    <SourceLink href={x.url} label={`Last year: ${formatDate(x.lastYear)}`} />
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </Panel>

      {announcements.length > 0 && (
        <Panel title="Latest from the company" note="Official announcements filed with the SEC (8-K).">
          <ol className="m-0 flex list-none flex-col gap-3 p-0">
            {announcements.slice(0, 4).map((a) => (
              <li key={a.url} className="flex flex-col gap-0.5 border-l-2 border-line pl-3">
                <span className="text-[12px] font-semibold uppercase tracking-wide text-muted">{formatDate(a.filingDate)}</span>
                <span className="text-[14px] leading-snug">{a.events.join(", ")}</span>
                <SourceLink href={a.url} label="8-K filing" />
              </li>
            ))}
          </ol>
        </Panel>
      )}

      <Panel title="In the news" note="Recent headlines about the company, via TradingView.">
        <CompanyNews symbol={symbol} height={460} />
      </Panel>

      <Panel title="This week in the economy" note="Big US releases, like jobs and inflation figures, that can move every share price.">
        <EconomicCalendar height={380} />
      </Panel>
    </div>
  );
}
