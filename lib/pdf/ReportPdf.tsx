/**
 * The downloadable company report, laid out like an equity research report but written
 * in plain English:
 *
 *   Page 1   the company in one minute, key takeaways, what the figures show in its
 *            favour and what to keep an eye on, and a key-figures sidebar
 *   1–6      the business, growth and profit, financial health, cash, how it's run,
 *            and its industry and risks, with flat colour charts
 *   7        how the numbers link, each sum worked out with the company's own figures
 *   8–9      what changed in a year, and recent official announcements
 *   A–C      every figure and how it's worked out, the key terms, and the sources
 *
 * Key finance terms are highlighted in the text and explained under "Key terms", and
 * every point carries a [number] matching the source list. Numbers come straight from
 * SEC filings and are worked out in code; AI-written points were checked word for word.
 * Live market data (share price, market value) changes every day, so it stays on the website.
 */
import path from "node:path";
import { MARK_BAR_HEIGHT, MARK_BARS } from "@/components/Logo";
import { Document, Font, Link, Page, Rect, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import { Fragment, type ReactElement, type ReactNode } from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import type { CheckedClaim, SavedExplanation, TopicId } from "../explain/types";
import { formatDate, formatMoney, formatShare } from "../financials/format";
import { changeRows, marginTrends } from "../financials/explain-numbers";
import { termsIn, type Statement } from "../financials/templates";
import { glossaryKeys, lookupTerm, withTerms } from "../glossary";
import { emphasise } from "../emphasis";
import { FUNDAMENTAL_GROUPS, fundamentalFromReport, type FundamentalGroupId } from "../lens/fundamental";
import { figureValue, periodText } from "../lens/format";
import type { CompanyProfile } from "../profile/wiki";
import type { CompanyReport } from "../report/company";
import { workedLinks } from "../report/concept-map";
import { highlights } from "../report/highlights";
import { moneyUses, salesSplit } from "../report/visuals";

// ---------------------------------------------------------------- fonts and colours

const FONTS = path.join(process.cwd(), "lib", "pdf", "fonts");
Font.register({
  family: "Figtree",
  fonts: [
    { src: path.join(FONTS, "figtree-400.woff"), fontWeight: 400 },
    { src: path.join(FONTS, "figtree-600.woff"), fontWeight: 600 },
    { src: path.join(FONTS, "figtree-700.woff"), fontWeight: 700 },
  ],
});
Font.register({ family: "Bricolage", src: path.join(FONTS, "bricolage-700.woff"), fontWeight: 700 });
Font.registerHyphenationCallback((word) => [word]); // never split words across lines

const C = {
  ink: "#0C0F14",
  muted: "#5B6270",
  line: "#E4E7EC",
  mist: "#F4F5F7",
  blue: "#2D5BFF",
  blueInk: "#1F45D6",
  blueSoft: "#EEF2FF",
  teal: "#0EA5A4",
  tealSoft: "#E6F7F7",
  violet: "#7C5CFF",
  violetSoft: "#F1EDFF",
  amber: "#F59E0B",
  amberInk: "#8A5300",
  amberSoft: "#FEF6E7",
  rose: "#F43F5E",
  roseSoft: "#FEECEF",
  sky: "#0EA5E9",
  skySoft: "#E6F6FD",
  green: "#16A34A",
  greenSoft: "#E8F6EC",
  slate: "#64748B",
};

const s = StyleSheet.create({
  // Line spacing is set on the body, not the page: the footer repeats on every page, and an inherited
  // relative line height gets multiplied again on each page until the numbers overflow. The body states
  // its font size too, because a relative line height is turned into points using the box's own size.
  page: { paddingTop: 40, paddingBottom: 60, paddingHorizontal: 44, fontFamily: "Figtree", fontSize: 10, color: C.ink },
  body: { fontSize: 10, lineHeight: 1.45 },
  footer: { position: "absolute", bottom: 24, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: C.muted, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 7 },
  band: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.ink, color: "#FFFFFF", paddingVertical: 9, paddingHorizontal: 12, borderRadius: 2 },
  title: { fontFamily: "Bricolage", fontWeight: 700, fontSize: 24, lineHeight: 1.15, marginTop: 12 },
  meta: { color: C.muted, fontSize: 9, marginTop: 3 },
  h: { fontFamily: "Bricolage", fontWeight: 700, fontSize: 11.5, marginTop: 12, marginBottom: 4 },
  label: { fontSize: 7.5, fontWeight: 700, color: C.muted, letterSpacing: 0.8, textTransform: "uppercase" },
  p: { marginBottom: 5 },
  note: { color: C.muted, fontSize: 8.5, marginBottom: 5 },
  kw: { fontWeight: 700, color: C.blueInk },
  num: { fontWeight: 700 },
  ref: { fontSize: 7, color: C.blue },
  quote: { fontSize: 8, color: C.muted, marginTop: 1 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.line, paddingVertical: 4 },
  th: { fontSize: 7.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  link: { color: C.blueInk, textDecoration: "none" },
});

// ---------------------------------------------------------------- numbered sources and highlighted terms

/** Hands out [1], [2]… in the order sources first appear, so the list at the end matches. */
class SourceList {
  readonly items: { label: string; url: string }[] = [];
  private seen = new Map<string, number>();
  ref(label: string, url: string): number {
    const base = url.split("#")[0];
    const key = `${label}|${base}`;
    let n = this.seen.get(key);
    if (!n) {
      this.items.push({ label, url: base });
      n = this.items.length;
      this.seen.set(key, n);
    }
    return n;
  }
}

/** Every name a glossary term goes by, to the term's key: so highlighted words can be explained at the back. */
let NAMES: Map<string, string> | undefined;
function termKey(word: string): string | undefined {
  if (!NAMES) {
    NAMES = new Map();
    for (const k of glossaryKeys()) {
      const e = lookupTerm(k)!;
      for (const n of [e.short, e.term.replace(/\s*\(.*\)\s*$/, "")]) NAMES.set(n.toLowerCase(), k);
    }
  }
  return NAMES.get(word.toLowerCase());
}

type Ctx = { report: CompanyReport; e?: SavedExplanation; profile?: CompanyProfile; src: SourceList; terms: Set<string> };

/** Swap characters the PDF font doesn't have for ones it does. */
function clean(text: string): string {
  return text
    .replace(/[‐‑‒]/g, "-")
    .replace(/[   ]/g, " ")
    .replace(/→/g, "to")
    .replace(/≈/g, "about ");
}

/** A sentence with its figures in bold and its key finance terms highlighted (and noted for "Key terms"). */
function rich(ctx: Ctx, raw: string): ReactNode[] {
  termsIn(raw).forEach((t) => ctx.terms.add(t));
  const text = clean(withTerms(raw));
  return emphasise(text).map((p, i) => {
    if (!p.strong) return <Fragment key={i}>{p.text}</Fragment>;
    const isNumber = /^[-−$\d]/.test(p.text);
    if (!isNumber) {
      const k = termKey(p.text);
      if (k) ctx.terms.add(k);
    }
    return (
      <Text key={i} style={isNumber ? s.num : s.kw}>
        {p.text}
      </Text>
    );
  });
}

const refText = (refs: number[]) => (refs.length > 0 ? ` ${refs.map((r) => `[${r}]`).join("")}` : "");

/** One bullet point: rich text, its source numbers, and (optionally) the report's own words. */
function bullet(ctx: Ctx, text: string, refs: number[] = [], quote?: string, color: string = C.blue) {
  return (
    <View key={text} style={{ flexDirection: "row", gap: 6, marginBottom: 5 }} wrap={false}>
      <View style={{ width: 5, height: 5, borderRadius: 0, backgroundColor: color, marginTop: 4.5 }} />
      <View style={{ flex: 1 }}>
        <Text>
          {rich(ctx, text)}
          {refs.length > 0 && <Text style={s.ref}>{refText(refs)}</Text>}
        </Text>
        {quote && <Text style={s.quote}>From the report: “{clean(quote)}”</Text>}
      </View>
    </View>
  );
}

function statement(ctx: Ctx, id: string, color?: string) {
  const st = ctx.report.statements.find((x) => x.id === id);
  return st ? statementPoint(ctx, st, color) : null;
}
function statementPoint(ctx: Ctx, st: Statement, color?: string) {
  return bullet(ctx, st.text, st.sources.map((x) => ctx.src.ref(x.label, x.url)), undefined, color);
}

function claims(ctx: Ctx, list: CheckedClaim[], quotes = true, color?: string) {
  return list.map((c) => bullet(ctx, c.text, [ctx.src.ref(c.source.label, c.source.url)], quotes ? c.quote : undefined, color));
}

function topic(ctx: Ctx, id: TopicId, title: string, max?: number, color?: string) {
  const list = (ctx.e?.topics[id] ?? []).slice(0, max);
  if (list.length === 0) return null;
  return (
    <View key={id}>
      <KeepMarker />
      <Text style={s.h} minPresenceAhead={70}>
        {title}
      </Text>
      {claims(ctx, list, true, color)}
    </View>
  );
}

/** The candor mark: three flat bars, one per level of detail. */
function LogoMark({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {MARK_BARS.map((b) => (
        <Rect key={b.y} x={0} y={b.y} width={b.width} height={MARK_BAR_HEIGHT} fill={b.color} />
      ))}
    </Svg>
  );
}

/**
 * react-pdf only moves a heading to the next page (to keep it with what follows) when something comes
 * before it in the same box; as a box's first child it assumes it's already at the top of a page.
 * This empty marker goes first, so headings are never left alone at the bottom of a page.
 */
const KeepMarker = () => <View style={{ height: 0 }} />;

/** A numbered section: a coloured number tile, the title, and one line on what it tells you. */
function section(num: string, title: string, intro: string, color: string, children: ReactNode, opts: { breakBefore?: boolean } = {}) {
  return (
    <View break={opts.breakBefore} style={{ marginTop: opts.breakBefore ? 0 : 18 }}>
      <KeepMarker />
      <View wrap={false} minPresenceAhead={150} style={{ borderBottomWidth: 2, borderBottomColor: color, paddingBottom: 6, marginBottom: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ backgroundColor: color, borderRadius: 1, width: 20, height: 20, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#FFFFFF", fontWeight: 700, fontSize: 10 }}>{num}</Text>
          </View>
          <Text style={{ fontFamily: "Bricolage", fontWeight: 700, fontSize: 16 }}>{title}</Text>
        </View>
        <Text style={[s.note, { marginTop: 4, marginBottom: 0 }]}>{intro}</Text>
      </View>
      {children}
    </View>
  );
}

function notWritten() {
  return (
    <Text style={s.note}>
      The plain-English points for this part haven&apos;t been written for this company yet. They will appear on its candor page once ready.
    </Text>
  );
}

// ---------------------------------------------------------------- charts (flat, one colour each)

function hbars(title: string, rows: { label: string; value: number; display: string; color: string }[], note?: string) {
  const max = Math.max(...rows.map((x) => Math.abs(x.value)), 1);
  return (
    <View style={{ backgroundColor: C.mist, borderRadius: 2, padding: 10, marginVertical: 6 }} wrap={false}>
      <Text style={s.label}>{title}</Text>
      {rows.map((x) => (
        <View key={x.label} style={{ flexDirection: "row", alignItems: "center", marginTop: 5 }}>
          <Text style={{ width: 170, fontSize: 8.5, color: C.muted }}>{clean(x.label)}</Text>
          <View style={{ flex: 1, height: 9, backgroundColor: "#FFFFFF", borderRadius: 2 }}>
            <View style={{ width: `${Math.max(1, (Math.abs(x.value) / max) * 100)}%`, height: 9, borderRadius: 2, backgroundColor: x.color }} />
          </View>
          <Text style={{ width: 78, fontSize: 8.5, textAlign: "right", fontWeight: 600 }}>{clean(x.display)}</Text>
        </View>
      ))}
      {note && <Text style={[s.note, { marginTop: 5, marginBottom: 0 }]}>{note}</Text>}
    </View>
  );
}

/** Columns for a figure over several years, the latest in full colour. */
function columns(title: string, bars: { label: string; value: number; display: string }[], color: string, soft: string) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <View style={{ backgroundColor: C.mist, borderRadius: 2, padding: 10, marginVertical: 6 }} wrap={false}>
      <Text style={s.label}>{title}</Text>
      <View style={{ flexDirection: "row", alignItems: "flex-end", height: 96, gap: 8, marginTop: 8 }}>
        {bars.map((b, i) => (
          <View key={b.label} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", height: 96 }}>
            <Text style={{ fontSize: 7.5, fontWeight: 600, marginBottom: 2 }}>{clean(b.display)}</Text>
            <View style={{ width: "100%", height: Math.max(3, (b.value / max) * 72), backgroundColor: i === bars.length - 1 ? color : soft, borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 8, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 3 }}>
        {bars.map((b) => (
          <Text key={b.label} style={{ flex: 1, textAlign: "center", fontSize: 7.5, color: C.muted }}>
            {b.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

/** One bar split into parts, with a key: where each $100 of sales went. */
function stacked(title: string, parts: { label: string; value: number; display: string; color: string }[], note?: string) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  return (
    <View style={{ backgroundColor: C.mist, borderRadius: 2, padding: 10, marginVertical: 6 }} wrap={false}>
      <Text style={s.label}>{title}</Text>
      <View style={{ flexDirection: "row", height: 14, marginTop: 7, borderRadius: 0, overflow: "hidden", gap: 1.5 }}>
        {parts.map((p) => (
          <View key={p.label} style={{ width: `${(p.value / total) * 100}%`, backgroundColor: p.color }} />
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6, columnGap: 12, rowGap: 3 }}>
        {parts.map((p) => (
          <View key={p.label} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: p.color }} />
            <Text style={{ fontSize: 8, color: C.muted }}>
              {clean(p.label)} <Text style={{ color: C.ink, fontWeight: 700 }}>{clean(p.display)}</Text>
            </Text>
          </View>
        ))}
      </View>
      {note && <Text style={[s.note, { marginTop: 5, marginBottom: 0 }]}>{note}</Text>}
    </View>
  );
}

type Cell = { text: string; width: string | number; align?: "left" | "right"; bold?: boolean; sub?: string; color?: string };

function table(header: string[], widths: (string | number)[], rows: Cell[][]) {
  return (
    <View style={{ marginVertical: 6 }}>
      <KeepMarker />
      <View style={[s.tr, { borderBottomWidth: 1.5, borderBottomColor: C.ink }]} wrap={false} minPresenceAhead={60}>
        {header.map((h, i) => (
          <Text key={h} style={[s.th, { width: widths[i], textAlign: i === 0 ? "left" : "right", paddingRight: 6 }]}>
            {h}
          </Text>
        ))}
      </View>
      {rows.map((r, i) => (
        <View key={i} style={s.tr} wrap={false}>
          {r.map((c, j) => (
            <View key={j} style={{ width: c.width, paddingRight: 6 }}>
              <Text style={{ textAlign: c.align ?? "left", fontWeight: c.bold ? 700 : 400, color: c.color ?? C.ink, fontSize: 9 }}>{clean(c.text)}</Text>
              {c.sub && <Text style={{ fontSize: 7.5, color: C.muted, textAlign: c.align ?? "left" }}>{clean(c.sub)}</Text>}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------- the document

export type PdfInput = {
  report: CompanyReport;
  explanation?: SavedExplanation;
  profile?: CompanyProfile;
  pageUrl: string; // the live page on the candor website
  createdAt: Date;
};

/** Called as a plain function (not <ReportPdf/>) so the PDF renderer receives the <Document> directly. */
export function ReportPdf({ report, explanation: e, profile, pageUrl, createdAt }: PdfInput): ReactElement<DocumentProps> {
  // Built top to bottom with plain function calls, so source numbers follow reading order.
  const ctx: Ctx = { report, e, profile, src: new SourceList(), terms: new Set() };
  const created = formatDate(createdAt.toISOString().slice(0, 10));
  const body = (
    <>
      {frontPage(ctx, created, pageUrl)}
      {business(ctx)}
      {growth(ctx)}
      {health(ctx)}
      {cash(ctx)}
      {management(ctx)}
      {outlook(ctx)}
      {links(ctx)}
      {changes(ctx)}
      {announcements(ctx)}
      {everyFigure(ctx)}
    </>
  );
  const terms = keyTerms(ctx);
  const sources = sourcesSection(ctx, pageUrl);
  const company = report.company;
  return (
    <Document title={`${company.name} (${company.ticker}): plain-English company report · candor`} author="candor" subject="Plain-English company research report" creator="candor" producer="candor">
      <Page size="A4" style={s.page}>
        <View fixed style={s.footer}>
          <Text>
            candor · {company.name} ({company.ticker}) · {created} · For education only, not investment advice.
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
        <View style={s.body}>
          {body}
          {terms}
          {sources}
          {disclaimer()}
        </View>
      </Page>
    </Document>
  );
}

// ---------------------------------------------------------------- page 1

function frontPage(ctx: Ctx, created: string, pageUrl: string) {
  const { report, e, profile } = ctx;
  const { company, annualReport, quarterlyReport } = report;
  const fundamentals = fundamentalFromReport(report);
  const { favour, watch, risks } = highlights(report.numbers, report.governance, e);
  const lead = [...(e?.topics.whatItDoes ?? []).slice(0, 1), ...(e?.topics.howItMakesMoney ?? []).slice(0, 2)];
  const basedOn = [
    annualReport && `annual report (10-K) filed ${formatDate(annualReport.filingDate)}`,
    quarterlyReport && `quarterly report (10-Q) filed ${formatDate(quarterlyReport.filingDate)}`,
  ].filter(Boolean);

  return (
    <View>
      <View style={s.band}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <LogoMark size={15} />
          <Text style={{ fontWeight: 700, fontSize: 13, color: "#D9DCE2" }}>candor</Text>
        </View>
        <Text style={{ fontSize: 8.5 }}>Company research report · plain-English edition · {created}</Text>
      </View>

      <Text style={s.title}>{company.name}</Text>
      <View style={{ flexDirection: "row", gap: 6, marginTop: 6, alignItems: "center" }}>
        <Text style={{ backgroundColor: C.blueSoft, color: C.blueInk, fontWeight: 700, fontSize: 9, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 1 }}>
          {company.ticker}
          {company.exchanges[0] ? ` · ${company.exchanges[0]}` : ""}
        </Text>
        {company.industry && <Text style={{ fontSize: 9, color: C.muted }}>Industry: {company.industry}</Text>}
      </View>
      {basedOn.length > 0 && <Text style={s.meta}>Based on its {basedOn.join(" and ")}, from SEC EDGAR.</Text>}

      <Text style={[s.note, { marginTop: 6 }]}>
        How to read it: key finance terms are <Text style={s.kw}>highlighted</Text> and explained under &quot;Key terms&quot; at the back, figures are in{" "}
        <Text style={s.num}>bold</Text>, and each [number] matches the source list. Every point is worked out from the company&apos;s own figures and words: it
        describes the business, not whether to buy, sell or hold its shares. Share price and latest news:{" "}
        <Link src={pageUrl} style={s.link}>
          {pageUrl.replace(/^https?:\/\//, "")}
        </Link>
        .
      </Text>

      <View style={{ flexDirection: "row", gap: 16, marginTop: 10 }}>
        {/* The story */}
        <View style={{ flex: 1 }}>
          <Text style={[s.label, { marginTop: 2 }]}>The company in one minute</Text>
          {lead.length > 0 ? (
            <Text style={[s.p, { fontSize: 10.5, marginTop: 4 }]}>
              {lead.map((c, i) => (
                <Fragment key={c.text}>
                  {i > 0 ? " " : ""}
                  {rich(ctx, c.text)}
                  <Text style={s.ref}>{refText([ctx.src.ref(c.source.label, c.source.url)])}</Text>
                </Fragment>
              ))}
            </Text>
          ) : (
            <Text style={[s.note, { marginTop: 4 }]}>The plain-English description of this business hasn&apos;t been written yet.</Text>
          )}

          {fundamentals && fundamentals.summary.length > 0 && (
            <>
              <Text style={[s.label, { marginTop: 8 }]}>Key takeaways from the figures</Text>
              <View style={{ marginTop: 4 }}>{fundamentals.summary.map((t) => bullet(ctx, t, fundamentals.sources.slice(0, 1).map((x) => ctx.src.ref(x.name, x.url))))}</View>
            </>
          )}
        </View>

        {/* Key figures sidebar */}
        <View style={{ width: 178, backgroundColor: C.mist, borderRadius: 2, padding: 10 }}>
          <Text style={s.label}>Key figures</Text>
          {fundamentals ? (
            FUNDAMENTAL_GROUPS.map((g) => {
              const rows = fundamentals.data.rows.filter((r) => r.group === g.id && r.figure.status === "reported");
              if (rows.length === 0) return null;
              return (
                <View key={g.id} style={{ marginTop: 6 }}>
                  <Text style={{ fontSize: 7.5, fontWeight: 700, color: GROUP_COLOR[g.id] }}>{g.title}</Text>
                  {rows.map((r) => {
                    ctx.terms.add(r.term);
                    const [name, value] = figureLabel(r.id, r.name, r.figure);
                    return (
                      <View key={r.id} style={{ flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 0.5, borderBottomColor: C.line, paddingVertical: 1.5 }}>
                        <Text style={{ fontSize: 8, color: C.muted, flex: 1 }}>{name}</Text>
                        <Text style={{ fontSize: 8.5, fontWeight: 700 }}>{value}</Text>
                      </View>
                    );
                  })}
                </View>
              );
            })
          ) : (
            <Text style={[s.note, { marginTop: 4 }]}>No figures available.</Text>
          )}
          {fundamentals?.meta.fiscalYearEnd && <Text style={{ fontSize: 6.5, color: C.muted, marginTop: 5 }}>Latest financial year; balance-sheet figures on the latest report date. In US dollars.</Text>}
          {profile && companyFacts(profile)}
        </View>
      </View>

      {(favour.length > 0 || watch.length > 0 || risks.length > 0) && (
        <View style={{ flexDirection: "row", gap: 12, marginTop: 12, fontSize: 9, lineHeight: 1.4 }} wrap={false}>
          <View style={{ flex: 1, backgroundColor: C.greenSoft, borderRadius: 2, padding: 9 }}>
            <Text style={[s.label, { color: C.green }]}>What the figures show in its favour</Text>
            <View style={{ marginTop: 4 }}>
              {favour.length > 0 ? favour.slice(0, 3).map((h) => bullet(ctx, h.text, [], undefined, C.green)) : <Text style={s.note}>Nothing stood out from the figures.</Text>}
            </View>
          </View>
          <View style={{ flex: 1, backgroundColor: C.amberSoft, borderRadius: 2, padding: 9 }}>
            <Text style={[s.label, { color: C.amberInk }]}>What to keep an eye on</Text>
            <View style={{ marginTop: 4 }}>
              {watch.slice(0, Math.max(1, 3 - risks.length)).map((h) => bullet(ctx, h.text, [], undefined, C.amber))}
              {risks.map((c) => bullet(ctx, `The company says: ${c.text}`, [ctx.src.ref(c.source.label, c.source.url)], undefined, C.amber))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

/** Net debt below zero reads better as "Net cash" with a positive amount. */
function figureLabel(id: string, name: string, f: Parameters<typeof figureValue>[0]): [string, string] {
  if (id === "netDebt" && f.status === "reported" && f.value < 0) return ["Net cash (more cash than debt)", clean(formatMoney(Math.abs(f.value)))];
  return [name, clean(figureValue(f))];
}

const GROUP_COLOR: Record<FundamentalGroupId, string> = { size: C.blueInk, profitability: "#0B6F6E", cash: C.amberInk, safety: "#5B3FD6", returns: "#B4233C" };

function companyFacts(p: CompanyProfile) {
  const facts: [string, string][] = [];
  if (p.ceo) facts.push(["Chief executive", p.ceo]);
  if (p.founded) facts.push(["Founded", p.founded]);
  if (p.headquarters) facts.push(["Headquarters", p.headquarters]);
  if (p.employees) facts.push(["Employees", `${p.employees.count.toLocaleString("en-US")}${p.employees.asOf ? ` (${p.employees.asOf})` : ""}`]);
  if (facts.length === 0) return null;
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={s.label}>Company facts</Text>
      {facts.map(([k, v]) => (
        <View key={k} style={{ marginTop: 3 }}>
          <Text style={{ fontSize: 7.5, color: C.muted }}>{k}</Text>
          <Text style={{ fontSize: 8.5, fontWeight: 600 }}>{clean(v)}</Text>
        </View>
      ))}
      <Text style={{ fontSize: 6.5, color: C.muted, marginTop: 4 }}>Background from Wikidata (CC0); may lag behind.</Text>
    </View>
  );
}

// ---------------------------------------------------------------- sections 1–6

function business(ctx: Ctx) {
  const body = ctx.e ? (
    <>
      {topic(ctx, "whatItDoes", "What the company does", undefined, C.blue)}
      {topic(ctx, "howItMakesMoney", "How it makes money", undefined, C.blue)}
      {topic(ctx, "competitiveEdge", "What the company says gives it an edge", undefined, C.blue)}
      {topic(ctx, "marketPosition", "Where it says it stands in its industry", undefined, C.blue)}
    </>
  ) : (
    notWritten()
  );
  return section("1", "The business", "What it sells, who pays for it, and what it says sets it apart. Every number later makes more sense with this in mind.", C.blue, body);
}

function growth(ctx: Ctx) {
  const n = ctx.report.numbers;
  const split = salesSplit(n);
  const trends = n ? marginTrends(n) : [];
  const pct = (v?: number) => (v === undefined ? "–" : formatShare(v));
  return section(
    "2",
    "Growth and profit",
    "Whether it sells more each year, and how much of each sale it keeps. From the income statement.",
    C.teal,
    <>
      {n && n.revenueHistory.length >= 2 &&
        columns(
          "Revenue by financial year",
          n.revenueHistory.map((f) => ({ label: f.end.slice(0, 4), value: f.value, display: formatMoney(f.value).replace(" billion", "bn").replace(" million", "m").replace(" trillion", "tn") })),
          C.teal,
          "#BFE8E7",
        )}
      {["revenue-year", "revenue-quarter", "net-income-year", "gross-margin", "net-margin", "eps"].map((id) => statement(ctx, id, C.teal))}
      {split &&
        stacked(
          "Where each $100 of sales went",
          split.segments.map((x, i) => ({ ...x, color: [C.blue, C.rose, C.violet, C.teal][i] ?? C.teal })),
          split.period,
        )}
      {trends.map((t) => bullet(ctx, t, [], undefined, C.teal))}
      {n && n.marginHistory.length >= 2 && marginTable(n.marginHistory, pct)}
      {!n && <Text style={s.note}>No figures available.</Text>}
    </>,
  );
}

/** Margins year by year; a margin the company never reports is left out rather than shown as a column of dashes. */
function marginTable(history: { end: string; gross?: number; operating?: number; net?: number }[], pct: (v?: number) => string) {
  const cols = (
    [
      ["gross", "Gross margin"],
      ["operating", "Operating margin"],
      ["net", "Net profit margin"],
    ] as const
  ).filter(([k]) => history.some((y) => y[k] !== undefined));
  const w = `${Math.floor(66 / cols.length)}%`;
  return table(
    ["Year ended", ...cols.map(([, h]) => h)],
    ["34%", ...cols.map(() => w)],
    history.map((y) => [{ text: formatDate(y.end), width: "34%" }, ...cols.map(([k]) => ({ text: pct(y[k]), width: w, align: "right" as const, bold: k === "net" }))]),
  );
}

function health(ctx: Ctx) {
  const n = ctx.report.numbers;
  const cash = n?.balance.cash?.latest;
  const debt = n?.balance.longTermDebt?.latest;
  return section(
    "3",
    "Financial health",
    "Whether it can pay its bills and how much it relies on borrowed money: its cushion for bad times. From the balance sheet.",
    C.violet,
    <>
      {cash && debt && cash.end === debt.end &&
        hbars(
          `Cash and long-term debt on ${formatDate(cash.end)}`,
          [
            { label: "Cash and cash equivalents", value: cash.value, display: formatMoney(cash.value), color: C.teal },
            { label: "Long-term debt", value: debt.value, display: formatMoney(debt.value), color: C.amber },
          ],
          debt.value > cash.value ? `Net debt: ${formatMoney(debt.value - cash.value)} more borrowed than held in cash.` : `Net cash: ${formatMoney(cash.value - debt.value)} more cash than long-term debt.`,
        )}
      {["cash", "long-term-debt", "cash-vs-debt", "current-ratio", "assets-vs-liabilities", "debt-to-equity", "negative-equity"].map((id) => statement(ctx, id, C.violet))}
      {!n && <Text style={s.note}>No figures available.</Text>}
    </>,
  );
}

function cash(ctx: Ctx) {
  const n = ctx.report.numbers;
  const fcf = n?.ratios.freeCashFlow;
  return section(
    "4",
    "Cash",
    "Profit follows accounting rules; cash is what actually lands in the bank. Free cash flow is what's left after investing in the business. From the cash flow statement.",
    C.amber,
    <>
      {fcf &&
        hbars(`Cash in the year ended ${formatDate(fcf.end)}`, [
          { label: "Operating cash flow (cash from the business)", value: fcf.figures[0].value, display: formatMoney(fcf.figures[0].value), color: C.blue },
          { label: "Capital expenditure (buildings and equipment)", value: fcf.figures[1].value, display: `-${formatMoney(Math.abs(fcf.figures[1].value))}`, color: C.amber },
          { label: "Free cash flow (left over)", value: fcf.value, display: formatMoney(fcf.value), color: fcf.value >= 0 ? C.teal : C.rose },
        ])}
      {["operating-cash-flow", "free-cash-flow", "fcf-vs-profit"].map((id) => statement(ctx, id, C.amber))}
      {!n && <Text style={s.note}>No figures available.</Text>}
    </>,
  );
}

function management(ctx: Ctx) {
  const n = ctx.report.numbers;
  const uses = moneyUses(n);
  const g = ctx.report.governance;
  if (g) {
    ctx.terms.add("auditor");
    ctx.terms.add("restatement");
  }
  return section(
    "5",
    "How it's run",
    "How its leaders use the company's money, how much profit they make with shareholders' money, and official warning signs about its accounts.",
    C.sky,
    <>
      {uses && hbars(`What it spent its money on, ${uses.period.toLowerCase()}`, uses.segments.map((x, i) => ({ ...x, color: [C.blue, C.rose, C.violet, C.teal][i] ?? C.teal })))}
      {["capital-allocation", "return-on-equity"].map((id) => statement(ctx, id, C.sky))}
      {g && (
        <>
          <Text style={s.h} minPresenceAhead={40}>
            Accounts check
          </Text>
          {g.events.length === 0
            ? bullet(ctx, `No auditor changes or restatement notices were filed since ${formatDate(g.since)}. These are the two official warning signs a company must announce.`, [], undefined, C.green)
            : g.events.map((ev) =>
                bullet(
                  ctx,
                  ev.kind === "auditor-change"
                    ? `${formatDate(ev.filingDate)}: the company changed its auditor. This has many ordinary reasons; the filing explains why.`
                    : `${formatDate(ev.filingDate)}: the company said earlier financial statements should no longer be relied on (a restatement).`,
                  [ctx.src.ref(`8-K filed ${formatDate(ev.filingDate)}`, ev.url)],
                  undefined,
                  C.amber,
                ),
              )}
        </>
      )}
    </>,
  );
}

function outlook(ctx: Ctx) {
  const body = ctx.e ? (
    <>
      {topic(ctx, "industryTrends", "Trends in its industry", undefined, C.rose)}
      {topic(ctx, "demandDrivers", "What drives demand", undefined, C.rose)}
      {topic(ctx, "biggestRisks", "Key risks the company highlights", undefined, C.rose)}
      {topic(ctx, "newRisks", "New or changed risks", undefined, C.rose)}
      {topic(ctx, "outlook", "What management expects", undefined, C.rose)}
      {topic(ctx, "upcoming", "What the company says is coming up", undefined, C.rose)}
    </>
  ) : (
    notWritten()
  );
  ctx.terms.add("risk-factors");
  return section("6", "Industry, outlook and risks", "The bigger picture and what could go wrong, in the company's own words (with the exact wording from its reports).", C.rose, body);
}

// ---------------------------------------------------------------- 7–9

function links(ctx: Ctx) {
  const list = workedLinks(ctx.report.numbers).filter((l) => l.period);
  if (list.length === 0) return null;
  return section(
    "7",
    "How the numbers link",
    "The sums that connect one figure to the next, worked out with the company's own figures, so you can see exactly where each number comes from.",
    C.ink,
    <>
      {list.map((l) => (
        <View key={l.id} style={{ borderLeftWidth: 2, borderLeftColor: C.line, paddingLeft: 8, marginBottom: 8 }} wrap={false}>
          <Text style={{ fontWeight: 700, fontSize: 9.5 }}>{clean(l.rule)}</Text>
          <Text style={{ fontSize: 9, color: C.blueInk, marginTop: 2 }}>
            {l.sum
              .map((p) => (p.kind === "op" ? ` ${p.text} ` : `${p.label}${p.value ? ` ${p.value}` : ""}`))
              .join("")
              .replace(/\s+/g, " ")}
          </Text>
          <Text style={{ marginTop: 2 }}>{rich(ctx, l.says)}</Text>
          <Text style={{ fontSize: 7.5, color: C.muted }}>Figures for the {l.period}.</Text>
        </View>
      ))}
    </>,
  );
}

function changes(ctx: Ctx) {
  const n = ctx.report.numbers;
  const rows = n ? changeRows(n) : [];
  if (rows.length === 0) return null;
  rows.forEach((r) => r.term && ctx.terms.add(r.term));
  return section(
    "8",
    "What changed in a year",
    "Each figure next to the same figure a year earlier. Quarters are compared with the same quarter a year before, because many businesses are busier in some seasons.",
    C.green,
    table(
      ["Figure", "Latest", "A year earlier", "Change"],
      ["40%", "20%", "20%", "20%"],
      rows.map((r) => [
        { text: r.name, width: "40%", bold: true, sub: r.when },
        { text: r.latest, width: "20%", align: "right" },
        { text: r.previous ?? "–", width: "20%", align: "right", color: C.muted },
        { text: r.change, width: "20%", align: "right", bold: true, color: /^Down/i.test(r.change) ? "#B4233C" : /^Up/i.test(r.change) ? "#0B6F6E" : C.ink },
      ]),
    ),
  );
}

function announcements(ctx: Ctx) {
  const list = ctx.report.announcements;
  ctx.terms.add("8-k");
  return section(
    "9",
    "Recent official announcements",
    "Major events the company reported to the SEC in the last four months (form 8-K).",
    C.slate,
    list.length === 0 ? (
      <Text style={s.note}>No major announcements filed in the last four months.</Text>
    ) : (
      <>{list.map((a) => bullet(ctx, `${formatDate(a.filingDate)}: ${a.events.join(", ")}.`, [ctx.src.ref(`8-K filed ${formatDate(a.filingDate)}`, a.url)], undefined, C.muted))}</>
    ),
  );
}

// ---------------------------------------------------------------- appendices

function everyFigure(ctx: Ctx) {
  const f = fundamentalFromReport(ctx.report);
  if (!f) return null;
  return section(
    "A",
    "Every figure, and how it's worked out",
    "Worked out in code from the figures the company tagged in its SEC reports. candor only combines figures covering exactly the same period, and leaves a figure out rather than guess.",
    C.muted,
    <>
      {FUNDAMENTAL_GROUPS.map((g) => {
        const rows = f.data.rows.filter((r) => r.group === g.id);
        if (rows.length === 0) return null;
        return (
          <View key={g.id}>
            <KeepMarker />
            <Text style={[s.h, { color: GROUP_COLOR[g.id] }]} minPresenceAhead={60}>
              {g.title}
            </Text>
            {rows.map((r) => {
              ctx.terms.add(r.term);
              const refs = r.figure.status === "reported" ? r.figure.sources.map((x) => ctx.src.ref(x.name, x.url)) : [];
              return (
                <View key={r.id} style={{ flexDirection: "row", gap: 8, borderBottomWidth: 1, borderBottomColor: C.line, paddingVertical: 4 }} wrap={false}>
                  <View style={{ width: 120 }}>
                    <Text style={{ fontWeight: 700, fontSize: 9 }}>{figureLabel(r.id, r.name, r.figure)[0]}</Text>
                    <Text style={{ fontWeight: 700, fontSize: 11, color: GROUP_COLOR[g.id] }}>{figureLabel(r.id, r.name, r.figure)[1]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 8.5 }}>
                      {clean(r.reading ?? (r.figure.status !== "reported" ? r.figure.reason : ""))}
                      <Text style={s.ref}>{refText(refs)}</Text>
                    </Text>
                    <Text style={{ fontSize: 7.5, color: C.muted }}>
                      How it&apos;s worked out: {clean(r.formula)}
                      {r.figure.status === "reported" ? ` ${periodText(r.figure.period)}.` : ""}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        );
      })}
    </>,
  );
}

function keyTerms(ctx: Ctx) {
  const entries = [...ctx.terms].map((k) => lookupTerm(k)).filter(Boolean) as { term: string; definition: string }[];
  if (entries.length === 0) return null;
  const unique = entries.filter((t, i) => entries.findIndex((x) => x.term === t.term) === i).sort((a, b) => a.term.localeCompare(b.term));
  return section(
    "B",
    "Key terms",
    "Every highlighted term in this report, in plain English.",
    C.blueInk,
    <>
      {unique.map((t) => (
        <Text key={t.term} style={{ marginBottom: 4 }} wrap={false}>
          <Text style={s.kw}>{t.term}: </Text>
          {clean(t.definition)}
        </Text>
      ))}
    </>,
  );
}

function sourcesSection(ctx: Ctx, pageUrl: string) {
  return section(
    "C",
    "Sources",
    "candor doesn't create financial data. Every figure and point comes from these documents, filed by the company with the US Securities and Exchange Commission (SEC EDGAR).",
    C.muted,
    <>
      {ctx.src.items.map((it, i) => (
        <View key={it.url + it.label} style={{ flexDirection: "row", marginBottom: 3 }} wrap={false}>
          <Text style={{ width: 24, color: C.muted, fontSize: 8.5 }}>[{i + 1}]</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 8.5 }}>{clean(it.label)}</Text>
            <Link src={it.url} style={[s.link, { fontSize: 7.5 }]}>
              {it.url}
            </Link>
          </View>
        </View>
      ))}
      {ctx.profile && (
        <Text style={[s.note, { marginTop: 4 }]}>
          Company facts on page 1: Wikidata, a free public database (CC0){" "}
          <Link src={ctx.profile.wikidataUrl} style={s.link}>
            {ctx.profile.wikidataUrl}
          </Link>
          .
        </Text>
      )}
      <Text style={[s.note, { marginTop: 4 }]}>
        The share price, market value and the latest news change every day and are shown on the live page:{" "}
        <Link src={pageUrl} style={s.link}>
          {pageUrl.replace(/^https?:\/\//, "")}
        </Link>
        .
      </Text>
    </>,
  );
}

function disclaimer() {
  return (
    <View style={{ backgroundColor: C.mist, borderRadius: 2, padding: 10, marginTop: 16 }} wrap={false}>
      <Text style={[s.label, { color: C.ink }]}>Important information</Text>
      <Text style={{ fontSize: 8, color: C.muted, marginTop: 3 }}>
        This report explains a company&apos;s public filings for educational purposes only. It is not investment, financial, legal or tax advice, and it is not a
        recommendation to buy, sell or hold any security; candor does not give price targets or ratings. Figures are taken from filings with the US Securities and
        Exchange Commission and may contain errors or be out of date: check them against the original documents listed above before relying on them. Past results
        are not a reliable indicator of future performance. Consider speaking to a licensed financial adviser before making any investment decision. candor is
        independent and not affiliated with any company it covers.
      </Text>
    </View>
  );
}
