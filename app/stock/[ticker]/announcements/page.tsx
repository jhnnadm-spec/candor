import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loader } from "@/components/Loader";
import { CompanyTop, shortCompany } from "@/components/company/CompanyTop";
import { AnnouncementsView } from "@/components/filings/AnnouncementsView";
import { getAnnouncements } from "@/lib/filings/load";
import { getCompanyProfile } from "@/lib/profile/wiki";
import { getCompanyReport } from "@/lib/report/company";

export async function generateMetadata(props: PageProps<"/stock/[ticker]/announcements">): Promise<Metadata> {
  const { ticker } = await props.params;
  return { title: `${ticker.toUpperCase()} announcements (8-K), explained` };
}

export default function AnnouncementsPage(props: PageProps<"/stock/[ticker]/announcements">) {
  return (
    <Suspense fallback={<Loader steps={["Finding its announcements…", "Reading the newest ones…", "Sorting them by kind…"]} />}>
      <Announcements params={props.params} />
    </Suspense>
  );
}

async function Announcements({ params }: { params: Promise<{ ticker: string }> }) {
  const ticker = decodeURIComponent((await params).ticker).toUpperCase();
  const report = await getCompanyReport(ticker);
  if (!report) notFound();
  const [profile, data] = await Promise.all([getCompanyProfile(report.company.cik), getAnnouncements(ticker)]);
  const company = shortCompany(report.company.name);
  return (
    <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 px-5 pb-16 pt-6 sm:pt-8 lg:px-10">
      <CompanyTop
        report={report}
        profile={profile}
        title="Official announcements (8-K)"
        intro={
          <p className="m-0">
            Between its yearly and quarterly reports, a company must tell everyone about big news within four business days, by filing a short report
            called an 8-K. Results, a new boss, a big deal, new debt, a change of auditor, shareholder vote results: it all lands here first. Below is every
            8-K {company} filed in the last two years, sorted by kind, with the opening of the company&apos;s own words for the newest ones.
          </p>
        }
      />
      {data && data.list.length > 0 ? <AnnouncementsView list={data.list} since={data.since} /> : <p className="text-[17px] text-muted">{company} hasn&apos;t filed any 8-K announcements in the last two years.</p>}
    </div>
  );
}
