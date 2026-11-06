/** What each Form 4 transaction code means. Safe to use in the browser. */
export type TradeKind = "buy" | "sell" | "award" | "tax" | "exercise" | "gift" | "other";

export const CODES: Record<string, { action: string; kind: TradeKind; why: string }> = {
  P: { action: "Bought shares on the open market", kind: "buy", why: "They paid their own money at the market price. People often watch these most closely." },
  S: { action: "Sold shares on the open market", kind: "sell", why: "Insiders sell for many reasons: paying taxes, buying a house, spreading their savings. Many sales are planned months ahead." },
  A: { action: "Received shares or options as pay", kind: "award", why: "A grant from the company as part of their pay, not a purchase." },
  M: { action: "Turned options or share units into shares", kind: "exercise", why: "Swapping options or units they already had for actual shares. Often followed by a sale or tax withholding." },
  X: { action: "Used options to buy shares", kind: "exercise", why: "Buying shares at the option's set price." },
  C: { action: "Converted into shares", kind: "exercise", why: "Swapping one kind of security for shares." },
  F: { action: "Shares kept back to pay tax", kind: "tax", why: "When share pay vests, the company keeps some shares to cover the tax bill. Not a decision to sell." },
  G: { action: "Gave shares away (gift)", kind: "gift", why: "A gift, often to family or charity. No money changes hands." },
  D: { action: "Handed shares back to the company", kind: "sell", why: "Shares returned to the company, not sold on the market." },
  W: { action: "Received or passed on by inheritance", kind: "other", why: "Shares passed on through a will." },
  J: { action: "Other kind of transaction", kind: "other", why: "A transaction that fits none of the standard types; the footnotes explain it." },
  I: { action: "Trade inside a company plan", kind: "other", why: "A transaction inside a company savings or pension plan." },
  K: { action: "Equity swap or similar deal", kind: "other", why: "A contract that changes their exposure to the share price." },
  V: { action: "Reported early, voluntarily", kind: "other", why: "A trade they chose to report before the deadline." },
  L: { action: "Small purchase", kind: "buy", why: "A small acquisition that could have been reported later." },
  Z: { action: "Moved into or out of a voting trust", kind: "other", why: "Shares deposited in or taken out of a voting trust." },
  E: { action: "Short option expired", kind: "other", why: "An option position ended without being used." },
  H: { action: "Option expired", kind: "other", why: "An option ended without being used." },
  O: { action: "Used options worth less than their price", kind: "exercise", why: "An unusual option exercise." },
  U: { action: "Sold in a takeover offer", kind: "sell", why: "Shares sold into an offer to buy the whole company." },
};

