"use client";

/** A folded panel whose contents are only built once it's opened, so heavy widgets don't load until wanted. */
import { useState, type ReactNode } from "react";

export function Unfold({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex min-h-10 w-full items-center justify-between gap-3 text-left">
        <span className="flex flex-col">
          <span className="text-[14px] font-semibold">{title}</span>
          {note && <span className="text-[12px] leading-snug text-muted">{note}</span>}
        </span>
        <svg className={`flex-none transition-transform ${open ? "rotate-180" : ""}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && <div className="pt-3">{children}</div>}
    </div>
  );
}
