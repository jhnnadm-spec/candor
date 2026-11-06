import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loader } from "@/components/Loader";
import { CompanyTop, shortCompany } from "@/components/company/CompanyTop";
import { CompanyDisclaimer } from "@/components/company/Disclaimer";
import { StatementsExplorer, type ReportLite } from "@/components/statements/Explorer";
import { getCompanyReport } from "@/lib/report/company";
import { getCompanyProfile } from "@/lib/profile/wiki";
import { getCompanyStatements, type ReportStatements } from "@/lib/statements/load";

export async function generateMetadata(props: PageProps<"/stock/[ticker]/statements">): Promise<Metadata> {
  const { ticker } = await props.params;
  return { title: `${ticker.toUpperCase()} financial statements, explained` };
}

export default function StatementsPage(props: PageProps<"/stock/[ticker]/statements">) {
  return (
    <Suspense fallback={<Loader steps={["Opening its latest reports…", "Reading every line of the four statements…", "Putting it into plain words…"]} />}>
      <Statements params={props.params} />
    </Suspense>
  );
}

/** The pages list is only needed by the report pages, so it isn't sent to the browser here. */
const lite = (r?: ReportStatements): ReportLite | undefined => {
  if (!r) return undefined;
  const { pages, ...rest } = r;
  void pages;
  return rest;
};

async function Statements({ params }: { params: Promise<{ ticker: string }> }) {
  const ticker = decodeURIComponent((await params).ticker).toUpperCase();
  const report = await getCompanyReport(ticker);
  if (!report) notFound();
  const [profile, data] = await Promise.all([getCompanyProfile(report.company.cik), report.support.supported ? getCompanyStatements(ticker) : null]);
  const company = shortCompany(report.company.name);
  return (
    <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 px-5 pb-16 pt-6 sm:pt-8 lg:px-10">
      <CompanyTop
        report={report}
        profile={profile}
        title="The four financial statements"
        intro={
          <p className="m-0">
            Every company that sells shares in the US files four statements with the SEC. Together they show whether {company} made money, what it owns
            and owes, where its cash went, and what changed for its shareholders. Below is every line exactly as {company} filed it, with what each one
            means in plain English.
          </p>
        }
      />
      {data && (data.annual || data.quarterly) ? (
        <StatementsExplorer company={company} annual={lite(data.annual)} quarterly={lite(data.quarterly)} />
      ) : (
        <p className="text-[17px] text-muted">
          {company} hasn&apos;t filed a yearly or quarterly report with tagged figures that candor can read.
        </p>
      )}
      <CompanyDisclaimer extra={`Plain-English names and meanings are candor's; ${company}'s own wording is shown next to each line.`} />
    </div>
  );
}
