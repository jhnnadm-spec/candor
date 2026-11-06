"use client";

/**
 * The tabs along the top of every company page: the overview, the four financial
 * statements, and each kind of SEC filing explained. The current tab is marked once
 * the address is known.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

export const COMPANY_TABS = [
  { path: "", label: "Overview", form: "" },
  { path: "/statements", label: "Financial statements", form: "4 statements" },
  { path: "/annual", label: "Yearly report", form: "10-K" },
  { path: "/quarterly", label: "Quarterly report", form: "10-Q" },
  { path: "/announcements", label: "Announcements", form: "8-K" },
  { path: "/proxy", label: "Pay and votes", form: "DEF 14A" },
  { path: "/insiders", label: "Insider trades", form: "Form 4" },
] as const;

export function CompanyTabs({ ticker }: { ticker: string }) {
  return (
    <Suspense fallback={<Tabs ticker={ticker} path="" />}>
      <Current ticker={ticker} />
    </Suspense>
  );
}

function Current({ ticker }: { ticker: string }) {
  return <Tabs ticker={ticker} path={usePathname()} />;
}

function Tabs({ ticker, path }: { ticker: string; path: string }) {
  const base = `/stock/${encodeURIComponent(ticker)}`;
  return (
    <nav aria-label="Company sections" className="overflow-hidden rounded-sm border border-line bg-white">
      <ol className="m-0 flex list-none gap-1 overflow-x-auto p-1.5 [scrollbar-width:none]">
        {COMPANY_TABS.map((t) => {
          const href = `${base}${t.path}`;
          const on = path === href || (t.path === "" && path === `/stock/${ticker}`);
          return (
            <li key={t.path} className="flex-none">
              <Link
                href={href}
                aria-current={on ? "page" : undefined}
                className={`flex min-h-11 flex-col justify-center rounded-sm px-3.5 py-1 no-underline transition-colors ${on ? "bg-ink text-white hover:text-white" : "text-ink hover:bg-panel-2"}`}
              >
                <span className="text-[14px] font-semibold leading-tight">{t.label}</span>
                {t.form && <span className={`text-[11.5px] leading-tight ${on ? "text-white/70" : "text-muted"}`}>{t.form}</span>}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
