"use client";

/**
 * The front page's headline: "Understand Nike in plain English", with the company
 * swapping every few seconds in the brand blue. Screen readers hear one steady
 * sentence. It stays on the first name for anyone who has asked for less motion.
 */
import { useEffect, useState } from "react";

const NAMES = ["any company", "Nike", "Apple", "Coca-Cola", "Microsoft", "Costco", "Netflix", "Disney"];

export function HeroHeadline() {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % NAMES.length), 2400);
    return () => window.clearInterval(t);
  }, []);

  return (
    <h1 className="max-w-4xl font-display text-[42px] font-semibold leading-[1.04] tracking-[-0.045em] sm:text-[72px]">
      <span className="sr-only">Understand any company in plain English</span>
      <span aria-hidden="true">
        Understand{" "}
        <span className="relative inline-block whitespace-nowrap">
          <span key={i} className="fathom-swap text-ocean">
            {NAMES[i]}
          </span>
        </span>
        <br />
        in plain English
      </span>
    </h1>
  );
}
