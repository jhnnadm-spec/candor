"use client";

/** The main menu in the header, with the current page marked. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { ACCENTS, accentVars, NAV_ACCENT } from "@/lib/accents";

const LINKS = [
  { href: "/sectors", label: "Browse" },
  { href: "/compare", label: "Compare" },
  { href: "/watchlist", label: "Saved" },
  { href: "/terms", label: "Dictionary" },
];

/** The menu, marking the current page once the address is known (plain links until then). */
export function NavLinks() {
  return (
    <Suspense fallback={<Links path="" />}>
      <Current />
    </Suspense>
  );
}

function Current() {
  return <Links path={usePathname()} />;
}

function Links({ path }: { path: string }) {
  return (
    <nav aria-label="Main" className="flex min-w-0 flex-none items-center gap-0.5 text-[15px] font-semibold sm:gap-1">
      {LINKS.map((l) => {
        const on = path === l.href || path.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={on ? "page" : undefined}
            style={accentVars(ACCENTS[NAV_ACCENT[l.href]])}
            className={`group inline-flex min-h-10 items-center gap-1.5 rounded-full px-2.5 no-underline sm:gap-2 sm:px-3.5 transition-colors ${
              on ? "bg-[var(--a-soft)] text-[var(--a-ink)]" : "text-ink hover:bg-[var(--a-soft)] hover:text-[var(--a-ink)]"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-2 w-2 flex-none rounded-full bg-[var(--a)] transition-transform group-hover:scale-125 ${on ? "scale-125" : ""}`}
            />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** The header's small search box, hidden on the front page, which already has a big one. */
export function HeaderSearch({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <HideOnHome>{children}</HideOnHome>
    </Suspense>
  );
}

function HideOnHome({ children }: { children: React.ReactNode }) {
  return usePathname() === "/" ? null : <>{children}</>;
}
