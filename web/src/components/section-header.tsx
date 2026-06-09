import React from "react";
import { Reveal } from "./reveal";

interface SectionHeaderProps {
  logo?: React.ReactNode;
  subtitle?: string;
  title: string;
  description?: string;
  light?: boolean; // Set to true if background is dark
  className?: string;
}

export function SectionHeader({
  logo,
  subtitle,
  title,
  description,
  light = false,
  className = "",
}: SectionHeaderProps) {
  return (
    <div
      className={`flex flex-col items-center text-center max-w-2xl mx-auto mb-12 sm:mb-16 px-5 ${className}`}
    >
      {logo && (
        <Reveal>
          <div className="mb-4 flex items-center justify-center float-slow">
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                light ? "bg-white/10 text-white" : "bg-brand-soft text-brand"
              } pulse-ring`}
            >
              {logo}
            </span>
          </div>
        </Reveal>
      )}

      {subtitle && (
        <Reveal delay={60}>
          <span
            className={`text-[12px] font-bold uppercase tracking-[0.18em] ${
              light ? "text-brand-soft" : "text-brand"
            } mb-3 block`}
          >
            {subtitle}
          </span>
        </Reveal>
      )}

      <Reveal delay={120}>
        <h2
          className={`text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.12] ${
            light ? "text-white" : "text-ink"
          }`}
        >
          {title}
        </h2>
      </Reveal>

      {description && (
        <Reveal delay={180}>
          <p
            className={`mt-4 text-[15px] sm:text-[16px] leading-relaxed ${
              light ? "text-white/70" : "text-muted"
            }`}
          >
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}
