/** How to read each financial statement, in plain words. Written once, the same for every company. */
import type { StatementKind } from "../sec/rpages";

export type StatementGuide = {
  kind: StatementKind;
  question: string; // the plain question it answers
  name: string; // the real name
  aka: string; // other names companies use
  short: string; // one line
  read: string; // how to read it, a short paragraph
  lookFor: string[]; // what people usually check first
  picture: string; // what the picture shows
};

export const GUIDES: Record<StatementKind, StatementGuide> = {
  income: {
    kind: "income",
    question: "Did it make money?",
    name: "Income statement",
    aka: "also called the statement of operations, statement of earnings or profit and loss",
    short: "Sales at the top, every cost taken away line by line, profit at the bottom.",
    read: "Read it from the top down. It starts with everything customers paid (sales), takes away the cost of making what was sold, then the costs of running the company, then interest and tax. What is left at the bottom is profit (net income), the part that belongs to shareholders. It covers a stretch of time: a year, or a quarter.",
    lookFor: [
      "Are sales growing compared with a year earlier?",
      "How much of each dollar of sales is left at each step (the margins)?",
      "Is profit growing faster or slower than sales?",
    ],
    picture: "From sales to profit: tap a bar to see the lines inside it.",
  },
  balance: {
    kind: "balance",
    question: "What does it own and owe?",
    name: "Balance sheet",
    aka: "also called the statement of financial position",
    short: "A snapshot on one day: what it owns, what it owes, and what's left for shareholders.",
    read: "Unlike the other statements, this is a snapshot of a single day. On one side is everything it owns (assets). On the other is how those things were paid for: by money it owes (liabilities) or by its shareholders (equity). The two sides always add up to the same total. Things are listed from the quickest to turn into cash down to the slowest.",
    lookFor: [
      "Does it have enough cash and short-term assets to pay the bills due within a year?",
      "How much does it owe compared with what it owns?",
      "Is shareholders' equity growing, and is it positive?",
    ],
    picture: "What it owns next to what it owes plus what belongs to shareholders. Tap any piece.",
  },
  cashflow: {
    kind: "cashflow",
    question: "Where did the cash come from and go?",
    name: "Cash flow statement",
    aka: "also called the statement of cash flows",
    short: "The real cash that came in and went out, in three groups.",
    read: "Profit and cash are not the same: a sale can be counted before the customer pays, and some costs (like wear and tear) use no cash at all. This statement follows the actual money. Cash from the main business comes first, then cash spent on investing (equipment, other companies, investments), then cash paid to or raised from lenders and shareholders (debt, dividends, buybacks). Together they explain why the cash pile grew or shrank.",
    lookFor: [
      "Does the main business bring in more cash than it reports as profit?",
      "How much goes on equipment and buildings (capital expenditure)?",
      "What is left after that (free cash flow), and is it paid out as dividends and buybacks?",
    ],
    picture: "From the cash it started with to the cash it ended with. Tap a bar for the lines inside.",
  },
  equity: {
    kind: "equity",
    question: "What changed for its shareholders?",
    name: "Statement of shareholders' equity",
    aka: "also called the statement of stockholders' equity or changes in equity",
    short: "How the shareholders' part of the company grew or shrank, and why.",
    read: "Shareholders' equity is what would be left for shareholders if everything the company owns paid off everything it owes, at the values in its books. This statement starts with that amount at the beginning of the period and lists everything that changed it: profit adds to it; dividends and share buybacks hand money back and lower it; shares given to staff add to it; and some gains and losses that skip the income statement also land here.",
    lookFor: [
      "How much of the profit was handed back through dividends and buybacks?",
      "How much is paid to staff in shares each year?",
      "Is equity rising or falling over time, and why?",
    ],
    picture: "From equity at the start to equity at the end. Tap a bar for what it means.",
  },
  comprehensive: {
    kind: "comprehensive",
    question: "What other gains and losses were there?",
    name: "Statement of comprehensive income",
    aka: "a short add-on to the income statement",
    short: "Profit, plus gains and losses that skip the income statement.",
    read: "Some value changes don't count as profit yet: currency moves on businesses abroad, rises or falls in investments it hasn't sold, and some hedges and pension changes. They are added to profit here to give comprehensive income, and they build up in shareholders' equity.",
    lookFor: ["Are these extra gains and losses large next to profit?"],
    picture: "",
  },
};
