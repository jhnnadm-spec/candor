"use client";

/**
 * A number that counts up to its value the first time it scrolls into view:
 * "$132.2B", "+15%", "$1.38". Whatever surrounds the number is kept as it is.
 * Still for anyone who has asked their device for less motion.
 */
import { useEffect, useRef, useState } from "react";

const NUMBER = /-?\d[\d,]*(\.\d+)?/;

export function CountUp({ text, duration = 900, className }: { text: string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(text);

  useEffect(() => {
    const m = text.match(NUMBER);
    const el = ref.current;
    if (!m || !el || m.index === undefined) return;
    if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = Number(m[0].replace(/,/g, ""));
    if (!Number.isFinite(target) || target === 0) return;
    const decimals = m[1] ? m[1].length - 1 : 0;
    const commas = m[0].includes(",");
    const before = text.slice(0, m.index);
    const after = text.slice(m.index + m[0].length);
    const format = (v: number) => {
      const fixed = v.toFixed(decimals);
      if (!commas) return fixed;
      const [int, dec] = fixed.split(".");
      return `${Number(int).toLocaleString("en-US")}${dec ? `.${dec}` : ""}`;
    };
    let frame = 0;
    let started = false;
    const run = () => {
      started = true;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setShown(`${before}${format(target * eased)}${after}`);
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (!started && entries.some((e) => e.isIntersecting)) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [text, duration]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      <span aria-hidden="true">{shown}</span>
    </span>
  );
}
