"use client";

/**
 * The front page's headline, on three lines: "Understand / Nike / in plain English".
 * Only the middle line changes, rolling to the next company every few seconds in a
 * different colour, so the rest of the headline never moves. Screen readers hear one
 * steady sentence. It stays on the first name for anyone who has asked for less motion.
 */
import { useEffect, useState } from "react";
import { accentAt } from "@/lib/accents";

const NAMES = ["any company", "Nike", "Apple", "Coca-Cola", "Microsoft", "Costco", "Netflix", "Disney"];

export function HeroHeadline() {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % NAMES.length), 2400);
    return () => window.clearInterval(t);
  }, []);

  return (
    <h1 className="font-display text-[44px] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-[68px] xl:text-[80px]">
      <span className="sr-only">Understand any company in plain English</span>
      <span aria-hidden="true" className="flex flex-col">
        <span>Understand</span>
        {/* a fixed-height window: the name rolls inside it and nothing around it moves */}
        <span className="relative block h-[1.12em] overflow-hidden">
          <span key={i} className="fathom-roll absolute inset-x-0 top-0 whitespace-nowrap" style={{ color: i === 0 ? "#2d5bff" : accentAt(i).ink }}>
            {NAMES[i]}
          </span>
        </span>
        <span>in plain English</span>
      </span>
    </h1>
  );
}
