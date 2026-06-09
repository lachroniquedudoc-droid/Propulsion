"use client";

import { useEffect, useState } from "react";
import { Menu, Close, ArrowRight } from "./icons";

const LINKS = [
  { href: "#transformation", label: "La communauté" },
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#apero", label: "Apéro Business" },
  { href: "#offres", label: "Adhésions" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 72);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        scrolled
          ? "bg-paper/95 backdrop-blur-2xl border-b border-line/50 shadow-[0_1px_0_0_rgba(0,0,0,0.04)]"
          : "bg-transparent border-b border-white/0"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:py-5">
        {/* Logo */}
        <a href="#top" className="flex items-center gap-3 group shrink-0">
          <img
            src="/branding/logo.jpg"
            alt="Propulsion"
            className={`h-11 sm:h-12 w-auto object-contain rounded transition-all duration-500 ${
              scrolled
                ? "mix-blend-multiply brightness-100"
                : "brightness-[2] mix-blend-lighten"
            }`}
          />
        </a>

        {/* Desktop nav */}
        <div className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`text-[13px] font-medium tracking-wide transition-colors duration-300 ${
                scrolled
                  ? "text-muted hover:text-ink"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-2 lg:flex">
          <a
            href="/connexion"
            className={`rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-300 ${
              scrolled
                ? "text-ink hover:bg-brand-soft"
                : "text-white/70 hover:text-white hover:bg-white/8"
            }`}
          >
            Connexion
          </a>
          <a
            href="/rejoindre"
            className="group inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-brand-dark active:scale-[0.97] shadow-[0_2px_12px_rgba(56,113,194,0.3)]"
          >
            Rejoindre
            <ArrowRight
              width={14}
              height={14}
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            />
          </a>
        </div>

        {/* Mobile burger */}
        <button
          type="button"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={`flex h-9 w-9 items-center justify-center rounded-full border lg:hidden transition-all duration-300 ${
            scrolled
              ? "border-line bg-surface text-ink"
              : "border-white/20 bg-white/10 text-white"
          }`}
        >
          {open ? <Close width={18} height={18} /> : <Menu width={18} height={18} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-line/60 bg-paper/98 backdrop-blur-2xl px-6 py-5 lg:hidden">
          <div className="flex flex-col gap-0.5 mb-5">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-ink hover:bg-brand-soft hover:text-brand transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>
          <div className="flex flex-col gap-2 pt-4 border-t border-line">
            <a
              href="/connexion"
              onClick={() => setOpen(false)}
              className="rounded-full border border-line px-4 py-3.5 text-center text-sm font-medium text-ink hover:border-brand/30 hover:bg-brand-soft transition-colors"
            >
              Connexion
            </a>
            <a
              href="/rejoindre"
              onClick={() => setOpen(false)}
              className="rounded-full bg-brand px-4 py-3.5 text-center text-sm font-semibold text-white shadow-[0_2px_12px_rgba(56,113,194,0.35)] active:scale-[0.98]"
            >
              Rejoindre Propulsion
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
