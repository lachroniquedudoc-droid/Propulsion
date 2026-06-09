import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales — Propulsion",
  description: "Mentions légales de la plateforme Propulsion CNIC.",
};

export default function MentionsLegalesPage() {
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
          <h1 className="serif text-[42px] font-bold text-white leading-tight">Mentions légales</h1>
          <div className="h-[3px] w-32 brand-stripe rounded-full mt-4 mb-4" />
          <p className="text-[13px] text-white/30 font-sans">Dernière mise à jour : 9 juin 2026</p>
        </div>

        <div className="space-y-8 font-sans text-[15px] text-white/60 leading-relaxed">

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">01 — Éditeur du site</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-2.5">
              {[
                ["Raison sociale", "CNIC (Centre National d’Ingénierie et de Conseil)"],
                ["Forme juridique", "SARL"],
                ["Siège social", "Douala, Cameroun"],
                ["RCCM", "RC/DLA/[À COMPLÉTER]"],
                ["Téléphone", "+237 677 88 99 00"],
                ["Email", "contact@cnic.africa"],
                ["Site web", "propulsion.cnic.africa"],
              ].map(([label, value]) => (
                <p key={label}>
                  <span className="font-semibold text-white/80">{label} :</span>{" "}
                  <span className={label === "RCCM" ? "italic text-white/30" : ""}>{value}</span>
                </p>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">02 — Directeur de la publication</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
              <p>
                Le directeur de la publication de la plateforme Propulsion est{" "}
                <span className="font-semibold text-white/90">Dr Claudel NOUBISSIE</span>, en sa qualité de Directeur Général de CNIC.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">03 — Hébergement</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-4">
              <div>
                <p className="font-semibold text-white/80">Supabase Inc.</p>
                <p className="text-[14px] text-white/40">970 Toa Payoh North #07-04, Singapore 318992</p>
                <a href="https://supabase.com" className="text-[#2E6FD4] hover:underline text-[14px]" target="_blank" rel="noopener noreferrer">supabase.com</a>
              </div>
              <div className="pt-3 border-t border-white/8">
                <p className="font-semibold text-white/80">Vercel Inc. <span className="font-normal text-white/40">(frontal web)</span></p>
                <p className="text-[14px] text-white/40">340 Pine Street Suite 701, San Francisco, CA 94104, États-Unis</p>
                <a href="https://vercel.com" className="text-[#2E6FD4] hover:underline text-[14px]" target="_blank" rel="noopener noreferrer">vercel.com</a>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">04 — Propriété intellectuelle</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-3">
              <p>
                L&apos;ensemble des contenus présents sur la plateforme Propulsion (textes, images, logos, vidéos, masterclasses, méthodes pédagogiques, charte graphique) est la propriété exclusive de CNIC et de Dr Claudel NOUBISSIE, protégés par le droit de la propriété intellectuelle applicable dans l&apos;espace OHADA et les conventions internationales.
              </p>
              <p>
                Toute reproduction, distribution, modification ou utilisation à des fins commerciales de ces contenus, sans autorisation préalable et écrite de CNIC, est strictement interdite et constitue une contrefaçon.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">05 — Limitation de responsabilité</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-3">
              <p>
                CNIC s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des informations diffusées sur la plateforme. Toutefois, CNIC ne peut garantir l&apos;exactitude, la complétude ou l&apos;actualité des informations. L&apos;utilisateur reconnaît utiliser ces informations sous sa propre responsabilité.
              </p>
              <p>
                CNIC ne saurait être tenu responsable des dommages directs ou indirects résultant de l&apos;utilisation de la plateforme, d&apos;une indisponibilité technique ou d&apos;une erreur de contenu.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">06 — Droit applicable et juridiction</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
              <p>
                Les présentes mentions légales sont régies par le droit camerounais et le droit OHADA. Tout litige relatif à l&apos;interprétation ou à l&apos;exécution des présentes sera soumis à la compétence exclusive des tribunaux de Douala, Cameroun.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#2E6FD4] mb-4">07 — Contact</h2>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 space-y-3">
              <p>Pour toute question relative aux présentes mentions légales :</p>
              <ul className="space-y-2 text-[14px]">
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
          <Link href="/mentions-legales" className="text-[12px] font-semibold text-white/60 font-sans">Mentions légales</Link>
          <Link href="/confidentialite" className="text-[12px] text-white/30 hover:text-white/60 font-sans transition-colors">Confidentialité</Link>
          <Link href="/cgu" className="text-[12px] text-white/30 hover:text-white/60 font-sans transition-colors">CGU</Link>
        </div>
        <div className="h-[3px] w-full brand-stripe mt-10" />
      </footer>
    </div>
  );
}
