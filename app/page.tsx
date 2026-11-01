import Link from "next/link";
import { CompanyLogo } from "@/components/CompanyLogo";
import { HeroHeadline } from "@/components/HeroHeadline";
import { HeroPreview } from "@/components/HeroPreview";
import { HowArt } from "@/components/HowArt";
import { SearchForm } from "@/components/SearchForm";
import { SectorIcon } from "@/components/SectorIcon";
import { SurpriseButton } from "@/components/SurpriseButton";
import { WatchlistHome } from "@/components/WatchlistHome";
import { largestCompanies, sectorSummaries } from "@/lib/sectors-data";

const POPULAR = [
  { ticker: "AAPL", name: "Apple", site: "https://www.apple.com" },
  { ticker: "NKE", name: "Nike", site: "https://www.nike.com" },
  { ticker: "KO", name: "Coca-Cola", site: "https://www.coca-colacompany.com" },
  { ticker: "MSFT", name: "Microsoft", site: "https://www.microsoft.com" },
  { ticker: "COST", name: "Costco", site: "https://www.costco.com" },
];

const HOW = [
  { n: 1 as const, title: "Search a company", text: "Type its name, like Nike, or its short code, like NKE." },
  { n: 2 as const, title: "Read the short answers", text: "Seven simple questions, each answered in a sentence or a picture." },
  { n: 3 as const, title: "Tap “Tell me more”", text: "Only when you're curious. You never have to read it all." },
];

export default function Home() {
  const surprise = largestCompanies(60).map((r) => r.t);
  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-20 px-5 pb-24 pt-14 sm:gap-28 sm:pt-24 lg:px-8">
      {/* Search first, on a faint grid with one soft glow of brand blue behind it */}
      <section className="relative isolate flex flex-col items-center gap-7 text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-[14px] font-medium text-muted">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-ocean" />
          Free. A source for every point.
        </p>
        <HeroHeadline />
        <p className="max-w-xl text-[19px] leading-relaxed text-muted">
          Pick a US company. Candor explains it one simple question at a time.
        </p>
        <div className="flex w-full justify-center">
          <SearchForm />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="mr-1 text-[15px] text-muted">Try</span>
          {POPULAR.map((c) => (
            <Link
              key={c.ticker}
              href={`/stock/${c.ticker}`}
              className="fathom-lift inline-flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3.5 text-[15px] font-medium text-ink no-underline"
            >
              <CompanyLogo name={c.name} website={c.site} size={26} />
              {c.name}
            </Link>
          ))}
          <SurpriseButton tickers={surprise} />
        </div>
        <HeroPreview />
      </section>

      <WatchlistHome />

      {/* How it works, in three steps */}
      <section aria-labelledby="how-title" className="flex flex-col gap-6">
        <h2 id="how-title" className="font-display text-[28px] font-semibold tracking-[-0.03em]">
          How it works
        </h2>
        <ol className="m-0 grid list-none gap-px overflow-hidden rounded-2xl border border-line bg-line p-0 sm:grid-cols-3">
          {HOW.map((h) => (
            <li key={h.n} className="group flex flex-col gap-3 bg-white p-5 sm:p-6">
              <HowArt step={h.n} />
              <span aria-hidden="true" className="mt-2 text-[13px] font-medium tabular-nums text-muted">
                Step {h.n}
              </span>
              <span className="text-[18px] font-semibold tracking-[-0.02em]">{h.title}</span>
              <span className="text-[15px] leading-relaxed text-muted">{h.text}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Browse when you don't have a company in mind */}
      <section className="flex flex-col gap-6" aria-labelledby="sectors-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="sectors-title" className="font-display text-[28px] font-semibold tracking-[-0.03em]">
              Not sure where to start?
            </h2>
            <p className="text-[16px] text-muted">Pick a type of business and see the biggest companies in it.</p>
          </div>
          <Link href="/sectors" className="text-[15px] font-semibold">
            Browse all →
          </Link>
        </div>
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-4">
          {sectorSummaries().map((s) => (
            <li key={s.id}>
              <Link
                href={`/sectors/${s.id}`}
                className="fathom-card fathom-lift group flex h-full items-center gap-3 p-3.5 text-[15px] font-medium text-ink no-underline"
              >
                <SectorIcon id={s.id} size={38} />
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
