import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loader } from "@/components/Loader";
import { CompanyTop, shortCompany } from "@/components/company/CompanyTop";
import { CompanyDisclaimer } from "@/components/company/Disclaimer";
import { ProxyView } from "@/components/filings/ProxyView";
import { getProxy } from "@/lib/filings/load";
import { getCompanyProfile } from "@/lib/profile/wiki";
import { getCompanyReport } from "@/lib/report/company";

export async function generateMetadata(props: PageProps<"/stock/[ticker]/proxy">): Promise<Metadata> {
  const { ticker } = await props.params;
  return { title: `${ticker.toUpperCase()} pay and votes (proxy statement), explained` };
}

export default function ProxyPage(props: PageProps<"/stock/[ticker]/proxy">) {
  return (
    <Suspense fallback={<Loader steps={["Opening its proxy statement…", "Reading the pay tables…", "Finding what shareholders vote on…"]} />}>
      <Proxy params={props.params} />
    </Suspense>
  );
}

async function Proxy({ params }: { params: Promise<{ ticker: string }> }) {
  const ticker = decodeURIComponent((await params).ticker).toUpperCase();
  const report = await getCompanyReport(ticker);
  if (!report) notFound();
  const [profile, proxy] = await Promise.all([getCompanyProfile(report.company.cik), getProxy(ticker).catch(() => null)]);
  const company = shortCompany(report.company.name);
  return (
    <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 px-5 pb-16 pt-6 sm:pt-8 lg:px-10">
      <CompanyTop
        report={report}
        profile={profile}
        title="Pay and votes (proxy statement)"
        intro={
          <p className="m-0">
            Before its yearly shareholder meeting, a company sends out a proxy statement, filed with the SEC as a DEF 14A. It says what shareholders will
            vote on, who sits on the board, and how the top managers are paid, set against how the shares did. Here are the key parts of {company}&apos;s
            latest one.
            {proxy && (
              <>
                {" "}
                <a href={proxy.url} target="_blank" rel="noopener noreferrer">
                  Open the full statement
                </a>
                .
              </>
            )}
          </p>
        }
      />
      {proxy ? <ProxyView p={proxy} company={company} /> : <p className="text-[17px] text-muted">{company} hasn&apos;t filed a proxy statement (DEF 14A) that candor can find. Some companies file a different kind, or include it in their yearly report.</p>}
      <CompanyDisclaimer extra={"Pay and vote details are as the company reported them."} />
    </div>
  );
}
