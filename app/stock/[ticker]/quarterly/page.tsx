import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader } from "@/components/Loader";
import { ReportGuidePage } from "@/components/filings/ReportGuidePage";

export async function generateMetadata(props: PageProps<"/stock/[ticker]/quarterly">): Promise<Metadata> {
  const { ticker } = await props.params;
  return { title: `${ticker.toUpperCase()} quarterly report (10-Q), explained` };
}

export default function QuarterlyPage(props: PageProps<"/stock/[ticker]/quarterly">) {
  return (
    <Suspense fallback={<Loader steps={["Opening its quarterly report…", "Finding every part…", "Pulling out what matters…"]} />}>
      <ReportGuidePage params={props.params} form="10-Q" />
    </Suspense>
  );
}
