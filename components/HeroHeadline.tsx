"use client";

/**
 * The front page's headline: "Understand Nike in plain English", with the company
 * swapping every few seconds, each in its own colour. Screen readers hear one steady
 * sentence. It stays on the first name for anyone who has asked for less motion.
 */
import { useEffect, useState } from "react";
import { accentAt, accentVars } from "@/lib/accents";

const NAMES = ["any company", "Nike", "Apple", "Coca-Cola", "Microsoft", "Costco", "Netflix", "Disney"];

export function HeroHeadline() {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % NAMES.length), 2400);
    return () => window.clearInterval(t);
  }, []);

  const a = accentAt(i);
  return (
    <h1 className="max-w-4xl font-display text-[40px] font-bold leading-[1.08] tracking-tight sm:text-[64px]">
      <span className="sr-only">Understand any company in plain English</span>
      <span aria-hidden="true">
        Understand{" "}
        <span className="relative inline-block whitespace-nowrap" style={accentVars(a)}>
          <span key={i} className="fathom-swap text-[var(--a-ink)]">
            {NAMES[i]}
          </span>
          <span className="absolute inset-x-0 -bottom-1 h-[0.14em] rounded-full bg-[var(--a)] opacity-70 transition-colors duration-500" />
        </span>
        <br />
        in <span className="fathom-rainbow">plain English</span>
      </span>
    </h1>
  );
}
