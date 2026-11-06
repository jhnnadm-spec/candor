import type { Metadata } from "next";
import Link from "next/link";
// Fonts are bundled with the app (no request to Google at build time).
import "@fontsource/inter-tight/400.css";
import "@fontsource/inter-tight/500.css";
import "@fontsource/inter-tight/600.css";
import "@fontsource/inter-tight/700.css";
import "./globals.css";
import { Logo } from "@/components/Logo";
import { HeaderSearch, NavLinks } from "@/components/NavLinks";
import { SearchForm } from "@/components/SearchForm";

export const metadata: Metadata = {
  title: {
    default: "candor: company reports, explained plainly",
    template: "%s · candor",
  },
  description:
    "Understand any US public company in plain English, with a source for every claim. For education only, not financial advice.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <header className="relative z-10 bg-ink">
          <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 py-3.5 lg:px-10">
            <Link href="/" className="no-underline" aria-label="candor home">
              <Logo size={26} tone="dark" />
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

        <footer className="bg-ink">
          <div className="mx-auto flex max-w-[1360px] flex-col gap-2 px-5 py-3 text-[12px] leading-snug text-[#A3AAB8] lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-10">
            <p className="m-0">
              <strong className="font-semibold text-white">candor</strong> is for education only, not investment, legal or tax advice, and never says buy, sell
              or hold. Figures come from public SEC filings and may contain errors: check the linked sources.{" "}
              <Link href="/disclaimer" className="font-semibold text-[#D9DCE2] hover:text-white">
                Read the full disclaimer
              </Link>
            </p>
            <nav aria-label="Footer" className="flex flex-none gap-x-5 font-medium">
              {[
                ["/sectors", "Browse"],
                ["/compare", "Compare"],
                ["/terms", "Dictionary"],
                ["/about", "About"],
                ["/disclaimer", "Disclaimer"],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="text-[#D9DCE2] no-underline hover:text-white">
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
