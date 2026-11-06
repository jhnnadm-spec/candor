import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loader } from "@/components/Loader";
import { CompanyTop, shortCompany } from "@/components/company/CompanyTop";
import { InsidersView } from "@/components/filings/InsidersView";
import { getInsiders } from "@/lib/filings/load";
import { getCompanyProfile } from "@/lib/profile/wiki";
import { getCompanyReport } from "@/lib/report/company";

export async function generateMetadata(props: PageProps<"/stock/[ticker]/insiders">): Promise<Metadata> {
  const { ticker } = await props.params;
  return { title: `${ticker.toUpperCase()} insider trades (Form 4), explained` };
}

export default function InsidersPage(props: PageProps<"/stock/[ticker]/insiders">) {
  return (
    <Suspense fallback={<Loader steps={["Finding insider trades…", "Reading each Form 4…", "Adding them up…"]} />}>
      <Insiders params={props.params} />
    </Suspense>
  );
}

async function Insiders({ params }: { params: Promise<{ ticker: string }> }) {
  const ticker = decodeURIComponent((await params).ticker).toUpperCase();
  const report = await getCompanyReport(ticker);
  if (!report) notFound();
  const [profile, data] = await Promise.all([getCompanyProfile(report.company.cik), getInsiders(ticker).catch(() => null)]);
  const company = shortCompany(report.company.name);
  return (
    <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 px-5 pb-16 pt-6 sm:pt-8 lg:px-10">
      <CompanyTop
        report={report}
        profile={profile}
        title="Insider trades (Form 4)"
        intro={
          <p className="m-0">
            Directors, top managers and anyone owning more than 10% of a company must report every time they buy, sell or receive its shares, within two
            business days, on a Form 4. Here is what {company}&apos;s insiders did over the last year, and what each kind of trade means.
          </p>
        }
      />
      {data && data.trades.length > 0 ? <InsidersView s={data} company={company} /> : <p className="text-[17px] text-muted">No insider trades (Form 4) for {company} were filed in the last year.</p>}
    </div>
  );
}
