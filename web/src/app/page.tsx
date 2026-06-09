"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { WavyMeshBackground } from "@/components/wavy-mesh";

/* ─── Outline SVG Icons (Tabler Style, 20px, currentColor) ──────── */

function IconBooks() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
      <path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
      <path d="M3 6l0 13" />
      <path d="M12 6l0 13" />
      <path d="M21 6l0 13" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
    </svg>
  );
}

function IconChartLine() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19l16 0" />
      <path d="M4 15l4 -6l4 2l4 -5l4 4" />
    </svg>
  );
}

function IconVideo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 10l4.553 -2.276a1 1 0 0 1 1.447 .894v6.764a1 1 0 0 1 -1.447 .894l-4.553 -2.276v-4z" />
      <rect x="3" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function IconAddressBook() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6v12a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2z" />
      <path d="M10 16h6" />
      <path d="M13 11m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M4 8h3" />
      <path d="M4 12h3" />
      <path d="M4 16h3" />
    </svg>
  );
}

function IconTrophy() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21l8 0" />
      <path d="M12 17l0 4" />
      <path d="M7 4l10 0" />
      <path d="M17 4v8a5 5 0 0 1 -10 0v-8" />
      <path d="M5 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M5 9v1" />
      <path d="M19 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M19 9v1" />
    </svg>
  );
}

function IconMessages() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 14a2 2 0 0 1 -2 2h-14l-4 4v-14a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2z" />
      <path d="M14 8h-4" />
      <path d="M14 12h-4" />
    </svg>
  );
}

function IconRobot() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 11h10" />
      <path d="M5 8m0 2a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z" />
      <path d="M12 8l0 -3" />
      <path d="M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M9 13v.01" />
      <path d="M15 13v.01" />
    </svg>
  );
}

function IconCalendarEvent() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <line x1="16" y1="3" x2="16" y2="7" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="4" y1="11" x2="20" y2="11" />
      <rect x="8" y="14" width="2" height="2" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5l10 -10" />
    </svg>
  );
}

function IconPassport() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 5v2" />
      <path d="M12 17v2" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
    </svg>
  );
}

function IconNetwork() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
      <path d="M12 7v10" />
      <path d="M12 12h-7v5" />
      <path d="M12 12h7v5" />
    </svg>
  );
}

function IconSchool() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 9l-10 -4l-10 4l10 4z" />
      <path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4" />
    </svg>
  );
}

function IconMicrophone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function IconChecklist() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l11 0" />
      <path d="M9 12l11 0" />
      <path d="M9 18l11 0" />
      <circle cx="5" cy="6" r="1" fill="currentColor" />
      <circle cx="5" cy="12" r="1" fill="currentColor" />
      <circle cx="5" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}

function IconShieldCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12l2 2l4 -4" />
      <path d="M12 3a12 12 0 0 0 8.5 3c0 5.83 -2.63 11.23 -8.5 15a12 12 0 0 0 -8.5 -15a12 12 0 0 0 8.5 -3" />
    </svg>
  );
}

function IconLinkedin() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <line x1="8" y1="11" x2="8" y2="16" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
      <path d="M12 16v-5a3 3 0 0 1 6 0v5" />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3" />
      <circle cx="16.5" cy="7.5" r="1" fill="currentColor" />
    </svg>
  );
}

function IconYoutube() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="4" />
      <path d="M10 9l5 3l-5 3z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// Unused IconExternalLink removed

/* ─── Official Multicolor Circular Logo SVG ──────── */

function BrandLogo({ className = "shrink-0", size = 24 }: { className?: string; size?: number } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke="#E0DDD8" strokeWidth="0.5" />
      {/* segment 1: Orange */}
      <path d="M12 2A10 10 0 0 1 22 12" stroke="#F0A500" strokeWidth="3" strokeLinecap="round" />
      {/* segment 2: Violet */}
      <path d="M22 12A10 10 0 0 1 12 22" stroke="#6C3FC5" strokeWidth="3" strokeLinecap="round" />
      {/* segment 3: Noir */}
      <path d="M12 22A10 10 0 0 1 2 12" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" />
      {/* segment 4: Bleu */}
      <path d="M2 12A10 10 0 0 1 12 2" stroke="#2E6FD4" strokeWidth="3" strokeLinecap="round" />
      {/* segment 5: Rouge (core core) */}
      <circle cx="12" cy="12" r="3.5" fill="#E8174B" />
    </svg>
  );
}

/* ─── Horizontal 5-Color Brand Divider Bar ──────── */

function BrandBar({ className = "my-4", align = "center" }: { className?: string; align?: "center" | "left" }) {
  const colors = ["#F0A500", "#6C3FC5", "#1A1A1A", "#2E6FD4", "#E8174B"];
  return (
    <div className={`flex items-center gap-[2px] ${align === "center" ? "justify-center" : "justify-start"} ${className}`}>
      {colors.map((c, i) => (
        <span
          key={i}
          className="h-[3px] w-[32px] rounded-[2px]"
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}

/* ─── Corner Radial Dot Cluster component ──────── */

function RadialDotCluster({ anchor }: { anchor: "top-right" | "bottom-left" }) {
  const spacing = 14;
  const maxDistance = 320;
  const dots: React.ReactNode[] = [];
  const count = Math.ceil(maxDistance / spacing);

  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      const x = col * spacing;
      const y = row * spacing;
      const d = Math.sqrt(x * x + y * y);

      if (d <= maxDistance) {
        const factor = 1 - d / maxDistance;
        const opacity = 0.12 * factor;
        const radius = 2 * factor; // radius is 2px as requested

        dots.push(
          <circle
            key={`${row}-${col}`}
            cx={anchor === "top-right" ? 320 - x : x}
            cy={anchor === "bottom-left" ? 320 - y : y}
            r={radius}
            fill="#B8B5AE"
            opacity={opacity}
          />
        );
      }
    }
  }

  return (
    <svg
      width="320"
      height="320"
      viewBox="0 0 320 320"
      className={`absolute pointer-events-none z-0 ${
        anchor === "top-right" ? "top-0 right-0" : "bottom-0 left-0"
      }`}
    >
      {dots}
    </svg>
  );
}

/* ─── Parallax Halftone Section Wrapper ──────── */

function Section({
  children,
  id,
  className = "",
  bg = "bg-[#F4F3F0]",
  overlays,
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
  bg?: string;
  dotsColor?: string;
  dotsOpacity?: number;
  noDots?: boolean;
  overlays?: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={`relative overflow-hidden py-[120px] ${bg} ${className}`}
    >
      {overlays}
      <div className="relative mx-auto max-w-[1200px] px-6 z-10">
        {children}
      </div>
    </section>
  );
}

/* ─── Stat Animated Counter Component ──────── */

function AnimatedCounter({
  value,
  label,
  fontSizeClass = "text-[28px]",
  colorClass = "text-[#1A1A1A]",
}: {
  value: string;
  label: string;
  fontSizeClass?: string;
  colorClass?: string;
}) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const numValue = parseInt(value.replace(/\s/g, "").replace(/\+/g, ""), 10) || 0;
  const suffix = value.includes("+") ? "+" : "";

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let startTimestamp: number | null = null;
          const duration = 2000; // 2 seconds

          const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // Ease-out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(easeOut * numValue));

            if (progress < 1) {
              window.requestAnimationFrame(step);
            } else {
              setCount(numValue);
            }
          };

          window.requestAnimationFrame(step);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [numValue]);

  const formatNumber = (num: number) => {
    return num.toLocaleString("fr-FR").replace(/,/g, " ");
  };

  return (
    <div ref={elementRef} className="flex flex-col items-center justify-center">
      <span className={`font-serif ${fontSizeClass} ${colorClass} font-bold leading-none`}>
        {formatNumber(count)}{suffix}
      </span>
      <span className="font-sans text-[13px] text-[#6B6B6B] mt-2 uppercase tracking-[0.12em] text-center">
        {label}
      </span>
    </div>
  );
}

/* ─── Hero Card Fan Illustration Component ──────── */

interface MemberCardProps {
  tier: "standard" | "pro" | "elite";
  name: string;
  validity: string;
  memberId: string;
  className?: string;
  style?: React.CSSProperties;
}

function MemberCard({ tier, name, validity, memberId, className = "", style = {} }: MemberCardProps) {
  const isStandard = tier === "standard";
  const isPro = tier === "pro";
  const isElite = tier === "elite";

  // Accent Colors
  const accentColor = isStandard ? "#2E6FD4" : isPro ? "#6C3FC5" : "#C9A84C";
  const idBg = isStandard ? "bg-[#2E6FD4]/5" : isPro ? "bg-[#6C3FC5]/5" : "bg-[#C9A84C]/5";
  const idBorder = isStandard ? "border-[#2E6FD4]/25" : isPro ? "border-[#6C3FC5]/25" : "border-[#C9A84C]/25";
  const idText = isStandard ? "text-[#2E6FD4]" : isPro ? "text-[#6C3FC5]" : "text-[#C9A84C]";
  const titleText = isStandard ? "text-[#2E6FD4]" : isPro ? "text-[#6C3FC5]" : "text-[#C9A84C]";

  const tierTitle = isStandard ? "STANDARD" : isPro ? "PRO" : "ÉLITE";

  return (
    <div
      className={`w-[230px] sm:w-[250px] h-[355px] sm:h-[385px] bg-white border border-[#E0DDD8] rounded-[16px] overflow-hidden flex flex-col justify-between py-5 px-4 select-none relative transition-transform duration-300 ${className}`}
      style={{
        borderTop: `4px solid ${accentColor}`,
        ...style,
      }}
    >
      {/* Corner decorations */}
      <div 
        className="absolute top-2 right-2 w-6 h-6 border-t border-r pointer-events-none rounded-tr-[4px]"
        style={{ borderColor: `${accentColor}40` }} 
      />
      <div 
        className="absolute bottom-2 left-2 w-6 h-6 border-b border-l pointer-events-none rounded-bl-[4px]"
        style={{ borderColor: `${accentColor}40` }} 
      />

      {/* Header section */}
      <div className="flex flex-col items-center pt-1.5 relative z-10">
        <div className="flex items-center gap-2">
          <img src="/branding/logo.jpg" alt="Propulsion" className="h-7 w-auto mix-blend-multiply shrink-0" />
          <span className="font-serif text-[11px] font-bold tracking-[0.08em] text-[#1a1a1a]">PROPULSION</span>
        </div>
        <div className="text-[8px] font-bold tracking-[0.15em] text-[#6B6B6B] uppercase mt-1.5">
          CARTE DE MEMBRE
        </div>
        <div className={`font-serif text-[18px] font-bold tracking-[0.05em] mt-0.5 ${titleText}`}>
          {tierTitle}
        </div>
      </div>

      {/* Portrait photo section with dynamic crop/border */}
      <div className="flex-1 flex items-center justify-center py-2.5 relative z-10">
        {isStandard && (
          <div className="w-[95px] h-[105px] border border-[#2E6FD4]/50 p-[2px] rounded-lg overflow-hidden bg-white">
            <img
              src="/claudel_noubissie.png"
              alt="Dr. Claudel NOUBISSIE"
              className="w-full h-full object-cover object-top rounded-[6px]"
            />
          </div>
        )}

        {isPro && (
          <div 
            className="w-[100px] h-[100px] bg-[#6C3FC5] p-[1.5px] flex items-center justify-center"
            style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
          >
            <img
              src="/claudel_noubissie.png"
              alt="Dr. Claudel NOUBISSIE"
              className="w-full h-full object-cover object-top bg-white"
              style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
            />
          </div>
        )}

        {isElite && (
          <div className="w-[95px] h-[115px] border border-[#C9A84C] p-[2px] rounded-md overflow-hidden bg-white relative">
            <img
              src="/claudel_noubissie.png"
              alt="Dr. Claudel NOUBISSIE"
              className="w-full h-full object-cover object-top rounded-sm"
            />
          </div>
        )}
      </div>

      {/* Metadata Section */}
      <div className="flex flex-col gap-1.5 px-1.5 text-left w-full relative z-10">
        <div className="flex items-center gap-1.5 leading-none">
          {/* User Icon */}
          <svg className="w-2.5 h-2.5 text-[#6B6B6B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <div className="text-[10px] text-[#6B6B6B] truncate">
            <span className="font-bold text-[#6b6b6b]">Nom :</span> <span className="text-[#1a1a1a] font-bold">{name}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 leading-none">
          {/* Calendar Icon */}
          <svg className="w-2.5 h-2.5 text-[#6B6B6B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div className="text-[10px] text-[#6B6B6B] truncate">
            <span className="font-bold text-[#6b6b6b]">Validité :</span> <span className="text-[#1a1a1a]">{validity}</span>
          </div>
        </div>

        {/* Member ID Pill */}
        <div className={`mt-1 py-1 px-2.5 rounded-[4px] border text-center text-[9px] font-bold tracking-wider uppercase ${idBg} ${idBorder} ${idText}`}>
          ID MEMBRE : {memberId}
        </div>
      </div>
    </div>
  );
}

function FannedCards() {
  return (
    <div className="relative w-full h-[400px] sm:h-[420px] md:h-[480px] flex items-center justify-center select-none scale-90 sm:scale-100 transition-transform">
      {/* Background halftone cluster behind cards */}
      <div
        className="absolute w-[280px] h-[280px] opacity-40 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#D0CEC8 2px, transparent 2px)`,
          backgroundSize: "12px 12px",
          WebkitMaskImage: `radial-gradient(circle, black, transparent 70%)`,
          maskImage: `radial-gradient(circle, black, transparent 70%)`,
        }}
      />

      {/* Card 1: Standard (Blue) -8deg */}
      <div
        className="absolute transition-all duration-300 hover:z-30 z-10 group"
        style={{
          transform: "rotate(-8deg) translateX(-55px) translateY(20px)",
        }}
      >
        <MemberCard
          tier="standard"
          name="NOUBISSIE Claudel Joel"
          validity="04 mai 2025 au 04 mai 2026"
          memberId="PRP-STD-2025-0843"
          className="group-hover:scale-105"
        />
      </div>

      {/* Card 2: Pro (Violet) 0deg */}
      <div
        className="absolute transition-all duration-300 hover:z-30 z-20 group"
        style={{
          transform: "rotate(0deg) translateY(-20px)",
        }}
      >
        <MemberCard
          tier="pro"
          name="NOUBISSIE Claudel Joel"
          validity="04 mai 2025 au 04 mai 2026"
          memberId="PRP-PRO-2025-0612"
          className="group-hover:scale-105"
        />
      </div>

      {/* Card 3: Elite (Gold) +8deg */}
      <div
        className="absolute transition-all duration-300 hover:z-30 z-10 group"
        style={{
          transform: "rotate(8deg) translateX(55px) translateY(20px)",
        }}
      >
        <MemberCard
          tier="elite"
          name="NOUBISSIE Claudel Joel"
          validity="04 mai 2025 au 04 mai 2026"
          memberId="PRP-ELT-2025-0001"
          className="group-hover:scale-105"
        />
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   MAIN LANDING PAGE COMPONENT
   Clean editorial layout, Cormorant/Playfair serif headlines, DM Sans body.
   Smooth scroll animations with stagger delay. Zero drop shadows.
═══════════════════════════════════════════════════════════════════════════ */

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="font-sans min-h-screen bg-[#F4F3F0] text-[#1A1A1A] antialiased">
      
      {/* ── Fixed Navbar ── */}
      <header
        className={`fixed top-0 inset-x-0 h-[88px] z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#F4F3F0]/98 border-b border-[#E0DDD8] backdrop-blur-sm"
            : "bg-[#F4F3F0] border-b border-transparent"
        }`}
      >
        <div className="mx-auto max-w-[1200px] px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="#top" className="flex items-center">
            <img src="/branding/logo.jpg" alt="Propulsion" className="h-[72px] w-auto mix-blend-multiply shrink-0" />
          </Link>

          {/* Desktop Nav links */}
          <nav className="hidden md:flex items-center gap-6 text-[14px] font-normal text-[#6B6B6B]">
            <Link href="#top" className="hover:text-[#1A1A1A] transition-colors">Accueil</Link>
            <Link href="#offres" className="hover:text-[#1A1A1A] transition-colors">Les formules</Link>
            <Link href="/masterclasses" className="hover:text-[#1A1A1A] transition-colors">Masterclass</Link>
            <Link href="/evenements" className="hover:text-[#1A1A1A] transition-colors">Événements</Link>
            <Link href="/annuaire" className="hover:text-[#1A1A1A] transition-colors">Annuaire</Link>
          </nav>

          {/* Desktop Auth CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/connexion"
              className="text-[14px] font-bold text-[#1A1A1A] px-4 py-2 hover:opacity-80 transition-opacity"
            >
              Se connecter
            </Link>
            <Link
              href="/rejoindre"
              className="bg-[#1A1A1A] text-white text-[14px] font-bold h-10 px-5 rounded-[8px] flex items-center justify-center transition-all duration-200 hover:scale-[1.02] border border-transparent hover:border-white/10 active:scale-[0.98]"
            >
              Rejoindre Propulsion
            </Link>
          </div>

          {/* Mobile Toggler */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#1A1A1A] hover:bg-black/5 rounded-[8px] transition-colors"
          >
            {mobileMenuOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[88px] bg-[#F4F3F0] z-40 md:hidden flex flex-col p-6 border-t border-[#E0DDD8] animate-drawer-slide">
          <nav className="flex flex-col gap-6 text-[18px] font-normal text-[#6B6B6B] mb-8">
            <Link href="#top" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#1A1A1A]">Accueil</Link>
            <Link href="#offres" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#1A1A1A]">Les formules</Link>
            <Link href="/masterclasses" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#1A1A1A]">Masterclass</Link>
            <Link href="/evenements" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#1A1A1A]">Événements</Link>
            <Link href="/annuaire" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#1A1A1A]">Annuaire</Link>
          </nav>
          <div className="flex flex-col gap-3">
            <Link href="/connexion" onClick={() => setMobileMenuOpen(false)} className="text-[15px] font-bold text-[#1A1A1A] py-3 text-center border border-[#1A1A1A] rounded-[8px]">
              Se connecter
            </Link>
            <Link href="/rejoindre" onClick={() => setMobileMenuOpen(false)} className="bg-[#1A1A1A] text-white text-[15px] font-bold py-3 text-center rounded-[8px]">
              Rejoindre Propulsion
            </Link>
          </div>
        </div>
      )}

      {/* ── Page Content ── */}
      <main id="top" className="pt-[88px]">

        {/* ══════════════════════════════════════════════════════════
            SECTION 01 — HERO
        ══════════════════════════════════════════════════════════ */}
        <Section bg="bg-[#F4F3F0]" className="border-b border-[#E0DDD8]" noDots={true} overlays={<WavyMeshBackground />}>
          <div className="max-w-[800px] mx-auto text-center py-12 lg:py-20">
            <Reveal direction="up">
              <span className="block text-[#6B6B6B] text-[12px] font-bold tracking-[0.12em] uppercase">
                LA COMMUNAUTÉ ENTREPRENEURIALE PANAFRICAINE
              </span>
              
              {/* Horizontal segment brand bar centered */}
              <BrandBar align="center" className="mt-3 mb-6 mx-auto" />

              <h1 className="font-serif text-[56px] sm:text-[68px] md:text-[80px] font-bold leading-[1.05] tracking-tight text-[#1A1A1A]">
                Ensemble, nous <span className="text-brand">allons plus loin.</span>
              </h1>
              
              <p className="mt-6 mx-auto max-w-[580px] text-[18px] font-normal leading-[1.75] text-[#6B6B6B]">
                Propulsion est la communauté des entrepreneurs africains qui passent à l&apos;action. Masterclass, ressources, networking et accompagnement — tout au même endroit.
              </p>
              
              <div className="mt-8 flex flex-wrap gap-3 justify-center">
                <Link
                  href="/rejoindre"
                  className="bg-[#1A1A1A] text-white text-[15px] font-bold h-12 px-8 rounded-[8px] flex items-center justify-center transition-all duration-200 hover:scale-[1.02] border border-transparent hover:border-white/10 active:scale-[0.98]"
                >
                  Rejoindre Propulsion
                </Link>
                <Link
                  href="#offres"
                  className="bg-transparent border border-[#1A1A1A] text-[#1A1A1A] text-[15px] font-bold h-12 px-8 rounded-[8px] flex items-center justify-center transition-all duration-200 hover:scale-[1.02] hover:bg-black/5 active:scale-[0.98]"
                >
                  Découvrir les formules
                </Link>
              </div>
            </Reveal>
          </div>
        </Section>

        {/* ── Stat Bar (Below Hero) ── */}
        <section className="bg-white border-b border-[#E0DDD8] py-4 relative z-10">
          <div className="mx-auto max-w-[1200px] px-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-[#E0DDD8]">
            <AnimatedCounter value="2 000+" label="Membres actifs" />
            <AnimatedCounter value="30+" label="Pays représentés" />
            <AnimatedCounter value="200+" label="Replays & Masterclasses" />
            <AnimatedCounter value="3" label="Niveaux d'engagement" />
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 02 — LE DÉFI
        ══════════════════════════════════════════════════════════ */}
        <Section id="defi" bg="bg-[#F4F3F0]" className="border-b border-[#E0DDD8]">
          
          {/* Centered Header */}
          <div className="text-center mb-16">
            <Reveal>
              <span className="block text-[#6B6B6B] text-[12px] font-bold tracking-[0.12em] uppercase">
                LE CONTEXTE
              </span>
              <BrandBar align="center" className="mt-3 mb-4" />
              <h2 className="font-serif text-[48px] font-bold leading-[1.1] text-[#1A1A1A] whitespace-pre-line">
                Votre potentiel est là.{"\n"}Ce qui manque, <span className="text-purple">c&apos;est la structure.</span>
              </h2>
              <p className="mt-6 mx-auto max-w-[580px] text-[17px] leading-[1.75] text-[#6B6B6B]">
                Beaucoup d&apos;entrepreneurs ont les idées, l&apos;énergie, l&apos;ambition. Ce qui fait la différence, c&apos;est le cadre d&apos;exécution et l&apos;environnement d&apos;élite.
              </p>
            </Reveal>
          </div>

          {/* Grid of 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <Reveal direction="left" delay={0}>
              <div className="bg-white border border-[#E0DDD8] rounded-[16px] p-8 h-full flex flex-col justify-between defi-card-hover">
                <div>
                  <span className="text-[#2E6FD4] mb-6 block">
                    <IconBooks />
                  </span>
                  <h3 className="font-serif text-[20px] font-bold text-[#1A1A1A] mb-3 leading-tight">
                    Vous apprenez, mais vous n&apos;appliquez pas
                  </h3>
                  <p className="font-sans text-[15px] leading-[1.7] text-[#6B6B6B]">
                    Les formations s&apos;accumulent. Les notes aussi. Mais sans un cadre d&apos;exécution et une communauté qui vous pousse, la théorie reste de la théorie.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Card 2 */}
            <Reveal direction="up" delay={100}>
              <div className="bg-white border border-[#E0DDD8] rounded-[16px] p-8 h-full flex flex-col justify-between defi-card-hover">
                <div>
                  <span className="text-[#6C3FC5] mb-6 block">
                    <IconUsers />
                  </span>
                  <h3 className="font-serif text-[20px] font-bold text-[#1A1A1A] mb-3 leading-tight">
                    Vous avancez seul, alors que vous pourriez avancer ensemble
                  </h3>
                  <p className="font-sans text-[15px] leading-[1.7] text-[#6B6B6B]">
                    Trouver un partenaire de confiance, un client d&apos;envergure, un mentor inspirant dans votre secteur ne devrait pas relever du parcours du combattant.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Card 3 */}
            <Reveal direction="right" delay={200}>
              <div className="bg-white border border-[#E0DDD8] rounded-[16px] p-8 h-full flex flex-col justify-between defi-card-hover">
                <div>
                  <span className="text-[#F0A500] mb-6 block">
                    <IconChartLine />
                  </span>
                  <h3 className="font-serif text-[20px] font-bold text-[#1A1A1A] mb-3 leading-tight">
                    Vous n&apos;avez aucun repère sur votre progression
                  </h3>
                  <p className="font-sans text-[15px] leading-[1.7] text-[#6B6B6B]">
                    Pas de suivi clair, pas de tableau de bord de votre progression. Difficile d&apos;ajuster ses actions quand on navigue sans boussole.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 03 — LA SOLUTION
        ══════════════════════════════════════════════════════════ */}
        <Section id="solution" bg="bg-white" noDots className="border-b border-[#E0DDD8]">
          
          {/* Centered Header */}
          <div className="text-center mb-16">
            <Reveal>
              <span className="block text-[#6B6B6B] text-[12px] font-bold tracking-[0.12em] uppercase">
                LA SOLUTION
              </span>
              <BrandBar align="center" className="mt-3 mb-4" />
              <h2 className="font-serif text-[48px] font-bold leading-[1.1] text-[#1A1A1A]">
                <span className="text-red">Propulsion</span>, c&apos;est l&apos;infrastructure de votre croissance.
              </h2>
              <p className="mt-6 mx-auto max-w-[560px] text-[17px] leading-[1.75] text-[#6B6B6B]">
                Pas un cours théorique de plus. Un écosystème conçu pour les bâtisseurs qui exigent des résultats concrets.
              </p>
            </Reveal>
          </div>

          {/* Grid 3x2 Features (Borderless, flat stacked) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <Reveal direction="left" delay={0}>
              <div className="bg-white border border-[#E0DDD8] rounded-[16px] p-8 h-full flex flex-col justify-between feature-card feature-card-red">
                <div>
                  <div className="w-12 h-12 rounded-[12px] bg-red-soft text-red flex items-center justify-center mb-6 shrink-0">
                    <IconVideo />
                  </div>
                  <h3 className="font-serif text-[19px] font-bold text-[#1A1A1A] mb-3 leading-snug">
                    Masterclass & replays
                  </h3>
                  <p className="font-sans text-[14px] leading-[1.6] text-[#6B6B6B]">
                    Chaque semaine, une session live animée par le Dr Claudel NOUBISSIE ou un expert. Plus de 200 heures de ressources à haute valeur ajoutée.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Feature 2 */}
            <Reveal direction="up" delay={100}>
              <div className="bg-white border border-[#E0DDD8] rounded-[16px] p-8 h-full flex flex-col justify-between feature-card feature-card-blue">
                <div>
                  <div className="w-12 h-12 rounded-[12px] bg-brand-soft text-brand flex items-center justify-center mb-6 shrink-0">
                    <IconAddressBook />
                  </div>
                  <h3 className="font-serif text-[19px] font-bold text-[#1A1A1A] mb-3 leading-snug">
                    Annuaire des membres
                  </h3>
                  <p className="font-sans text-[14px] leading-[1.6] text-[#6B6B6B]">
                    Un annuaire géolocalisé pour connecter instantanément avec les entrepreneurs de votre secteur dans plus de 30 pays.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Feature 3 */}
            <Reveal direction="right" delay={200}>
              <div className="bg-white border border-[#E0DDD8] rounded-[16px] p-8 h-full flex flex-col justify-between feature-card feature-card-gold">
                <div>
                  <div className="w-12 h-12 rounded-[12px] bg-gold-soft text-gold flex items-center justify-center mb-6 shrink-0">
                    <IconTrophy />
                  </div>
                  <h3 className="font-serif text-[19px] font-bold text-[#1A1A1A] mb-3 leading-snug">
                    Challenges hebdomadaires
                  </h3>
                  <p className="font-sans text-[14px] leading-[1.6] text-[#6B6B6B]">
                    Des sprints d&apos;action de 7 jours pour appliquer la théorie et mesurer votre progression en temps réel avec des points.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Feature 4 */}
            <Reveal direction="left" delay={300}>
              <div className="bg-white border border-[#E0DDD8] rounded-[16px] p-8 h-full flex flex-col justify-between feature-card feature-card-purple">
                <div>
                  <div className="w-12 h-12 rounded-[12px] bg-purple-soft text-purple flex items-center justify-center mb-6 shrink-0">
                    <IconMessages />
                  </div>
                  <h3 className="font-serif text-[19px] font-bold text-[#1A1A1A] mb-3 leading-snug">
                    Réseau social privé
                  </h3>
                  <p className="font-sans text-[14px] leading-[1.6] text-[#6B6B6B]">
                    Échangez sans le bruit et les distractions des réseaux classiques au sein d&apos;une agora exclusive et modérée.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Feature 5 */}
            <Reveal direction="up" delay={400}>
              <div className="bg-white border border-[#E0DDD8] rounded-[16px] p-8 h-full flex flex-col justify-between feature-card feature-card-dark">
                <div>
                  <div className="w-12 h-12 rounded-[12px] bg-[#1A1A1A]/5 text-[#1A1A1A] flex items-center justify-center mb-6 shrink-0">
                    <IconRobot />
                  </div>
                  <h3 className="font-serif text-[19px] font-bold text-[#1A1A1A] mb-3 leading-snug">
                    Agent IA Propulsion
                  </h3>
                  <p className="font-sans text-[14px] leading-[1.6] text-[#6B6B6B]">
                    Un copilote intelligent entraîné sur toutes les ressources de la communauté, disponible 24/7 pour vous orienter.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Feature 6 */}
            <Reveal direction="right" delay={500}>
              <div className="bg-white border border-[#E0DDD8] rounded-[16px] p-8 h-full flex flex-col justify-between feature-card feature-card-red">
                <div>
                  <div className="w-12 h-12 rounded-[12px] bg-red-soft text-red flex items-center justify-center mb-6 shrink-0">
                    <IconCalendarEvent />
                  </div>
                  <h3 className="font-serif text-[19px] font-bold text-[#1A1A1A] mb-3 leading-snug">
                    Événements & Apéros Business
                  </h3>
                  <p className="font-sans text-[14px] leading-[1.6] text-[#6B6B6B]">
                    Rencontres physiques et virtuelles régulières en Afrique et en diaspora pour transformer le digital en opportunités concrètes.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 04 — LES FORMULES
        ══════════════════════════════════════════════════════════ */}
        <Section id="offres" bg="bg-[#F4F3F0]" className="border-b border-[#E0DDD8]">
          
          {/* Centered Header */}
          <div className="text-center mb-16">
            <Reveal>
              <span className="block text-[#6B6B6B] text-[12px] font-bold tracking-[0.12em] uppercase">
                LES FORMULES
              </span>
              <BrandBar align="center" className="mt-3 mb-4" />
              <h2 className="font-serif text-[48px] font-bold leading-[1.1] text-[#1A1A1A]">
                Choisissez votre niveau d&apos;engagement.
              </h2>
            </Reveal>
          </div>

          {/* Grid of 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            {/* Standard Formula */}
            <Reveal direction="left" delay={0}>
              <div className="bg-white border border-[#E0DDD8] rounded-[16px] p-8 flex flex-col justify-between h-full formula-card-standard-hover">
                <div>
                  <h3 className="font-serif text-[28px] font-bold text-[#1A1A1A]">Standard</h3>
                  <p className="font-sans text-[14px] italic text-[#6B6B6B] mt-2 mb-6">
                    Pour poser les fondations de votre structure.
                  </p>
                  <div className="border-t border-[#E0DDD8] my-4" />
                  <ul className="space-y-3">
                    {[
                      "Masterclass hebdomadaires",
                      "Replays illimités",
                      "Challenges d'exécution",
                      "Parrainage et commissions (10%)",
                      "Accès au réseau social privé",
                    ].map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-[14px] text-[#1A1A1A]">
                        <span className="text-[#2E6FD4] mt-0.5"><IconCheck /></span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/rejoindre?offer=Standard"
                  className="mt-8 border border-[#1A1A1A] text-[#1A1A1A] text-[15px] font-bold h-12 rounded-[8px] flex items-center justify-center transition-all duration-200 hover:scale-[1.02] hover:bg-[#F4F3F0] active:scale-[0.98]"
                >
                  Rejoindre en Standard
                </Link>
              </div>
            </Reveal>

            {/* Pro Formula (Featured) */}
            <Reveal direction="zoom" delay={100}>
              <div className="relative bg-white border-2 border-[#6C3FC5] rounded-[16px] p-8 flex flex-col justify-between h-full formula-card-pro-hover">
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#F0EEFF] text-[#6C3FC5] text-[11px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
                  Le plus choisi
                </span>
                <div>
                  <h3 className="font-serif text-[28px] font-bold text-[#6C3FC5]">Pro</h3>
                  <p className="font-sans text-[14px] italic text-[#6B6B6B] mt-2 mb-6">
                    Pour accélérer votre exécution commerciale.
                  </p>
                  <div className="border-t border-[#E0DDD8] my-4" />
                  <ul className="space-y-3">
                    {[
                      "Tout ce qui est inclus dans Standard",
                      "Annuaire complet des membres",
                      "Fiches business géolocalisées",
                      "Session de questions-réponses mensuelle",
                      "Copilote IA Propulsion 24/7",
                      "Événements & Apéros Business",
                      "Support prioritaire",
                    ].map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-[14px] text-[#1A1A1A]">
                        <span className="text-[#6C3FC5] mt-0.5"><IconCheck /></span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/rejoindre?offer=Pro"
                  className="mt-8 bg-[#1A1A1A] text-white text-[15px] font-bold h-12 rounded-[8px] flex items-center justify-center transition-all duration-200 hover:scale-[1.02] hover:bg-[#2A2A2A] border border-transparent hover:border-white/10 active:scale-[0.98]"
                >
                  Choisir la formule Pro
                </Link>
              </div>
            </Reveal>

            {/* Elite Formula */}
            <Reveal direction="right" delay={200}>
              <div className="relative bg-white border-2 border-[#C9A84C] rounded-[16px] p-8 flex flex-col justify-between h-full formula-card-elite-hover">
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FBF5E6] text-[#C9A84C] text-[11px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
                  Accès exclusif
                </span>
                <div>
                  <h3 className="font-serif text-[28px] font-bold text-[#C9A84C]">Élite</h3>
                  <p className="font-sans text-[14px] italic text-[#6B6B6B] mt-2 mb-6">
                    Pour les leaders qui visent le sommet.
                  </p>
                  <div className="border-t border-[#E0DDD8] my-4" />
                  <ul className="space-y-3">
                    {[
                      "Tout ce qui est inclus dans Pro",
                      "Mentorat stratégique avec le Dr NOUBISSIE",
                      "Badge Élite et visibilité premium",
                      "Canal privé VIP Élite",
                      "Accompagnement de structuration",
                      "Dîners d'affaires privés inclus",
                      "Opportunités d'investissement exclusives",
                    ].map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-[14px] text-[#1A1A1A]">
                        <span className="text-[#C9A84C] mt-0.5"><IconCheck /></span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/rejoindre?offer=Elite"
                  className="mt-8 border border-[#C9A84C] text-[#C9A84C] text-[15px] font-bold h-12 rounded-[8px] flex items-center justify-center transition-all duration-200 hover:scale-[1.02] hover:bg-[#FBF5E6] active:scale-[0.98]"
                >
                  Accéder au niveau Élite
                </Link>
              </div>
            </Reveal>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 05 — PREUVES SOCIALES (Dark Mode Theme)
        ══════════════════════════════════════════════════════════ */}
        <Section id="temoignages" bg="bg-[#1A1A1A]" dotsColor="#2A2A2A" dotsOpacity={0.6} className="text-white border-b border-black">
          
          {/* Animated Counters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-[#2D2D2D] mb-16">
            <AnimatedCounter value="2 000+" label="Membres actifs" fontSizeClass="text-[64px]" colorClass="text-white" />
            <AnimatedCounter value="30+" label="Pays représentés" fontSizeClass="text-[64px]" colorClass="text-white" />
            <AnimatedCounter value="200+" label="Replays & Masterclasses" fontSizeClass="text-[64px]" colorClass="text-white" />
          </div>

          <BrandBar align="center" className="my-8" />

          {/* Testimonial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "Depuis que j'ai rejoint Propulsion, j'ai structuré mon activité et sécurisé mes premiers contrats d'envergure. Le cadre d'exécution a tout changé.",
                name: "Aminata K.",
                location: "Dakar, Sénégal 🇸🇳",
                badge: "Pro",
                badgeColor: "text-[#6C3FC5] bg-[#6C3FC5]/15",
                initials: "AK",
                avatarBg: "bg-[#6C3FC5]"
              },
              {
                quote: "Les masterclass de vente et négociation sont d'une efficacité redoutable. On applique le soir même ce qu'on apprend.",
                name: "Rodrigue M.",
                location: "Douala, Cameroun 🇨🇲",
                badge: "Standard",
                badgeColor: "text-[#2E6FD4] bg-[#2E6FD4]/15",
                initials: "RM",
                avatarBg: "bg-[#2E6FD4]"
              },
              {
                quote: "Grâce à l'annuaire et au réseau VIP, j'ai trouvé un partenaire clé en moins d'une semaine. L'investissement est rentabilisé au centuple.",
                name: "Grace T.",
                location: "Kinshasa, RDC 🇨🇩",
                badge: "Élite",
                badgeColor: "text-[#C9A84C] bg-[#C9A84C]/15",
                initials: "GT",
                avatarBg: "bg-[#C9A84C]"
              }
            ].map((test, idx) => (
              <Reveal key={idx} direction={idx === 0 ? "left" : idx === 1 ? "zoom" : "right"} delay={idx * 100}>
                <div className="bg-[#242424] border border-[#333333] rounded-[16px] p-8 h-full flex flex-col justify-between defi-card-hover">
                  <p className="font-sans text-[15px] italic text-[#CCCCCC] leading-[1.75] mb-6">
                    &ldquo;{test.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 border-t border-[#333333] pt-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-sans text-[14px] font-bold shrink-0 ${test.avatarBg}`}>
                      {test.initials}
                    </div>
                    <div>
                      <p className="font-sans text-[14px] font-bold text-white">{test.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-sans text-[13px] text-[#6B6B6B]">{test.location}</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${test.badgeColor}`}>
                          {test.badge}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>


        </Section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 06 — PROGRAMME HEBDOMADAIRE
        ══════════════════════════════════════════════════════════ */}
        <Section id="programme" bg="bg-white" noDots className="border-b border-[#E0DDD8]">
          
          {/* Centered Header */}
          <div className="text-center mb-16">
            <Reveal>
              <span className="block text-[#6B6B6B] text-[12px] font-bold tracking-[0.12em] uppercase">
                LA SEMAINE TYPE
              </span>
              <BrandBar align="center" className="mt-3 mb-4" />
              <h2 className="font-serif text-[48px] font-bold leading-[1.1] text-[#1A1A1A]">
                Dans Propulsion, chaque jour a une intention.
              </h2>
            </Reveal>
          </div>

          {/* 7-Column Strip Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            {[
              { name: "Lundi", time: "19h30", icon: <IconPassport />, title: "Passeport Propulsion", desc: "Accueil et orientation des nouveaux membres.", featured: false, color: "#2E6FD4", softBg: "bg-brand-soft", textClass: "text-brand" },
              { name: "Mardi", time: "19h30", icon: <IconChartLine />, title: "Clinique de vente", desc: "Closing et traitement des objections.", featured: false, color: "#E8174B", softBg: "bg-red-soft", textClass: "text-red" },
              { name: "Mercredi", time: "—", icon: <IconStar />, title: "Visibilité Élite", desc: "Pitch de nos membres VIP.", featured: false, color: "#F0A500", softBg: "bg-gold-soft", textClass: "text-gold" },
              { name: "Jeudi", time: "—", icon: <IconNetwork />, title: "Agents & Structuration", desc: "Organisation, processus et IA.", featured: false, color: "#1A1A1A", softBg: "bg-[#EAE8E3]", textClass: "text-dark" },
              { name: "Vendredi", time: "20h00", icon: <IconSchool />, title: "Masterclass", desc: "Grande session hebdomadaire live.", featured: true, color: "#6C3FC5", softBg: "bg-purple-soft", textClass: "text-purple" },
              { name: "Samedi", time: "—", icon: <IconMicrophone />, title: "Pitch Arena", desc: "Critiques constructives de projets.", featured: false, color: "#2E6FD4", softBg: "bg-brand-soft", textClass: "text-brand" },
              { name: "Dimanche", time: "17h00", icon: <IconChecklist />, title: "Bilan & Plan", desc: "Évaluation et planification d&apos;objectifs.", featured: false, color: "#F0A500", softBg: "bg-gold-soft", textClass: "text-gold" },
            ].map((day, idx) => (
              <Reveal key={day.name} delay={idx * 100}>
                <div
                  className={`bg-white border border-[#E0DDD8] rounded-[12px] p-5 flex flex-col justify-between h-full relative day-card-hover`}
                  style={{
                    borderTop: `4px solid ${day.color}`,
                    ["--hover-glow" as any]: day.color,
                  }}
                >
                  {day.featured && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#6C3FC5] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap z-10">
                      Session phare
                    </span>
                  )}
                  <div>
                    <div className="flex items-center justify-between mb-4 border-b border-[#E0DDD8]/40 pb-2">
                      <span className="font-serif text-[15px] font-bold text-[#1A1A1A]">{day.name}</span>
                      {day.time !== "—" ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${day.softBg} ${day.textClass} tracking-wide`}>
                          {day.time}
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-400 font-medium px-2 py-0.5 bg-neutral-100 rounded-full">
                          —
                        </span>
                      )}
                    </div>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${day.softBg} ${day.textClass} mb-3`}>
                      {day.icon}
                    </div>
                  </div>
                  <div className="mt-2">
                    <h4 className="font-sans text-[14px] font-bold text-[#1A1A1A] leading-tight mb-1">{day.title}</h4>
                    <p className="font-sans text-[12px] text-[#6B6B6B] leading-relaxed line-clamp-2">{day.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 07 — AGENT IA
        ══════════════════════════════════════════════════════════ */}
        <Section id="agent-ia" bg="bg-[#F4F3F0]" className="border-b border-[#E0DDD8]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column (50%) */}
            <div className="lg:col-span-6">
              <Reveal direction="left">
                <span className="block text-[#6B6B6B] text-[12px] font-bold tracking-[0.12em] uppercase">
                  INTELLIGENCE ARTIFICIELLE
                </span>
                <BrandBar align="left" className="mt-3 mb-6" />
                <h2 className="font-serif text-[36px] font-bold leading-[1.1] text-[#1A1A1A]">
                  Votre assistant <span className="text-gold">Propulsion</span>, disponible à toute heure.
                </h2>
                <p className="mt-6 text-[17px] leading-[1.75] text-[#6B6B6B]">
                  Des questions entre deux sessions ? Notre copilote d&apos;intelligence artificielle est entraîné sur l&apos;ensemble des formations, guides et ressources de Propulsion pour vous assister instantanément.
                </p>

                {/* 3 Capabilities */}
                <ul className="mt-8 space-y-4">
                  {[
                    "Réponses instantanées sur toutes les méthodologies Propulsion",
                    "Orientation intelligente vers les replays et fiches pratiques",
                    "Disponible 24h/24, 7j/7 depuis votre mobile ou ordinateur",
                  ].map((cap, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-[15px] text-[#1A1A1A]">
                      <span className="text-[#E8174B] mt-0.5"><IconCheck /></span>
                      <span>{cap}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <span className="inline-block bg-[#F0EEFF] text-[#6C3FC5] text-[11px] font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
                    Propulsé par intelligence artificielle
                  </span>
                </div>
              </Reveal>
            </div>

            {/* Right Column (50%) */}
            <div className="lg:col-span-6 flex justify-center">
              <Reveal delay={100}>
                {/* Flat Phone Mockup Frame */}
                <div className="w-[320px] border border-[#E0DDD8] rounded-[32px] bg-white p-6 relative">
                  
                  {/* Phone Speaker & Camera Indicator */}
                  <div className="flex justify-between items-center pb-4 mb-4 border-b border-[#F4F3F0]">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#6C3FC5]/10 flex items-center justify-center text-[#6C3FC5] text-[9px] font-bold font-serif">P</div>
                      <span className="text-[12px] font-bold">IA Propulsion</span>
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75]" />
                  </div>

                  {/* Chat bubbles container */}
                  <div className="space-y-4">
                    {/* User bubble */}
                    <div className="flex justify-end">
                      <div className="bg-[#1A1A1A] text-white text-[13px] p-3 rounded-[16px] max-w-[85%] leading-relaxed">
                        Comment structurer mon offre de conseil ?
                      </div>
                    </div>

                    {/* AI bubble */}
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#F4F3F0] flex items-center justify-center text-[10px] shrink-0 font-bold border border-[#E0DDD8]">P</div>
                      <div className="bg-[#F4F3F0] text-[#1A1A1A] text-[13px] p-3 rounded-[16px] max-w-[85%] leading-relaxed">
                        Dr Claudel NOUBISSIE recommande d&apos;abord d&apos;identifier le problème douloureux de votre cible, puis de diviser votre accompagnement en 3 phases claires avec des livrables précis à chaque étape.
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 08 — CTA FINAL
        ══════════════════════════════════════════════════════════ */}
        <Section id="cta-final" bg="bg-[#1A1A1A]" dotsColor="#2A2A2A" dotsOpacity={0.6} className="text-white border-b border-black text-center">
          
          <BrandBar align="center" className="mb-6" />

          <Reveal>
            <h2 className="font-serif text-[56px] font-bold leading-[1.1] text-white whitespace-pre-line">
              Vous avez 12 mois{"\n"}devant vous.{"\n"}Ne les gâchez pas.
            </h2>
            
            <p className="mt-6 mx-auto max-w-[520px] text-[18px] text-[#AAAAAA] leading-[1.75]">
              Rejoignez la communauté d&apos;affaires la plus active du continent et écrivez le prochain chapitre de votre croissance.
            </p>
            
            <div className="mt-10">
              <Link
                href="/rejoindre"
                className="bg-white text-[#1A1A1A] text-[17px] font-bold h-[60px] px-12 rounded-[8px] inline-flex items-center justify-center transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                Créer mon compte Propulsion
              </Link>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-8 text-[13px] text-[#6B6B6B]">
              <span className="flex items-center gap-1.5">
                <span className="text-[#F0A500]"><IconShieldCheck /></span>
                <span>Accès immédiat après validation</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <span className="text-[#F0A500]"><IconShieldCheck /></span>
                <span>Réseau vérifié et modéré</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <span className="text-[#F0A500]"><IconShieldCheck /></span>
                <span>Accompagnement dès le 1er jour</span>
              </span>
            </div>
          </Reveal>
        </Section>
      </main>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer className="bg-[#F4F3F0] border-t border-[#E0DDD8] pt-[80px] pb-[48px] relative overflow-hidden">

        <div className="relative mx-auto max-w-[1200px] px-6 z-10">
          
          <BrandBar align="center" className="mb-12" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            {/* Col 1: Brand Logo & Socials */}
            <div>
              <Link href="#top" className="flex items-center mb-4">
                <img src="/branding/logo.jpg" alt="Propulsion" className="h-20 w-auto mix-blend-multiply shrink-0" />
              </Link>
              <p className="font-sans text-[14px] italic text-[#6B6B6B] mb-6">
                Un mouvement. Un futur. Ensemble.
              </p>
              <div className="flex items-center gap-4 text-[#6B6B6B]">
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-[#1A1A1A] transition-colors">
                  <IconLinkedin />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-[#1A1A1A] transition-colors">
                  <IconInstagram />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-[#1A1A1A] transition-colors">
                  <IconYoutube />
                </a>
              </div>
            </div>

            {/* Col 2: Navigation Links */}
            <div>
              <h4 className="font-sans text-[12px] font-bold uppercase tracking-[0.12em] text-[#1A1A1A] mb-4">
                Navigation
              </h4>
              <div className="flex flex-col gap-2.5 font-sans text-[14px] text-[#6B6B6B]">
                <Link href="#top" className="hover:text-[#1A1A1A] transition-colors leading-[2.2]">Accueil</Link>
                <Link href="#offres" className="hover:text-[#1A1A1A] transition-colors leading-[2.2]">Les formules</Link>
                <Link href="/masterclasses" className="hover:text-[#1A1A1A] transition-colors leading-[2.2]">Masterclass</Link>
                <Link href="/evenements" className="hover:text-[#1A1A1A] transition-colors leading-[2.2]">Événements</Link>
                <Link href="/annuaire" className="hover:text-[#1A1A1A] transition-colors leading-[2.2]">Annuaire</Link>
                <Link href="/support" className="hover:text-[#1A1A1A] transition-colors leading-[2.2]">Contact</Link>
              </div>
            </div>

            {/* Col 3: Legal Info */}
            <div>
              <h4 className="font-sans text-[12px] font-bold uppercase tracking-[0.12em] text-[#1A1A1A] mb-4">
                Légal
              </h4>
              <div className="flex flex-col gap-2.5 font-sans text-[14px] text-[#6B6B6B]">
                <Link href="/mentions-legales" className="hover:text-[#1A1A1A] transition-colors leading-[2.2]">Mentions légales</Link>
                <Link href="/confidentialite" className="hover:text-[#1A1A1A] transition-colors leading-[2.2]">Politique de confidentialité</Link>
                <Link href="/cgu" className="hover:text-[#1A1A1A] transition-colors leading-[2.2]">CGU</Link>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="border-t border-[#E0DDD8] mt-12 pt-8 text-center">
            <p className="font-sans text-[12px] text-[#6B6B6B]">
              © 2026 Propulsion — CNIC · Dr Claudel NOUBISSIE
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
