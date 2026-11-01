"use client";

/** "in about 45 days", worked out in the reader's browser so the page itself can stay cached. */
import { useEffect, useState } from "react";

export function DaysUntil({ date }: { date: string }) {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setDays(Math.max(0, Math.round((Date.parse(date) - Date.now()) / 86_400_000))), 0);
    return () => clearTimeout(t);
  }, [date]);
  if (days === null) return null;
  return <>{days === 0 ? " · any day now" : ` · in about ${days} day${days === 1 ? "" : "s"}`}</>;
}
