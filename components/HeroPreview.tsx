/**
 * The picture under the front page's search box: three small answer cards floating
 * gently, the way a company page looks. They are drawings, not real figures: shapes
 * only, no numbers. Decoration, hidden from screen readers.
 */
import { StepIcon } from "./StepIcon";

function Card({
  id,
  title,
  className = "",
  delay = "0s",
  children,
}: {
  id: string;
  title: string;
  className?: string;
  delay?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`candor-float flex w-[176px] flex-none flex-col gap-3.5 rounded-[20px] border border-line bg-white p-4 shadow-[0_24px_48px_-28px_rgba(12,15,20,0.35)] sm:w-[232px] sm:p-5 ${className}`}
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center gap-2.5">
        <StepIcon id={id} size={30} />
        <span className="text-[13px] font-semibold tracking-[-0.01em] text-ink sm:text-[14px]">{title}</span>
      </div>
      {children}
    </div>
  );
}

export function HeroPreview() {
  return (
    <div aria-hidden="true" className="flex w-full justify-center pt-2">
      <div className="flex items-end">
        <Card id="business" title="What does it do?" className="relative z-0 -mr-12 -rotate-[5deg] sm:-mr-10" delay="-1.2s">
          <span className="flex flex-col gap-2">
            <span className="h-2 w-[92%] rounded-full bg-panel-2" />
            <span className="h-2 w-[78%] rounded-full bg-panel-2" />
            <span className="h-2 w-[60%] rounded-full bg-panel-2" />
          </span>
          <span className="flex gap-1.5">
            <span className="h-5 w-14 rounded-full bg-[#eef2ff]" />
            <span className="h-5 w-10 rounded-full bg-[#f1edff]" />
          </span>
        </Card>

        <Card id="performance" title="Is it growing?" className="relative z-10 sm:-mb-4" delay="0s">
          <span className="flex h-[78px] items-end gap-2 border-b border-line pb-px">
            {[34, 46, 52, 68, 88].map((h, i) => (
              <span
                key={h}
                className="fathom-grow-up flex-1 rounded-t-[5px]"
                style={{ height: `${h}%`, background: i === 4 ? "#0ea5a4" : "#c9ecec", animationDelay: `${0.2 + i * 0.08}s` }}
              />
            ))}
          </span>
          <span className="h-2 w-[64%] rounded-full bg-panel-2" />
        </Card>

        <Card id="health" title="Is it healthy?" className="relative z-0 -ml-12 rotate-[5deg] sm:-ml-10" delay="-2.4s">
          <svg viewBox="0 0 120 64" className="w-full">
            <path d="M10 58a50 50 0 0 1 100 0" fill="none" stroke="#f1f3f6" strokeWidth="12" strokeLinecap="round" />
            <path d="M10 58a50 50 0 0 1 78-41.5" fill="none" stroke="#f43f5e" strokeOpacity=".9" strokeWidth="12" strokeLinecap="round" />
            <line x1="60" y1="58" x2="86" y2="26" stroke="#0c0f14" strokeWidth="3" strokeLinecap="round" />
            <circle cx="60" cy="58" r="5" fill="#0c0f14" />
          </svg>
          <span className="h-2 w-[55%] rounded-full bg-panel-2" />
        </Card>
      </div>
    </div>
  );
}
