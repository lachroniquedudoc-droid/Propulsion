"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import {
  Home, MessageSquare, Ticket, Briefcase,
  VideoPlay, BookUser, Trophy, Share, HelpCircle, Menu, Close, Spark,
  BookOpen, UserCircle,
} from "./icons";
import { NotificationsBell } from "./notifications-bell";

/* ─── Spring transition ─────────────────────────────────────────── */
const SP = "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]";

/* ─── Brand helpers ─────────────────────────────────────────────── */
const getLevelColor = (role: string) => {
  if (role === "Standard") return "#2E6FD4";
  if (role === "Pro")      return "#6C3FC5";
  if (role === "Élite")    return "#C9A84C";
  return "#2E6FD4";
};

function BrandBar() {
  return (
    <div className="flex h-[3px] w-full">
      {["#F0A500","#6C3FC5","#1A1A1A","#2E6FD4","#E8174B"].map(c => (
        <span key={c} className="flex-1" style={{ background: c }} />
      ))}
    </div>
  );
}

function LogOutIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

/* ─── Navigation groups ─────────────────────────────────────────── */
const NAV_GROUP_1 = [
  { href: "/dashboard",     label: "Dashboard",     Icon: Home },
  { href: "/masterclasses", label: "Masterclasses", Icon: VideoPlay },
  { href: "/communaute",    label: "Communauté",    Icon: MessageSquare },
  { href: "/annuaire",      label: "Annuaire",      Icon: BookUser },
  { href: "/challenges",    label: "Challenges",    Icon: Trophy },
];
const NAV_GROUP_2 = [
  { href: "/evenements",    label: "Événements",    Icon: Ticket },
  { href: "/offres",        label: "Marché",        Icon: Briefcase },
  { href: "/parrainage",    label: "Parrainage",    Icon: Share },
  { href: "/ressources",    label: "Ressources",    Icon: BookOpen },
];
const MOBILE_NAV_ITEMS = NAV_GROUP_1;
const MOBILE_MORE_ITEMS = [
  ...NAV_GROUP_2,
  { href: "/profil",  label: "Mon profil", Icon: UserCircle },
  { href: "/support", label: "Support",    Icon: HelpCircle },
];

/* ─── Sidebar nav item ──────────────────────────────────────────── */
function SideNavItem({ href, label, Icon, active, levelColor, filterItem }: {
  href: string; label: string; Icon: React.ElementType;
  active: boolean; levelColor: string; filterItem: (i: { href: string }) => boolean;
}) {
  if (!filterItem({ href })) return null;
  return (
    <Link href={href}
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium ${SP} group`}
      style={{
        color: active ? "#FFFFFF" : "#6B6B6B",
        background: active ? `${levelColor}18` : "transparent",
      }}
    >
      {/* Active left accent */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full"
          style={{ background: levelColor }} />
      )}
      <span className={`shrink-0 ${SP} ${active ? "" : "group-hover:text-white/80"}`}>
        <Icon width={16} height={16} />
      </span>
      <span className={`${SP} ${active ? "text-white" : "group-hover:text-white/80"}`}>{label}</span>
    </Link>
  );
}

/* ─── Waiting card (payment validation) ────────────────────────── */
function WaitingCard({ member, initials, levelColor }: {
  member: { role: string; avatar_url?: string; first_name: string; last_name: string; unique_id?: string };
  initials: string; levelColor: string;
}) {
  const displayRole = member.role === "Modérateur" ? "MODÉRATEUR" : member.role === "Admin" ? "ADMINISTRATEUR" : member.role.toUpperCase();
  const cardBg = member.role === "Standard" ? "linear-gradient(135deg, #2E6FD4 0%, #153E82 100%)"
    : member.role === "Pro"    ? "linear-gradient(135deg, #6C3FC5 0%, #351C66 100%)"
    : member.role === "Élite"  ? "linear-gradient(135deg, #C9A84C 0%, #68531D 100%)"
    : "linear-gradient(135deg, #2E2E2C 0%, #111110 100%)";

  return (
    <div className="relative aspect-[1.586] w-full rounded-2xl overflow-hidden p-5 flex flex-col justify-between select-none text-white border border-white/15 shadow-xl"
      style={{ background: cardBg }}>
      <div className="absolute inset-x-0 top-0 h-[3px] flex">
        {["#F0A500","#6C3FC5","#1A1A1A","#2E6FD4","#E8174B"].map(c => (
          <div key={c} className="flex-1" style={{ background: c }} />
        ))}
      </div>
      <div className="flex items-start justify-between z-10">
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">CARTE DE MEMBRE</span>
        <div className="h-11 w-11 rounded-full overflow-hidden backdrop-blur-md border-2 flex items-center justify-center font-bold text-sm text-white shrink-0"
            style={{ borderColor: `${levelColor}80`, background: "rgba(255,255,255,0.12)" }}>
            {member.avatar_url ? <img src={member.avatar_url} alt="" className="h-full w-full object-cover" /> : <span>{initials}</span>}
          </div>
      </div>
      <div className="my-1 z-10">
        <h2 className="font-serif text-[26px] font-bold text-white leading-none tracking-tight">{displayRole}</h2>
        <p className="text-[15px] font-bold text-white mt-1.5 leading-none">{member.first_name} {member.last_name.toUpperCase()}</p>
        <p className="font-mono text-[10.5px] text-white/70 mt-1.5 leading-none tracking-wide">{member.unique_id || "ID en cours…"}</p>
      </div>
      <div className="flex items-center justify-between mt-auto z-10">
        <span className="rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2.5 py-0.5 text-[9px] font-bold tracking-wide uppercase animate-pulse">
          VALIDATION
        </span>
        <span className="text-[11px] text-white/70">En attente</span>
      </div>
    </div>
  );
}

/* ─── Types ──────────────────────────────────────────────────────── */
interface MemberLayoutProps {
  children: React.ReactNode;
  role?: string;
}

/* ═══════════════════════════════════════════════════════════════════
   MEMBER LAYOUT
═══════════════════════════════════════════════════════════════════ */
export function MemberLayout({ children, role = "Standard" }: MemberLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen]   = useState(false);
  const [loading, setLoading]                 = useState(true);
  const [paymentPending, setPaymentPending]   = useState(false);
  const [member, setMember]                   = useState<{
    first_name: string; last_name: string;
    avatar_url: string; role: string; unique_id?: string; status: string;
  } | null>(null);
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    maintenanceMessage: "La plateforme Propulsion est en cours de maintenance temporaire. Nous revenons très vite !",
    enableSocialFeed: true,
    enableMarketplace: true,
    enableChallenges: true,
    commissionStandard: 2500,
    commissionPro: 11250,
    commissionElite: 30000,
    pointsPerChallenge: 50,
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase.from("system_settings").select("*").eq("id", 1).single();
        if (data && !error) {
          setSystemSettings({
            maintenanceMode: data.maintenance_mode,
            maintenanceMessage: data.maintenance_message,
            enableSocialFeed: data.enable_social_feed,
            enableMarketplace: data.enable_marketplace,
            enableChallenges: data.enable_challenges,
            commissionStandard: Number(data.commission_standard),
            commissionPro: Number(data.commission_pro),
            commissionElite: Number(data.commission_elite),
            pointsPerChallenge: Number(data.points_per_challenge),
          });
        }
      } catch { /* offline */ }
    }
    async function loadMember() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("members")
            .select("first_name, last_name, avatar_url, role, unique_id, status")
            .eq("id", user.id)
            .single();
          if (data) {
            setMember({
              first_name: data.first_name || "",
              last_name:  data.last_name  || "",
              avatar_url: data.avatar_url || "",
              role:       data.role       || "Standard",
              unique_id:  data.unique_id  || "",
              status:     data.status     || "En attente de paiement",
            });
            if (data.status === "En attente de paiement" && data.role !== "Admin" && data.role !== "Modérateur") {
              setPaymentPending(true);
            }
          }
        }
      } catch { /* offline */ } finally {
        setLoading(false);
      }
    }
    loadSettings();
    loadMember();
  }, []);

  /* close mobile menu on route change */
  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);
  useEffect(() => { document.body.style.overflow = mobileMenuOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [mobileMenuOpen]);

  const roleToUse  = member?.role || role || "Standard";
  const uid        = member?.unique_id || "";
  const cardTier   = uid.includes("-ELT-") ? "Élite" : uid.includes("-PRO-") ? "Pro" : uid.includes("-STD-") ? "Standard" : roleToUse;
  const levelColor = getLevelColor(cardTier);
  const initials   = member ? `${member.first_name[0] || ""}${member.last_name[0] || ""}`.toUpperCase() : "MP";
  const memberName = member ? `${member.first_name} ${member.last_name}` : "Membre Propulsion";
  const isAdmin    = roleToUse === "Admin" || roleToUse === "Modérateur";

  const handleSignOut   = async () => { try { await supabase.auth.signOut(); } catch { /* ignore */ } window.location.href = "/"; };
  const handleOpenAgent = () => window.dispatchEvent(new Event("toggle-ai-agent"));

  const filterItem = (item: { href: string }) => {
    if (item.href === "/communaute" && !systemSettings.enableSocialFeed)  return false;
    if (item.href === "/offres"     && !systemSettings.enableMarketplace) return false;
    if (item.href === "/challenges" && !systemSettings.enableChallenges)  return false;
    return true;
  };
  const moduleDisabled = (() => {
    if (pathname === "/communaute" && !systemSettings.enableSocialFeed)  return true;
    if (pathname === "/offres"     && !systemSettings.enableMarketplace) return true;
    if (pathname === "/challenges" && !systemSettings.enableChallenges)  return true;
    return false;
  })();

  /* ── Status screens ────────────────────────────────────────────── */
  const renderContent = () => {
    if (systemSettings.maintenanceMode && !isAdmin) return <StatusScreen type="maintenance" message={systemSettings.maintenanceMessage} levelColor={levelColor} />;
    if (moduleDisabled && !isAdmin) return <StatusScreen type="module-disabled" levelColor={levelColor} />;
    if (paymentPending) return <StatusScreen type="payment-pending" levelColor={levelColor} onSignOut={handleSignOut} />;
    return children;
  };

  /* ── Loading ───────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F3F0] flex flex-col items-center justify-center gap-5">
        <img src="/branding/logo.jpg" alt="Propulsion" className="h-14 w-auto mix-blend-multiply animate-pulse" />
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <span key={i} className="h-1.5 w-1.5 rounded-full bg-[#1A1A1A]/30 animate-bounce"
              style={{ animationDelay: `${i * 120}ms`, animationDuration: "800ms" }} />
          ))}
        </div>
      </div>
    );
  }

  /* ── Paiement à valider ────────────────────────────────────────── */
  if (member && member.status === "Paiement à valider" && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#F4F3F0] flex items-center justify-center py-12 px-4">
        <div className="max-w-4xl w-full grid gap-6 md:grid-cols-[1.2fr_0.8fr] items-stretch">
          <div className="rounded-2xl border border-[#E0DDD8] bg-white p-6 sm:p-8 flex flex-col justify-between gap-6 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[3px] flex">
              {["#F0A500","#6C3FC5","#1A1A1A","#2E6FD4","#E8174B"].map(c => <div key={c} className="flex-1" style={{ background: c }} />)}
            </div>
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-white border border-[#E0DDD8] shrink-0 relative">
                  <img src="/branding/logo.jpg" alt="Logo" className="absolute h-full w-full object-cover scale-[1.6] origin-[50%_38%]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#2E6FD4] block">PROPULSION</span>
                  <h3 className="font-serif text-[18px] font-bold text-[#1A1A1A] leading-tight">Adhésion en cours de validation</h3>
                </div>
              </div>
              <div className="py-4 border-y border-[#E0DDD8]/60 flex items-center justify-between gap-2">
                {[
                  { label: "Compte", done: true, current: false },
                  { label: "Paiement", done: true, current: false },
                  { label: "Validation", done: false, current: true },
                  { label: "Accès", done: false, current: false },
                ].map((step, idx) => (
                  <div key={step.label} className="flex flex-col items-center gap-1.5 flex-1">
                    <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border"
                      style={{
                        backgroundColor: step.current ? "#F0A500" : step.done ? "#1D6B45" : "transparent",
                        borderColor: step.current ? "#F0A500" : step.done ? "#1D6B45" : "#E0DDD8",
                        color: step.current || step.done ? "#FFFFFF" : "#8A8880",
                      }}>
                      {step.done ? "✓" : idx + 1}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: step.current ? "#F0A500" : step.done ? "#1D6B45" : "#8A8880" }}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#6B6B6B]">
                  Kit de bienvenue — Règles d&apos;or du réseau
                </h4>
                <div className="max-h-[180px] overflow-y-auto space-y-3 pr-2">
                  {[
                    { title: "Réciprocité et Valeur", body: "Cherchez d'abord comment apporter de la valeur avant d'en réclamer." },
                    { title: "Confidentialité absolue", body: "Toutes les transactions, fiches business et secrets partagés sont confidentiels." },
                    { title: "Exécution et Défis", body: "Chaque semaine, un challenge pour tester vos compétences réelles et grimper au classement." },
                  ].map(r => (
                    <div key={r.title} className="p-3 bg-[#F4F3F0] rounded-xl border border-[#E0DDD8]/50 text-[12.5px] leading-relaxed text-[#6B6B6B]">
                      <strong className="text-[#1A1A1A] block mb-0.5">{r.title}</strong>{r.body}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-[#E0DDD8]/60">
              <button onClick={() => window.location.reload()}
                className="flex-1 h-11 inline-flex items-center justify-center rounded-xl bg-[#1A1A1A] text-white font-bold text-[13px] cursor-pointer">
                Actualiser le statut
              </button>
              <button onClick={handleSignOut}
                className="px-4 h-11 inline-flex items-center justify-center rounded-xl border border-[#E8174B] text-[#E8174B] bg-transparent font-bold text-[13px] cursor-pointer">
                Déconnexion
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-[#E0DDD8] bg-[#1E1E1C] p-6 flex flex-col justify-between gap-5 text-white text-center">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9A84C]">CARTE PROPULSION EN COURS</span>
              <p className="text-[12px] text-[#8A8880] mt-1">Votre badge digital est prêt à être activé.</p>
            </div>
            <div className="flex-1 flex items-center justify-center py-4">
              <div className="w-full max-w-[320px]">
                <WaitingCard member={member} initials={initials} levelColor={levelColor} />
              </div>
            </div>
            <div className="text-[11px] text-[#8A8880]/90 leading-relaxed bg-white/[0.02] border border-white/5 rounded-xl p-3.5">
              <strong>Validation manuelle</strong> : Notre équipe vérifie votre preuve de dépôt. Cela prend généralement moins de 2h aux heures ouvrables.
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Suspended / Expired ───────────────────────────────────────── */
  if (member && member.status === "Suspendu" && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#F4F3F0] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-[#E0DDD8] bg-white p-8 text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#E8174B]" />
          <div className="flex flex-col items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8174B]/10 text-[#E8174B]">
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>
            <h3 className="font-serif text-[20px] font-bold text-[#1A1A1A]">Compte Suspendu</h3>
            <p className="text-[13.5px] text-[#6B6B6B] leading-relaxed">Votre compte membre a été suspendu. Contactez le support si vous pensez qu&apos;il s&apos;agit d&apos;une erreur.</p>
          </div>
          <div className="pt-4 border-t border-[#E0DDD8] flex flex-col gap-3">
            <Link href="/support" className="w-full h-11 inline-flex items-center justify-center rounded-xl bg-[#1A1A1A] text-white font-bold text-[14px]">
              Contacter le Support
            </Link>
            <button onClick={handleSignOut} className="text-[13px] text-[#6B6B6B] font-semibold hover:underline cursor-pointer">
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (member && member.status === "Expiré" && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#F4F3F0] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-[#E0DDD8] bg-white p-8 text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#6B6B6B]" />
          <div className="flex flex-col items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6B6B6B]/10 text-[#6B6B6B]">
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
            <h3 className="font-serif text-[20px] font-bold text-[#1A1A1A]">Adhésion Expirée</h3>
            <p className="text-[13.5px] text-[#6B6B6B] leading-relaxed">Votre abonnement annuel a expiré. Renouvelez pour retrouver l&apos;accès complet.</p>
          </div>
          <div className="pt-4 border-t border-[#E0DDD8] flex flex-col gap-3">
            <Link href="/rejoindre" className="w-full h-11 inline-flex items-center justify-center rounded-xl bg-[#2E6FD4] text-white font-bold text-[14px]">
              Renouveler mon adhésion
            </Link>
            <button onClick={handleSignOut} className="text-[13px] text-[#6B6B6B] font-semibold hover:underline cursor-pointer">
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main layout ───────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#F4F3F0] flex flex-col lg:flex-row">

      {/* ════════════════════════════════════════
          DESKTOP SIDEBAR — 240px, dark
      ════════════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col w-[240px] fixed top-0 bottom-0 left-0 z-30 select-none"
        style={{ background: "linear-gradient(to bottom, #15130E, #0C0B09)" }}>

        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full opacity-[0.06]"
            style={{ background: "radial-gradient(circle, #F0A500, transparent)" }} />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full opacity-[0.05]"
            style={{ background: "radial-gradient(circle, #6C3FC5, transparent)" }} />
        </div>

        {/* Scrollable nav area */}
        <div className="flex flex-col flex-1 overflow-y-auto relative z-10 scrollbar-none">

          {/* Logo */}
          <div className="flex items-center gap-2.5 px-5 pt-5 pb-4 border-b border-white/[0.06]">
            <div className="h-7 w-7 rounded-full overflow-hidden bg-white shrink-0 relative">
              <img src="/branding/logo.jpg" alt="Logo" className="absolute h-full w-full object-cover scale-[1.6] origin-[50%_38%]" />
            </div>
            <span className="font-serif text-[15px] font-bold tracking-wider text-white">PROPULSION</span>
          </div>

          {/* Member identity */}
          <Link href="/profil"
            className={`flex items-center gap-3 px-4 py-3.5 group border-b border-white/[0.06] ${SP} hover:bg-white/[0.04]`}>
            <div className="relative h-9 w-9 shrink-0">
              <div className="h-full w-full rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center text-white font-bold text-[12px]"
                style={{ boxShadow: `0 0 0 2px ${levelColor}50` }}>
                {member?.avatar_url
                  ? <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
                  : <span>{initials}</span>
                }
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#15130E] bg-[#1D9E75]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-white truncate leading-tight">{memberName}</p>
              <span className="inline-flex items-center gap-1 mt-0.5 rounded-full px-2 py-0.5 text-[9px] font-bold"
                style={{ background: `${levelColor}20`, color: levelColor }}>
                {cardTier}
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="px-3 py-4 space-y-5">
            <div>
              <p className="px-3 mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-white/25">Espace membre</p>
              <div className="space-y-0.5">
                {NAV_GROUP_1.map(item => {
                  const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return <SideNavItem key={item.href} {...item} active={active} levelColor={levelColor} filterItem={filterItem} />;
                })}
              </div>
            </div>
            <div>
              <p className="px-3 mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-white/25">Business</p>
              <div className="space-y-0.5">
                {NAV_GROUP_2.map(item => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return <SideNavItem key={item.href} {...item} active={active} levelColor={levelColor} filterItem={filterItem} />;
                })}
              </div>
            </div>
          </nav>
        </div>

        {/* Bottom: brand bar + actions */}
        <div className="shrink-0 relative z-10">
          <BrandBar />
          <div className="px-3 py-3 space-y-0.5">
            <button onClick={handleOpenAgent}
              className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#6B6B6B] ${SP} hover:bg-white/[0.05] hover:text-white`}>
              <div className="flex items-center gap-3">
                <Spark width={16} height={16} />
                <span>Agent IA</span>
              </div>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1D9E75] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1D9E75]" />
              </span>
            </button>
            {isAdmin && (
              <Link href="/admin"
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#F0A500] ${SP} hover:bg-[#F0A500]/10`}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                </svg>
                <span>Panneau admin</span>
              </Link>
            )}
            <button onClick={handleSignOut}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] text-[#6B6B6B] ${SP} hover:text-[#E8174B] hover:bg-[#E8174B]/[0.06]`}>
              <LogOutIcon />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ════════════════════════════════════════
          CONTENT AREA
      ════════════════════════════════════════ */}
      <div className="flex-1 lg:pl-[240px] flex flex-col min-w-0">

        {/* Mobile sticky header */}
        <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-[56px] border-b border-[#E0DDD8]/80 bg-[#F4F3F0]/90 backdrop-blur-xl shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <img src="/branding/logo.jpg" alt="Logo" className="h-8 w-auto mix-blend-multiply" />
            <span className="font-serif text-[14px] font-bold text-[#1A1A1A] tracking-wider">PROPULSION</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <NotificationsBell />
            {isAdmin && (
              <Link href="/admin"
                className="flex items-center gap-1 rounded-full border border-[#F0A500]/30 bg-[#F0A500]/10 px-2.5 py-1 text-[10px] font-bold text-[#F0A500]">
                Admin
              </Link>
            )}
            <div className="relative h-8 w-8">
              <div className="h-full w-full rounded-full overflow-hidden bg-neutral-200 border-2 flex items-center justify-center font-bold text-[11px] text-[#1A1A1A]"
                style={{ borderColor: `${levelColor}60` }}>
                {member?.avatar_url
                  ? <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
                  : <span>{initials}</span>
                }
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 pb-[76px] lg:pb-0 flex flex-col bg-[#F4F3F0] min-h-0">
          {renderContent()}
        </main>
      </div>

      {/* ════════════════════════════════════════
          MOBILE BOTTOM TAB BAR
      ════════════════════════════════════════ */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-2xl border-t border-[#E0DDD8]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="flex items-end justify-around px-2 pt-2 pb-2">
          {MOBILE_NAV_ITEMS.filter(filterItem).map(({ href, label, Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className={`relative flex flex-col items-center gap-1.5 px-3 py-1.5 rounded-xl min-w-[52px] ${SP}`}
                style={{ color: active ? levelColor : "#8A8880" }}>
                {/* Pill indicator above active icon */}
                <span className={`absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-6 rounded-full ${SP} ${active ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"}`}
                  style={{ background: levelColor }} />
                <Icon width={18} height={18} />
                <span className="text-[9px] font-bold uppercase tracking-[0.1em]">{label}</span>
              </Link>
            );
          })}
          {/* Plus button */}
          <button
            onClick={() => setMobileMenuOpen(o => !o)}
            className={`relative flex flex-col items-center gap-1.5 px-3 py-1.5 rounded-xl min-w-[52px] ${SP} ${
              mobileMenuOpen || MOBILE_MORE_ITEMS.some(i => pathname === i.href) ? "" : "text-[#8A8880]"
            }`}
            style={{ color: (mobileMenuOpen || MOBILE_MORE_ITEMS.some(i => pathname === i.href)) ? levelColor : "#8A8880" }}>
            <span className={`absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-6 rounded-full ${SP} ${
              MOBILE_MORE_ITEMS.some(i => pathname === i.href) ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
            }`} style={{ background: levelColor }} />
            {mobileMenuOpen
              ? <Close width={18} height={18} />
              : <Menu width={18} height={18} />
            }
            <span className="text-[9px] font-bold uppercase tracking-[0.1em]">Plus</span>
          </button>
        </div>
      </nav>

      {/* ════════════════════════════════════════
          MOBILE "PLUS" BOTTOM SHEET
      ════════════════════════════════════════ */}
      <div className={`fixed inset-0 z-50 lg:hidden ${SP} ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />

        {/* Sheet */}
        <div className={`absolute bottom-0 left-0 right-0 rounded-t-[28px] bg-white ${SP} ${mobileMenuOpen ? "translate-y-0" : "translate-y-full"}`}
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)" }}>
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-[4px] w-10 rounded-full bg-[#E0DDD8]" />
          </div>

          <div className="px-4 pt-3 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6B6B6B] mb-3">Accès rapide</p>
            <div className="grid grid-cols-3 gap-2.5">
              {MOBILE_MORE_ITEMS.filter(filterItem).map((item, idx) => {
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex flex-col items-center gap-2 rounded-2xl p-3.5 text-center border ${SP} ${SP}`}
                    style={{
                      transitionDelay: mobileMenuOpen ? `${idx * 30}ms` : "0ms",
                      background: active ? `${levelColor}08` : "#F4F3F0",
                      borderColor: active ? `${levelColor}30` : "#E0DDD8",
                      color: active ? levelColor : "#6B6B6B",
                    }}>
                    <item.Icon width={20} height={20} />
                    <span className="text-[11px] font-bold leading-tight">{item.label}</span>
                  </Link>
                );
              })}

              {/* Agent IA */}
              <button
                onClick={() => { setMobileMenuOpen(false); handleOpenAgent(); }}
                className={`flex flex-col items-center gap-2 rounded-2xl p-3.5 text-center border border-[#E0DDD8] bg-[#F4F3F0] text-[#6B6B6B] ${SP} hover:border-[#1A1A1A]/20 hover:text-[#1A1A1A]`}>
                <Spark width={20} height={20} />
                <span className="text-[11px] font-bold leading-tight">Agent IA</span>
              </button>

              {/* Déconnexion */}
              <button
                onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
                className={`flex flex-col items-center gap-2 rounded-2xl p-3.5 text-center border border-[#E8174B]/20 bg-[#E8174B]/[0.04] text-[#E8174B] ${SP}`}>
                <LogOutIcon />
                <span className="text-[11px] font-bold leading-tight">Quitter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Status Screens ────────────────────────────────────────────── */
function StatusScreen({ type, message, levelColor, onSignOut }: {
  type: "maintenance" | "module-disabled" | "payment-pending";
  message?: string;
  levelColor: string;
  onSignOut?: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-[#E0DDD8] bg-white p-8 text-center space-y-5 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[3px] flex">
          {["#F0A500","#6C3FC5","#1A1A1A","#2E6FD4","#E8174B"].map(c => (
            <div key={c} className="flex-1" style={{ background: c }} />
          ))}
        </div>
        <div className="mx-auto h-12 w-12 rounded-full flex items-center justify-center mt-2"
          style={{ background: `${levelColor}12`, color: levelColor }}>
          {type === "maintenance" ? (
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          ) : type === "payment-pending" ? (
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
          ) : (
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          )}
        </div>
        <div className="space-y-1.5">
          <h2 className="font-serif text-[1.4rem] font-bold text-[#1A1A1A]">
            {type === "maintenance" ? "Maintenance en cours" : type === "payment-pending" ? "Adhésion en attente" : "Module désactivé"}
          </h2>
          <p className="text-[13px] text-[#6B6B6B] leading-relaxed">
            {type === "maintenance" ? message : type === "payment-pending" ? "Votre compte est créé. Finalisez votre paiement pour accéder à la plateforme." : "Ce module a été temporairement désactivé par l'administrateur."}
          </p>
        </div>
        {type === "payment-pending" ? (
          <div className="flex flex-col gap-3">
            <Link href="/rejoindre"
              className="inline-flex items-center justify-center rounded-full bg-[#1A1A1A] px-6 py-2.5 text-[13px] font-bold text-white">
              Finaliser mon adhésion →
            </Link>
            {onSignOut && (
              <button onClick={onSignOut} className="text-[12px] text-[#6B6B6B] hover:underline cursor-pointer">
                Se déconnecter
              </button>
            )}
          </div>
        ) : (
          <Link href="/dashboard"
            className="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-[12px] font-bold text-white"
            style={{ background: levelColor }}>
            Retour au tableau de bord
          </Link>
        )}
      </div>
    </div>
  );
}
