/** The yearly (10-K) and quarterly (10-Q) report pages share this. */
import { notFound } from "next/navigation";
import { CompanyTop, shortCompany } from "@/components/company/CompanyTop";
import { CompanyDisclaimer } from "@/components/company/Disclaimer";
import { ReportGuideView } from "@/components/filings/ReportGuideView";
import { getReportGuide, type ReportForm } from "@/lib/filings/load";
import { getCompanyProfile } from "@/lib/profile/wiki";
import { getCompanyReport } from "@/lib/report/company";
import { niceDate } from "@/lib/statements/format";

const INTRO: Record<ReportForm, (c: string) => string> = {
  "10-K": (c) =>
    `Once a year, every US-listed company files a full report with the SEC called the 10-K. It's longer and more detailed than the glossy annual report sent to shareholders, and its figures are checked by an independent auditor. Here is ${c}'s latest one, part by part: what each part is, why people read it, and what it says.`,
  "10-Q": (c) =>
    `After each of the first three quarters of its financial year, a company files a shorter report called the 10-Q. Its figures are reviewed but not fully audited. Here is ${c}'s latest one, part by part.`,
};

export async function ReportGuidePage({ params, form }: { params: Promise<{ ticker: string }>; form: ReportForm }) {
  const ticker = decodeURIComponent((await params).ticker).toUpperCase();
  const report = await getCompanyReport(ticker);
  if (!report) notFound();
  const [profile, data] = await Promise.all([getCompanyProfile(report.company.cik), report.support.supported ? getReportGuide(ticker, form) : null]);
  const company = shortCompany(report.company.name);
  return (
    <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 px-5 pb-16 pt-6 sm:pt-8 lg:px-10">
      <CompanyTop
        report={report}
        profile={profile}
        title={form === "10-K" ? "The yearly report (10-K), explained" : "The quarterly report (10-Q), explained"}
        intro={
          <p className="m-0">
            {INTRO[form](company)}
            {data && (
              <span className="text-muted">
                {" "}
                Filed {niceDate(data.guide.filingDate)}
                {data.guide.periodEnd ? `, covering the period to ${niceDate(data.guide.periodEnd)}` : ""}.
              </span>
            )}
          </p>
        }
      />
      {data ? (
        <ReportGuideView guide={data.guide} notes={data.notes} ticker={ticker} company={company} />
      ) : (
        <p className="text-[17px] text-muted">{company} hasn&apos;t filed a {form} that candor can find.</p>
      )}
      <CompanyDisclaimer extra={"Checks marked green or amber describe wording found in the report, not a judgement of the company."} />
    </div>
  );
}
