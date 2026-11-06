/**
 * The front page's banner: a pale morning sky with soft candor colours drifting through
 * it, and dark dunes rising along the bottom, with a faint line of colour catching one
 * ridge. Purely decorative: drawn in code (no image to download), hidden from screen
 * readers, and still for anyone who has asked for less motion.
 */
import type { ReactNode } from "react";

export function HeroBanner({ children }: { children: ReactNode }) {
  return (
    <section className="candor-banner relative isolate overflow-hidden rounded-2xl">
      {/* Sky */}
      <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,#cbd7e6_0%,#dfe6ef_38%,#eef1f6_68%,#f6f7fa_100%)]" />

      {/* Fading colours drifting through the sky */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <span className="candor-glow absolute -left-[8%] -top-[18%] h-[60%] w-[46%] rounded-full bg-[#2d5bff] opacity-[0.22]" style={{ animationDuration: "26s" }} />
        <span className="candor-glow absolute right-[-6%] top-[-10%] h-[55%] w-[40%] rounded-full bg-[#7c5cff] opacity-[0.2]" style={{ animationDuration: "31s", animationDelay: "-8s" }} />
        <span className="candor-glow absolute right-[14%] top-[30%] h-[42%] w-[30%] rounded-full bg-[#0ea5a4] opacity-[0.16]" style={{ animationDuration: "28s", animationDelay: "-14s" }} />
        <span className="candor-glow absolute left-[30%] top-[46%] h-[34%] w-[34%] rounded-full bg-[#f59e0b] opacity-[0.12]" style={{ animationDuration: "34s", animationDelay: "-4s" }} />
        <span className="candor-glow absolute left-[-4%] top-[52%] h-[30%] w-[26%] rounded-full bg-[#f43f5e] opacity-[0.1]" style={{ animationDuration: "29s", animationDelay: "-19s" }} />
      </div>

      {/* Dunes */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[170px] w-full sm:h-[230px] lg:h-[290px]"
        viewBox="0 0 1440 300"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="dune-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3b4250" />
            <stop offset="1" stopColor="#1d222b" />
          </linearGradient>
          <linearGradient id="dune-main" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1f242e" />
            <stop offset="0.5" stopColor="#14181f" />
            <stop offset="1" stopColor="#0d1015" />
          </linearGradient>
          <linearGradient id="dune-light" x1="0" y1="0" x2="1" y2="0.5">
            <stop offset="0" stopColor="#a3aec0" stopOpacity="0" />
            <stop offset="0.45" stopColor="#a3aec0" stopOpacity="0.3" />
            <stop offset="1" stopColor="#a3aec0" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="dune-near" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#181c24" />
            <stop offset="1" stopColor="#0a0c10" />
          </linearGradient>
          <linearGradient id="dune-edge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#7d889b" stopOpacity="0" />
            <stop offset="0.5" stopColor="#7d889b" stopOpacity="0.55" />
            <stop offset="1" stopColor="#7d889b" stopOpacity="0" />
          </linearGradient>
          {/* the faint line of colour along the crest: brand colours, fading out at both ends */}
          <linearGradient id="ridge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0.02" stopColor="#2d5bff" stopOpacity="0" />
            <stop offset="0.2" stopColor="#2d5bff" stopOpacity="0.95" />
            <stop offset="0.44" stopColor="#7c5cff" stopOpacity="0.95" />
            <stop offset="0.66" stopColor="#0ea5a4" stopOpacity="0.95" />
            <stop offset="0.84" stopColor="#f59e0b" stopOpacity="0.85" />
            <stop offset="0.99" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* a distant dune showing in the saddle between the two big ones */}
        <path d="M430 170 C 520 150, 600 118, 660 112 C 700 108, 730 116, 770 132 C 840 158, 900 172, 980 176 L980 300 L430 300 Z" fill="url(#dune-far)" opacity="0.85" />
        {/* the two big dunes */}
        <path d="M0 236 C 120 176, 240 98, 330 76 C 372 66, 404 68, 436 82 C 516 116, 576 146, 650 152 C 760 160, 880 116, 1004 80 C 1054 66, 1104 60, 1146 70 C 1246 94, 1350 130, 1440 152 L1440 300 L0 300 Z" fill="url(#dune-main)" />
        {/* light grazing the slopes below each crest */}
        <path d="M330 76 C 372 66, 404 68, 436 82 C 516 116, 576 146, 650 152 C 700 170, 760 196, 860 228 C 700 214, 560 182, 450 140 C 400 118, 360 96, 330 76 Z" fill="url(#dune-light)" />
        <path d="M1004 80 C 1054 66, 1104 60, 1146 70 C 1246 94, 1350 130, 1440 152 L1440 186 C 1330 170, 1230 140, 1140 112 C 1090 98, 1040 88, 1004 80 Z" fill="url(#dune-light)" opacity="0.8" />
        <path className="candor-ridge" d="M0 236 C 120 176, 240 98, 330 76 C 372 66, 404 68, 436 82 C 516 116, 576 146, 650 152 C 760 160, 880 116, 1004 80 C 1054 66, 1104 60, 1146 70 C 1246 94, 1350 130, 1440 152" fill="none" stroke="url(#ridge)" strokeWidth="2" strokeLinecap="round" pathLength={1} />
        {/* a low dune sweeping across the front, its edge catching the light */}
        <path d="M0 268 C 240 246, 470 214, 720 222 C 930 228, 1150 258, 1440 242 L1440 300 L0 300 Z" fill="url(#dune-near)" />
        <path d="M0 268 C 240 246, 470 214, 720 222 C 930 228, 1150 258, 1440 242" fill="none" stroke="url(#dune-edge)" strokeWidth="1.5" />
      </svg>

      <div className="relative px-4 pb-[170px] pt-8 sm:px-10 sm:pb-[250px] sm:pt-14 lg:pb-[300px]">{children}</div>
    </section>
  );
}
