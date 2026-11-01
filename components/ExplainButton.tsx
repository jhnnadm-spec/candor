"use client";

/**
 * Writes the plain-English explanation automatically. When someone opens a company
 * that doesn't have one yet (or whose one is out of date), this asks for it once in
 * the background, shows a slim "being written" line while it works, and reloads the
 * page when it's ready. Nothing to click. If today's free AI allowance or this
 * visitor's daily share is used up, it stays quiet: the company page still shows
 * everything that comes straight from the reports.
 */
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Phase = "idle" | "working" | "queued" | "done-quietly" | "slow";

export function ExplainButton({
  ticker,
  initial,
  update = false,
}: {
  ticker: string;
  initial: "none" | "working" | "queued" | "failed";
  update?: boolean; // an explanation exists but a newer report has been filed
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>(initial === "working" ? "working" : initial === "queued" ? "queued" : "idle");
  const asked = useRef(false);
  const api = `/api/explain/${encodeURIComponent(ticker)}`;

  // Ask once, as soon as the page is open.
  useEffect(() => {
    if ((initial !== "none" && initial !== "failed") || asked.current) return;
    asked.current = true;
    (async () => {
      try {
        const res = await fetch(api, { method: "POST" });
        const { result } = (await res.json()) as { result: string };
        if (result === "claimed" || result === "already-working") setPhase("working");
        else if (result === "already-ready") router.refresh();
        else if (result === "queued") setPhase("queued");
        else setPhase("done-quietly");
      } catch {
        setPhase("done-quietly");
      }
    })();
  }, [initial, api, router]);

  // While it's being written, check every few seconds and reload when it's done.
  useEffect(() => {
    if (phase !== "working") return;
    const started = Date.now();
    const poll = setInterval(async () => {
      if (Date.now() - started > 6 * 60_000) {
        setPhase("slow");
        return;
      }
      try {
        const res = await fetch(api, { cache: "no-store" });
        const { status } = (await res.json()) as { status: string };
        if (status === "ready") router.refresh();
        else if (status === "queued") setPhase("queued");
        else if (status === "failed") setPhase("done-quietly");
      } catch {
        // try again on the next tick
      }
    }, 6_000);
    return () => clearInterval(poll);
  }, [phase, api, router]);

  if (phase !== "working" && phase !== "queued") return null;

  return (
    <p
      aria-live="polite"
      className="flex items-center gap-3 self-start rounded-full border border-line bg-white/80 py-2 pl-3 pr-4 text-[14px] text-muted backdrop-blur"
    >
      {phase === "working" ? (
        <>
          <span aria-hidden="true" className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-ocean" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </span>
          {update ? "Updating the plain-English version from the newest report" : "Writing the plain-English version"} · usually 1 to 3 minutes
        </>
      ) : (
        <>
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
          {update ? "An update from the newest report is on its way" : "The plain-English version is on its way"}, usually within a day
        </>
      )}
    </p>
  );
}
