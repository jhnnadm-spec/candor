/** The kinds of announcement, with their colours. Safe to use in the browser. */
export type AnnouncementTopic = "results" | "people" | "deals" | "money" | "votes" | "accounts" | "other";

export const TOPICS: Record<AnnouncementTopic, { label: string; color: string; soft: string }> = {
  results: { label: "Results", color: "#0b6f6e", soft: "#e6f7f7" },
  people: { label: "Leaders and board", color: "#5b3fd6", soft: "#f1edff" },
  deals: { label: "Deals and agreements", color: "#1f45d6", soft: "#eef2ff" },
  money: { label: "Debt and shares", color: "#8a5300", soft: "#fef6e7" },
  votes: { label: "Shareholder votes and rules", color: "#0369a1", soft: "#e6f6fd" },
  accounts: { label: "Accounts and audit", color: "#b4233c", soft: "#feecef" },
  other: { label: "Other news", color: "#3f4a5a", soft: "#f1f3f6" },
};

