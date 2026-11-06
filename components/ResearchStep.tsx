"use client";

/**
 * One part of a company page. The short answer is always there. Underneath it, one
 * button opens the full explanation in place: it slides open below the short answer,
 * wears the part's colour down its left edge with a clear "open" label, and closes from
 * the top or the bottom. Nothing above it changes, so it's always clear what's open.
 */
import { useRef, useState, type ReactNode } from "react";
import { markStep } from "@/lib/client/store";
import { accentVars, stepAccent } from "@/lib/accents";
import { StepIcon } from "./StepIcon";
import { useOpenParts } from "./OpenParts";

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
  full,
  inside,
}: {
  ticker: string;
  id: string;
  number: number;
  total: number;
  label?: string;
  question: string; // the plain question this part answers
  brief: string; // one short line on why it matters
  term: ReactNode; // the real finance term, shown as a tag
  surface: ReactNode; // the short answer
  full?: ReactNode; // the full explanation
  inside?: string; // what the full explanation holds, in a few words
}) {
  const { open, setOpen } = useOpenParts();
  const isOpen = open.has(id);
  // Built the first time it's opened, then kept, so closing can slide shut smoothly.
  const [built, setBuilt] = useState(false);
  const top = useRef<HTMLElement>(null);
  const drawer = useRef<HTMLDivElement>(null);
  const accent = stepAccent(id);
  const buttonBg = accent.solid === "#f59e0b" ? accent.ink : accent.solid;

  function toggle(fromBottom = false) {
    const next = !isOpen;
    setOpen(id, next);
    if (next) {
      setBuilt(true);
      markStep(ticker, id, "explored");
      // Bring the start of the explanation into view if it opens below the screen.
      window.setTimeout(() => {
        const box = drawer.current?.getBoundingClientRect();
        if (box && box.top > window.innerHeight - 120) drawer.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    } else if (fromBottom || (top.current && top.current.getBoundingClientRect().top < 0)) {
      top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <section
      ref={top}
      id={`step-${id}`}
      data-part={label ?? question}
      style={accentVars(accent)}
      className="candor-reveal scroll-mt-24 overflow-hidden rounded-2xl border border-line bg-white"
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

      {/* The short answer: always shown */}
      <div className="flex flex-col gap-3 px-5 pb-5 pt-4 sm:px-6">
        <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">The short answer</p>
        {surface}
      </div>

      {full && (
        <>
          {/* The one button that opens or closes the full explanation */}
          <div className="px-5 pb-5 sm:px-6">
            <button
              type="button"
              onClick={() => toggle()}
              aria-expanded={isOpen}
              aria-controls={`step-${id}-full`}
              className="group flex w-full items-center gap-3 rounded-sm border px-4 py-3 text-left transition-[background-color,border-color,box-shadow] duration-200"
              style={isOpen ? { background: accent.soft, borderColor: accent.solid } : { borderColor: "var(--color-line)" }}
            >
              <span
                aria-hidden="true"
                className="flex h-8 w-8 flex-none items-center justify-center rounded-sm text-white transition-transform duration-300"
                style={{ background: buttonBg, transform: isOpen ? "rotate(180deg)" : undefined }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[15.5px] font-semibold text-ink">{isOpen ? "Hide the full explanation" : "Show the full explanation"}</span>
                {inside && <span className="text-[13px] text-muted">{inside}</span>}
              </span>
              <span
                className="flex-none rounded-sm px-2 py-0.5 text-[11.5px] font-semibold uppercase tracking-wide"
                style={isOpen ? { background: buttonBg, color: "#fff" } : { background: "var(--color-panel-2)", color: "var(--color-muted)" }}
              >
                {isOpen ? "Open" : "Closed"}
              </span>
            </button>
          </div>

          {/* The full explanation, sliding open underneath */}
          <div
            id={`step-${id}-full`}
            ref={drawer}
            role="region"
            aria-label={`Full explanation: ${label ?? question}`}
            className="grid scroll-mt-24 transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
          >
            <div className="min-h-0 overflow-hidden" inert={!isOpen}>
              {(built || isOpen) && (
                <div className="mx-5 mb-5 border-l-[3px] pl-4 sm:mx-6 sm:pl-5" style={{ borderColor: accent.solid }}>
                  <p className="m-0 mb-4 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: accent.ink }}>
                    <span aria-hidden="true" className="h-2 w-2 rounded-[2px]" style={{ background: accent.solid }} />
                    Full explanation: {label ?? question}
                  </p>
                  <div className={`flex flex-col gap-6 ${isOpen ? "candor-drawer-in" : ""}`}>{full}</div>
                  <button
                    type="button"
                    onClick={() => toggle(true)}
                    className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-sm px-4 text-[14px] font-semibold text-white transition-[filter] hover:brightness-110"
                    style={{ background: buttonBg }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m18 15-6-6-6 6" />
                    </svg>
                    Close and go back to the short answer
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
