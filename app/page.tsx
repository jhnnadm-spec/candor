import Link from "next/link";
import { CompanyLogo } from "@/components/CompanyLogo";
import { HeroHeadline } from "@/components/HeroHeadline";
import { SearchForm } from "@/components/SearchForm";
import { SectorIcon } from "@/components/SectorIcon";
import { SurpriseButton } from "@/components/SurpriseButton";
import { WatchlistHome } from "@/components/WatchlistHome";
import { ACCENTS, accentAt, accentVars, sectorAccent } from "@/lib/accents";
import { largestCompanies, sectorSummaries } from "@/lib/sectors-data";

const POPULAR = [
  { ticker: "AAPL", name: "Apple", site: "https://www.apple.com" },
  { ticker: "NKE", name: "Nike", site: "https://www.nike.com" },
  { ticker: "KO", name: "Coca-Cola", site: "https://www.coca-colacompany.com" },
  { ticker: "MSFT", name: "Microsoft", site: "https://www.microsoft.com" },
  { ticker: "COST", name: "Costco", site: "https://www.costco.com" },
];

const HOW = [
  { n: 1, title: "Search a company", text: "Type its name, like Nike, or its short code, like NKE.", accent: ACCENTS.ocean },
  { n: 2, title: "Read the short answers", text: "Seven simple questions, each answered in a sentence or a picture.", accent: ACCENTS.coral },
  { n: 3, title: "Tap “Tell me more”", text: "Only when you're curious. You never have to read it all.", accent: ACCENTS.kelp },
];

export default function Home() {
  const surprise = largestCompanies(60).map((r) => r.t);
  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-16 px-5 pb-20 pt-12 sm:gap-20 sm:pt-20 lg:px-8">
      {/* Search first, with soft colour drifting behind it */}
      <section className="relative isolate flex flex-col items-center gap-6 text-center">
        <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-visible">
          <span className="fathom-blob left-[2%] top-[-8%] h-56 w-56 bg-[#7fc4d8] sm:h-80 sm:w-80" />
          <span className="fathom-blob right-[4%] top-[6%] h-48 w-48 bg-[#ffb4a6] [animation-delay:-6s] sm:h-72 sm:w-72" />
          <span className="fathom-blob bottom-[-6%] left-[38%] h-44 w-44 bg-[#c7b8fb] [animation-delay:-12s] sm:h-64 sm:w-64" />
        </div>
        <p className="inline-flex items-center gap-2 rounded-full border border-white bg-white/80 px-3.5 py-1.5 text-[14px] font-semibold text-ocean shadow-[0_4px_14px_-8px_rgba(10,42,58,0.35)] backdrop-blur">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#1fb58c] shadow-[0_0_0_4px_rgba(31,181,140,0.18)]" />
          Free, with a source for every point
        </p>
        <HeroHeadline />
        <p className="max-w-2xl text-[19px] leading-relaxed text-muted">
          Pick a US company. Fathom explains it one simple question at a time.
        </p>
        <div className="flex w-full justify-center">
          <SearchForm />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="mr-1 text-[15px] text-muted">Try</span>
          {POPULAR.map((c, i) => (
            <Link
              key={c.ticker}
              href={`/stock/${c.ticker}`}
              style={accentVars(accentAt(i))}
              className="fathom-lift inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--a)_30%,white)] bg-white py-1 pl-1 pr-3.5 text-[15px] font-semibold text-ink no-underline hover:bg-[var(--a-soft)] hover:text-[var(--a-ink)]"
            >
              <CompanyLogo name={c.name} website={c.site} size={26} />
              {c.name}
            </Link>
          ))}
          <SurpriseButton tickers={surprise} />
        </div>
      </section>

      <WatchlistHome />

      {/* How it works, in three colourful steps */}
      <section aria-labelledby="how-title" className="flex flex-col gap-5">
        <h2 id="how-title" className="font-display text-[26px] font-bold tracking-tight">
          How it works
        </h2>
        <ol className="m-0 grid list-none gap-4 p-0 sm:grid-cols-3">
          {HOW.map((h) => (
            <li key={h.n} style={accentVars(h.accent)} className="fathom-tint fathom-lift flex gap-3.5 p-5">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[var(--a-ink)] font-display text-[18px] font-bold text-white shadow-[0_6px_14px_-6px_var(--a)]"
              >
                {h.n}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[17px] font-semibold text-[var(--a-ink)]">{h.title}</span>
                <span className="text-[15px] leading-relaxed text-ink/80">{h.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Browse when you don't have a company in mind */}
      <section className="flex flex-col gap-5" aria-labelledby="sectors-title">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h2 id="sectors-title" className="font-display text-[26px] font-bold tracking-tight">
              Not sure where to start?
            </h2>
            <p className="text-[16px] text-muted">Pick a type of business and see the biggest companies in it.</p>
          </div>
        </div>
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-4">
          {sectorSummaries().map((s) => (
            <li key={s.id}>
              <Link
                href={`/sectors/${s.id}`}
                style={accentVars(sectorAccent(s.id))}
                className="fathom-card fathom-lift group flex h-full items-center gap-3 p-3.5 text-[15px] font-semibold text-ink no-underline hover:bg-[var(--a-soft)] hover:text-[var(--a-ink)]"
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
