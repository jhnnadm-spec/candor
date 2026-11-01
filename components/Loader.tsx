/**
 * cand0r's loading animation: a card floats in front of a slowly turning glow of
 * colour, and its little bar chart rises and falls in a wave while placeholder
 * lines shimmer, as if the answer is being put together. Below it, the steps take
 * turns and a thin line runs along. Pure CSS (keyframes in globals.css), and still
 * for anyone who has asked their device for less motion.
 */
const BARS = [
  { color: "#0c0f14", rest: 0.55 },
  { color: "#2d5bff", rest: 0.8 },
  { color: "#7c5cff", rest: 0.45 },
  { color: "#0ea5a4", rest: 0.95 },
  { color: "#f59e0b", rest: 0.6 },
  { color: "#f43f5e", rest: 0.75 },
];

export function Loader({ label = "Loading…", steps }: { label?: string; steps?: string[] }) {
  const lines = steps && steps.length > 0 ? steps : [label];
  return (
    <div role="status" aria-live="polite" className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-9 px-5">
      <div aria-hidden="true" className="relative h-[170px] w-[230px]">
        {/* A soft, slowly turning ring of colour behind the cards */}
        <span className="candor-aurora absolute inset-[-28px] rounded-full" />
        {/* A second card peeking out behind */}
        <span className="candor-float-slow absolute inset-x-7 top-0 h-[120px] rounded-[22px] border border-line bg-white/70 backdrop-blur" />
        {/* The front card */}
        <div className="candor-float absolute inset-x-0 bottom-0 flex h-[142px] flex-col gap-4 rounded-[24px] border border-line bg-white p-5 shadow-[0_24px_50px_-24px_rgba(12,15,20,0.35)]">
          <div className="flex items-center gap-3">
            <span className="candor-shimmer h-8 w-8 rounded-[30%]" />
            <span className="flex flex-1 flex-col gap-1.5">
              <span className="candor-shimmer h-2.5 w-[70%] rounded-full" />
              <span className="candor-shimmer h-2.5 w-[45%] rounded-full" />
            </span>
          </div>
          <div className="flex flex-1 items-end gap-2">
            {BARS.map((b, i) => (
              <span
                key={b.color}
                className="candor-bar flex-1 rounded-t-[5px] rounded-b-[2px]"
                style={{ background: b.color, animationDelay: `${i * 0.12}s`, transform: `scaleY(${b.rest})` }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex w-full max-w-md flex-col items-center gap-3">
        <p className="relative h-6 w-full text-center text-[16px] font-medium text-ink">
          {lines.map((l, i) => (
            <span
              key={l}
              className={lines.length > 1 ? "fathom-loader-line absolute inset-0" : ""}
              style={lines.length > 1 ? { animationDelay: `${i * 2.4}s`, animationDuration: `${lines.length * 2.4}s` } : undefined}
            >
              {l}
            </span>
          ))}
        </p>
        <span aria-hidden="true" className="relative h-[3px] w-36 overflow-hidden rounded-full bg-panel-2">
          <span className="candor-progress absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-[#2d5bff] to-[#7c5cff]" />
        </span>
      </div>
    </div>
  );
}
