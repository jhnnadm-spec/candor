/** The heading every listing page shares: a big title and one line under it. */
export function PageTitle({ title, note }: { eyebrow?: string; title: string; note?: string }) {
  return (
    <div className="flex max-w-3xl flex-col gap-2">
      <h1 className="font-display text-[34px] font-bold leading-[1.1] tracking-tight sm:text-[42px]">{title}</h1>
      <span aria-hidden="true" className="flex gap-1.5">
        <span className="h-1.5 w-10 rounded-full bg-[#2f8fb3]" />
        <span className="h-1.5 w-5 rounded-full bg-[#8b6cf2]" />
        <span className="h-1.5 w-2.5 rounded-full bg-[#ff6f59]" />
      </span>
      {note && <p className="text-[18px] leading-relaxed text-muted">{note}</p>}
    </div>
  );
}
