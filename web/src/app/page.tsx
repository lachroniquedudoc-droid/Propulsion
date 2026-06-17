"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

/* ─── Brand Colors ─────────────────────────────────────────────── */
const C = {
  blue:   "#2E6FD4",
  purple: "#6C3FC5",
  gold:   "#C9A84C",
  red:    "#E8174B",
  orange: "#F0A500",
  ink:    "#1A1A1A",
  muted:  "#6B6B6B",
  line:   "#E0DDD8",
  sand:   "#F4F3F0",
  white:  "#FFFFFF",
};

/* ─── Spring transition ─────────────────────────────────────────── */
const SPRING = "transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]";
const SPRING_FAST = "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]";

/* ─── Scroll reveal hook ────────────────────────────────────────── */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({
  children, delay = 0, direction = "up", className = "",
}: {
  children: React.ReactNode; delay?: number; direction?: "up" | "left" | "right" | "none"; className?: string;
}) {
  const { ref, visible } = useReveal();
  const base = "transition-all duration-[900ms] ease-[cubic-bezier(0.32,0.72,0,1)]";
  const hidden = direction === "up" ? "translate-y-10 opacity-0 blur-[2px]"
    : direction === "left" ? "-translate-x-10 opacity-0"
    : direction === "right" ? "translate-x-10 opacity-0"
    : "opacity-0";
  const shown = "translate-y-0 translate-x-0 opacity-100 blur-0";
  return (
    <div ref={ref} className={`${base} ${visible ? shown : hidden} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}>
      {children}
    </div>
  );
}

/* ─── Brand 5-Color Bar ─────────────────────────────────────────── */
function BrandBar({ align = "center", className = "" }: { align?: "center" | "left"; className?: string }) {
  return (
    <div className={`flex h-[3px] gap-[3px] ${align === "center" ? "mx-auto justify-center" : ""} w-[120px] ${className}`}>
      {[C.orange, C.purple, C.ink, C.blue, C.red].map((c, i) => (
        <span key={i} className="flex-1 rounded-full" style={{ background: c }} />
      ))}
    </div>
  );
}

/* ─── Eyebrow tag ────────────────────────────────────────────────── */
function Eyebrow({ children, color = C.muted }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
      style={{ color, borderColor: `${color}30`, background: `${color}08` }}>
      {children}
    </span>
  );
}

/* ─── Animated counter ──────────────────────────────────────────── */
function Counter({ value, label, light = false }: { value: string; label: string; light?: boolean }) {
  const num = parseInt(value.replace(/[\s+]/g, ""), 10) || 0;
  const suffix = value.includes("+") ? "+" : "";
  const [count, setCount] = useState(0);
  const { ref, visible } = useReveal(0.1);
  const animated = useRef(false);
  useEffect(() => {
    if (!visible || animated.current) return;
    animated.current = true;
    const start = performance.now();
    const dur = 2200;
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setCount(Math.floor(ease * num));
      if (p < 1) requestAnimationFrame(tick);
      else setCount(num);
    };
    requestAnimationFrame(tick);
  }, [visible, num]);
  return (
    <div ref={ref} className="flex flex-col items-center gap-2">
      <span className={`font-serif text-[52px] sm:text-[64px] font-bold leading-none tabular-nums ${light ? "text-white" : "text-[#1A1A1A]"}`}>
        {count.toLocaleString("fr-FR")}{suffix}
      </span>
      <span className={`text-[11px] font-bold uppercase tracking-[0.14em] ${light ? "text-white/50" : "text-[#6B6B6B]"}`}>{label}</span>
    </div>
  );
}

/* ─── Member card (fan) ─────────────────────────────────────────── */
function MemberCard({ tier, name, memberId, className = "", style = {} }: {
  tier: "standard" | "pro" | "elite"; name: string; memberId: string;
  className?: string; style?: React.CSSProperties;
}) {
  const accent = tier === "standard" ? C.blue : tier === "pro" ? C.purple : C.gold;
  const label  = tier === "standard" ? "STANDARD" : tier === "pro" ? "PRO" : "ÉLITE";
  return (
    <div className={`relative w-[210px] h-[310px] rounded-[20px] overflow-hidden flex flex-col bg-white select-none ${SPRING_FAST} ${className}`}
      style={{ borderTop: `3px solid ${accent}`, boxShadow: `0 24px 60px rgba(0,0,0,0.13), 0 4px 12px rgba(0,0,0,0.07)`, ...style }}>
      {/* outer ring */}
      <div className="absolute inset-0 rounded-[20px] ring-1 ring-inset ring-black/[0.04] pointer-events-none" />
      <div className="flex flex-col items-center pt-5 px-4">
        <img src="/branding/logo.jpg" alt="Propulsion" className="h-7 w-auto mix-blend-multiply" />
        <span className="mt-1 text-[7.5px] font-bold tracking-[0.18em] text-[#6B6B6B] uppercase">CARTE DE MEMBRE</span>
        <span className="font-serif text-[15px] font-bold mt-0.5" style={{ color: accent }}>{label}</span>
      </div>
      <div className="flex-1 flex items-center justify-center py-2">
        <div className="w-[80px] h-[90px] rounded-[10px] overflow-hidden border-2 p-[1.5px]" style={{ borderColor: `${accent}50` }}>
          <img src="/claudel_noubissie.png" alt="" className="w-full h-full object-cover object-top rounded-[8px]" />
        </div>
      </div>
      <div className="px-4 pb-4 space-y-1.5">
        <div className="text-[9px] text-[#6B6B6B]"><span className="font-bold">Nom :</span> <span className="text-[#1A1A1A] font-bold">{name}</span></div>
        <div className="rounded-[5px] py-1 px-2 text-center text-[8px] font-bold tracking-wider uppercase"
          style={{ background: `${accent}10`, color: accent, border: `1px solid ${accent}30` }}>
          ID : {memberId}
        </div>
      </div>
    </div>
  );
}

function FannedCards() {
  return (
    <div className="relative w-[300px] h-[360px] flex items-center justify-center select-none">
      <div className="absolute w-[260px] h-[260px] opacity-30 pointer-events-none rounded-full"
        style={{ background: "radial-gradient(circle, #C9A84C20 0%, transparent 70%)" }} />
      {[
        { tier: "standard" as const, rotate: -9, tx: -54, ty: 18, z: 10 },
        { tier: "pro"      as const, rotate:  0, tx:   0, ty:-14, z: 20 },
        { tier: "elite"    as const, rotate:  9, tx:  54, ty: 18, z: 10 },
      ].map(({ tier, rotate, tx, ty, z }) => (
        <div key={tier} className={`absolute group cursor-pointer ${SPRING}`}
          style={{ transform: `rotate(${rotate}deg) translate(${tx}px,${ty}px)`, zIndex: z }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.zIndex = "30"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.zIndex = String(z); }}>
          <MemberCard tier={tier} name="NOUBISSIE Claudel J."
            memberId={tier === "standard" ? "PRP-STD-0843" : tier === "pro" ? "PRP-PRO-0612" : "PRP-ELT-0001"}
            className="group-hover:scale-[1.04]" />
        </div>
      ))}
    </div>
  );
}

/* ─── Double-bezel card wrapper ─────────────────────────────────── */
function Bezel({ children, className = "", accentColor = "" }: {
  children: React.ReactNode; className?: string; accentColor?: string;
}) {
  return (
    <div className={`p-1.5 rounded-[1.75rem] ring-1 ring-black/[0.06] bg-black/[0.025] ${className}`}>
      <div className="h-full rounded-[calc(1.75rem-0.375rem)] bg-white ring-1 ring-inset ring-black/[0.04] overflow-hidden"
        style={accentColor ? { borderTop: `2.5px solid ${accentColor}` } : {}}>
        {children}
      </div>
    </div>
  );
}

/* ─── Icons (ultra-light, 1.25 stroke) ─────────────────────────── */
const Ico = {
  Video:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z"/><rect x="3" y="6" width="12" height="12" rx="2"/></svg>,
  Network:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v10M12 12H5v5M12 12h7v5"/></svg>,
  Trophy:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M7 4h10M17 4v8a5 5 0 01-10 0V4"/><path d="M5 9a2 2 0 100 4v-4zM19 9a2 2 0 110 4V9z"/></svg>,
  Chat:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  Robot:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M7 11h10M5 8a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V8zM12 5V3M11 5a1 1 0 102 0M9 13v.01M15 13v.01"/></svg>,
  Calendar: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M16 3v4M8 3v4M4 11h16"/><rect x="8" y="14" width="2" height="2"/></svg>,
  Check:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>,
  Arrow:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  Shield:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4M12 3a12 12 0 008.5 3c0 5.83-2.63 11.23-8.5 15a12 12 0 01-8.5-15A12 12 0 0012 3z"/></svg>,
  Menu:     () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="17" x2="20" y2="17"/></svg>,
  LI:       () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="8" y1="11" x2="8" y2="16"/><circle cx="8" cy="8" r="1" fill="currentColor"/><path d="M12 16v-5a3 3 0 016 0v5"/></svg>,
  IG:       () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3"/><circle cx="16.5" cy="7.5" r="0.5" fill="currentColor"/></svg>,
  YT:       () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="4"/><path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none"/></svg>,
};

/* ─── CTA pill button ───────────────────────────────────────────── */
function CTAPrimary({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href}
      className={`group inline-flex items-center gap-3 rounded-full bg-[#1A1A1A] px-6 py-3.5 text-[14px] font-bold text-white ${SPRING_FAST} hover:bg-[#111] active:scale-[0.97]`}>
      <span>{children}</span>
      <span className={`flex h-7 w-7 items-center justify-center rounded-full bg-white/10 ${SPRING_FAST} group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105`}>
        <Ico.Arrow />
      </span>
    </Link>
  );
}

function CTASecondary({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href}
      className={`inline-flex items-center gap-2 rounded-full border border-[#1A1A1A]/25 bg-white/60 px-6 py-3.5 text-[14px] font-bold text-[#1A1A1A] ${SPRING_FAST} hover:border-[#1A1A1A]/50 hover:bg-white active:scale-[0.97]`}>
      {children}
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const close = useCallback(() => setMenuOpen(false), []);

  const navLinks = [
    { label: "Les formules", href: "#offres" },
    { label: "Masterclass",  href: "/masterclasses" },
    { label: "Événements",   href: "/evenements" },
    { label: "Annuaire",     href: "/annuaire" },
  ];

  return (
    <div className="min-h-screen bg-[#F4F3F0] text-[#1A1A1A] antialiased overflow-x-hidden">

      {/* ── GRAIN OVERLAY (fixed, non-interactive) ── */}
      <div className="pointer-events-none fixed inset-0 z-[60] opacity-[0.025]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundRepeat: "repeat", backgroundSize: "128px" }} />

      {/* ══════════════════════════════════════════════
          FLOATING NAV — pill island
      ══════════════════════════════════════════════ */}
      <header className="fixed top-0 inset-x-0 z-50 flex justify-center pt-5 px-4">
        <nav className={`flex items-center gap-4 rounded-full px-4 py-2.5 ${SPRING} ${
          scrolled
            ? "bg-white/80 backdrop-blur-xl shadow-[0_4px_32px_rgba(0,0,0,0.10)] ring-1 ring-black/[0.06]"
            : "bg-white/50 backdrop-blur-md ring-1 ring-black/[0.05]"
        }`}>

          {/* Logo */}
          <Link href="/" className="shrink-0">
            <img src="/branding/logo.jpg" alt="Propulsion" className="h-9 w-auto mix-blend-multiply" />
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href}
                className={`rounded-full px-4 py-2 text-[13px] font-medium text-[#6B6B6B] ${SPRING_FAST} hover:bg-black/[0.04] hover:text-[#1A1A1A]`}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/connexion"
              className={`rounded-full px-4 py-2 text-[13px] font-bold text-[#1A1A1A] ${SPRING_FAST} hover:bg-black/[0.04]`}>
              Connexion
            </Link>
            <Link href="/rejoindre"
              className={`rounded-full bg-[#1A1A1A] px-4 py-2 text-[13px] font-bold text-white ${SPRING_FAST} hover:bg-[#111] active:scale-[0.97]`}>
              Rejoindre
            </Link>
          </div>

          {/* Hamburger → X morph */}
          <button onClick={() => setMenuOpen(o => !o)}
            className={`relative md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-full ${SPRING_FAST} hover:bg-black/[0.05]`}
            aria-label="Menu">
            <span className={`block h-[1.5px] w-5 bg-[#1A1A1A] origin-center ${SPRING} ${menuOpen ? "rotate-45 translate-y-[4.5px]" : ""}`} />
            <span className={`block h-[1.5px] w-5 bg-[#1A1A1A] origin-center ${SPRING} ${menuOpen ? "-rotate-45 -translate-y-[4.5px]" : ""}`} />
          </button>
        </nav>
      </header>

      {/* ── MOBILE MENU OVERLAY ── */}
      <div className={`fixed inset-0 z-40 md:hidden ${SPRING} ${menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className={`absolute inset-0 bg-[#F4F3F0]/95 backdrop-blur-2xl ${SPRING}`} onClick={close} />
        <div className="relative flex flex-col justify-center h-full px-8 pt-24">
          <nav className="flex flex-col gap-1">
            {navLinks.map((l, i) => (
              <Link key={l.href} href={l.href} onClick={close}
                className={`block py-4 font-serif text-[32px] font-bold text-[#1A1A1A] border-b border-[#E0DDD8] ${SPRING} ${menuOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
                style={{ transitionDelay: menuOpen ? `${i * 60 + 80}ms` : "0ms" }}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className={`mt-10 flex flex-col gap-3 ${SPRING} ${menuOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
            style={{ transitionDelay: menuOpen ? "320ms" : "0ms" }}>
            <Link href="/connexion" onClick={close}
              className="rounded-full border border-[#1A1A1A]/25 py-3.5 text-center text-[15px] font-bold text-[#1A1A1A]">
              Se connecter
            </Link>
            <Link href="/rejoindre" onClick={close}
              className="rounded-full bg-[#1A1A1A] py-3.5 text-center text-[15px] font-bold text-white">
              Rejoindre Propulsion
            </Link>
          </div>
          <BrandBar className="mt-10" />
        </div>
      </div>

      <main>

        {/* ══════════════════════════════════════════════
            § 01 — HERO
        ══════════════════════════════════════════════ */}
        <section className="relative min-h-[100dvh] flex flex-col overflow-hidden bg-[#F4F3F0]">

          {/* Radial glow accents */}
          <div className="pointer-events-none absolute -top-40 -right-40 h-[700px] w-[700px] rounded-full opacity-30"
            style={{ background: "radial-gradient(circle, #6C3FC510 0%, transparent 70%)" }} />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-[500px] w-[500px] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #2E6FD415 0%, transparent 70%)" }} />

          {/* Dot grid */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{ backgroundImage: "radial-gradient(#B8B5AE 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

          <div className="relative z-10 mx-auto flex max-w-7xl flex-col lg:flex-row items-center justify-between gap-12 px-6 pt-36 pb-24 lg:pt-44 lg:pb-28 w-full">

            {/* Left — Text */}
            <div className="flex-1 max-w-[620px]">
              <Reveal>
                <Eyebrow color={C.red}>La communauté entrepreneuriale panafricaine</Eyebrow>
              </Reveal>
              <Reveal delay={80}>
                <BrandBar align="left" className="mt-5 mb-7" />
              </Reveal>
              <Reveal delay={120}>
                <h1 className="font-serif text-[48px] sm:text-[60px] lg:text-[76px] font-bold leading-[1.03] tracking-[-0.02em] text-[#1A1A1A]">
                  Ensemble,{" "}
                  <em className="not-italic" style={{ color: C.blue }}>nous allons</em>
                  <br />plus loin.
                </h1>
              </Reveal>
              <Reveal delay={180}>
                <p className="mt-6 max-w-[500px] text-[17px] leading-[1.8] text-[#6B6B6B]">
                  Propulsion est l&apos;écosystème des entrepreneurs africains qui passent à l&apos;action. Masterclass, networking, challenges et IA — tout au même endroit.
                </p>
              </Reveal>
              <Reveal delay={240}>
                <div className="mt-9 flex flex-wrap gap-3">
                  <CTAPrimary href="/rejoindre">Rejoindre Propulsion</CTAPrimary>
                  <CTASecondary href="#offres">Voir les formules</CTASecondary>
                </div>
              </Reveal>
              <Reveal delay={300}>
                <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-[#6B6B6B]">
                  {["2 000+ membres actifs", "30+ pays", "200+ masterclasses"].map((t, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-[#C9A84C]" />{t}
                    </span>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* Right — Fanned cards */}
            <Reveal delay={200} direction="right" className="shrink-0">
              <FannedCards />
            </Reveal>
          </div>

          {/* Scroll indicator */}
          <div className="relative z-10 flex justify-center pb-8">
            <div className={`flex flex-col items-center gap-2 text-[#6B6B6B] ${SPRING} opacity-70 hover:opacity-100`}>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em]">Découvrir</span>
              <div className="h-8 w-[1px] bg-gradient-to-b from-[#6B6B6B] to-transparent" />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            § 02 — STATS BAND (dark)
        ══════════════════════════════════════════════ */}
        <section className="bg-[#1A1A1A] py-20 overflow-hidden relative">
          <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "radial-gradient(#FFF 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="relative mx-auto max-w-5xl px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-0 md:divide-x divide-white/10">
              {[
                { v: "2 000+", l: "Membres actifs" },
                { v: "30+",    l: "Pays représentés" },
                { v: "200+",   l: "Heures de contenus" },
                { v: "3",      l: "Niveaux d'accès" },
              ].map((s, i) => <Counter key={i} value={s.v} label={s.l} light />)}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            § 03 — LE DÉFI (Asymmetric bento)
        ══════════════════════════════════════════════ */}
        <section id="defi" className="py-28 lg:py-40 px-6 bg-[#F4F3F0]">
          <div className="mx-auto max-w-6xl">

            <Reveal className="mb-14 text-center">
              <Eyebrow color={C.muted}>Le contexte</Eyebrow>
              <BrandBar className="mt-4 mb-5" />
              <h2 className="font-serif text-[40px] sm:text-[52px] font-bold leading-[1.08] tracking-[-0.02em] text-[#1A1A1A] max-w-[700px] mx-auto">
                Votre potentiel est là.{" "}
                <span style={{ color: C.purple }}>Ce qui manque,<br />c&apos;est la structure.</span>
              </h2>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

              {/* Large card */}
              <Reveal delay={0} className="md:col-span-7">
                <Bezel accentColor={C.blue} className="h-full">
                  <div className="p-8 flex flex-col gap-6">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: `${C.blue}12`, color: C.blue }}>
                      <Ico.Video />
                    </div>
                    <div>
                      <h3 className="font-serif text-[22px] font-bold text-[#1A1A1A] leading-snug mb-3">
                        Vous apprenez, mais vous n&apos;appliquez pas
                      </h3>
                      <p className="text-[14px] leading-[1.75] text-[#6B6B6B]">
                        Les formations s&apos;accumulent. Les notes aussi. Mais sans un cadre d&apos;exécution et une communauté qui vous pousse, la théorie reste de la théorie.
                      </p>
                    </div>
                  </div>
                </Bezel>
              </Reveal>

              {/* Stacked small cards */}
              <div className="md:col-span-5 flex flex-col gap-4">
                <Reveal delay={80}>
                  <Bezel accentColor={C.purple} className="h-full">
                    <div className="p-7">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-5"
                        style={{ background: `${C.purple}12`, color: C.purple }}>
                        <Ico.Network />
                      </div>
                      <h3 className="font-serif text-[19px] font-bold text-[#1A1A1A] leading-snug mb-2">
                        Vous avancez seul
                      </h3>
                      <p className="text-[13px] leading-[1.7] text-[#6B6B6B]">
                        Trouver un partenaire de confiance ne devrait pas relever du parcours du combattant.
                      </p>
                    </div>
                  </Bezel>
                </Reveal>
                <Reveal delay={140}>
                  <Bezel accentColor={C.orange} className="h-full">
                    <div className="p-7">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-5"
                        style={{ background: `${C.orange}12`, color: C.orange }}>
                        <Ico.Trophy />
                      </div>
                      <h3 className="font-serif text-[19px] font-bold text-[#1A1A1A] leading-snug mb-2">
                        Aucun repère de progression
                      </h3>
                      <p className="text-[13px] leading-[1.7] text-[#6B6B6B]">
                        Difficile d&apos;ajuster ses actions quand on navigue sans boussole ni tableau de bord.
                      </p>
                    </div>
                  </Bezel>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            § 04 — LA SOLUTION (Bento 6 features)
        ══════════════════════════════════════════════ */}
        <section id="solution" className="py-28 lg:py-40 px-6 bg-white border-y border-[#E0DDD8]">
          <div className="mx-auto max-w-6xl">

            <Reveal className="mb-14 text-center">
              <Eyebrow color={C.red}>La solution</Eyebrow>
              <BrandBar className="mt-4 mb-5" />
              <h2 className="font-serif text-[40px] sm:text-[52px] font-bold leading-[1.08] tracking-[-0.02em] text-[#1A1A1A] max-w-[680px] mx-auto">
                <span style={{ color: C.red }}>Propulsion</span>, c&apos;est l&apos;infrastructure
                de votre croissance.
              </h2>
              <p className="mt-5 text-[16px] text-[#6B6B6B] max-w-[480px] mx-auto leading-[1.75]">
                Pas un cours théorique de plus. Un écosystème conçu pour les bâtisseurs qui exigent des résultats.
              </p>
            </Reveal>

            {/* Bento grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: <Ico.Video />,    title: "Masterclass & Replays",       desc: "Chaque semaine, une session live avec le Dr Claudel NOUBISSIE. 200+ heures à haute valeur ajoutée.", color: C.red,    delay: 0   },
                { icon: <Ico.Network />,  title: "Annuaire des membres",         desc: "Un annuaire géolocalisé pour connecter avec les entrepreneurs de votre secteur dans 30+ pays.",    color: C.blue,   delay: 60  },
                { icon: <Ico.Trophy />,   title: "Challenges hebdomadaires",     desc: "Sprints d'action de 7 jours pour appliquer la théorie et mesurer votre progression en temps réel.", color: C.gold,   delay: 120 },
                { icon: <Ico.Chat />,     title: "Réseau social privé",          desc: "Échangez sans le bruit des réseaux classiques au sein d'une agora exclusive et modérée.",           color: C.purple, delay: 180 },
                { icon: <Ico.Robot />,    title: "Agent IA Propulsion",          desc: "Un copilote entraîné sur toutes les ressources de la communauté, disponible 24h/24.",               color: C.ink,    delay: 240 },
                { icon: <Ico.Calendar />, title: "Événements & Apéros Business", desc: "Rencontres physiques et virtuelles régulières en Afrique et en diaspora.",                          color: C.red,    delay: 300 },
              ].map((f, i) => (
                <Reveal key={i} delay={f.delay}>
                  <Bezel accentColor={f.color} className="h-full group cursor-default">
                    <div className={`p-7 h-full flex flex-col gap-5 ${SPRING_FAST} group-hover:bg-[#FAFAF9]`}>
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${SPRING_FAST} group-hover:scale-110`}
                        style={{ background: `${f.color}10`, color: f.color }}>
                        {f.icon}
                      </div>
                      <div>
                        <h3 className="font-serif text-[17px] font-bold text-[#1A1A1A] leading-snug mb-2">{f.title}</h3>
                        <p className="text-[13px] leading-[1.7] text-[#6B6B6B]">{f.desc}</p>
                      </div>
                    </div>
                  </Bezel>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            § 05 — PROGRAMME HEBDOMADAIRE
        ══════════════════════════════════════════════ */}
        <section id="programme" className="py-28 lg:py-40 bg-[#F4F3F0] overflow-hidden">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal className="mb-14 text-center">
              <Eyebrow color={C.muted}>La semaine type</Eyebrow>
              <BrandBar className="mt-4 mb-5" />
              <h2 className="font-serif text-[40px] sm:text-[52px] font-bold leading-[1.08] tracking-[-0.02em] text-[#1A1A1A]">
                Dans Propulsion,<br />chaque jour a une intention.
              </h2>
            </Reveal>
          </div>

          {/* Horizontal scroll on mobile, 7-col grid on desktop */}
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex lg:grid lg:grid-cols-7 gap-3 overflow-x-auto pb-4 lg:overflow-x-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
              {[
                { day: "Lun", time: "19h30", title: "Passeport Propulsion",  desc: "Accueil des nouveaux membres.",           color: C.blue,   featured: false },
                { day: "Mar", time: "19h30", title: "Clinique de vente",      desc: "Closing & traitement des objections.",    color: C.red,    featured: false },
                { day: "Mer", time: "",       title: "Visibilité Élite",       desc: "Pitch de nos membres VIP.",               color: C.gold,   featured: false },
                { day: "Jeu", time: "",       title: "Agents & Structuration", desc: "Organisation, processus et IA.",          color: C.ink,    featured: false },
                { day: "Ven", time: "20h00",  title: "Masterclass",            desc: "Grande session hebdomadaire live.",        color: C.purple, featured: true  },
                { day: "Sam", time: "",       title: "Pitch Arena",            desc: "Critiques constructives de projets.",      color: C.blue,   featured: false },
                { day: "Dim", time: "17h00",  title: "Bilan & Plan",           desc: "Évaluation et planification d'objectifs.", color: C.orange, featured: false },
              ].map((d, i) => (
                <Reveal key={i} delay={i * 50} className="shrink-0 w-[160px] lg:w-auto">
                  <div className={`relative h-full rounded-[18px] border border-[#E0DDD8] bg-white p-4 ${SPRING_FAST} hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:-translate-y-0.5`}
                    style={{ borderTop: `2.5px solid ${d.color}` }}>
                    {d.featured && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[8px] font-bold text-white uppercase tracking-wider whitespace-nowrap"
                        style={{ background: C.purple }}>
                        Phare
                      </span>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-serif text-[13px] font-bold text-[#1A1A1A]">{d.day}</span>
                      {d.time && (
                        <span className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                          style={{ background: `${d.color}12`, color: d.color }}>{d.time}</span>
                      )}
                    </div>
                    <h4 className="text-[12px] font-bold text-[#1A1A1A] leading-snug mb-1">{d.title}</h4>
                    <p className="text-[11px] text-[#6B6B6B] leading-relaxed">{d.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            § 06 — LES FORMULES
        ══════════════════════════════════════════════ */}
        <section id="offres" className="py-28 lg:py-40 px-6 bg-white border-y border-[#E0DDD8]">
          <div className="mx-auto max-w-6xl">

            <Reveal className="mb-14 text-center">
              <Eyebrow color={C.muted}>Les formules</Eyebrow>
              <BrandBar className="mt-4 mb-5" />
              <h2 className="font-serif text-[40px] sm:text-[52px] font-bold leading-[1.08] tracking-[-0.02em] text-[#1A1A1A]">
                Choisissez votre niveau d&apos;engagement.
              </h2>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">

              {/* Standard */}
              <Reveal delay={0}>
                <Bezel accentColor={C.blue} className="h-full">
                  <div className="p-7 flex flex-col h-full">
                    <div className="mb-6">
                      <h3 className="font-serif text-[28px] font-bold" style={{ color: C.blue }}>Standard</h3>
                      <p className="mt-1 text-[13px] italic text-[#6B6B6B]">Pour poser les fondations.</p>
                    </div>
                    <div className="h-px bg-[#E0DDD8] mb-6" />
                    <ul className="space-y-3 flex-1">
                      {["Masterclass hebdomadaires","Replays illimités","Challenges d'exécution","Parrainage & commissions (10%)","Accès au réseau social privé"].map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[13px] text-[#1A1A1A]">
                          <span className="mt-0.5 shrink-0" style={{ color: C.blue }}><Ico.Check /></span>{f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/rejoindre?offer=Standard"
                      className={`mt-8 flex items-center justify-center rounded-full border py-3 text-[14px] font-bold ${SPRING_FAST} hover:bg-[#F4F3F0]`}
                      style={{ borderColor: C.blue, color: C.blue }}>
                      Rejoindre en Standard
                    </Link>
                  </div>
                </Bezel>
              </Reveal>

              {/* Pro — featured */}
              <Reveal delay={80}>
                <div className="relative h-full">
                  <span className="absolute left-1/2 -translate-x-1/2 -top-3.5 z-10 rounded-full px-3.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider whitespace-nowrap"
                    style={{ background: C.purple }}>Le plus choisi</span>
                  <div className="p-1.5 rounded-[1.75rem] h-full" style={{ background: `linear-gradient(145deg, ${C.purple}25, ${C.blue}15)`, boxShadow: `0 0 0 1px ${C.purple}30` }}>
                    <div className="h-full rounded-[calc(1.75rem-0.375rem)] bg-white overflow-hidden" style={{ borderTop: `2.5px solid ${C.purple}` }}>
                      <div className="p-7 flex flex-col h-full">
                        <div className="mb-6">
                          <h3 className="font-serif text-[28px] font-bold" style={{ color: C.purple }}>Pro</h3>
                          <p className="mt-1 text-[13px] italic text-[#6B6B6B]">Pour accélérer votre exécution.</p>
                        </div>
                        <div className="h-px bg-[#E0DDD8] mb-6" />
                        <ul className="space-y-3 flex-1">
                          {["Tout le contenu Standard","Annuaire complet des membres","Fiches business géolocalisées","Q&A mensuelle avec le Dr NOUBISSIE","Copilote IA Propulsion 24/7","Événements & Apéros Business","Support prioritaire"].map((f, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-[13px] text-[#1A1A1A]">
                              <span className="mt-0.5 shrink-0" style={{ color: C.purple }}><Ico.Check /></span>{f}
                            </li>
                          ))}
                        </ul>
                        <Link href="/rejoindre?offer=Pro"
                          className={`mt-8 flex items-center justify-center rounded-full py-3 text-[14px] font-bold text-white ${SPRING_FAST} hover:opacity-90`}
                          style={{ background: C.purple }}>
                          Choisir la formule Pro
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* Élite */}
              <Reveal delay={160}>
                <Bezel accentColor={C.gold} className="h-full">
                  <div className="p-7 flex flex-col h-full">
                    <div className="mb-6">
                      <h3 className="font-serif text-[28px] font-bold" style={{ color: C.gold }}>Élite</h3>
                      <p className="mt-1 text-[13px] italic text-[#6B6B6B]">Pour les leaders qui visent le sommet.</p>
                    </div>
                    <div className="h-px bg-[#E0DDD8] mb-6" />
                    <ul className="space-y-3 flex-1">
                      {["Tout le contenu Pro","Mentorat stratégique avec le Dr NOUBISSIE","Badge Élite et visibilité premium","Canal privé VIP Élite","Accompagnement de structuration","Dîners d'affaires privés","Opportunités d'investissement exclusives"].map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[13px] text-[#1A1A1A]">
                          <span className="mt-0.5 shrink-0" style={{ color: C.gold }}><Ico.Check /></span>{f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/rejoindre?offer=Elite"
                      className={`mt-8 flex items-center justify-center rounded-full border py-3 text-[14px] font-bold ${SPRING_FAST} hover:bg-[#FBF5E6]`}
                      style={{ borderColor: C.gold, color: C.gold }}>
                      Accéder au niveau Élite
                    </Link>
                  </div>
                </Bezel>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            § 07 — TÉMOIGNAGES (dark)
        ══════════════════════════════════════════════ */}
        <section id="temoignages" className="py-28 lg:py-40 px-6 bg-[#111111] relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{ backgroundImage: "radial-gradient(#FFF 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="relative mx-auto max-w-6xl">
            <Reveal className="mb-14 text-center">
              <Eyebrow color="#666">Ce qu&apos;ils en disent</Eyebrow>
              <BrandBar className="mt-4 mb-5" />
              <h2 className="font-serif text-[40px] sm:text-[52px] font-bold leading-[1.08] tracking-[-0.02em] text-white">
                Des résultats concrets,<br />sur tous les continents.
              </h2>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { q: "Depuis que j'ai rejoint Propulsion, j'ai structuré mon activité et sécurisé mes premiers contrats d'envergure. Le cadre d'exécution a tout changé.", name: "Aminata K.", location: "Dakar, Sénégal 🇸🇳", tier: "Pro", color: C.purple },
                { q: "Les masterclass de vente et négociation sont d'une efficacité redoutable. On applique le soir même ce qu'on apprend.", name: "Rodrigue M.", location: "Douala, Cameroun 🇨🇲", tier: "Standard", color: C.blue },
                { q: "Grâce à l'annuaire et au réseau VIP, j'ai trouvé un partenaire clé en moins d'une semaine. L'investissement est rentabilisé au centuple.", name: "Grace T.", location: "Kinshasa, RDC 🇨🇩", tier: "Élite", color: C.gold },
              ].map((t, i) => (
                <Reveal key={i} delay={i * 80}>
                  <div className={`h-full rounded-[1.5rem] p-5 ring-1 ring-white/[0.06] bg-white/[0.04] ${SPRING_FAST} hover:bg-white/[0.07]`}>
                    <div className="p-1 rounded-[calc(1.5rem-0.375rem)] h-full" style={{ background: "rgba(255,255,255,0.03)", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)" }}>
                      <div className="p-5 flex flex-col h-full">
                        {/* Stars */}
                        <div className="flex gap-0.5 mb-5">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className="text-[12px]" style={{ color: C.gold }}>★</span>
                          ))}
                        </div>
                        <p className="flex-1 text-[14px] italic leading-[1.8] text-white/70 mb-6">
                          &ldquo;{t.q}&rdquo;
                        </p>
                        <div className="flex items-center gap-3 border-t border-white/10 pt-5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                            style={{ background: t.color }}>
                            {t.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-white">{t.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-white/40">{t.location}</span>
                              <span className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                                style={{ background: `${t.color}20`, color: t.color }}>{t.tier}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            § 08 — AGENT IA
        ══════════════════════════════════════════════ */}
        <section id="agent-ia" className="py-28 lg:py-40 px-6 bg-[#F4F3F0] border-b border-[#E0DDD8]">
          <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            <Reveal direction="left">
              <Eyebrow color={C.gold}>Intelligence artificielle</Eyebrow>
              <BrandBar align="left" className="mt-4 mb-6" />
              <h2 className="font-serif text-[38px] sm:text-[48px] font-bold leading-[1.08] tracking-[-0.02em] text-[#1A1A1A]">
                Votre assistant{" "}
                <span style={{ color: C.gold }}>Propulsion</span>,<br />disponible à toute heure.
              </h2>
              <p className="mt-5 text-[16px] leading-[1.8] text-[#6B6B6B] max-w-[460px]">
                Notre copilote d&apos;IA est entraîné sur l&apos;ensemble des formations et ressources Propulsion pour vous orienter instantanément.
              </p>
              <ul className="mt-7 space-y-4">
                {["Réponses instantanées sur toutes les méthodologies Propulsion","Orientation vers les replays et fiches pratiques pertinentes","Disponible 24h/24, 7j/7 depuis mobile ou ordinateur"].map((c, i) => (
                  <li key={i} className="flex items-start gap-3 text-[14px] text-[#1A1A1A]">
                    <span className="mt-0.5 shrink-0" style={{ color: C.red }}><Ico.Check /></span>{c}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <span className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em]"
                  style={{ background: `${C.purple}10`, color: C.purple }}>
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: C.purple }} />
                  Propulsé par intelligence artificielle
                </span>
              </div>
            </Reveal>

            <Reveal delay={120} direction="right">
              <Bezel className="max-w-[340px] mx-auto">
                <div className="p-5">
                  {/* Chat header */}
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#F4F3F0]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: C.purple }}>P</div>
                      <span className="text-[12px] font-bold text-[#1A1A1A]">IA Propulsion</span>
                    </div>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: "#1D9E75" }}>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#1D9E75] animate-pulse" />En ligne
                    </span>
                  </div>
                  {/* Messages */}
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-[14px] rounded-tr-[4px] bg-[#1A1A1A] px-4 py-2.5 text-[12px] leading-[1.65] text-white">
                        Comment structurer mon offre de conseil ?
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold border border-[#E0DDD8] bg-white">P</div>
                      <div className="max-w-[85%] rounded-[14px] rounded-tl-[4px] bg-[#F4F3F0] px-4 py-2.5 text-[12px] leading-[1.65] text-[#1A1A1A]">
                        Dr NOUBISSIE recommande d&apos;identifier d&apos;abord le problème douloureux, puis de diviser en 3 phases avec des livrables précis à chaque étape.
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold border border-[#E0DDD8] bg-white">P</div>
                      <div className="max-w-[85%] rounded-[14px] rounded-tl-[4px] bg-[#F4F3F0] px-4 py-2.5 text-[12px] leading-[1.65] text-[#1A1A1A]">
                        Voir aussi le replay &ldquo;Tarifer sa valeur&rdquo; de vendredi dernier — il répond exactement à votre cas.
                      </div>
                    </div>
                    {/* Typing dots */}
                    <div className="flex gap-2 items-center">
                      <div className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold border border-[#E0DDD8] bg-white">P</div>
                      <div className="rounded-[14px] bg-[#F4F3F0] px-4 py-3 flex gap-1 items-center">
                        {[0,1,2].map(i => (
                          <span key={i} className="h-1.5 w-1.5 rounded-full bg-[#6B6B6B] animate-bounce"
                            style={{ animationDelay: `${i * 150}ms`, animationDuration: "900ms" }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Bezel>
            </Reveal>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            § 09 — CTA FINAL
        ══════════════════════════════════════════════ */}
        <section className="relative py-32 lg:py-48 px-6 bg-[#0E0E0E] text-center overflow-hidden">

          {/* Radial gradient accent */}
          <div className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse 80% 60% at 50% 100%, #6C3FC520 0%, transparent 70%)" }} />
          <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "radial-gradient(#FFF 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

          <div className="relative mx-auto max-w-[720px]">
            <Reveal>
              <BrandBar className="mb-8" />
              <h2 className="font-serif text-[48px] sm:text-[64px] lg:text-[80px] font-bold leading-[1.02] tracking-[-0.03em] text-white">
                Vous avez 12 mois<br />devant vous.{" "}
                <em className="not-italic" style={{ color: C.gold }}>Ne les gâchez pas.</em>
              </h2>
              <p className="mt-7 text-[17px] leading-[1.8] text-white/50 max-w-[500px] mx-auto">
                Rejoignez la communauté d&apos;affaires la plus active du continent et écrivez le prochain chapitre de votre croissance.
              </p>
              <div className="mt-10">
                <Link href="/rejoindre"
                  className={`group inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-[15px] font-bold text-[#1A1A1A] ${SPRING_FAST} hover:bg-white/90 active:scale-[0.97]`}>
                  <span>Créer mon compte Propulsion</span>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.06] ${SPRING_FAST} group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105`}>
                    <Ico.Arrow />
                  </span>
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-[12px] text-white/30">
                {["Accès immédiat après validation","Réseau vérifié et modéré","Accompagnement dès le 1er jour"].map((t, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <span style={{ color: C.gold }}><Ico.Shield /></span>{t}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

      </main>

      {/* ══════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════ */}
      <footer className="bg-[#F4F3F0] border-t border-[#E0DDD8] pt-20 pb-12 px-6">
        <div className="mx-auto max-w-6xl">
          <BrandBar className="mb-14" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <Link href="/">
                <img src="/branding/logo.jpg" alt="Propulsion" className="h-16 w-auto mix-blend-multiply mb-4" />
              </Link>
              <p className="text-[13px] italic text-[#6B6B6B] mb-6">Un mouvement. Un futur. Ensemble.</p>
              <div className="flex gap-4 text-[#6B6B6B]">
                {[
                  { href: "https://linkedin.com",  Icon: Ico.LI },
                  { href: "https://instagram.com", Icon: Ico.IG },
                  { href: "https://youtube.com",   Icon: Ico.YT },
                ].map(({ href, Icon }) => (
                  <a key={href} href={href} target="_blank" rel="noreferrer"
                    className={`${SPRING_FAST} hover:text-[#1A1A1A]`}><Icon /></a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1A1A1A] mb-5">Navigation</h4>
              <div className="flex flex-col gap-3 text-[14px] text-[#6B6B6B]">
                {[["Accueil","/"],[" Les formules","#offres"],["Masterclass","/masterclasses"],["Événements","/evenements"],["Annuaire","/annuaire"],["Contact","/support"]].map(([l,h]) => (
                  <Link key={h} href={h} className={`${SPRING_FAST} hover:text-[#1A1A1A]`}>{l}</Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1A1A1A] mb-5">Légal</h4>
              <div className="flex flex-col gap-3 text-[14px] text-[#6B6B6B]">
                {[["Mentions légales","/mentions-legales"],["Confidentialité","/confidentialite"],["CGU","/cgu"]].map(([l,h]) => (
                  <Link key={h} href={h} className={`${SPRING_FAST} hover:text-[#1A1A1A]`}>{l}</Link>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-14 border-t border-[#E0DDD8] pt-8 text-center">
            <p className="text-[12px] text-[#6B6B6B]">© 2026 Propulsion — CNIC · Dr Claudel NOUBISSIE</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
