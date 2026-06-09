import { OnboardingFlow } from "@/components/onboarding-flow";
import Link from "next/link";

export const metadata = {
  title: "Rejoindre la Communauté Propulsion — Onboarding",
  description: "Créez votre compte membre et activez votre adhésion Propulsion en quelques étapes simples.",
};

export default function RejoindrePage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col relative overflow-hidden">
      {/* Background gradients aligned with the Propulsion branding (Bleu Royal & Gold) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] bg-[radial-gradient(45%_45%_at_15%_0%,var(--color-brand-soft)_0%,transparent_75%),radial-gradient(45%_45%_at_85%_0%,var(--color-gold-soft)_0%,transparent_75%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 left-10 -z-10 h-64 w-32 bg-dot-grid opacity-[0.18] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-10 right-10 -z-10 h-64 w-32 bg-dot-grid opacity-[0.18] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]"
      />

      {/* Simplified, distraction-free Header */}
      <header className="py-6 border-b border-line/20 bg-surface/40 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-ink group">
            <span className="transition-transform duration-300 group-hover:scale-105">
              <img 
                src="/branding/logo.jpg" 
                alt="Propulsion Logo" 
                className="h-10 sm:h-12 w-auto object-contain rounded-md mix-blend-multiply"
              />
            </span>
          </Link>
          <Link 
            href="/" 
            className="text-xs font-semibold text-muted hover:text-ink transition-colors px-3 py-1.5 rounded-full border border-line hover:border-line-strong bg-surface"
          >
            ← Retour au site
          </Link>
        </div>
      </header>

      {/* Main Form content */}
      <main className="flex-1 flex items-center justify-center">
        <OnboardingFlow />
      </main>

      {/* Simple Footer */}
      <footer className="py-6 border-t border-line/30 bg-surface/40 text-center">
        <p className="text-[11px] text-faint">
          Propulsion © 2026. Espace d&apos;inscription sécurisé. Toutes les données WhatsApp sont chiffrées.
        </p>
      </footer>
    </div>
  );
}
