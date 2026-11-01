"use client";

/**
 * The company at a glance: its main figures in four columns (sales and profit, cash,
 * what it owns and owes, what it means for owners), with arrows for the sums that
 * link them. The panel beside it works each sum out with the company's own numbers.
 *
 * How it responds:
 *  - Pointing at a box shows that box and its links.
 *  - Clicking a box keeps it in place: pointing at other boxes changes nothing, so the
 *    reader can move to the panel freely. Clicking another box switches to that one.
 *  - Clicking anywhere else on the page (or pressing Escape) lets go, and pointing at
 *    boxes works again.
 * On phones the boxes become a list of tappable chips above the same panel.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { GROUPS, MAP_COLUMNS, type MapNode, type WorkedLink } from "@/lib/report/concept-map";

const W = 860;
const COL_W = W / MAP_COLUMNS.length;
const BOX_W = 176;
const BOX_H = 58;
const TOP = 12;
const ROW = 80;

type Placed = MapNode & { cx: number; cy: number };

function place(nodes: MapNode[]): { placed: Placed[]; height: number } {
  const placed = nodes.map((n) => ({ ...n, cx: n.x * COL_W + COL_W / 2, cy: TOP + BOX_H / 2 + n.y * ROW }));
  const rows = Math.max(1, ...nodes.map((n) => n.y + 1));
  return { placed, height: TOP * 2 + BOX_H + (rows - 1) * ROW };
}

/** A smooth arrow between two boxes: across columns it runs edge to edge; within a column it bows out to the right. */
function arrow(a: Placed, b: Placed): string {
  if (a.x === b.x) {
    const x = a.cx + BOX_W / 2;
    const bow = 22 + Math.abs(b.y - a.y) * 6;
    return `M${x},${a.cy} C${x + bow},${a.cy} ${x + bow},${b.cy} ${x + 4},${b.cy}`;
  }
  const right = a.x < b.x;
  const x1 = a.cx + (right ? BOX_W / 2 : -BOX_W / 2);
  const x2 = b.cx + (right ? -BOX_W / 2 - 4 : BOX_W / 2 + 4);
  const dx = (x2 - x1) * 0.5;
  return `M${x1},${a.cy} C${x1 + dx},${a.cy} ${x2 - dx},${b.cy} ${x2},${b.cy}`;
}

export function KeyMap({
  nodes,
  links,
  company,
  stepTitles,
}: {
  nodes: MapNode[];
  links: WorkedLink[];
  company: string;
  stepTitles: Record<string, string>;
}) {
  const { placed, height } = useMemo(() => place(nodes), [nodes]);
  const byId = useMemo(() => new Map(placed.map((n) => [n.id, n])), [placed]);
  const [hover, setHover] = useState<string>(placed[0]?.id ?? "revenue");
  const [locked, setLocked] = useState<string | null>(null);
  // Which link's written explanation is open: the first one, unless the reader picks another.
  const [opened, setOpened] = useState<{ node: string; link: string } | null>(null);
  const section = useRef<HTMLElement>(null);
  const focus = locked ?? hover;
  const sel = byId.get(focus) ?? placed[0];

  // Once a box is kept in place, a click anywhere outside the boxes and the panel lets it go.
  useEffect(() => {
    if (!locked) return;
    const release = (e: PointerEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) {
        if (e.key !== "Escape") return;
      } else if ((e.target as Element | null)?.closest?.("[data-km-keep]")) {
        return;
      }
      setHover(locked);
      setLocked(null);
    };
    document.addEventListener("pointerdown", release);
    document.addEventListener("keydown", release);
    return () => {
      document.removeEventListener("pointerdown", release);
      document.removeEventListener("keydown", release);
    };
  }, [locked]);

  // "Show on the map" buttons elsewhere on the page keep a box in place here.
  useEffect(() => {
    const show = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (!byId.has(id)) return;
      setLocked(id);
      section.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    window.addEventListener("fathom:map-focus", show);
    return () => window.removeEventListener("fathom:map-focus", show);
  }, [byId]);

  if (!sel) return null;
  const visible = (id: string) => byId.has(id);
  const active = links.filter((l) => l.nodes.includes(sel.id));
  // Sums that work this box out come first, then the ones it feeds into.
  active.sort((a, b) => Number(b.result === sel.id) - Number(a.result === sel.id));
  const lit = new Set(active.flatMap((l) => l.nodes));
  const edges = active.flatMap((l) => l.edges.filter(([f, t]) => visible(f) && visible(t)));
  const g = GROUPS[sel.group];
  const point = (id: string) => {
    if (!locked) setHover(id);
  };

  const box = (n: Placed, compact = false) => {
    const gg = GROUPS[n.group];
    const on = n.id === sel.id;
    const near = !on && lit.has(n.id);
    return (
      <button
        key={n.id}
        type="button"
        data-km-keep
        onMouseEnter={() => point(n.id)}
        // Also on movement, so a box already under the pointer responds as soon as a kept box is let go.
        onMouseMove={() => point(n.id)}
        onFocus={() => point(n.id)}
        onClick={() => {
          setLocked(n.id);
          setHover(n.id);
        }}
        aria-pressed={locked === n.id}
        aria-label={`${n.label}${n.value ? `: ${n.value}` : ""}. ${locked === n.id ? "Kept in place." : "Click to keep in place."}`}
        className={`flex flex-col items-start justify-center rounded-xl border text-left transition-[background-color,border-color,color,opacity] duration-150 ${
          compact ? "min-h-11 px-3 py-1.5" : "h-full w-full px-3"
        }`}
        style={{
          background: on ? gg.color : near ? gg.soft : "#ffffff",
          borderColor: on ? gg.color : near ? gg.color : "var(--color-line)",
          // Boxes stay solid white so arrows passing behind them never show through.
          color: on ? "#ffffff" : near ? "var(--color-ink)" : "#8a909c",
        }}
      >
        <span className="flex items-center gap-1.5 text-[13px] font-semibold leading-tight">
          {!on && <span aria-hidden="true" className="h-2 w-2 flex-none rounded-full" style={{ background: gg.color, opacity: near ? 1 : 0.45 }} />}
          {n.label}
        </span>
        <span className={`text-[12.5px] tabular-nums leading-tight ${on ? "text-white/85" : near ? "text-muted" : ""}`}>{n.short ?? "Not reported"}</span>
      </button>
    );
  };

  return (
    <section ref={section} id="map" data-part="At a glance" aria-labelledby="keymap-title" className="scroll-mt-20 overflow-hidden rounded-2xl border border-line bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <h2 id="keymap-title" className="font-display text-[22px] font-semibold tracking-[-0.03em]">
            {company} at a glance
          </h2>
          <p className="text-[14px] text-muted">How its main figures link up, worked out with its own numbers.</p>
        </div>
        <p className="flex items-center gap-2 text-[13px]" aria-live="polite">
          {locked ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              <span>
                <strong className="font-semibold">{byId.get(locked)?.label}</strong> is kept in place. Click anywhere else to let go.
              </span>
            </>
          ) : (
            <span className="text-muted">Point at a box to see how it links. Click a box to keep it in place.</span>
          )}
        </p>
      </header>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex flex-col gap-3 p-4 sm:p-6">
          {/* Column names */}
          <div className="hidden grid-cols-4 sm:grid">
            {MAP_COLUMNS.map((c) => (
              <span key={c} className="flex items-center justify-center gap-1.5 px-2 text-center text-[12px] font-semibold uppercase tracking-[0.06em]" style={{ color: GROUPS[c].ink }}>
                <span aria-hidden="true" className="h-2 w-2 flex-none rounded-full" style={{ background: GROUPS[c].color }} />
                {GROUPS[c].name}
              </span>
            ))}
          </div>

          {/* The map (tablets and up) */}
          <div className="relative hidden w-full sm:block" style={{ aspectRatio: `${W} / ${height}` }}>
            <svg viewBox={`0 0 ${W} ${height}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
              <defs>
                <marker id="km-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 z" fill={g.color} />
                </marker>
              </defs>
              {MAP_COLUMNS.slice(1).map((_, i) => (
                <line key={i} x1={(i + 1) * COL_W} x2={(i + 1) * COL_W} y1={4} y2={height - 4} stroke="var(--color-line)" strokeWidth="1" />
              ))}
              {edges.map(([f, t]) => (
                <path key={`${f}-${t}`} d={arrow(byId.get(f)!, byId.get(t)!)} fill="none" stroke={g.color} strokeWidth="2" strokeLinecap="round" markerEnd="url(#km-arrow)" className="fathom-pop" />
              ))}
            </svg>
            {placed.map((n) => (
              <div
                key={n.id}
                className="absolute"
                style={{
                  left: `${((n.cx - BOX_W / 2) / W) * 100}%`,
                  top: `${((n.cy - BOX_H / 2) / height) * 100}%`,
                  width: `${(BOX_W / W) * 100}%`,
                  height: `${(BOX_H / height) * 100}%`,
                }}
              >
                {box(n)}
              </div>
            ))}
          </div>

          {/* Phones: the same boxes as chips, column by column */}
          <div className="flex flex-col gap-3 sm:hidden">
            {MAP_COLUMNS.map((c) => (
              <div key={c} className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold uppercase tracking-[0.06em]" style={{ color: GROUPS[c].ink }}>
                  {GROUPS[c].name}
                </span>
                <div className="flex flex-wrap gap-1.5">{placed.filter((n) => n.group === c).map((n) => box(n, true))}</div>
              </div>
            ))}
          </div>
        </div>

        {/* What the box is, and each sum it's part of */}
        <aside data-km-keep aria-live="polite" className="flex flex-col gap-4 border-t border-line p-5 sm:p-6 xl:border-l xl:border-t-0">
          <div className="flex flex-col gap-1">
            <span className="inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-0.5 text-[12px] font-semibold" style={{ background: g.soft, color: g.ink }}>
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: g.color }} />
              {g.name}
            </span>
            <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3">
              <h3 className="font-display text-[24px] font-semibold leading-tight tracking-[-0.03em]">{sel.label}</h3>
              <span className="font-display text-[24px] font-semibold tabular-nums" style={{ color: g.ink }}>
                {sel.value ?? "Not reported"}
              </span>
            </div>
            {sel.when && <span className="text-[13px] text-muted">{company}, {sel.when}</span>}
          </div>
          <p className="text-[15px] leading-relaxed">
            <span className="font-semibold">What it is: </span>
            {sel.plain}
          </p>

          {active.length > 0 && (
            <div className="flex flex-col gap-3">
              <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">How it links</span>
              <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
                {active.map((l, i) => {
                  const open = opened?.node === sel.id ? opened.link === l.id : i === 0;
                  return (
                    <li key={l.id} className="flex flex-col gap-2 rounded-xl bg-mist p-3.5">
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => setOpened({ node: sel.id, link: open ? "" : l.id })}
                        className="flex items-start justify-between gap-3 text-left"
                      >
                        <span className="text-[12.5px] font-semibold text-muted">{l.rule}</span>
                        <span className="flex-none text-[12px] font-semibold text-ink underline decoration-line underline-offset-2">{open ? "Hide" : "Explain"}</span>
                      </button>
                      <Sum
                        link={l}
                        current={sel.id}
                        onPick={(id) => {
                          if (!byId.has(id)) return;
                          setLocked(id);
                          setHover(id);
                        }}
                      />
                      {open && (
                        <>
                          <p className="fathom-pop text-[14px] leading-relaxed">{l.says}</p>
                          {l.period && <span className="text-[12px] text-muted">Figures for the {l.period}.</span>}
                        </>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {stepTitles[sel.step] && (
            <a href={`#step-${sel.step}`} className="mt-auto self-start text-[14px] font-semibold no-underline hover:underline">
              More on this in “{stepTitles[sel.step]}” →
            </a>
          )}
        </aside>
      </div>
    </section>
  );
}

/** A sum written out with figures: [Revenue $46.4 billion] − [Costs $43.3 billion] = [Net income $3.1 billion]. */
function Sum({ link, current, onPick }: { link: WorkedLink; current: string; onPick: (id: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {link.sum.map((p, i) =>
        p.kind === "op" ? (
          <span key={i} aria-hidden={p.text !== "vs"} className="px-0.5 text-[16px] font-semibold text-muted">
            {p.text}
          </span>
        ) : p.node && p.node !== current ? (
          <button
            key={i}
            type="button"
            onClick={() => onPick(p.node!)}
            className="flex flex-col rounded-lg border border-line bg-white px-2.5 py-1 text-left transition-colors hover:border-ink/40"
            title={`Show ${p.label} on the map`}
          >
            <span className="text-[11.5px] leading-tight text-muted">{p.label}</span>
            <span className="text-[13.5px] font-semibold tabular-nums leading-tight">{p.value ?? "–"}</span>
          </button>
        ) : (
          <span key={i} className={`flex flex-col rounded-lg px-2.5 py-1 ${p.node === current ? "bg-ink text-white" : "border border-dashed border-line bg-white"}`}>
            <span className={`text-[11.5px] leading-tight ${p.node === current ? "text-white/75" : "text-muted"}`}>{p.label}</span>
            <span className="text-[13.5px] font-semibold tabular-nums leading-tight">{p.value ?? "–"}</span>
          </span>
        ),
      )}
    </div>
  );
}
