/**
 * The narrow side column on a company page: what's coming up, recent headlines from
 * major publishers, the company's own latest announcements, and (folded away) the
 * week's big economic releases. Dates "coming up" are estimates from last year's timing.
 */
import { Suspense } from "react";
import type { Expected } from "@/lib/sec/filings";
import type { Announcement } from "@/lib/report/company";
import { formatDate } from "@/lib/financials/format";
import { CompanyNews, CompanyNewsLoading } from "./CompanyNews";
import { DaysUntil } from "./DaysUntil";
import { EconomicCalendar } from "./MarketWidgets";
import { Unfold } from "./Unfold";

const KIND: Record<Expected["kind"], { title: string; color: string; soft: string }> = {
  results: { title: "Results announcement", color: "#1f45d6", soft: "#eef2ff" },
  quarterly: { title: "Quarterly report (10-Q)", color: "#0b6f6e", soft: "#e6f7f7" },
  annual: { title: "Annual report (10-K)", color: "#5b3fd6", soft: "#f1edff" },
};

function Panel({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5 rounded-2xl border border-line bg-white p-4">
      <div className="flex flex-col">
        <h2 className="text-[14px] font-semibold">{title}</h2>
        {note && <p className="text-[12px] leading-snug text-muted">{note}</p>}
      </div>
      {children}
    </section>
  );
}

export function CompanySidebar({
  company,
  ticker,
  expected = [],
  announcements = [],
}: {
  company: string;
  ticker: string;
  expected?: Expected[];
  announcements?: Announcement[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <Panel title="In the news" note={`Latest headlines about ${company} from major publishers.`}>
        <Suspense fallback={<CompanyNewsLoading />}>
          <CompanyNews name={company} ticker={ticker} />
        </Suspense>
      </Panel>

      {expected.length > 0 && (
        <Panel title="Coming up" note="Estimated from the same time last year.">
          <ol className="m-0 flex list-none flex-col gap-2 p-0">
            {expected.map((x) => {
              const k = KIND[x.kind];
              return (
                <li key={x.kind} className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 flex-none flex-col items-center justify-center rounded-lg leading-none" style={{ background: k.soft, color: k.color }}>
                    <span className="text-[10px] font-semibold uppercase">{new Date(x.date).toLocaleString("en-US", { month: "short", timeZone: "UTC" })}</span>
                    <span className="text-[15px] font-semibold">{new Date(x.date).getUTCDate()}</span>
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[13px] font-semibold leading-tight">{k.title}</span>
                    <span className="text-[12px] text-muted">
                      Around {formatDate(x.date)}
                      <DaysUntil date={x.date} />
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        </Panel>
      )}

      {announcements.length > 0 && (
        <Panel title="Latest from the company" note="Official announcements filed with the SEC (8-K).">
          <ol className="m-0 flex list-none flex-col gap-2 p-0">
            {announcements.slice(0, 3).map((a) => (
              <li key={a.url} className="flex flex-col">
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-[13px] leading-snug no-underline hover:underline">
                  {a.events.join(", ")}
                </a>
                <span className="text-[11.5px] text-muted">{formatDate(a.filingDate)}</span>
              </li>
            ))}
          </ol>
        </Panel>
      )}

      <section className="rounded-2xl border border-line bg-white px-4 py-2">
        <Unfold title="This week in the economy" note="Big US releases, like jobs and inflation figures.">
          <EconomicCalendar height={340} />
        </Unfold>
      </section>
    </div>
  );
}
