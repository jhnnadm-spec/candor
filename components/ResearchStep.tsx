"use client";

/**
 * One of the seven questions on a company page. It follows the page-wide detail
 * level (Short, Explained, Everything), and can also show more on its own,
 * right where the reader is.
 */
import { useRef, useState, type ReactNode } from "react";
import { markStep } from "@/lib/client/store";
import { accentVars, stepAccent } from "@/lib/accents";
import { StepIcon } from "./StepIcon";
import { LEVELS, useDepth, type Level } from "./Depth";

export function ResearchStep({
  ticker,
  id,
  number,
  total,
  question,
  brief,
  term,
  surface,
  below,
  deep,
}: {
  ticker: string;
  id: string;
  number: number;
  total: number;
  label?: string;
  question: string; // the plain question this step answers
  brief: string; // one short line on why it matters
  term: ReactNode; // the real finance term, shown as a tag
  art?: ReactNode;
  surface: ReactNode;
  below?: ReactNode;
  deep?: ReactNode;
}) {
  const page = useDepth();
  // A question's own choice lasts until the page-wide level is changed again.
  const [own, setOwn] = useState<{ level: Level; stamp: number } | null>(null);
  const level = own && own.stamp === page.stamp ? own.level : page.level;
  const top = useRef<HTMLElement>(null);

  const bodies: Record<Level, ReactNode> = { surface, below: below ?? surface, deep: deep ?? below ?? surface };
  const i = LEVELS.indexOf(level);
  const next = LEVELS.slice(i + 1).find((l) => (l === "below" ? below : deep));

  function go(to: Level) {
    setOwn({ level: to, stamp: page.stamp });
    if (to !== "surface") markStep(ticker, id, "explored");
    else top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section
      ref={top}
      id={`step-${id}`}
      style={accentVars(stepAccent(id))}
      className="flex scroll-mt-20 flex-col gap-5 border-t border-line pt-10 first:border-t-0 first:pt-4"
      aria-labelledby={`step-${id}-title`}
    >
      <header className="flex gap-4">
        <span className="mt-1">
          <StepIcon id={id} size={48} />
        </span>
        <div className="flex min-w-0 flex-col gap-2">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] font-semibold text-muted">
            <span className="inline-flex items-center gap-2">
              Question {number} of {total}
              {/* Seven little dots, this question's lit up */}
              <span aria-hidden="true" className="inline-flex gap-1">
                {Array.from({ length: total }, (_, k) => (
                  <span key={k} className={`h-1.5 rounded-full transition-all ${k === number - 1 ? "w-4 bg-[var(--a)]" : k < number - 1 ? "w-1.5 bg-[#c5cbd6]" : "w-1.5 bg-line"}`} />
                ))}
              </span>
            </span>
            <span className="font-normal">{term}</span>
          </p>
          <h2 id={`step-${id}-title`} className="font-display text-[26px] font-semibold leading-[1.12] tracking-[-0.03em] sm:text-[32px]">
            {question}
          </h2>
          <p className="text-[17px] leading-relaxed text-muted">{brief}</p>
        </div>
      </header>

      <div key={level} className="fathom-fade flex flex-col gap-6">
        {bodies[level]}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {next && (
          <button
            type="button"
            onClick={() => go(next)}
            className="group inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-[15px] font-semibold text-white transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-ocean active:translate-y-0"
          >
            Tell me more
            <svg className="transition-transform group-hover:translate-y-0.5" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        )}
        {level !== "surface" && (
          <button type="button" onClick={() => go("surface")} className="min-h-11 rounded-full px-4 text-[15px] font-semibold text-muted transition-colors hover:bg-[var(--a-soft)] hover:text-[var(--a-ink)]">
            Show less
          </button>
        )}
      </div>
    </section>
  );
}
