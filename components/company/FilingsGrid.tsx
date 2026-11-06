/** On the overview: every deeper page about the company, each with what it answers. */
import Link from "next/link";

const CARDS = [
  { path: "/statements", tag: "4 statements", title: "Every line of its accounts", text: "Income statement, balance sheet, cash flow and shareholders' equity, each line explained.", color: "#0ea5a4" },
  { path: "/annual", tag: "10-K", title: "Its yearly report, part by part", text: "What it does, every risk it lists, the auditor's verdict, the managers' discussion and all the notes.", color: "#7c5cff" },
  { path: "/quarterly", tag: "10-Q", title: "Its latest quarterly report", text: "What changed this quarter, new risks, buybacks and leaders' trading plans.", color: "#2d5bff" },
  { path: "/announcements", tag: "8-K", title: "Official announcements", text: "Results, new leaders, deals, debt and votes, as the company announced them.", color: "#f59e0b" },
  { path: "/proxy", tag: "DEF 14A", title: "Pay and votes", text: "How the boss is paid next to how the shares did, and what shareholders vote on.", color: "#f43f5e" },
  { path: "/insiders", tag: "Form 4", title: "Insider trades", text: "What its directors and top managers bought and sold over the last year.", color: "#16a34a" },
];

export function FilingsGrid({ ticker, company }: { ticker: string; company: string }) {
  const base = `/stock/${encodeURIComponent(ticker)}`;
  return (
    <section id="filings" data-part="Every filing" className="flex scroll-mt-20 flex-col gap-4 rounded-2xl border border-line bg-white px-5 py-6 sm:px-6">
      <div>
        <h2 className="m-0 font-display text-[22px] font-semibold tracking-[-0.03em]">Go deeper: everything {company} files</h2>
        <p className="m-0 text-[14px] text-muted">Each of its SEC filings, turned into plain English with pictures.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {CARDS.map((c) => (
          <Link key={c.path} href={`${base}${c.path}`} className="fathom-lift group flex flex-col gap-1.5 rounded-sm border border-line px-4 py-4 no-underline">
            <span className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: c.color }}>
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[2px]" style={{ background: c.color }} />
              {c.tag}
            </span>
            <span className="font-display text-[17px] font-semibold text-ink">{c.title} →</span>
            <span className="text-[14px] leading-snug text-muted">{c.text}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
