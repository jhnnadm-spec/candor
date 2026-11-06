"use client";

/**
 * The bar that stays at the top of a company page: every section in order, the one
 * being read highlighted, a small "open" mark on parts whose full explanation is open,
 * and a button to close them all. A thin line along its bottom fills as the reader scrolls.
 */
import { useEffect, useRef, useState } from "react";
import { useOpenParts, useReadProgress } from "./OpenParts";

export type NavItem = { id: string; label: string; number?: number; color?: string };

export function PageNav({ items }: { items: NavItem[] }) {
  const [current, setCurrent] = useState(items[0]?.id);
  const progress = useReadProgress();
  const { open, closeAll } = useOpenParts();
  const list = useRef<HTMLOListElement>(null);

  // The section being read: the last one whose top has passed just under the bar.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let pick = items[0]?.id;
      for (const it of items) {
        const el = document.getElementById(it.id);
        if (el && el.getBoundingClientRect().top <= 140) pick = it.id;
      }
      setCurrent(pick);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [items]);

  // Keep the highlighted section in view inside the bar on narrow screens.
  useEffect(() => {
    const el = list.current?.querySelector<HTMLElement>(`[data-nav="${current}"]`);
    const box = list.current;
    if (!el || !box) return;
    const left = el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2;
    box.scrollTo({ left, behavior: "smooth" });
  }, [current]);

  return (
    <nav aria-label="Sections of this page" className="sticky top-2 z-20 overflow-hidden rounded-2xl border border-line bg-white px-2">
      <div className="flex items-center gap-4 py-1.5">
        <ol ref={list} className="m-0 flex min-w-0 flex-1 list-none gap-1 overflow-x-auto p-0 [scrollbar-width:none]">
          {items.map((it) => {
            const on = it.id === current;
            return (
              <li key={it.id} className="flex-none">
                <a
                  href={`#${it.id}`}
                  data-nav={it.id}
                  aria-current={on ? "location" : undefined}
                  className={`flex min-h-9 items-center gap-1.5 rounded-sm px-3 text-[13px] font-semibold no-underline transition-colors ${on ? "text-white" : "text-muted hover:bg-panel-2 hover:text-ink"}`}
                  style={on ? { background: it.color ?? "var(--color-ink)" } : undefined}
                >
                  {it.number !== undefined && (
                    <span
                      aria-hidden="true"
                      className="flex h-[18px] w-[18px] items-center justify-center rounded-sm text-[10.5px] font-bold"
                      style={on ? { background: "rgba(255,255,255,0.25)", color: "#fff" } : { background: it.color, color: "#fff" }}
                    >
                      {it.number}
                    </span>
                  )}
                  {it.label}
                  {open.has(it.id.replace(/^step-/, "")) && (
                    <span className={`rounded-sm px-1 text-[10px] font-bold uppercase tracking-wide ${on ? "bg-white/25 text-white" : "bg-ink text-white"}`} title="Its full explanation is open">
                      open
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ol>
        {open.size > 0 && (
          <button
            type="button"
            onClick={closeAll}
            className="flex min-h-9 flex-none items-center gap-1.5 rounded-sm bg-panel-2 px-3 text-[13px] font-semibold text-ink transition-colors hover:bg-surface"
          >
            <span className="tabular-nums">{open.size} open</span>
            <span className="text-muted">· Close all</span>
          </button>
        )}
      </div>
      <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-[2px]">
        <span className="block h-full origin-left bg-ocean" style={{ transform: `scaleX(${progress})` }} />
      </span>
    </nav>
  );
}
