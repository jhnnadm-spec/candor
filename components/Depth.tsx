"use client";

/**
 * How much detail the reader wants, for the whole company page:
 *   Short:      the quick answer and a picture.
 *   Explained:  each answer explained, with the main numbers.
 *   Everything: every detail, with what people usually check and the reports' own words.
 * Each question can still show more on its own; changing the page-wide level resets them.
 * The choice is remembered in this browser only.
 * (In the code the levels keep their older names: surface, below and deep.)
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Level = "surface" | "below" | "deep";
export const LEVELS: Level[] = ["surface", "below", "deep"];

export const LEVEL_INFO: Record<Level, { name: string; hint: string }> = {
  surface: { name: "Short", hint: "The quick answer" },
  below: { name: "Explained", hint: "With the numbers" },
  deep: { name: "Everything", hint: "Every detail" },
};

const KEY = "fathom:depth";

type DepthState = { level: Level; setLevel: (l: Level) => void; stamp: number };
const DepthContext = createContext<DepthState>({ level: "surface", setLevel: () => {}, stamp: 0 });

export function DepthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ level: Level; stamp: number }>({ level: "surface", stamp: 0 });

  // Pick up the reader's last choice once the page is in the browser.
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(KEY);
    } catch {
      // storage blocked: start with the short answers
    }
    if (saved === "below" || saved === "deep") {
      const level = saved;
      queueMicrotask(() => setState((s) => ({ level, stamp: s.stamp + 1 })));
    }
  }, []);

  const setLevel = (level: Level) => {
    setState((s) => ({ level, stamp: s.stamp + 1 }));
    try {
      window.localStorage.setItem(KEY, level);
    } catch {
      // not remembered next time; that's fine
    }
  };

  return <DepthContext.Provider value={{ ...state, setLevel }}>{children}</DepthContext.Provider>;
}

export function useDepth(): DepthState {
  return useContext(DepthContext);
}

/** Show something only at some depths: from `min` down, up to `max`, or at exactly `only`. */
export function AtDepth({ min, max, only, children }: { min?: Level; max?: Level; only?: Level; children: ReactNode }) {
  const { level } = useDepth();
  const i = LEVELS.indexOf(level);
  if (only && level !== only) return null;
  if (min && i < LEVELS.indexOf(min)) return null;
  if (max && i > LEVELS.indexOf(max)) return null;
  return <>{children}</>;
}

/** The sliding pill: ink for the first two levels, brand blue for "Everything". */
const LEVEL_COLOR: Record<Level, string> = {
  surface: "#0c0f14",
  below: "#0c0f14",
  deep: "#2d5bff",
};

/** Three buttons in a row: Short, Explained, Everything, with a coloured pill sliding to the chosen one. */
export function DepthSwitch() {
  const { level, setLevel } = useDepth();
  const i = LEVELS.indexOf(level);
  return (
    <div role="radiogroup" aria-label="How much detail to show" className="relative grid grid-cols-3 gap-1 rounded-full bg-panel-2 p-1">
      <span
        aria-hidden="true"
        className="absolute bottom-1 top-1 left-1 rounded-full shadow-[0_4px_10px_-4px_rgba(12,15,20,0.45)] transition-[transform,background] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{ width: "calc((100% - 0.5rem - 0.5rem) / 3)", transform: `translateX(calc(${i * 100}% + ${i * 0.25}rem))`, background: LEVEL_COLOR[level] }}
      />
      {LEVELS.map((l) => {
        const on = l === level;
        return (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={on}
            title={LEVEL_INFO[l].hint}
            onClick={() => setLevel(l)}
            className={`relative min-h-9 rounded-full px-2 text-[14px] font-semibold transition-colors ${on ? "text-white" : "text-muted hover:text-ink"}`}
          >
            {LEVEL_INFO[l].name}
          </button>
        );
      })}
    </div>
  );
}

/** How far down the page the reader is, from 0 to 1. */
function useReadProgress(): number {
  const [p, setP] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setP(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
  return p;
}

/**
 * A slim bar that stays at the top of a company page while reading, holding the detail
 * switch, with a blue line along its bottom edge that fills as the reader scrolls.
 */
export function DetailBar() {
  const { level } = useDepth();
  const progress = useReadProgress();
  return (
    <div className="sticky top-0 z-20 -mx-5 border-b border-line bg-white/90 px-5 py-2.5 backdrop-blur-xl sm:mx-0 sm:rounded-b-2xl sm:px-4">
      <div className="mx-auto flex max-w-[760px] items-center justify-between gap-3">
        <span className="hidden text-[14px] font-semibold text-muted sm:block">
          How much detail? <span className="font-normal">{LEVEL_INFO[level].hint}</span>
        </span>
        <div className="w-full sm:w-[300px]">
          <DepthSwitch />
        </div>
      </div>
      <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-[3px] overflow-hidden sm:rounded-b-2xl">
        <span
          className="block h-full origin-left bg-ocean"
          style={{ transform: `scaleX(${progress})` }}
        />
      </span>
    </div>
  );
}
