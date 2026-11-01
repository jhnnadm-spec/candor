import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { EXPLANATIONS } from "@/content/explanations";
import { ReportPdf } from "@/lib/pdf/ReportPdf";
import type { CompanyReport } from "@/lib/report/company";

const report: CompanyReport = {
  company: { name: "Apple Inc.", ticker: "AAPL", cik: "0000320193", industry: "Electronic Computers", sic: 3571, exchanges: ["Nasdaq"] },
  support: { supported: true } as CompanyReport["support"],
  annualReport: {
    form: "10-K",
    filingDate: "2025-10-31",
    periodEnd: "2025-09-27",
    url: "https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/aapl-20250927.htm",
    indexUrl: "https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/",
  },
  statements: [],
  announcements: [{ filingDate: "2026-07-30", events: ["Shared financial results"], codes: ["2.02"], url: "https://www.sec.gov/x.htm" }],
  tradingViewSymbol: "NASDAQ:AAPL",
  explanationKey: "",
  generatedAt: "2026-10-13T00:00:00Z",
};

describe("PDF download", () => {
  it("makes a PDF with and without an AI explanation", async () => {
    for (const explanation of [EXPLANATIONS.AAPL, undefined]) {
      const pdf = await renderToBuffer(
        ReportPdf({ report, explanation, pageUrl: "https://example.com/stock/AAPL", createdAt: new Date("2026-10-13") }),
      );
      expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
      expect(pdf.length).toBeGreaterThan(10_000);
    }
  }, 30_000);

  it("renders long reports (the repeating footer must not grow page by page)", async () => {
    // Many announcements push the report past 11 pages, where an inherited line height on the
    // repeating footer used to compound until react-pdf crashed with "unsupported number".
    const long: CompanyReport = {
      ...report,
      announcements: Array.from({ length: 150 }, (_, i) => ({
        filingDate: new Date(Date.UTC(2026, 0, 1) + i * 86_400_000).toISOString().slice(0, 10),
        events: ["Shared financial results", "Change in its leaders or board"],
        codes: ["2.02", "5.02"],
        url: `https://www.sec.gov/x${i}.htm`,
      })),
    };
    const pdf = await renderToBuffer(ReportPdf({ report: long, explanation: EXPLANATIONS.AAPL, pageUrl: "https://example.com/stock/AAPL", createdAt: new Date("2026-10-13") }));
    const pages = (pdf.toString("latin1").match(/\/Type \/Page\b/g) ?? []).length;
    expect(pages).toBeGreaterThan(11);
  }, 60_000);
});
