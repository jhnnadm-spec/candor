/**
 * A small drawing for each "How it works" step on the front page, on a soft tile in
 * its own colour. They move a little when the step is pointed at. Decoration only.
 */
import { accentVars, ACCENTS } from "@/lib/accents";

export function HowArt({ step }: { step: 1 | 2 | 3 }) {
  const accent = step === 1 ? ACCENTS.blue : step === 2 ? ACCENTS.teal : ACCENTS.violet;
  return (
    <div
      aria-hidden="true"
      style={accentVars(accent)}
      className="relative flex h-[132px] items-center justify-center overflow-hidden rounded-xl bg-[var(--a-soft)]"
    >
      {step === 1 && (
        // A search box with a name being typed
        <div className="flex w-[78%] items-center gap-2.5 rounded-sm border border-[color-mix(in_srgb,var(--a)_25%,white)] bg-white px-3.5 py-2.5 transition-transform duration-300 group-hover:-translate-y-1">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="text-[var(--a-ink)]">
            <circle cx="11" cy="11" r="7" />
            <path d="m16.5 16.5 4 4" />
          </svg>
          <span className="text-[14px] font-medium text-ink">Nike</span>
          <span className="candor-caret -ml-1.5 h-4 w-px bg-ink" />
          <span className="ml-auto rounded-sm bg-ink px-2.5 py-0.5 text-[11px] font-semibold text-white">Go</span>
        </div>
      )}
      {step === 2 && (
        // Two short answer cards, one with a little chart
        <div className="relative h-[92px] w-[78%]">
          <div className="absolute left-0 top-0 flex w-[62%] flex-col gap-1.5 rounded-xl border border-line bg-white p-3 transition-transform duration-300 group-hover:-translate-y-1 group-hover:-rotate-2">
            <span className="h-1.5 w-[90%] rounded-sm bg-panel-2" />
            <span className="h-1.5 w-[70%] rounded-sm bg-panel-2" />
            <span className="h-1.5 w-[80%] rounded-sm bg-panel-2" />
          </div>
          <div className="absolute bottom-0 right-0 flex h-[64px] w-[52%] items-end gap-1.5 rounded-xl border border-line bg-white p-3 transition-transform duration-300 group-hover:translate-y-0.5 group-hover:rotate-2">
            {[40, 58, 50, 82].map((h, i) => (
              <span key={h} className="flex-1 rounded-t-[1px]" style={{ height: `${h}%`, background: i === 3 ? "var(--a)" : "color-mix(in srgb, var(--a) 28%, white)" }} />
            ))}
          </div>
        </div>
      )}
      {step === 3 && (
        // A "Tell me more" button opening up more lines underneath
        <div className="flex w-[74%] flex-col items-start gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-ink px-3 py-1.5 text-[12px] font-semibold text-white">
            Tell me more
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:rotate-180">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
          <span className="flex w-full flex-col gap-1.5 rounded-xl border border-line bg-white p-3">
            <span className="h-1.5 w-[85%] rounded-sm bg-[color-mix(in_srgb,var(--a)_30%,white)]" />
            <span className="h-1.5 w-[65%] rounded-sm bg-panel-2" />
            <span className="h-1.5 w-0 rounded-sm bg-panel-2 transition-[width] duration-500 group-hover:w-[75%]" />
            <span className="h-1.5 w-0 rounded-sm bg-panel-2 transition-[width] delay-100 duration-500 group-hover:w-[55%]" />
          </span>
        </div>
      )}
    </div>
  );
}
