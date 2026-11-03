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
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

export type Level = "surface" | "below" | "deep";
export const LEVELS: Level[] = ["surface", "below", "deep"];

export const LEVEL_INFO: Record<Level, { name: string; hint: string }> = {
  surface: { name: "Short", hint: "The quick answer" },
  below: { name: "Explained", hint: "With the numbers" },
  deep: { name: "Everything", hint: "Every detail" },
};

const KEY = "fathom:depth";

type Notice = { level: Level; part?: string; n: number };
type DepthState = { level: Level; setLevel: (l: Level) => void; stamp: number; notice?: Notice };
const DepthContext = createContext<DepthState>({ level: "surface", setLevel: () => {}, stamp: 0 });

/** The part of the page the reader is in right now: the last part whose top has scrolled past the bar. */
function currentPart(): HTMLElement | undefined {
  const parts = [...document.querySelectorAll<HTMLElement>("[data-part]")];
  let pick: HTMLElement | undefined;
  for (const el of parts) {
    if (el.getBoundingClientRect().top <= 180) pick = el;
    else break;
  }
  return pick ?? parts.find((el) => el.getBoundingClientRect().bottom > 0);
}

export function DepthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ level: Level; stamp: number }>({ level: "surface", stamp: 0 });
  const [notice, setNotice] = useState<Notice>();
  // Where the reader was, so the page can keep them there when the detail changes.
  const anchor = useRef<{ id: string; top: number } | null>(null);

  useLayoutEffect(() => {
    const a = anchor.current;
    anchor.current = null;
    if (!a) return;
    const el = document.getElementById(a.id);
    if (!el) return;
    const delta = el.getBoundingClientRect().top - a.top;
    if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: "instant" as ScrollBehavior });
    el.classList.remove("part-flash");
    void el.offsetWidth; // restart the highlight
    el.classList.add("part-flash");
  }, [state.stamp]);

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
    const part = currentPart();
    anchor.current = part ? { id: part.id, top: part.getBoundingClientRect().top } : null;
    setNotice((n) => ({ level, part: part?.dataset.part, n: (n?.n ?? 0) + 1 }));
    setState((s) => ({ level, stamp: s.stamp + 1 }));
    try {
      window.localStorage.setItem(KEY, level);
    } catch {
      // not remembered next time; that's fine
    }
  };

  return <DepthContext.Provider value={{ ...state, setLevel, notice }}>{children}</DepthContext.Provider>;
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

/**
 * Each level has its own colour (blue, teal, amber, from shortest to longest) and a small
 * bar as long as its bar in the logo, with text dark or white so it stays easy to read.
 */
const LEVEL_COLOR: Record<Level, { bg: string; text: string; hint: string; bar: number }> = {
  surface: { bg: "#2D5BFF", text: "#FFFFFF", hint: "rgba(255,255,255,0.8)", bar: 8 },
  below: { bg: "#0EA5A4", text: "#0C0F14", hint: "rgba(12,15,20,0.72)", bar: 13 },
  deep: { bg: "#F59E0B", text: "#0C0F14", hint: "rgba(12,15,20,0.72)", bar: 18 },
};

/** Three buttons in a row: Short, Explained, Everything, with a coloured pill sliding to the chosen one. */
export function DepthSwitch({ compact = false }: { compact?: boolean }) {
  const { level, setLevel } = useDepth();
  const i = LEVELS.indexOf(level);
  return (
    <div role="radiogroup" aria-label="How much detail to show" className="relative grid grid-cols-3 gap-1 rounded-sm bg-panel-2 p-1">
      <span
        aria-hidden="true"
        className="absolute bottom-1 top-1 left-1 rounded-sm transition-[transform,background] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{ width: "calc((100% - 0.5rem - 0.5rem) / 3)", transform: `translateX(calc(${i * 100}% + ${i * 0.25}rem))`, background: LEVEL_COLOR[level].bg }}
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
            className={`relative flex ${compact ? "min-h-9 px-1" : "min-h-11 px-2"} flex-col items-center justify-center rounded-sm leading-tight transition-colors ${on ? "" : "text-muted hover:text-ink"}`}
            style={on ? { color: LEVEL_COLOR[l].text } : undefined}
          >
            <span className={`flex items-center ${compact ? "gap-1 text-[13px]" : "gap-1.5 text-[14px]"} font-semibold`}>
              {/* A small bar as long as this level's bar in the logo */}
              <span aria-hidden="true" className="h-[5px] flex-none" style={{ width: compact ? Math.round(LEVEL_COLOR[l].bar * 0.65) : LEVEL_COLOR[l].bar, background: on ? "currentColor" : LEVEL_COLOR[l].bg }} />
              {LEVEL_INFO[l].name}
            </span>
            {!compact && (
              <span className="hidden text-[11px] sm:block" style={{ color: on ? LEVEL_COLOR[l].hint : undefined }}>
                {LEVEL_INFO[l].hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** How far down the page the reader is, from 0 to 1. */
export function useReadProgress(): number {
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
