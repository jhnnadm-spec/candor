/**
 * Recent headlines about a company from major publishers, as a short list of links,
 * plus links to search each publisher for more. Headlines come from the GDELT news index.
 */
import { getHeadlines, searchLinks, type Headline } from "@/lib/news/headlines";

function when(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export async function CompanyNews({ name, ticker }: { name: string; ticker: string }) {
  const headlines: Headline[] = await getHeadlines(name, ticker).catch(() => []);
  const more = searchLinks(name, ticker);
  return (
    <div className="flex flex-col gap-3">
      {headlines.length > 0 ? (
        <ol className="m-0 flex list-none flex-col p-0">
          {headlines.slice(0, 6).map((h) => (
            <li key={h.url} className="border-t border-line py-2 first:border-t-0 first:pt-0">
              <a href={h.url} target="_blank" rel="noopener noreferrer" className="group flex flex-col gap-0.5 no-underline">
                <span className="text-[13.5px] font-medium leading-snug text-ink group-hover:underline">{h.title}</span>
                <span className="text-[12px] text-muted">
                  {h.source} · {when(h.date)}
                </span>
              </a>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-[13px] leading-snug text-muted">No recent headlines found from the publishers candor checks. Search them directly:</p>
      )}
      <div className="flex flex-col gap-1.5 border-t border-line pt-2.5">
        <span className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted">Search for more</span>
        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {more.map((m) => (
            <li key={m.name}>
              <a href={m.url} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-sm border border-line px-2.5 py-1 text-[12px] font-medium text-ink no-underline transition-colors hover:border-ink/40">
                {m.name}
              </a>
            </li>
          ))}
        </ul>
        <span className="text-[11px] leading-snug text-muted">Headlines via the GDELT Project. Some publishers need a subscription.</span>
      </div>
    </div>
  );
}

export function CompanyNewsLoading() {
  return (
    <div className="flex flex-col gap-2.5" aria-label="Loading headlines">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="candor-shimmer block h-9 rounded-md" />
      ))}
    </div>
  );
}
