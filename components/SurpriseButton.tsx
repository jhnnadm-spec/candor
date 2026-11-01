"use client";

/** "Surprise me": opens a random big company, for when nothing comes to mind. */
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SurpriseButton({ tickers }: { tickers: string[] }) {
  const router = useRouter();
  const [spinning, setSpinning] = useState(false);
  if (tickers.length === 0) return null;

  function go() {
    const pick = tickers[Math.floor(Math.random() * tickers.length)];
    setSpinning(true);
    router.push(`/stock/${encodeURIComponent(pick)}`);
  }

  return (
    <button
      type="button"
      onClick={go}
      className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-[#f3c9e9] bg-gradient-to-r from-[#fff4dc] via-[#fde9f1] to-[#efeafe] px-4 text-[15px] font-semibold text-[#5434c0] transition-transform hover:-translate-y-0.5 active:translate-y-0"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={`transition-transform duration-500 group-hover:rotate-180 ${spinning ? "animate-spin" : ""}`}
      >
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" />
        <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      </svg>
      {spinning ? "Picking one…" : "Surprise me"}
    </button>
  );
}
