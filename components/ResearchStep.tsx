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
  label,
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

  const accent = stepAccent(id);
  return (
    <section
      ref={top}
      id={`step-${id}`}
      data-part={label ?? question}
      style={accentVars(accent)}
      className="scroll-mt-20 overflow-hidden rounded-2xl border border-line bg-white"
      aria-labelledby={`step-${id}-title`}
    >
      <header className="flex gap-4 border-b border-line px-5 py-5 sm:px-6" style={{ background: accent.soft }}>
        <StepIcon id={id} size={44} />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] font-semibold" style={{ color: accent.ink }}>
            <span>
              Part {number} of {total}
              {label ? ` · ${label}` : ""}
            </span>
            <span className="font-normal text-muted">{term}</span>
          </p>
          <h2 id={`step-${id}-title`} className="font-display text-[24px] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[28px]">
            {question}
          </h2>
          <p className="text-[15.5px] leading-relaxed text-muted">{brief}</p>
        </div>
      </header>

      <div key={level} className="fathom-fade flex flex-col gap-6 px-5 py-5 sm:px-6">
        {bodies[level]}
      </div>

      {(next || level !== "surface") && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3 sm:px-6">
          {next && (
            <button
              type="button"
              onClick={() => go(next)}
              className="group inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-[14px] font-semibold text-white transition-[filter] hover:brightness-110"
              style={{ background: accent.solid === "#f59e0b" ? accent.ink : accent.solid }}
            >
              {next === "below" ? "Explain it with the numbers" : "Show every detail"}
              <svg className="transition-transform group-hover:translate-y-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          )}
          {level !== "surface" && (
            <button type="button" onClick={() => go("surface")} className="min-h-10 rounded-full px-4 text-[14px] font-semibold text-muted transition-colors hover:bg-[var(--a-soft)] hover:text-[var(--a-ink)]">
              Back to the short answer
            </button>
          )}
        </div>
      )}
    </section>
  );
}
