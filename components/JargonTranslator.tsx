"use client";

/**
 * The front page's interactive card: pick a piece of finance jargon and watch it turn
 * into plain English, word by word. It cycles through the words by itself until
 * someone picks one, then waits for them. Everything comes from cand0r's own
 * dictionary. Still for anyone who has asked for less motion.
 */
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { accentAt } from "@/lib/accents";

export type JargonTerm = { key: string; label: string; term: string; definition: string; why?: string };

const CYCLE_MS = 5200;

const MOTION = "(prefers-reduced-motion: reduce)";
function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(MOTION);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(MOTION).matches,
    () => false,
  );
}

export function JargonTranslator({ terms }: { terms: JargonTerm[] }) {
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState<{ i: number; n: number }>({ i: -1, n: 0 });
  const [auto, setAuto] = useState(true);
  const still = useReducedMotion();
  const idle = useRef<number | undefined>(undefined);
  const t = terms[i];
  const parts = t.definition.split(" ");
  const accent = accentAt(i);

  // Type the definition out, a word at a time.
  useEffect(() => {
    if (still) return;
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      setTyped({ i, n });
      if (n >= parts.length) window.clearInterval(id);
    }, 55);
    return () => window.clearInterval(id);
  }, [i, still, parts.length]);
  const words = still ? parts.length : typed.i === i ? typed.n : 0;

  // Move on to the next word by itself, until someone picks one.
  useEffect(() => {
    if (!auto || still) return;
    const id = window.setTimeout(() => setI((n) => (n + 1) % terms.length), CYCLE_MS);
    return () => window.clearTimeout(id);
  }, [i, auto, still, terms.length]);

  function pick(n: number) {
    setI(n);
    setAuto(false);
    window.clearTimeout(idle.current);
    idle.current = window.setTimeout(() => setAuto(true), 15000); // pick up again after a quiet spell
  }

  return (
    <div className="relative w-full">
      {/* a soft glow in this word's colour */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[48px] opacity-60 blur-3xl transition-colors duration-700"
        style={{ background: `radial-gradient(60% 60% at 70% 30%, ${accent.soft}, transparent 70%)` }}
      />
      <div className="flex flex-col gap-5 rounded-[28px] border border-line bg-white/90 p-5 shadow-[0_40px_80px_-48px_rgba(12,15,20,0.45)] backdrop-blur sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">
            <span aria-hidden="true" className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:hidden" style={{ background: accent.solid }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: accent.solid }} />
            </span>
            Finance, translated
          </span>
          <span className="text-[13px] text-muted">Tap a word</span>
        </div>

        <div role="group" aria-label="Finance words" className="flex flex-wrap gap-2">
          {terms.map((x, n) => {
            const on = n === i;
            const a = accentAt(n);
            return (
              <button
                key={x.key}
                type="button"
                onClick={() => pick(n)}
                aria-pressed={on}
                className="rounded-full border px-3 py-1.5 font-mono text-[13px] transition-[background-color,border-color,color,transform] duration-200 hover:-translate-y-0.5"
                style={on ? { background: a.ink, borderColor: a.ink, color: "#fff" } : { background: "#fff", borderColor: "#e7e9ee", color: "#0c0f14" }}
              >
                {x.label}
              </button>
            );
          })}
        </div>

        <div className="relative min-h-[212px] overflow-hidden rounded-2xl p-5 sm:p-6" style={{ background: accent.soft }} aria-live="polite">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[15px] text-muted line-through decoration-[1.5px]">{t.label}</span>
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accent.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
            <span className="text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: accent.ink }}>
              In plain English
            </span>
          </div>
          <p className="mt-3 font-display text-[22px] font-semibold leading-[1.3] tracking-[-0.02em] text-ink sm:text-[26px]">
            {parts.map((w, n) => (
              <span key={`${i}-${n}`} className="transition-opacity duration-300" style={{ opacity: n < words ? 1 : 0 }}>
                {w}{" "}
              </span>
            ))}
          </p>
          {t.why && (
            <p className="mt-3 text-[15px] leading-relaxed text-ink/75 transition-opacity duration-500" style={{ opacity: words >= parts.length ? 1 : 0 }}>
              <strong className="font-semibold text-ink">Why it matters: </strong>
              {t.why}
            </p>
          )}
          {/* how long until the next word */}
          {auto && !still && (
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] bg-black/5">
              <span key={i} className="block h-full origin-left" style={{ background: accent.solid, animation: `candor-countdown ${CYCLE_MS}ms linear forwards` }} />
            </span>
          )}
        </div>

        <Link href={`/terms#${t.key}`} className="self-start text-[14px] font-semibold no-underline hover:underline">
          See {t.term} in the dictionary →
        </Link>
      </div>
    </div>
  );
}
