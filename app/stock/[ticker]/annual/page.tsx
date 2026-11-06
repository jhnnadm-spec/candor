import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader } from "@/components/Loader";
import { ReportGuidePage } from "@/components/filings/ReportGuidePage";

export async function generateMetadata(props: PageProps<"/stock/[ticker]/annual">): Promise<Metadata> {
  const { ticker } = await props.params;
  return { title: `${ticker.toUpperCase()} yearly report (10-K), explained` };
}

export default function AnnualPage(props: PageProps<"/stock/[ticker]/annual">) {
  return (
    <Suspense fallback={<Loader steps={["Opening its yearly report…", "Finding every part…", "Pulling out what matters…"]} />}>
      <ReportGuidePage params={props.params} form="10-K" />
    </Suspense>
  );
}
