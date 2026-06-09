import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — Propulsion",
  description: "Conditions générales d'utilisation de la plateforme Propulsion CNIC.",
};

export default function CguPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0E] text-white">
      <div className="h-[3px] w-full brand-stripe" />

      <header className="sticky top-0 z-10 border-b border-white/5 bg-[#0F0F0E]/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <img
              src="/branding/logo.jpg"
              alt="Propulsion"
              className="h-9 w-auto brightness-[2] mix-blend-lighten transition-opacity group-hover:opacity-70"
            />
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[12px] font-medium text-white/50 transition-all hover:border-white/20 hover:text-white/80"
          >
            ← Retour au site
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-14">
        <div className="mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25 font-sans mb-3">Légal</p>
          <h1 className="serif text-[42px] font-bold text-white leading-tight">Conditions Générales<br />d&apos;Utilisation</h1>
          <div className="h-[3px] w-32 brand-stripe rounded-full mt-4 mb-4" />
          <p className="text-[13px] text-white/30 font-sans">Dernière mise à jour : 9 juin 2026 — Version 1.0</p>
        </div>

        <div className="space-y-8 font-sans text-[15px] text-white/60 leading-relaxed">

          <div className="rounded-2xl border border-[#C9A84C]/20 bg-[#C9A84C]/5 p-5">
            <p className="text-[14px] text-white/70">
              En vous inscrivant sur la plateforme Propulsion et en utilisant ses services, vous acceptez sans réserve les présentes Conditions Générales d&apos;Utilisation (CGU). Veuillez les lire attentivement avant toute utilisation.
            </p>
          </div>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">01 — Objet</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-3">
              <p>
                Les présentes CGU régissent l&apos;utilisation de la plateforme <strong className="text-white/80">Propulsion</strong>, éditée par CNIC (Centre National d&apos;Ingénierie et de Conseil), accessible à l&apos;adresse <strong className="text-white/80">propulsion.cnic.africa</strong>.
              </p>
              <p>
                Propulsion est une communauté d&apos;entrepreneurs panafricains offrant des masterclasses, des événements, un réseau social privé, un marché business, des challenges d&apos;exécution et des ressources professionnelles.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">02 — Inscription et accès</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-3 text-[14px]">
              <p><span className="text-white/40">2.1 —</span> L&apos;inscription est ouverte à toute personne physique majeure (18 ans ou plus) ou représentant légal d&apos;une entreprise.</p>
              <p><span className="text-white/40">2.2 —</span> L&apos;accès complet à la plateforme est conditionné au paiement de l&apos;adhésion annuelle correspondant à la formule choisie (Standard, Pro ou Élite).</p>
              <p><span className="text-white/40">2.3 —</span> Chaque membre est responsable de la confidentialité de ses identifiants de connexion. Tout accès effectué depuis son compte est réputé effectué par le membre lui-même.</p>
              <p><span className="text-white/40">2.4 —</span> Il est interdit de créer plusieurs comptes pour un même individu ou de partager ses accès avec des tiers.</p>
              <p><span className="text-white/40">2.5 —</span> CNIC se réserve le droit de refuser ou de suspendre une inscription en cas de non-respect des présentes CGU.</p>
            </div>
          </section>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">03 — Formules d&apos;adhésion</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-4">
              <p>Trois formules d&apos;adhésion annuelle sont proposées :</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                {[
                  { name: "Standard", color: "#2E6FD4", desc: "Accès aux masterclasses de base, communauté, challenges et ressources Standard." },
                  { name: "Pro", color: "#6C3FC5", desc: "Tout Standard + annuaire complet, événements, marché business, copilote IA, support prioritaire." },
                  { name: "Élite", color: "#C9A84C", desc: "Tout Pro + mentorat avec Dr NOUBISSIE, canal VIP, dîners privés, opportunités d'investissement." },
                ].map(f => (
                  <div
                    key={f.name}
                    className="rounded-xl border p-4"
                    style={{ borderColor: `${f.color}30`, backgroundColor: `${f.color}08` }}
                  >
                    <p className="font-bold text-[15px]" style={{ color: f.color }}>{f.name}</p>
                    <p className="text-[13px] text-white/40 mt-1.5 leading-snug">{f.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-[13px] text-white/30">Les tarifs sont affichés sur la page{" "}
                <Link href="/rejoindre" className="text-[#2E6FD4] hover:underline">/rejoindre</Link>{" "}
                et peuvent évoluer. Tout renouvellement se fait aux tarifs en vigueur à la date du renouvellement.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">04 — Paiement et validation</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-3 text-[14px]">
              <p><span className="text-white/40">4.1 —</span> Le paiement de l&apos;adhésion s&apos;effectue par virement bancaire, Mobile Money (Orange Money, MTN MoMo) ou tout autre moyen accepté par CNIC.</p>
              <p><span className="text-white/40">4.2 —</span> Une preuve de paiement (capture d&apos;écran ou reçu) doit être téléversée sur la plateforme. L&apos;accès est activé manuellement par l&apos;administration dans un délai de <strong className="text-white/80">24 heures ouvrées</strong>.</p>
              <p><span className="text-white/40">4.3 —</span> Toute adhésion est annuelle et non remboursable, sauf en cas de manquement grave de CNIC à ses obligations contractuelles.</p>
              <p><span className="text-white/40">4.4 —</span> En cas de renouvellement, le membre doit procéder au paiement avant l&apos;expiration de son abonnement pour éviter toute interruption d&apos;accès.</p>
            </div>
          </section>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">05 — Charte communautaire</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-4">
              <p>En utilisant les espaces communautaires de Propulsion, chaque membre s&apos;engage à :</p>
              <ul className="space-y-2.5 text-[14px]">
                {[
                  "Respecter les autres membres, sans discrimination, harcèlement ou propos offensants.",
                  "Ne publier que des contenus licites, véridiques et pertinents pour la communauté entrepreneuriale.",
                  "Ne pas faire de publicité non sollicitée, de spam ou de démarchage agressif.",
                  "Ne pas diffuser de fausses informations ou de contenus trompeurs.",
                  "Respecter la confidentialité des échanges privés entre membres.",
                  "Ne pas tenter de contourner les mesures de sécurité de la plateforme.",
                  "Ne pas partager ses accès ou revendre son adhésion à des tiers.",
                ].map((rule) => (
                  <li key={rule} className="flex gap-3">
                    <span className="text-[#C9A84C] font-bold shrink-0 mt-0.5">✓</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[13px] text-white/30 pt-3 border-t border-white/8">
                Tout manquement à ces règles peut entraîner un avertissement, une suspension temporaire ou une résiliation définitive de l&apos;adhésion, sans remboursement.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">06 — Marché Business</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-3 text-[14px]">
              <p><span className="text-white/40">6.1 —</span> Le Marché Business est réservé aux membres <strong className="text-white/80">Pro</strong> et <strong className="text-white/80">Élite</strong>. Les offres publiées doivent être licites, vérifiées et en lien avec l&apos;entrepreneuriat.</p>
              <p><span className="text-white/40">6.2 —</span> Toute offre est soumise à validation par l&apos;administration avant publication.</p>
              <p><span className="text-white/40">6.3 —</span> CNIC agit en tant qu&apos;intermédiaire technique uniquement. Les transactions entre membres se font sous leur entière responsabilité. CNIC n&apos;est pas partie aux contrats conclus entre membres.</p>
              <p><span className="text-white/40">6.4 —</span> CNIC se réserve le droit de supprimer sans préavis toute offre contraire aux présentes CGU ou à la loi.</p>
            </div>
          </section>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">07 — Programme de parrainage</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-3 text-[14px]">
              <p><span className="text-white/40">7.1 —</span> Chaque membre actif dispose d&apos;un code de parrainage unique lui permettant de parrainer de nouveaux membres.</p>
              <p><span className="text-white/40">7.2 —</span> Une commission est versée au parrain lors de l&apos;activation du compte du filleul, selon les montants définis dans les paramètres de la plateforme (visibles dans votre espace Parrainage).</p>
              <p><span className="text-white/40">7.3 —</span> Les commissions ne sont dues que pour les parrainages ayant abouti à une adhésion payante et validée.</p>
              <p><span className="text-white/40">7.4 —</span> Le versement des commissions s&apos;effectue dans un délai de <strong className="text-white/80">15 jours ouvrés</strong> après validation, par le moyen de paiement convenu avec l&apos;administration.</p>
              <p><span className="text-white/40">7.5 —</span> Le programme de parrainage peut être modifié ou suspendu par CNIC avec un préavis de 30 jours.</p>
            </div>
          </section>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">08 — Propriété intellectuelle</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-3 text-[14px]">
              <p><span className="text-white/40">8.1 —</span> Tous les contenus produits par CNIC (masterclasses, méthodes, ressources, design, code) sont protégés par le droit d&apos;auteur et appartiennent exclusivement à CNIC.</p>
              <p><span className="text-white/40">8.2 —</span> L&apos;adhésion donne un droit d&apos;accès et d&apos;utilisation personnelle des contenus, non un droit de reproduction, diffusion ou revente.</p>
              <p><span className="text-white/40">8.3 —</span> Les contenus publiés par les membres restent leur propriété. En les publiant sur la plateforme, ils accordent à CNIC une licence non exclusive d&apos;utilisation à des fins d&apos;animation de la communauté.</p>
            </div>
          </section>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">09 — Résiliation et suspension</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-3 text-[14px]">
              <p><span className="text-white/40">9.1 Par le membre —</span> Tout membre peut demander la clôture de son compte à tout moment via{" "}
                <Link href="/support" className="text-[#2E6FD4] hover:underline">le support</Link>. Aucun remboursement ne sera effectué pour la période restante.</p>
              <p><span className="text-white/40">9.2 Par CNIC —</span> CNIC peut suspendre ou résilier un compte en cas de violation des CGU, de fraude, de comportement préjudiciable à la communauté ou de non-paiement. En cas de faute grave, la résiliation est immédiate et sans remboursement.</p>
              <p><span className="text-white/40">9.3 Non-renouvellement —</span> À l&apos;expiration de l&apos;adhésion, l&apos;accès est automatiquement suspendu. Les données du membre sont conservées 1 an pour lui permettre de renouveler son adhésion.</p>
            </div>
          </section>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">10 — Limitation de responsabilité</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-3 text-[14px]">
              <p>CNIC met tout en œuvre pour assurer la disponibilité et la qualité de la plateforme, mais ne peut garantir un accès ininterrompu.</p>
              <p>CNIC ne saurait être tenu responsable :</p>
              <ul className="space-y-2 mt-2">
                {[
                  "Des contenus publiés par les membres",
                  "Des transactions entre membres via le Marché Business",
                  "Des dommages indirects liés à l'utilisation de la plateforme",
                  "Des interruptions de service liées aux prestataires tiers (hébergeurs, opérateurs)",
                ].map((item) => (
                  <li key={item} className="flex gap-2"><span className="text-white/25">•</span><span>{item}</span></li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">11 — Modification des CGU</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 text-[14px]">
              <p>
                CNIC se réserve le droit de modifier les présentes CGU à tout moment. Les membres seront notifiés des modifications significatives par email et/ou notification sur la plateforme, avec un préavis d&apos;au moins <strong className="text-white/80">15 jours</strong>. La poursuite de l&apos;utilisation de la plateforme après ce délai vaut acceptation des nouvelles CGU.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">12 — Droit applicable et médiation</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-3 text-[14px]">
              <p>Les présentes CGU sont soumises au droit camerounais et au droit OHADA.</p>
              <p>En cas de litige, les parties s&apos;engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut, les tribunaux de <strong className="text-white/80">Douala, Cameroun</strong> seront seuls compétents.</p>
            </div>
          </section>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">13 — Contact</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-3 text-[14px]">
              <p>Pour toute question relative aux présentes CGU :</p>
              <ul className="space-y-2">
                <li><a href="mailto:contact@cnic.africa" className="text-[#2E6FD4] hover:underline">contact@cnic.africa</a></li>
                <li className="text-white/40">+237 677 88 99 00</li>
                <li><Link href="/support" className="text-[#2E6FD4] hover:underline">Formulaire de contact</Link></li>
              </ul>
            </div>
          </section>

        </div>
      </main>

      <footer className="border-t border-white/5 mt-16 py-10 text-center">
        <p className="font-sans text-[12px] text-white/20">© 2026 Propulsion — CNIC · Dr Claudel NOUBISSIE</p>
        <div className="flex items-center justify-center gap-6 mt-3">
          <Link href="/mentions-legales" className="text-[12px] text-white/30 hover:text-white/60 font-sans transition-colors">Mentions légales</Link>
          <Link href="/confidentialite" className="text-[12px] text-white/30 hover:text-white/60 font-sans transition-colors">Confidentialité</Link>
          <Link href="/cgu" className="text-[12px] font-semibold text-white/60 font-sans">CGU</Link>
        </div>
        <div className="h-[3px] w-full brand-stripe mt-10" />
      </footer>
    </div>
  );
}
