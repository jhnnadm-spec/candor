/**
 * candor's loading animation, built from the logo: its three flat bars (Short,
 * Explained, Everything) grow out one after another and fall back, over and over,
 * while the steps below take turns. Pure CSS (keyframes in globals.css), and still
 * for anyone who has asked their device for less motion.
 */
import { MARK_BAR_HEIGHT, MARK_BARS, MARK_INK } from "./Logo";

export function Loader({ label = "Loading…", steps }: { label?: string; steps?: string[] }) {
  const lines = steps && steps.length > 0 ? steps : [label];
  return (
    <div role="status" aria-live="polite" className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-8 px-5">
      <div aria-hidden="true" className="relative h-[96px] w-[96px]">
        {MARK_BARS.map((b, i) => (
          <span
            key={b.y}
            className="candor-logo-bar absolute right-0 block"
            style={{
              top: `${b.y}%`,
              height: `${MARK_BAR_HEIGHT}%`,
              width: `${b.width}%`,
              background: MARK_INK,
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>

      <p className="relative h-6 w-full max-w-md text-center text-[16px] font-medium text-ink">
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
    </div>
  );
}
