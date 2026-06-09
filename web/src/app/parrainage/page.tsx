"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { MemberLayout } from "@/components/member-layout";
import { AiAgent } from "@/components/ai-agent";
import { Users, Share, Trophy, Crown } from "@/components/icons";

type Referral = {
  id: string; tier: string; commission: number; status: string; created_at: string;
  referred: { first_name: string; last_name: string; avatar_url: string | null; role: string } | null;
};

const COMMISSIONS = [
  { tier: "Standard", amount: 2500,  label: "2 500 FCFA",  color: "#766391", price: "25 000 FCFA" },
  { tier: "Pro",      amount: 11250, label: "11 250 FCFA", color: "#3871c2", price: "75 000 FCFA" },
  { tier: "Élite",    amount: 30000, label: "30 000 FCFA", color: "#ffac42", price: "250 000 FCFA" },
];

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  "En attente": { bg: "rgba(56, 113, 194, 0.1)",  text: "#3871c2" },
  "Validé":     { bg: "rgba(34, 197, 94, 0.1)",   text: "#15803d" },
  "Payé":       { bg: "rgba(22, 163, 74, 0.15)",  text: "#14532d" },
};

function fmtAmount(n: number) { return n.toLocaleString("fr-FR") + " FCFA"; }

function BrandBar() {
  return (
    <div className="flex h-[3px] w-full overflow-hidden rounded-full">
      {["#3871c2","#ffac42","#766391","#ff1e58","#22c55e"].map(c => (
        <span key={c} className="flex-1" style={{ background: c }}/>
      ))}
    </div>
  );
}

export default function ParrainagePage() {
  const [role, setRole]             = useState("Standard");
  const [referralCode, setCode]     = useState<string | null>(null);
  const [referrals, setReferrals]   = useState<Referral[]>([]);
  const [loading, setLoading]       = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [baseUrl] = useState(() =>
    typeof window !== "undefined"
      ? `${window.location.origin}/rejoindre`
      : "https://propulsion.cnic.africa/rejoindre"
  );

  useEffect(() => {

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== "INITIAL_SESSION") return;
      if (session?.user) {
        const uid = session.user.id;
        const { data: m } = await supabase.from("members").select("role,referral_code").eq("id", uid).single();
        if (m) { setRole(m.role); setCode(m.referral_code); }
        const { data: refs } = await supabase
          .from("referrals")
          .select("id,tier,commission,status,created_at,referred:referred_id(first_name,last_name,avatar_url,role)")
          .eq("referrer_id", uid).order("created_at", { ascending: false });
        setReferrals((refs as unknown as Referral[]) ?? []);
      }
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function copyCode() {
    if (!referralCode) return;
    await navigator.clipboard.writeText(referralCode);
    setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000);
  }
  async function copyLink() {
    if (!referralCode) return;
    await navigator.clipboard.writeText(`${baseUrl}?ref=${referralCode}`);
    setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000);
  }
  function shareWhatsApp() {
    if (!referralCode) return;
    const msg = encodeURIComponent(`Rejoins la communauté Propulsion de Dr Claudel Noubissie et propulse ton business en Afrique ! 🌍\n\nInscris-toi avec mon lien :\n👉 ${baseUrl}?ref=${referralCode}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  const totalFilleuls = referrals.length;
  const totalEarned   = referrals.filter(r => r.status === "Payé").reduce((s, r) => s + Number(r.commission), 0);
  const totalPending  = referrals.filter(r => r.status === "Validé" || r.status === "En attente").reduce((s, r) => s + Number(r.commission), 0);

  return (
    <MemberLayout role={role}>
      <div className="min-h-full bg-[#F4F3F0]">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">

          {/* Brand bar */}
          <BrandBar />

          {/* Header */}
          <div className="mt-7 mb-7">
            <h1 className="font-serif text-3xl font-bold text-ink">Programme de Parrainage</h1>
            <p className="mt-1 text-[13px] text-muted leading-relaxed max-w-2xl">
              Invitez des entrepreneurs à rejoindre Propulsion. Vous touchez automatiquement <strong>10 % de commission</strong> sur le montant de leur adhésion dès validation de leur paiement.
            </p>
          </div>

          {/* Stats strip */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            {[
              { icon: <Users width={18} height={18}/>, color: "#3871c2", label: "Filleuls inscrits", value: String(totalFilleuls) },
              { icon: <Trophy width={18} height={18}/>, color: "#22c55e", label: "Commissions versées", value: fmtAmount(totalEarned) },
              { icon: <Crown width={18} height={18}/>, color: "#ffac42", label: "En attente", value: fmtAmount(totalPending) },
            ].map(({ icon, color, label, value }) => (
              <div key={label} className="rounded-2xl border border-[#E0DDD8] bg-white p-4 flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}18`, color }}>
                  {icon}
                </span>
                <div className="min-w-0">
                  <p className="text-[10.5px] text-muted leading-none truncate">{label}</p>
                  <p className="text-[15px] font-black mt-1.5 leading-none truncate" style={{ color: color === "#3871c2" ? "#0F0F0E" : color }}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Referral link card */}
          <div className="mb-6 rounded-2xl border border-[#E0DDD8] bg-white p-6">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-faint">Mon Lien de Parrainage</p>
            {loading ? (
              <div className="h-10 animate-pulse rounded-xl bg-[#F4F3F0]"/>
            ) : referralCode ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 rounded-xl border border-[#E0DDD8] bg-[#F4F3F0] px-4 py-3 min-w-0">
                  <span className="text-[11px] font-bold uppercase text-brand tracking-wider shrink-0 border-r border-[#E0DDD8] pr-3">Lien</span>
                  <input type="text" readOnly value={`${baseUrl}?ref=${referralCode}`}
                    className="w-full bg-transparent text-[13px] text-muted focus:outline-none truncate font-mono"/>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button onClick={copyLink}
                    className={`flex-1 rounded-full py-2.5 text-[12.5px] font-bold text-white transition-all active:scale-[0.97] ${copiedLink ? "bg-[#22c55e]" : "bg-brand hover:bg-brand/90"}`}>
                    {copiedLink ? "Lien copié !" : "Copier le lien"}
                  </button>
                  <button onClick={copyCode}
                    className={`flex-1 rounded-full py-2.5 text-[12.5px] font-bold border transition-all active:scale-[0.97] ${copiedCode ? "bg-[#22c55e] border-[#22c55e] text-white" : "border-[#E0DDD8] bg-white text-muted hover:border-brand/40 hover:text-brand"}`}>
                    {copiedCode ? "Code copié !" : `Code : ${referralCode}`}
                  </button>
                  <button onClick={shareWhatsApp}
                    className="rounded-full bg-[#25d366] px-5 py-2.5 text-[12.5px] font-bold text-white hover:bg-[#1ebe57] transition-all active:scale-[0.97] flex items-center gap-2">
                    <Share width={14} height={14}/> WhatsApp
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[12px] text-muted">Aucun code de parrainage disponible.</p>
            )}
            <p className="mt-4 text-[11px] text-faint leading-relaxed border-t border-[#E0DDD8] pt-4">
              Les filleuls doivent s&apos;inscrire en utilisant ce lien ou renseigner votre code lors de l&apos;onboarding pour lier la commission.
            </p>
          </div>

          {/* Commission table */}
          <div className="mb-6 rounded-2xl border border-[#E0DDD8] bg-white p-6">
            <div className="mb-4">
              <h3 className="text-[14px] font-bold text-ink">Barème des Commissions (10 % flat)</h3>
              <p className="text-[12px] text-muted mt-0.5">Vos gains selon la formule d&apos;adhésion souscrite par votre filleul.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {COMMISSIONS.map(c => (
                <div key={c.tier} className="relative overflow-hidden rounded-2xl border border-[#E0DDD8] bg-[#F4F3F0] p-4">
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: c.color }}/>
                  <div className="pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Formule {c.tier}</span>
                    <p className="text-[12px] text-faint mt-0.5">Abonnement : {c.price} / an</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#E0DDD8]">
                    <p className="text-[10.5px] text-muted">Votre commission (10%)</p>
                    <p className="text-[19px] font-extrabold mt-0.5 leading-none" style={{ color: c.color }}>{c.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Referral list */}
          <div>
            <h3 className="mb-4 text-[14px] font-bold text-ink">Mes Filleuls Référencés ({totalFilleuls})</h3>

            {loading ? (
              <div className="h-28 animate-pulse rounded-2xl bg-[#E0DDD8]"/>
            ) : referrals.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#E0DDD8] bg-white py-14 text-center">
                <Users width={32} height={32} className="text-faint"/>
                <p className="text-[13.5px] font-bold text-muted">Aucun filleul pour l&apos;instant</p>
                <p className="text-[12px] text-faint">Partagez votre lien ci-dessus pour commencer à générer des gains.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-[#E0DDD8] bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead className="border-b border-[#E0DDD8] bg-[#F4F3F0] text-[10px] font-bold uppercase tracking-wider text-muted">
                      <tr>
                        <th className="px-5 py-4">Membre</th>
                        <th className="px-5 py-4">Formule</th>
                        <th className="px-5 py-4">Commission</th>
                        <th className="px-5 py-4">Date</th>
                        <th className="px-5 py-4 text-right">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E0DDD8]">
                      {referrals.map(r => {
                        const ref = r.referred;
                        const sc = STATUS_COLOR[r.status] ?? STATUS_COLOR["En attente"];
                        const initials = ref ? `${ref.first_name?.[0] ?? ""}${ref.last_name?.[0] ?? ""}`.toUpperCase() : "?";
                        return (
                          <tr key={r.id} className="hover:bg-[#F4F3F0]/60 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                {ref?.avatar_url ? (
                                  <img src={ref.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover shrink-0"/>
                                ) : (
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[11px] font-bold text-brand">{initials}</span>
                                )}
                                <div>
                                  <p className="font-bold text-ink text-[13px]">{ref ? `${ref.first_name} ${ref.last_name}` : "Membre"}</p>
                                  <p className="text-[10px] text-faint">{ref?.role ?? "Standard"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-muted font-medium text-[13px]">{r.tier}</td>
                            <td className="px-5 py-4 font-bold text-ink text-[13px]">{fmtAmount(Number(r.commission))}</td>
                            <td className="px-5 py-4 text-muted text-[12px]">
                              {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className="rounded-full px-2.5 py-1 text-[9.5px] font-bold inline-block"
                                style={{ backgroundColor: sc.bg, color: sc.text }}>
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
      <AiAgent/>
    </MemberLayout>
  );
}
