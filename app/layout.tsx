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
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 py-3.5 lg:px-8">
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

        <footer className="border-t border-line bg-white/70 backdrop-blur">
          <div className="mx-auto flex max-w-[1180px] flex-col gap-2 px-5 py-8 text-sm leading-relaxed text-muted sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <p>For information only. Not investment advice. cand0r never tells you to buy, sell or hold anything.</p>
            <Link href="/about" className="font-semibold">
              About cand0r
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
