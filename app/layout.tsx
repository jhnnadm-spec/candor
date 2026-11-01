import type { Metadata } from "next";
import Link from "next/link";
// Fonts are bundled with the app (no request to Google at build time).
import "@fontsource/inter-tight/400.css";
import "@fontsource/inter-tight/500.css";
import "@fontsource/inter-tight/600.css";
import "@fontsource/inter-tight/700.css";
import "./globals.css";
import { AmbientBackground } from "@/components/AmbientBackground";
import { Logo } from "@/components/Logo";
import { HeaderSearch, NavLinks } from "@/components/NavLinks";
import { SearchForm } from "@/components/SearchForm";

export const metadata: Metadata = {
  title: {
    default: "cand0r: company reports, explained plainly",
    template: "%s · cand0r",
  },
  description:
    "Understand any US public company in plain English, with a source for every claim. For education only, not financial advice.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <AmbientBackground />
        <header className="relative z-10 border-b border-line bg-white/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 py-3.5 lg:px-10">
            <Link href="/" className="no-underline" aria-label="cand0r home">
              <Logo size={26} />
            </Link>
            <NavLinks />
            <HeaderSearch>
              <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1 sm:max-w-sm lg:ml-auto">
                <SearchForm size="small" />
              </div>
            </HeaderSearch>
          </div>
        </header>

        <main className="flex flex-1 flex-col overflow-x-clip">{children}</main>

        <footer className="border-t border-line bg-white/75 backdrop-blur">
          <div className="mx-auto flex max-w-[1360px] flex-col gap-8 px-5 py-10 lg:flex-row lg:items-start lg:justify-between lg:gap-16 lg:px-10">
            <div className="flex max-w-3xl flex-col gap-3">
              <Logo size={20} />
              <p className="text-[13px] leading-relaxed text-muted">
                <strong className="font-semibold text-ink">Important information.</strong> cand0r provides general information for
                educational purposes only. Nothing on this website is investment, financial, legal or tax advice, or a
                recommendation to buy, sell or hold any security. Figures are drawn from companies&apos; public filings with the US
                Securities and Exchange Commission and other public sources; they may contain errors or be out of date and should be
                checked against the original documents. Past results are not a reliable indicator of future performance. Consider
                speaking to a licensed financial adviser before making any investment decision.
              </p>
              <p className="text-[12px] text-muted">
                Market data and news widgets are provided by TradingView. cand0r is independent and is not affiliated with any
                company it covers.
              </p>
            </div>
            <nav aria-label="Footer" className="flex flex-none gap-x-8 gap-y-2 text-[14px] font-medium sm:flex-wrap lg:flex-col">
              <Link href="/sectors">Browse</Link>
              <Link href="/compare">Compare</Link>
              <Link href="/terms">Dictionary</Link>
              <Link href="/about">About cand0r</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
