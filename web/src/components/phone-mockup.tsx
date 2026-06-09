import { Bell, PlayCircle, Users, Spark, Card as CardIcon, Trophy } from "./icons";

/**
 * Aperçu produit — tableau de bord membre rendu en CSS pur.
 * Statique (server component), léger, mobile-first.
 * Tokens v2 : bleu royal, or, sans vert.
 */
export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[272px] sm:w-[296px]">
      {/* Halo ambiant multi-couleur */}
      <div
        aria-hidden
        className="absolute -inset-8 -z-10 rounded-[3rem] opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(56,113,194,0.35) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(255,172,66,0.25) 0%, transparent 60%)",
          filter: "blur(24px)",
        }}
      />

      {/* Cadre téléphone */}
      <div className="rounded-[2.8rem] bg-[#0b0e1a] p-[10px] shadow-[0_48px_100px_-30px_rgba(56,113,194,0.5),0_24px_50px_-20px_rgba(0,0,0,0.6)]">
        <div className="relative overflow-hidden rounded-[2.2rem] bg-paper">
          {/* Dynamic island */}
          <div className="absolute left-1/2 top-[10px] z-10 h-[18px] w-[76px] -translate-x-1/2 rounded-full bg-[#0b0e1a]" />

          {/* Contenu écran */}
          <div className="px-4 pb-4 pt-9">

            {/* Status row */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
                  AN
                </div>
                <div className="leading-tight">
                  <p className="text-[10.5px] text-faint">Bonjour</p>
                  <p className="text-[13px] font-semibold text-ink">Aïcha N.</p>
                </div>
              </div>
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink">
                <Bell width={16} height={16} />
                <span className="absolute -right-px -top-px h-2.5 w-2.5 rounded-full border-2 border-paper bg-brand" />
              </div>
            </div>

            {/* Carte adhésion */}
            <div className="relative overflow-hidden rounded-2xl bg-[#0b0e1a] p-4 text-white">
              <div
                aria-hidden
                className="absolute -right-6 -top-8 h-24 w-24 rounded-full blur-2xl"
                style={{ background: "rgba(56,113,194,0.3)" }}
              />
              <div
                aria-hidden
                className="absolute -left-4 -bottom-6 h-20 w-20 rounded-full blur-xl"
                style={{ background: "rgba(255,172,66,0.15)" }}
              />
              {/* Bande 5 couleurs en haut de la carte */}
              <div className="absolute top-0 left-0 right-0 h-[3px] brand-stripe rounded-t-2xl" />
              <div className="relative z-10 mt-1">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-wide">
                    Membre Pro
                  </span>
                  <span className="flex items-center gap-1.5 text-[9.5px] text-white/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                    Actif
                  </span>
                </div>
                <p className="mt-2.5 font-mono text-[11px] tracking-wider text-white/70">
                  PROP-PRO-2026-0481
                </p>
                <div className="mt-2.5 flex items-end justify-between">
                  <div>
                    <p className="text-[9.5px] text-white/40">Expire le</p>
                    <p className="text-[12px] font-semibold">14 mars 2027</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9.5px] text-white/40">Points</p>
                    <p className="nums text-[12px] font-bold text-gold">1 280</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Prochaine masterclass */}
            <p className="mb-2 mt-4 text-[10.5px] font-bold uppercase tracking-widest text-faint">
              Prochaine masterclass
            </p>
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <PlayCircle width={20} height={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-ink">
                  Vendre sans se brader
                </p>
                <p className="text-[10.5px] text-muted">Demain · 19h00 · En direct</p>
              </div>
              <span className="rounded-full bg-brand px-2 py-1 text-[9px] font-bold text-white">
                Live
              </span>
            </div>

            {/* Challenge en cours */}
            <div className="mt-2.5 rounded-2xl border border-line bg-surface p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-ink">
                  <Trophy width={14} height={14} className="text-gold" />
                  <p className="text-[11.5px] font-semibold">Challenge semaine 12</p>
                </div>
                <span className="nums text-[10px] font-bold text-brand">3/5</span>
              </div>
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
                <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-brand to-purple" />
              </div>
            </div>
          </div>

          {/* Barre d'onglets */}
          <div className="flex items-center justify-around border-t border-line bg-surface/95 px-2 py-3 backdrop-blur">
            <PhoneTab active>
              <CardIcon width={19} height={19} />
            </PhoneTab>
            <PhoneTab>
              <PlayCircle width={19} height={19} />
            </PhoneTab>
            <PhoneTab>
              <Users width={19} height={19} />
            </PhoneTab>
            <PhoneTab>
              <Spark width={19} height={19} />
            </PhoneTab>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneTab({
  children,
  active = false,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
        active ? "bg-brand-soft text-brand" : "text-faint"
      }`}
    >
      {children}
    </div>
  );
}
