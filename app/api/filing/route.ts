/**
 * GET /api/filing?t=AAPL&form=10-K&part=1A      → the company's own words for one part of its latest report
 * GET /api/filing?t=AAPL&form=10-K&page=R12.htm → one note or detail table from that report
 *
 * Used by the yearly and quarterly report pages to load long text only when someone asks for it.
 */
import { NextResponse } from "next/server";
import { getNotePage, getSectionText, type ReportForm } from "@/lib/filings/load";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const ticker = (q.get("t") ?? "").toUpperCase().replace(/[^A-Z0-9.-]/g, "");
  const form = q.get("form") as ReportForm;
  if (!ticker || (form !== "10-K" && form !== "10-Q")) return NextResponse.json({ error: "Add ?t=TICKER&form=10-K or 10-Q" }, { status: 400 });
  try {
    const part = q.get("part");
    if (part) {
      if (!/^(I{1,2}-)?\d{1,2}[A-C]?$/.test(part)) return NextResponse.json({ error: "Unknown part" }, { status: 400 });
      const text = await getSectionText(ticker, form, part);
      return text ? NextResponse.json({ text }) : NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const page = q.get("page") ?? "";
    const data = await getNotePage(ticker, form, page);
    return data ? NextResponse.json(data) : NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "SEC couldn't be reached. Try again in a moment." }, { status: 502 });
  }
}
