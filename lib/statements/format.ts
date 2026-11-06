/** Short number formats for statement tables and pictures. Safe to use in the browser. */

/** 391035000000 -> "$391.0B", -5400000 -> "−$5.4M" */
export function compact(v: number, unit: "money" | "shares" | "perShare" | "percent" | "pure" | "text" = "money"): string {
  if (unit === "perShare") return `${v < 0 ? "−" : ""}$${Math.abs(v).toFixed(2)}`;
  if (unit === "percent") return `${(v * 100).toFixed(1)}%`;
  if (unit === "pure") return v.toLocaleString("en-US");
  const a = Math.abs(v);
  const sign = v < 0 ? "−" : "";
  const cur = unit === "money" ? "$" : "";
  const tail = unit === "shares" ? " shares" : "";
  if (a >= 1e12) return `${sign}${cur}${(a / 1e12).toFixed(2)}T${tail}`;
  if (a >= 1e9) return `${sign}${cur}${(a / 1e9).toFixed(1)}B${tail}`;
  if (a >= 1e6) return `${sign}${cur}${(a / 1e6).toFixed(1)}M${tail}`;
  if (a >= 1e3) return `${sign}${cur}${(a / 1e3).toFixed(1)}K${tail}`;
  return `${sign}${cur}${a.toLocaleString("en-US", { maximumFractionDigits: 2 })}${tail}`;
}

/** Change from b to a as a percentage, or undefined when it can't be worked out sensibly. */
export function change(a: number | null | undefined, b: number | null | undefined): number | undefined {
  if (a === null || a === undefined || b === null || b === undefined || b === 0) return undefined;
  if (Math.sign(a) !== Math.sign(b) && a !== 0) return undefined; // from a loss to a profit: a percentage would mislead
  return (a - b) / Math.abs(b);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function niceDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}
