/** The short disclaimer at the bottom of every company page, linking to the full one. */
import Link from "next/link";

export function CompanyDisclaimer({ extra }: { extra?: string }) {
  return (
    <aside aria-label="Disclaimer" className="flex gap-3 rounded-sm border border-line bg-white px-4 py-3 text-[13px] leading-relaxed text-muted">
      <svg className="mt-0.5 flex-none text-ink" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8h.01M11 12h1v5h1" />
      </svg>
      <p className="m-0">
        <strong className="text-ink">For education only. Not investment, financial, legal or tax advice.</strong> candor never says buy, sell or hold.
        {extra ? ` ${extra}` : ""} Figures come from public SEC filings and may contain errors: check the linked source before relying on anything.{" "}
        <Link href="/disclaimer" className="font-semibold">
          Read the full disclaimer
        </Link>
        .
      </p>
    </aside>
  );
}
