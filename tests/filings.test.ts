import { describe, expect, it } from "vitest";
import { parseFilingSummary, parseRPage, pickStatements, statementKind } from "../lib/sec/rpages";
import { buildLines, equityPeriods, incomeSteps } from "../lib/statements/model";
import { plainLine } from "../lib/statements/lines";
import { parseForm4 } from "../lib/sec/insiders";
import { findPayRatio, findProposals } from "../lib/sec/proxy";
import { itemExcerpts, topicsFor } from "../lib/sec/announcements";
import { themeOf } from "../lib/sec/report-guide";

const row = (concept: string, label: string, values: string[], cls = "re", strong = false) =>
  `<tr class="${cls}"><td class="pl"><a onclick="top.Show.showAR( this, 'defref_${concept}', window );">${strong ? `<strong>${label}</strong>` : label}</a></td>${values
    .map((v) => (v ? `<td class="nump">${v}</td>` : `<td class="text">&#160;</td>`))
    .join("")}</tr>`;

const INCOME = `<table class="report">
<tr><th class="tl" rowspan="2"><div><strong>CONSOLIDATED STATEMENTS OF OPERATIONS - USD ($)<br> shares in Thousands, $ in Millions</strong></div></th><th class="th" colspan="2">12 Months Ended</th></tr>
<tr><th class="th"><div>Sep. 28, 2024</div></th><th class="th"><div>Sep. 30, 2023</div></th></tr>
${row("us-gaap_RevenueFromContractWithCustomerExcludingAssessedTax", "Net sales", ["$ 391,035", "$ 383,285"])}
${row("us-gaap_CostOfGoodsAndServicesSold", "Cost of sales", ["210,352", "214,137"])}
${row("us-gaap_GrossProfit", "Gross margin", ["180,683", "169,148"], "reu")}
${row("us-gaap_OperatingExpensesAbstract", "Operating expenses:", ["", ""], "re", true)}
${row("us-gaap_ResearchAndDevelopmentExpense", "Research and development", ["31,370", "29,915"])}
${row("us-gaap_OperatingIncomeLoss", "Operating income", ["123,216", "114,301"], "reu")}
${row("us-gaap_IncomeTaxExpenseBenefit", "Provision for income taxes", ["29,749", "16,741"])}
${row("us-gaap_NetIncomeLoss", "Net income", ["$ 93,736", "$ 96,995"], "reu")}
${row("us-gaap_EarningsPerShareDiluted", "Diluted (in dollars per share)", ["$ 6.08", "$ 6.13"])}
${row("us-gaap_WeightedAverageNumberOfDilutedSharesOutstanding", "Diluted (in shares)", ["15,408,095", "15,812,547"])}
</table>`;

describe("SEC statement pages", () => {
  it("finds the main statements in the filing summary", () => {
    const pages = parseFilingSummary(`<FilingSummary><MyReports>
      <Report><HtmlFileName>R2.htm</HtmlFileName><ShortName>CONSOLIDATED STATEMENTS OF OPERATIONS</ShortName><MenuCategory>Statements</MenuCategory><Position>2</Position></Report>
      <Report><HtmlFileName>R4.htm</HtmlFileName><ShortName>CONSOLIDATED BALANCE SHEETS</ShortName><MenuCategory>Statements</MenuCategory><Position>4</Position></Report>
      <Report><HtmlFileName>R5.htm</HtmlFileName><ShortName>CONSOLIDATED BALANCE SHEETS (Parenthetical)</ShortName><MenuCategory>Statements</MenuCategory><Position>5</Position></Report>
      <Report><HtmlFileName>R7.htm</HtmlFileName><ShortName>Consolidated Statements of Redeemable Noncontrolling Interests and Equity</ShortName><MenuCategory>Statements</MenuCategory><Position>7</Position></Report>
      <Report><HtmlFileName>R8.htm</HtmlFileName><ShortName>CONSOLIDATED STATEMENTS OF CASH FLOWS</ShortName><MenuCategory>Statements</MenuCategory><Position>8</Position></Report>
    </MyReports></FilingSummary>`);
    const picked = pickStatements(pages);
    expect(picked.income?.file).toBe("R2.htm");
    expect(picked.balance?.file).toBe("R4.htm");
    expect(picked.equity?.file).toBe("R7.htm");
    expect(picked.cashflow?.file).toBe("R8.htm");
    expect(statementKind("CONSOLIDATED STATEMENTS OF COMPREHENSIVE INCOME")).toBe("comprehensive");
    expect(statementKind("CONSOLIDATED STATEMENTS OF SHAREOWNERS' EQUITY")).toBe("equity");
  });

  it("reads every line with the right scale and units", () => {
    const t = parseRPage(INCOME);
    expect(t.columns.map((c) => c.label)).toEqual(["12 months to Sep 28, 2024", "12 months to Sep 30, 2023"]);
    const sales = t.rows.find((r) => r.label === "Net sales")!;
    expect(sales.values[0]).toBe(391_035_000_000);
    const eps = t.rows.find((r) => r.concept.endsWith("EarningsPerShareDiluted"))!;
    expect(eps.unit).toBe("perShare");
    expect(eps.values[0]).toBe(6.08);
    expect(t.rows.find((r) => r.concept.endsWith("DilutedSharesOutstanding"))!.values[0]).toBe(15_408_095_000);
    expect(t.rows.find((r) => r.label === "Operating expenses")!.header).toBe(true);
  });

  it("builds the steps from sales to profit, which add up", () => {
    const lines = buildLines(parseRPage(INCOME), "income");
    expect(lines.find((l) => l.label === "Net sales")!.plain).toBe("Sales");
    const steps = incomeSteps(lines, 0);
    expect(steps[0]).toMatchObject({ key: "sales", value: 391_035_000_000 });
    expect(steps.at(-1)).toMatchObject({ key: "net", value: 93_736_000_000 });
    const total = steps.filter((s) => !s.anchor).reduce((a, s) => a + s.value, steps[0].value);
    expect(total).toBe(93_736_000_000);
  });

  it("follows equity from the start of a year to its end", () => {
    const html = `<table class="report"><tr><th class="tl"><div><strong>STATEMENTS OF SHAREHOLDERS' EQUITY - USD ($)<br> $ in Millions</strong></div></th><th class="th"><div>Total</div></th><th class="th"><div>Retained earnings</div></th></tr>
      ${row("us-gaap_StockholdersEquity", "Beginning balances at Sep. 30, 2023", ["62,146", "(214)"])}
      ${row("us-gaap_NetIncomeLoss", "Net income", ["93,736", "93,736"])}
      ${row("us-gaap_Dividends", "Dividends declared", ["", "(15,218)"])}
      ${row("us-gaap_StockRepurchasedAndRetiredDuringPeriodValue", "Common stock repurchased", ["", "(83,618)"])}
      ${row("us-gaap_StockholdersEquity", "Ending balances at Sep. 28, 2024", ["57,046", "(5,314)"])}</table>`;
    const t = parseRPage(html);
    const [p] = equityPeriods(buildLines(t, "equity"), t.columns, [12]);
    expect(p).toMatchObject({ start: "2023-09-30", end: "2024-09-28", opening: 62_146_000_000, closing: 57_046_000_000 });
    expect(p.steps.map((s) => s.plain)).toEqual(["Profit (net income)", "Dividends declared", "Shares bought back and cancelled"]);
  });

  it("explains company-made lines from their words, and unknown ones from where they sit", () => {
    expect(plainLine("aapl_SomethingCustom", "Vendor non-trade receivables", "balance", "currentAssets").plain).toMatch(/owed/i);
    expect(plainLine("xyz_Mystery", "Zebra", "balance", "liabilities")).toMatchObject({ how: "place" });
  });
});

describe("Form 4 insider trades", () => {
  it("reads each trade with its plain meaning", () => {
    const trades = parseForm4(
      `<ownershipDocument><reportingOwner><reportingOwnerId><rptOwnerName>DENHOLM ROBYN M</rptOwnerName></reportingOwnerId>
      <reportingOwnerRelationship><isDirector>1</isDirector><isOfficer>0</isOfficer></reportingOwnerRelationship></reportingOwner>
      <aff10b5One>1</aff10b5One>
      <nonDerivativeTable><nonDerivativeTransaction><securityTitle><value>Common Stock</value></securityTitle><transactionDate><value>2025-04-29</value></transactionDate>
      <transactionCoding><transactionCode>S</transactionCode></transactionCoding>
      <transactionAmounts><transactionShares><value>1000</value></transactionShares><transactionPricePerShare><value>250.5</value></transactionPricePerShare><transactionAcquiredDisposedCode><value>D</value></transactionAcquiredDisposedCode></transactionAmounts>
      <postTransactionAmounts><sharesOwnedFollowingTransaction><value>85000</value></sharesOwnedFollowingTransaction></postTransactionAmounts>
      <ownershipNature><directOrIndirectOwnership><value>D</value></directOrIndirectOwnership></ownershipNature></nonDerivativeTransaction></nonDerivativeTable></ownershipDocument>`,
      { url: "u", filingDate: "2025-05-01" },
    );
    expect(trades).toHaveLength(1);
    expect(trades[0]).toMatchObject({ person: "Robyn M Denholm", role: "Director", kind: "sell", shares: 1000, value: 250_500, planned: true, acquired: false, after: 85000 });
  });
});

describe("proxy statements and announcements", () => {
  it("finds the CEO pay ratio and the proposals", () => {
    expect(findPayRatio("CEO Pay Ratio\nThe 2025 total compensation of our CEO was $74,294,811 and the ratio of these amounts is 533 to 1.")?.ratio).toBe(533);
    const p = findProposals("Proposal 1: Election of Directors\nsome text\nProposal 2: Ratification of Appointment of Auditor\nProposal 3 — Shareholder Proposal on Lobbying\n");
    expect(p.map((x) => x.number)).toEqual([1, 2, 3]);
    expect(p[2].byShareholder).toBe(true);
  });

  it("pulls the company's words under each 8-K item", () => {
    const ex = itemExcerpts("Item 5.02 Departure of Directors or Certain Officers; Election of Directors.\nOn July 8, 2025, the company announced that its chief operating officer will retire.\nItem 9.01 Financial Statements and Exhibits.\n(d) Exhibits\nSIGNATURES\n");
    expect(ex["5.02"]).toMatch(/^On July 8, 2025/);
    expect(topicsFor(["2.02"])).toEqual(["results"]);
  });

  it("sorts risk headings into themes", () => {
    expect(themeOf("The Company is exposed to credit risk and fluctuations in currency exchange rates.")).toBe("Economy and markets");
    expect(themeOf("The Company experiences cybersecurity incidents.")).toBe("Cyber and data");
  });
});
