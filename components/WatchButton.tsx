"use client";

import { useEffect, useState } from "react";
import { isWatched, STORE_EVENT, toggleWatch } from "@/lib/client/store";

/** Save or remove a company from the watchlist kept in this browser. */
export function WatchButton({ ticker, name }: { ticker: string; name: string }) {
  const [on, setOn] = useState<boolean | null>(null);
  useEffect(() => {
    const sync = () => setOn(isWatched(ticker));
    sync();
    window.addEventListener(STORE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STORE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [ticker]);

  return (
    <button
      type="button"
      onClick={() => setOn(toggleWatch(ticker, name))}
      aria-pressed={on ?? false}
      className={`group inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[15px] font-semibold transition-[background-color,border-color,transform] active:scale-[0.97] ${
        on
          ? "bg-gradient-to-r from-[#ffb23e] to-[#ff6f59] text-[#3d1b00] shadow-[0_8px_18px_-10px_#ff6f59]"
          : "border border-[#ffd99a] bg-white text-[#8a4f00] hover:bg-[#fff4dc]"
      }`}
    >
      <svg key={on ? "on" : "off"} className={on ? "fathom-icon-pop" : "transition-transform group-hover:rotate-12 group-hover:scale-110 motion-reduce:transition-none"} width="17" height="17" viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
        <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3z" />
      </svg>
      {on ? "Saved" : "Save"}
    </button>
  );
}
