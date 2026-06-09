import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Propulsion",
  description: "Politique de protection des données personnelles de la plateforme Propulsion CNIC.",
};

export default function ConfidentialitePage() {
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
          <h1 className="serif text-[42px] font-bold text-white leading-tight">Politique de confidentialité</h1>
          <div className="h-[3px] w-32 brand-stripe rounded-full mt-4 mb-4" />
          <p className="text-[13px] text-white/30 font-sans">Dernière mise à jour : 9 juin 2026</p>
        </div>

        <div className="space-y-8 font-sans text-[15px] text-white/60 leading-relaxed">

          <div className="rounded-2xl border border-[#2E6FD4]/20 bg-[#2E6FD4]/5 p-5">
            <p className="text-[14px] text-white/70">
              Chez Propulsion (CNIC), nous accordons une importance primordiale à la protection de vos données personnelles. Cette politique vous explique quelles données nous collectons, pourquoi, comment nous les utilisons et vos droits à leur égard.
            </p>
          </div>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">01 — Responsable du traitement</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-2.5">
              {[
                ["Entité", "CNIC — Centre National d'Ingénierie et de Conseil"],
                ["Responsable", "Dr Claudel NOUBISSIE, Directeur Général"],
                ["Adresse", "Douala, Cameroun"],
              ].map(([label, value]) => (
                <p key={label}>
                  <span className="font-semibold text-white/80">{label} :</span> {value}
                </p>
              ))}
              <p>
                <span className="font-semibold text-white/80">Contact DPD :</span>{" "}
                <a href="mailto:privacy@cnic.africa" className="text-[#2E6FD4] hover:underline">privacy@cnic.africa</a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">02 — Données collectées</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-5">
              {[
                ["Données d'identification", "Lors de votre inscription : nom, prénom, adresse e-mail, numéro de téléphone, numéro WhatsApp, ville et pays de résidence, secteur d'activité."],
                ["Données de paiement", "Lors de l'adhésion : preuve de paiement (image/PDF), référence de transaction, montant et devise. Nous ne stockons pas vos informations bancaires directes."],
                ["Données de navigation", "Adresse IP, type de navigateur, pages visitées, durée des sessions, progression dans les formations, participation aux challenges."],
                ["Contenus générés", "Publications sur la communauté, commentaires, offres de marché, soumissions aux challenges, messages privés entre membres."],
                ["Photo de profil", "Photo d'avatar uploadée volontairement dans votre espace profil."],
              ].map(([titre, desc], i) => (
                <div key={titre} className={i > 0 ? "pt-4 border-t border-white/5" : ""}>
                  <p className="font-semibold text-white/80 mb-1">{titre}</p>
                  <p className="text-[14px]">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">03 — Finalités du traitement</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
              <ul className="space-y-3">
                {[
                  ["Exécution du contrat d'adhésion", "Création et gestion de votre compte, validation de paiement, accès aux formations et modules."],
                  ["Animation de la communauté", "Affichage de votre profil aux autres membres, fil d'actualité, annuaire."],
                  ["Amélioration du service", "Analyse des usages, correction des bugs, développement de nouvelles fonctionnalités."],
                  ["Communication", "Notifications importantes liées à votre compte, événements, nouveaux contenus."],
                  ["Obligations légales", "Conservation des preuves de paiement, respect des réglementations camerounaises et OHADA."],
                  ["Programme de parrainage", "Suivi et calcul des commissions de parrainage."],
                ].map(([titre, desc]) => (
                  <li key={titre} className="flex gap-3 text-[14px]">
                    <span className="text-[#2E6FD4] font-bold shrink-0 mt-0.5">→</span>
                    <span><span className="font-semibold text-white/80">{titre} : </span>{desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">04 — Durée de conservation</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-[14px]">
                  <thead>
                    <tr className="border-b border-white/8">
                      <th className="text-left py-2 pr-6 font-semibold text-white/70">Type de données</th>
                      <th className="text-left py-2 font-semibold text-white/70">Durée</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      ["Données de compte actif", "Durée de l'adhésion + 1 an"],
                      ["Données de compte résilié", "3 ans (obligations légales)"],
                      ["Preuves de paiement", "5 ans (droit commercial OHADA)"],
                      ["Données de navigation", "12 mois"],
                      ["Logs de sécurité", "6 mois"],
                    ].map(([type, duree]) => (
                      <tr key={type}>
                        <td className="py-2.5 pr-6">{type}</td>
                        <td className="py-2.5 text-white/40">{duree}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">05 — Partage et transfert des données</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-3">
              <p>Nous ne vendons jamais vos données personnelles à des tiers.</p>
              <p>Vos données peuvent être transmises à :</p>
              <ul className="space-y-2 mt-2 text-[14px]">
                <li className="flex gap-2"><span className="text-[#2E6FD4]">•</span><span><strong className="text-white/80">Supabase</strong> — hébergement de la base de données (Singapore)</span></li>
                <li className="flex gap-2"><span className="text-[#2E6FD4]">•</span><span><strong className="text-white/80">Vercel</strong> — hébergement du site web (États-Unis)</span></li>
                <li className="flex gap-2"><span className="text-[#2E6FD4]">•</span><span><strong className="text-white/80">Autorités compétentes</strong> — en cas d&apos;obligation légale uniquement</span></li>
              </ul>
              <p className="text-[13px] text-white/30 mt-3">Supabase et Vercel sont contractuellement tenus de protéger vos données conformément aux standards internationaux.</p>
            </div>
          </section>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">06 — Vos droits</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-4">
              <p>Conformément à la loi camerounaise N° 2010/012 et aux principes OHADA de protection des données, vous disposez des droits suivants :</p>
              <ul className="space-y-2.5 text-[14px]">
                {[
                  ["Droit d'accès", "Obtenir une copie des données que nous détenons sur vous."],
                  ["Droit de rectification", "Corriger des données inexactes ou incomplètes."],
                  ["Droit à l'effacement", "Demander la suppression de vos données dans les limites légales."],
                  ["Droit d'opposition", "Vous opposer au traitement de vos données pour certaines finalités."],
                  ["Droit à la portabilité", "Recevoir vos données dans un format structuré et lisible."],
                ].map(([droit, desc]) => (
                  <li key={droit} className="flex gap-3">
                    <span className="text-[#2E6FD4] font-bold shrink-0 mt-0.5">✓</span>
                    <span><span className="font-semibold text-white/80">{droit} : </span>{desc}</span>
                  </li>
                ))}
              </ul>
              <p className="pt-4 border-t border-white/8 text-[14px]">
                Pour exercer vos droits, contactez-nous :{" "}
                <a href="mailto:privacy@cnic.africa" className="text-[#2E6FD4] hover:underline font-medium">privacy@cnic.africa</a>. Nous répondons dans un délai de 30 jours.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">07 — Cookies et technologies similaires</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-3">
              <p>Propulsion utilise des cookies essentiels au fonctionnement de la plateforme :</p>
              <ul className="space-y-2 text-[14px]">
                <li className="flex gap-2"><span className="text-[#2E6FD4]">•</span><span><strong className="text-white/80">Cookies de session</strong> — maintien de votre connexion (Supabase Auth)</span></li>
                <li className="flex gap-2"><span className="text-[#2E6FD4]">•</span><span><strong className="text-white/80">Cookies de préférences</strong> — langue, paramètres d&apos;affichage</span></li>
              </ul>
              <p className="text-[13px] text-white/30">Nous n&apos;utilisons pas de cookies publicitaires ou de tracking tiers.</p>
            </div>
          </section>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">08 — Sécurité des données</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-3">
              <p>Nous mettons en œuvre les mesures techniques et organisationnelles suivantes :</p>
              <ul className="space-y-2 text-[14px]">
                {[
                  "Chiffrement des données en transit (HTTPS/TLS)",
                  "Row Level Security (RLS) sur toutes les tables de données",
                  "Authentification sécurisée avec validation JWT côté serveur",
                  "Accès aux données admin restreint par rôle",
                  "Mots de passe hashés (jamais stockés en clair)",
                ].map((item) => (
                  <li key={item} className="flex gap-2"><span className="text-[#2E6FD4]">•</span><span>{item}</span></li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">09 — Contact</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-3">
              <p>Pour toute question relative à cette politique ou pour exercer vos droits :</p>
              <ul className="space-y-2 text-[14px]">
                <li><a href="mailto:privacy@cnic.africa" className="text-[#2E6FD4] hover:underline">privacy@cnic.africa</a></li>
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
          <Link href="/confidentialite" className="text-[12px] font-semibold text-white/60 font-sans">Confidentialité</Link>
          <Link href="/cgu" className="text-[12px] text-white/30 hover:text-white/60 font-sans transition-colors">CGU</Link>
        </div>
        <div className="h-[3px] w-full brand-stripe mt-10" />
      </footer>
    </div>
  );
}
