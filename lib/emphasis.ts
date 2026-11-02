/**
 * Picks out what matters in a sentence so it can be shown in bold: amounts of money,
 * percentages and other figures, and the key finance terms from candor's dictionary.
 * Each term is picked out once per sentence, so text stays easy to read.
 */
import { glossaryKeys, lookupTerm } from "./glossary";

export type Piece = { text: string; strong: boolean };

// Amounts like "$391 billion", "$4.2bn", "-$3m", percentages like "12%" or "12.5 percent", and "1.8 times".
const NUMBER = String.raw`[-−]?\$\d[\d,]*(?:\.\d+)?(?:\s?(?:trillion|billion|million|thousand|bn|tn|m|k)\b)?|\b\d[\d,]*(?:\.\d+)?\s?(?:%|percent\b|per cent\b)|\b\d[\d,]*(?:\.\d+)?\s?(?:trillion|billion|million)\b|\b\d+(?:\.\d+)?\s?times\b`;

// Words too everyday to bold on their own.
const SKIP = new Set(["cash", "price", "costs", "sales", "profit", "debt", "assets", "inflation", "competition", "regulation", "dividend", "dividends"]);

function terms(): string[] {
  const out = new Set<string>();
  for (const k of glossaryKeys()) {
    const e = lookupTerm(k);
    if (!e) continue;
    for (const name of [e.short, e.term.replace(/\s*\(.*\)\s*$/, "")]) {
      const n = name.trim();
      if (n.length >= 4 && !SKIP.has(n.toLowerCase())) out.add(n);
    }
  }
  // Longest first, so "free cash flow" wins over "cash flow".
  return [...out].sort((a, b) => b.length - a.length);
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
let pattern: RegExp | undefined;
function matcher(): RegExp {
  pattern ??= new RegExp(`(${NUMBER})|\\b(${terms().map(escape).join("|")})\\b`, "gi");
  return pattern;
}

export function emphasise(text: string): Piece[] {
  const re = matcher();
  re.lastIndex = 0;
  const out: Piece[] = [];
  const seen = new Set<string>();
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    const isTerm = !m[1];
    const key = m[0].toLowerCase();
    if (isTerm && seen.has(key)) continue;
    if (isTerm) seen.add(key);
    if (m.index > last) out.push({ text: text.slice(last, m.index), strong: false });
    out.push({ text: m[0], strong: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), strong: false });
  return out;
}
