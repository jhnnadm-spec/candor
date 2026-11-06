/**
 * The top of every company sub-page: who the company is, in one line, and the tabs.
 */
import { CompanyLogo } from "@/components/CompanyLogo";
import { WatchButton } from "@/components/WatchButton";
import type { CompanyReport } from "@/lib/report/company";
import type { CompanyProfile } from "@/lib/profile/wiki";
import { CompanyTabs } from "./CompanyTabs";

/** "Coca Cola Co" → "Coca Cola", for use inside sentences. */
export function shortCompany(name: string): string {
  return name.replace(/,?\s+(Inc\.?|Corp(oration)?\.?|Co\.?|Company|Ltd\.?|plc|Holdings?|Group)$/i, "").replace(/^The\s+/i, "");
}

export function CompanyTop({ report, profile, title, intro }: { report: CompanyReport; profile?: CompanyProfile; title: string; intro: React.ReactNode }) {
  const c = report.company;
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-line bg-white px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3.5">
          <CompanyLogo name={c.name} logo={profile?.logo} website={profile?.website} size={44} />
          <div className="flex min-w-0 flex-col">
            <p className="m-0 flex flex-wrap items-center gap-2 text-[13px] text-muted">
              <span className="rounded-sm bg-ink px-1.5 py-0.5 text-[12px] font-semibold tracking-wide text-white">{c.ticker}</span>
              <span className="truncate">{c.name}</span>
            </p>
            <h1 className="m-0 font-display text-[28px] font-semibold leading-tight tracking-[-0.035em] sm:text-[34px]">{title}</h1>
          </div>
        </div>
        <WatchButton ticker={c.ticker} name={c.name} />
      </header>
      <CompanyTabs ticker={c.ticker} />
      <div className="max-w-4xl text-[16px] leading-relaxed text-ink/80">{intro}</div>
    </div>
  );
}
