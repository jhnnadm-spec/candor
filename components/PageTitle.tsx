/** The heading every listing page shares: a big title and one line under it. */
export function PageTitle({ title, note }: { eyebrow?: string; title: string; note?: string }) {
  return (
    <div className="flex max-w-3xl flex-col gap-2">
      <h1 className="font-display text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[44px]">{title}</h1>
      {note && <p className="text-[18px] leading-relaxed text-muted">{note}</p>}
    </div>
  );
}
