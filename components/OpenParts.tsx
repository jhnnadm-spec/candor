"use client";

/**
 * Which parts of a company page are open. Each part shows its short answer all the
 * time; its full explanation opens underneath, in place, and never replaces anything.
 * The bar at the top of the page reads this to show which parts are open, and can
 * close them all at once.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type OpenState = {
  open: ReadonlySet<string>;
  setOpen: (id: string, on: boolean) => void;
  closeAll: () => void;
};

const OpenContext = createContext<OpenState>({ open: new Set(), setOpen: () => {}, closeAll: () => {} });

export function OpenPartsProvider({ children }: { children: ReactNode }) {
  const [open, setOpenSet] = useState<ReadonlySet<string>>(new Set());
  const setOpen = useCallback((id: string, on: boolean) => {
    setOpenSet((prev) => {
      if (prev.has(id) === on) return prev;
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);
  const closeAll = useCallback(() => setOpenSet(new Set()), []);
  const value = useMemo(() => ({ open, setOpen, closeAll }), [open, setOpen, closeAll]);
  return <OpenContext.Provider value={value}>{children}</OpenContext.Provider>;
}

export function useOpenParts(): OpenState {
  return useContext(OpenContext);
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
