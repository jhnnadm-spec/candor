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
        <header className="relative z-10 border-b border-line bg-white">
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

        <footer className="border-t border-line bg-white">
          <div className="mx-auto flex max-w-[1360px] flex-col gap-2 px-5 py-3 text-[12px] leading-snug text-muted lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-10">
            <p className="m-0">
              <strong className="font-semibold text-ink">cand0r</strong> is for education only, not investment, legal or tax advice, and never says buy, sell
              or hold. Figures come from public SEC filings and may contain errors: check the linked sources.{" "}
              <Link href="/about" className="text-muted">
                More about this
              </Link>
            </p>
            <nav aria-label="Footer" className="flex flex-none gap-x-5 font-medium">
              <Link href="/sectors">Browse</Link>
              <Link href="/compare">Compare</Link>
              <Link href="/terms">Dictionary</Link>
              <Link href="/about">About</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
