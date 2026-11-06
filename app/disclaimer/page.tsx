import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/PageTitle";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "candor is for education only. It is not investment, financial, legal or tax advice, and never says buy, sell or hold.",
};

const UPDATED = "7 November 2026";

const SECTIONS: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: "education",
    title: "For education only",
    body: (
      <>
        <p>
          candor explains information that US public companies publish, in plain English, to help people understand how a business works. Everything on
          this website, in its downloadable reports and in anything shared from it is general information for educational purposes only.
        </p>
        <p>
          It is <strong>not</strong> investment, financial, legal, tax or accounting advice, and it does not take into account your goals, your financial
          situation or your needs.
        </p>
      </>
    ),
  },
  {
    id: "no-recommendation",
    title: "No recommendations",
    body: (
      <>
        <p>
          candor never says whether to buy, sell or hold any share or other investment, and never gives a price target or a rating. Showing or comparing a
          company is not an endorsement of it.
        </p>
        <p>
          Explanations such as &ldquo;what people usually check&rdquo;, colours such as green or amber, charts, insider trades, pay figures and risk lists
          describe what a company reported. They are not signals to trade.
        </p>
      </>
    ),
  },
  {
    id: "not-licensed",
    title: "Not a licensed adviser",
    body: (
      <p>
        candor and its creator are not registered or licensed as an investment adviser, financial planner, broker or dealer with the US Securities and
        Exchange Commission, the Securities Commission Malaysia or any other regulator. Using candor does not create an adviser, client or any other
        professional relationship.
      </p>
    ),
  },
  {
    id: "sources",
    title: "Where the information comes from",
    body: (
      <>
        <ul>
          <li>
            <strong>Company filings</strong> (10-K, 10-Q, 8-K, DEF 14A, Form 4 and their tagged figures) from the SEC&apos;s public EDGAR system. Figures are
            read by computer, not typed by hand, and each one links to its filing.
          </li>
          <li>
            <strong>Share price charts</strong> are shown by TradingView. Prices can be delayed.
          </li>
          <li>
            <strong>Company descriptions and logos</strong> come from Wikidata and Wikipedia; <strong>news headlines</strong> come from the GDELT Project and
            the publishers it links to.
          </li>
          <li>
            <strong>Plain-English names and explanations</strong> are written by candor. Some explanations are drafted with the help of AI and checked
            against the filing before they are shown, but they can still be incomplete.
          </li>
          <li>
            <strong>Quoted text</strong> is the company&apos;s own wording, shown as it was filed.
          </li>
        </ul>
        <p>candor is not affiliated with, or endorsed by, the SEC, TradingView, Wikidata, the GDELT Project or any company shown.</p>
      </>
    ),
  },
  {
    id: "accuracy",
    title: "Accuracy is not guaranteed",
    body: (
      <>
        <p>
          candor works hard to be correct, but it is provided &ldquo;as is&rdquo;, without any promise that it is complete, accurate, up to date or free of
          errors. Filings can be amended after they are published, sources can be delayed, and reading thousands of different filings automatically can
          put a figure in the wrong place or leave something out.
        </p>
        <p>Always check anything important against the original filing, which is linked next to every figure.</p>
      </>
    ),
  },
  {
    id: "future",
    title: "Statements about the future",
    body: (
      <p>
        Filings often contain a company&apos;s own views of the future: plans, forecasts and expectations. Those are the company&apos;s words, not
        candor&apos;s, and they may turn out to be wrong. Past results, including any shown in charts, do not tell you what will happen next.
      </p>
    ),
  },
  {
    id: "your-decisions",
    title: "Your decisions are your own",
    body: (
      <p>
        Investing involves risk, including losing some or all of the money you put in. Any decision you make is yours alone. Do your own research and
        consider speaking with a licensed financial adviser who knows your situation before you invest.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limits on responsibility",
    body: (
      <p>
        To the fullest extent the law allows, candor and its creator are not responsible for any loss or damage, direct or indirect, that comes from using
        or relying on this website, its reports or the information in them.
      </p>
    ),
  },
  {
    id: "links",
    title: "Other websites and names",
    body: (
      <p>
        Links to other websites are given for convenience; candor doesn&apos;t control them and isn&apos;t responsible for what they say. Company names,
        logos and trademarks belong to their owners and are used only to identify the companies being explained.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this disclaimer",
    body: <p>This disclaimer may be updated from time to time. The date at the top shows when it last changed. Using candor means you accept the version in place at the time.</p>,
  },
];

export default function DisclaimerPage() {
  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-8 px-5 py-12 sm:py-16">
      <PageTitle eyebrow="Disclaimer" title="Please read before you use candor" note={`Last updated ${UPDATED}.`} />

      <section aria-label="In short" className="flex flex-col gap-3 rounded-sm border-l-[4px] border-ink bg-white px-6 py-5">
        <h2 className="m-0 font-display text-[20px] font-semibold">In short</h2>
        <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[16px] leading-relaxed">
          {[
            "candor is for education only. It is not investment, financial, legal or tax advice.",
            "It never says buy, sell or hold, and never gives price targets.",
            "Figures come from public SEC filings and may contain errors. Check the linked source.",
            "Investing can lose money. Your decisions are your own; consider a licensed adviser.",
          ].map((t) => (
            <li key={t} className="flex gap-3">
              <span aria-hidden="true" className="mt-[10px] h-1.5 w-1.5 flex-none rounded-[1px] bg-ink" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <nav aria-label="On this page" className="flex flex-wrap gap-2">
        {SECTIONS.map((s, i) => (
          <a key={s.id} href={`#${s.id}`} className="rounded-sm bg-panel-2 px-3 py-1.5 text-[13.5px] font-semibold text-ink no-underline hover:bg-surface">
            {i + 1}. {s.title}
          </a>
        ))}
      </nav>

      <div className="flex flex-col gap-3">
        {SECTIONS.map((s, i) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-24 rounded-sm border border-line bg-white px-6 py-5">
            <h2 id={`${s.id}-h`} className="m-0 mb-2 font-display text-[19px] font-semibold">
              <span className="mr-2 text-muted">{i + 1}.</span>
              {s.title}
            </h2>
            <div className="flex flex-col gap-2.5 text-[15.5px] leading-relaxed text-ink/85 [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_p]:m-0 [&_ul]:m-0 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:p-0">
              {s.body}
            </div>
          </section>
        ))}
      </div>

      <p className="m-0 text-[14px] text-muted">
        Questions about this disclaimer or something you spotted on candor? See <Link href="/about">About</Link>.
      </p>
    </div>
  );
}
