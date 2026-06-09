"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import {
  Home, MessageSquare, Ticket, Briefcase,
  VideoPlay, BookUser, Trophy, Share, HelpCircle, Menu, Close, Spark,
  BookOpen, UserCircle,
} from "./icons";
import { NotificationsBell } from "./notifications-bell";

const getLevelColor = (role: string) => {
  if (role === "Standard") return "#2E6FD4";
  if (role === "Pro")      return "#6C3FC5";
  if (role === "Élite")    return "#C9A84C";
  return "#2E6FD4";
};

function LogOutIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

/* ── Navigation groups ─────────────────────────────────────────────── */
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

interface MemberLayoutProps {
  children: React.ReactNode;
  role?: string;
}

interface NavGroupProps {
  items: typeof NAV_GROUP_1;
  label: string;
  pathname: string;
  levelColor: string;
  filterItem: (item: { href: string }) => boolean;
}

function NavGroup({ items, label, pathname, levelColor, filterItem }: NavGroupProps) {
  return (
    <div className="mt-5">
      <p className="px-3 mb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#4A4845]">{label}</p>
      {items.filter(filterItem).map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex items-center gap-[10px] px-3 rounded-lg text-[13px] font-medium font-sans transition-all"
            style={{
              height: "40px",
              color: active ? "#FFFFFF" : "#8A8880",
              backgroundColor: active ? `${levelColor}14` : undefined,
            }}
          >
            {active && <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r" style={{ backgroundColor: levelColor }} />}
            <item.Icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

function WaitingCard({ member, initials, levelColor }: { member: { role: string; avatar_url?: string; first_name: string; last_name: string; unique_id?: string }; initials: string; levelColor: string }) {
  const displayRole = member.role === "Modérateur" ? "MODÉRATEUR" : member.role === "Admin" ? "ADMINISTRATEUR" : member.role.toUpperCase();
  
  const cardBg = member.role === "Standard" ? "linear-gradient(135deg, #2E6FD4 0%, #153E82 100%)"
    : member.role === "Pro"    ? "linear-gradient(135deg, #6C3FC5 0%, #351C66 100%)"
    : member.role === "Élite"  ? "linear-gradient(135deg, #C9A84C 0%, #68531D 100%)"
    : "linear-gradient(135deg, #2E2E2C 0%, #111110 100%)";

  return (
    <div
      className="relative aspect-[1.586] w-full rounded-2xl overflow-hidden p-5 flex flex-col justify-between select-none text-white border border-white/15 shadow-xl text-left"
      style={{ background: cardBg }}
    >
      {/* 5-color top bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] flex">
        <div className="flex-1 bg-[#F0A500]"/><div className="flex-1 bg-[#6C3FC5]"/>
        <div className="flex-1 bg-[#1A1A1A]"/><div className="flex-1 bg-[#2E6FD4]"/>
        <div className="flex-1 bg-[#E8174B]"/>
      </div>
      <div className="flex items-start justify-between z-10">
        <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-white/70">CARTE DE MEMBRE</span>
        <div className="h-11 w-11 rounded-full overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-sm text-white shrink-0">
          {member.avatar_url ? <img src={member.avatar_url} alt="" className="h-full w-full object-cover" /> : <span>{initials}</span>}
        </div>
      </div>
      <div className="my-1 z-10">
        <h2 className="serif text-[26px] font-bold text-white leading-none tracking-tight">{displayRole}</h2>
        <p className="text-[15px] font-sans font-bold text-white mt-1.5 leading-none">{member.first_name} {member.last_name.toUpperCase()}</p>
        <p className="font-mono text-[10.5px] text-white/70 mt-1.5 leading-none tracking-wide">{member.unique_id || "ID en cours…"}</p>
      </div>
      <div className="flex items-center justify-between mt-auto z-10">
        <span className="rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2.5 py-0.5 text-[9px] font-sans font-bold tracking-wide uppercase animate-pulse">VALIDATION</span>
        <span className="text-[11px] font-sans text-white/70">
          En attente
        </span>
      </div>
    </div>
  );
}

export function MemberLayout({ children, role = "Pro" }: MemberLayoutProps) {
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentPending, setPaymentPending] = useState(false);
  const [member, setMember] = useState<{
    first_name: string; last_name: string;
    avatar_url: string; role: string; unique_id?: string;
    status: string;
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

  const roleToUse     = member?.role || role || "Standard";
  const uid           = member?.unique_id || "";
  const cardTier      = uid.includes("-ELT-") ? "Élite" : uid.includes("-PRO-") ? "Pro" : uid.includes("-STD-") ? "Standard" : roleToUse;
  const levelColor    = getLevelColor(cardTier);
  const initials      = member ? `${member.first_name[0] || ""}${member.last_name[0] || ""}`.toUpperCase() : "MP";
  const memberName    = member ? `${member.first_name} ${member.last_name}` : "Membre Propulsion";
  const isAdmin       = roleToUse === "Admin" || roleToUse === "Modérateur";

  const handleSignOut    = async () => { try { await supabase.auth.signOut(); } catch { /* ignore */ } window.location.href = "/"; };
  const handleOpenAgent  = () => window.dispatchEvent(new Event("toggle-ai-agent"));

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

  const renderContent = () => {
    if (systemSettings.maintenanceMode && !isAdmin) {
      return (
        <div className="flex-1 flex items-center justify-center p-6 bg-paper bg-halftone-light">
          <div className="max-w-md w-full rounded-2xl border border-line bg-white p-8 text-center space-y-5 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[3px] flex">
              <div className="flex-1 bg-[#F0A500]"/><div className="flex-1 bg-[#6C3FC5]"/>
              <div className="flex-1 bg-[#1A1A1A]"/><div className="flex-1 bg-[#2E6FD4]"/>
              <div className="flex-1 bg-[#E8174B]"/>
            </div>
            <h2 className="font-serif text-2xl font-bold text-ink pt-4">Maintenance en cours</h2>
            <p className="text-[13px] text-muted leading-relaxed">{systemSettings.maintenanceMessage}</p>
            <Link href="/dashboard" className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-2.5 text-[12px] font-bold text-white hover:bg-brand/90 transition-colors">
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      );
    }
    if (moduleDisabled && !isAdmin) {
      return (
        <div className="flex-1 flex items-center justify-center p-6 bg-paper bg-halftone-light">
          <div className="max-w-md w-full rounded-2xl border border-line bg-white p-8 text-center space-y-5">
            <h2 className="font-serif text-2xl font-bold text-ink">Module désactivé</h2>
            <p className="text-[13px] text-muted leading-relaxed">Ce module a été temporairement désactivé par l&apos;administrateur.</p>
            <Link href="/dashboard" className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-2.5 text-[12px] font-bold text-white hover:bg-brand/90 transition-colors">
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      );
    }
    if (paymentPending) {
      return (
        <div className="flex-1 flex items-center justify-center p-6 bg-[#F4F3F0] bg-halftone-light">
          <div className="max-w-md w-full rounded-2xl border border-[#E0DDD8] bg-white p-8 text-center space-y-5 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[3px] flex">
              {["#3871c2","#ffac42","#766391","#ff1e58","#22c55e"].map(c => (
                <span key={c} className="flex-1" style={{ background: c }}/>
              ))}
            </div>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ffac42]/10 mt-2">
              <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#ffac42" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div className="space-y-1.5">
              <h2 className="font-serif text-[1.4rem] font-bold text-[#1A1A1A]">Adhésion en attente</h2>
              <p className="text-[13px] text-[#6B6B6B] leading-relaxed">
                Votre compte est créé. Il vous reste à finaliser votre paiement pour accéder à la plateforme.
              </p>
            </div>
            <Link
              href="/rejoindre"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1A1A1A] px-6 py-2.5 text-[13px] font-semibold text-white hover:bg-[#333] transition-colors"
            >
              Finaliser mon adhésion →
            </Link>
            <p className="text-[11px] text-[#6B6B6B]/60 pt-1">
              Si vous avez déjà effectué le paiement, patientez — la validation prend moins de 24h.
            </p>
          </div>
        </div>
      );
    }
    return children;
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F3F0] flex items-center justify-center bg-halftone-light">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#2E6FD4] border-t-transparent"/>
      </div>
    );
  }

  if (member && member.status === "Paiement à valider" && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#F4F3F0] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-halftone-light select-none">
        <div className="max-w-4xl w-full grid gap-8 md:grid-cols-[1.2fr_0.8fr] items-stretch">
          
          {/* Column 1: Info, Stepper, and Member Kit */}
          <div className="rounded-2xl border border-[#E0DDD8] bg-white p-6 sm:p-8 flex flex-col justify-between gap-6 relative overflow-hidden">
            {/* Top 5-color bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] flex">
              <div className="flex-1 bg-[#F0A500]"/><div className="flex-1 bg-[#6C3FC5]"/>
              <div className="flex-1 bg-[#1A1A1A]"/><div className="flex-1 bg-[#2E6FD4]"/>
              <div className="flex-1 bg-[#E8174B]"/>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-white border border-[#E0DDD8] shrink-0 relative">
                  <img src="/branding/logo.jpg" alt="Logo" className="absolute h-full w-full object-cover scale-[1.6] origin-[50%_38%]" />
                </div>
                <div>
                  <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-brand block">PROPULSION</span>
                  <h3 className="font-serif text-[18px] font-bold text-[#1A1A1A] leading-tight">Adhésion en cours de validation</h3>
                </div>
              </div>

              {/* Status Stepper */}
              <div className="py-4 border-y border-[#E0DDD8]/60 flex items-center justify-between gap-2">
                {[
                  { label: "Compte", done: true, current: false },
                  { label: "Paiement", done: true, current: false },
                  { label: "Validation", done: false, current: true },
                  { label: "Accès", done: false, current: false },
                ].map((item, idx) => (
                  <div key={item.label} className="flex flex-col items-center gap-1.5 flex-1">
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border"
                      style={{
                        backgroundColor: item.current ? "#ffac42" : item.done ? "#1D6B45" : "transparent",
                        borderColor: item.current ? "#ffac42" : item.done ? "#1D6B45" : "#E0DDD8",
                        color: item.current || item.done ? "#FFFFFF" : "#8A8880",
                      }}
                    >
                      {item.done ? "✓" : idx + 1}
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: item.current ? "#ffac42" : item.done ? "#1D6B45" : "#8A8880" }}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Member Kit (Productive waiting) */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-[#6B6B6B]">
                  Kit de bienvenue — Règles d&apos;or du réseau
                </h4>
                <div className="max-h-[180px] overflow-y-auto space-y-3 pr-2 text-[12.5px] leading-relaxed text-[#6B6B6B] font-sans">
                  <div className="p-3 bg-[#F4F3F0] rounded-xl border border-[#E0DDD8]/50">
                    <strong className="text-[#1A1A1A] block mb-0.5">🌟 Règle 1 : Réciprocité et Valeur</strong>
                    Propulsion est un espace de partage d&apos;opportunités d&apos;affaires. Cherchez d&apos;abord comment apporter de la valeur avant d&apos;en réclamer.
                  </div>
                  <div className="p-3 bg-[#F4F3F0] rounded-xl border border-[#E0DDD8]/50">
                    <strong className="text-[#1A1A1A] block mb-0.5">🛡 Règle 2 : Confidentialité absolue</strong>
                    Toutes les transactions, fiches business et secrets partagés dans le réseau sont confidentiels. Aucun partage externe n&apos;est toléré.
                  </div>
                  <div className="p-3 bg-[#F4F3F0] rounded-xl border border-[#E0DDD8]/50">
                    <strong className="text-[#1A1A1A] block mb-0.5">🚀 Règle 3 : Exécution et Défis</strong>
                    Chaque semaine, un challenge business est lancé pour tester vos compétences réelles. Relevez-les pour grimper au classement !
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4 border-t border-[#E0DDD8]/60 mt-4">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-[#1A1A1A] text-white font-semibold text-[13px] transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer font-sans"
              >
                Actualiser le statut
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 h-11 inline-flex items-center justify-center rounded-lg border border-[#E8174B] text-[#E8174B] bg-transparent font-semibold text-[13px] hover:bg-[#E8174B]/5 transition-all cursor-pointer font-sans"
              >
                Déconnexion
              </button>
            </div>
          </div>

          {/* Column 2: Badge Visual */}
          <div className="rounded-2xl border border-[#E0DDD8] bg-[#1E1E1C] p-6 sm:p-8 flex flex-col justify-between gap-6 text-white text-center">
            <div>
              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[#C9A84C]">
                CARTE PROPULSION EN COURS
              </span>
              <p className="text-[12px] text-[#8A8880] mt-1 font-sans">
                Votre badge digital est prêt à être activé dès validation.
              </p>
            </div>
            
            <div className="flex-1 flex items-center justify-center py-4">
              <div className="w-full max-w-[320px]">
                <WaitingCard member={member} initials={initials} levelColor={levelColor} />
              </div>
            </div>

            <div className="text-[11px] text-[#8A8880]/90 leading-relaxed font-sans bg-white/[0.02] border border-white/5 rounded-xl p-3.5">
              💡 <strong>Validation manuelle</strong> : Notre équipe vérifie manuellement votre preuve de dépôt. Cela prend généralement moins de 2h aux heures ouvrables.
            </div>
          </div>

        </div>
      </div>
    );
  }

  if (member && member.status === "Suspendu" && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#F4F3F0] flex items-center justify-center p-6 bg-halftone-light select-none">
        <div className="max-w-md w-full rounded-2xl border border-[#E0DDD8] bg-white p-8 text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#E8174B]" />
          <div className="flex flex-col items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8174B]/10 text-[#E8174B]">
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m12 8-4 4M8 8l4 4" />
              </svg>
            </span>
            <h3 className="font-serif text-[20px] font-bold text-[#1A1A1A]">Compte Suspendu</h3>
            <p className="text-[13.5px] text-[#6B6B6B] leading-relaxed font-sans">
              Votre compte membre Propulsion a été suspendu par les administrateurs.
            </p>
            <p className="text-[12.5px] text-[#6B6B6B] font-sans">
              Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, veuillez contacter notre support.
            </p>
          </div>
          <div className="pt-4 border-t border-[#E0DDD8] flex flex-col gap-3">
            <Link
              href="/support"
              className="w-full h-11 inline-flex items-center justify-center rounded-lg bg-[#1A1A1A] text-white font-semibold text-[14px] transition-all hover:scale-[1.015] active:scale-[0.98] font-sans"
            >
              Contacter le Support
            </Link>
            <button
              onClick={handleSignOut}
              className="text-[13px] text-[#6B6B6B] font-semibold hover:underline cursor-pointer font-sans"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (member && member.status === "Expiré" && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#F4F3F0] flex items-center justify-center p-6 bg-halftone-light select-none">
        <div className="max-w-md w-full rounded-2xl border border-[#E0DDD8] bg-white p-8 text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#6B6B6B]" />
          <div className="flex flex-col items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6B6B6B]/10 text-[#6B6B6B]">
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
            <h3 className="font-serif text-[20px] font-bold text-[#1A1A1A]">Adhésion Expirée</h3>
            <p className="text-[13.5px] text-[#6B6B6B] leading-relaxed font-sans">
              Votre abonnement annuel à Propulsion a expiré.
            </p>
            <p className="text-[12.5px] text-[#6B6B6B] font-sans">
              Renouvelez votre adhésion pour retrouver l&apos;accès aux masterclasses, challenges et opportunités d&apos;affaires.
            </p>
          </div>
          <div className="pt-4 border-t border-[#E0DDD8] flex flex-col gap-3 font-sans">
            <Link
              href="/rejoindre"
              className="w-full h-11 inline-flex items-center justify-center rounded-lg bg-[#2E6FD4] text-white font-semibold text-[14px] transition-all hover:scale-[1.015] active:scale-[0.98] font-sans"
            >
              Renouveler mon adhésion
            </Link>
            <button
              onClick={handleSignOut}
              className="text-[13px] text-[#6B6B6B] font-semibold hover:underline cursor-pointer font-sans"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col lg:flex-row bg-halftone-light">

      {/* ── Desktop Sidebar 220px ───────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col w-[220px] fixed top-0 bottom-0 left-0 z-30 select-none overflow-hidden"
        style={{ background: "linear-gradient(to bottom, #16140F, #0E0D0B)" }}
      >
        {/* Texture overlays */}
        <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none z-0" style={{
          backgroundImage: `radial-gradient(circle, #F0A500 1.5px, transparent 1.5px)`,
          backgroundSize: "14px 14px",
          maskImage: "radial-gradient(circle at top right, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0) 75%)",
          WebkitMaskImage: "radial-gradient(circle at top right, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0) 75%)",
        }} />
        <div className="absolute bottom-0 left-0 w-40 h-40 pointer-events-none z-0" style={{
          backgroundImage: `radial-gradient(circle, #6C3FC5 1.5px, transparent 1.5px)`,
          backgroundSize: "14px 14px",
          maskImage: "radial-gradient(circle at bottom left, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0) 75%)",
          WebkitMaskImage: "radial-gradient(circle at bottom left, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0) 75%)",
        }} />

        {/* Scrollable content */}
        <div className="flex flex-col flex-1 overflow-y-auto scrollbar-none relative z-10">

          {/* Logo */}
          <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-[#2A2826]">
            <div className="h-7 w-7 rounded-full overflow-hidden bg-white shrink-0 relative">
              <img src="/branding/logo.jpg" alt="Logo" className="absolute h-full w-full object-cover scale-[1.6] origin-[50%_38%]" />
            </div>
            <span className="font-serif text-[15px] font-bold tracking-wider text-white">PROPULSION</span>
          </div>

          {/* Member identity — clickable → /profil */}
          <Link
            href="/profil"
            className="flex items-center gap-3 px-5 py-4 group hover:bg-white/5 transition-colors border-b border-[#2A2826]/60"
          >
            <div className="relative h-10 w-10 rounded-full p-[2px] shrink-0" style={{ backgroundColor: levelColor }}>
              <div className="h-full w-full rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center text-white font-bold text-[13px]">
                {member?.avatar_url
                  ? <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
                  : <span>{initials}</span>
                }
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-white truncate leading-tight">{memberName}</p>
              <p className="text-[11px] text-[#6B6B6B] group-hover:text-white/40 transition-colors">Voir mon profil</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="px-2 pb-4">
            <NavGroup items={NAV_GROUP_1} label="ESPACE MEMBRE" pathname={pathname} levelColor={levelColor} filterItem={filterItem} />
            <NavGroup items={NAV_GROUP_2} label="BUSINESS" pathname={pathname} levelColor={levelColor} filterItem={filterItem} />
          </nav>
        </div>

        {/* Bottom: brand bar + Agent IA + Logout */}
        <div className="shrink-0 relative z-10">
          {/* Five-color brand bar */}
          <div className="h-[3px] w-full flex">
            <div className="flex-1 bg-[#F0A500]"/><div className="flex-1 bg-[#6C3FC5]"/>
            <div className="flex-1 bg-[#1A1A1A]"/><div className="flex-1 bg-[#2E6FD4]"/>
            <div className="flex-1 bg-[#E8174B]"/>
          </div>
          <div className="px-2 py-4 space-y-0.5">
            <button
              onClick={handleOpenAgent}
              className="flex items-center justify-between px-3 rounded-lg text-[13px] font-medium text-[#8A8880] hover:text-white hover:bg-white/5 transition-colors w-full text-left font-sans"
              style={{ height: "40px" }}
            >
              <div className="flex items-center gap-[10px]">
                <Spark className="w-4 h-4 shrink-0" />
                <span>Agent IA</span>
              </div>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1D6B45] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1D6B45]" />
              </span>
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-[10px] px-3 rounded-lg text-[13px] text-[#4A4845] hover:text-[#E8174B]/70 hover:bg-[#E8174B]/5 transition-colors w-full text-left font-sans"
              style={{ height: "40px" }}
            >
              <LogOutIcon />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Content area (right of sidebar) ────────────────────────── */}
      <div className="flex-1 lg:pl-[220px] flex flex-col min-w-0">

        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-5 py-3 border-b border-[#E0DDD8] bg-white/80 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2">
            <img src="/branding/logo.jpg" alt="Logo" className="h-8 w-auto mix-blend-multiply" />
            <span className="font-serif text-[15px] font-bold text-ink">PROPULSION</span>
          </Link>
          <div className="flex items-center gap-3">
            <NotificationsBell />
            {isAdmin && (
              <Link href="/admin" className="text-[11px] font-bold text-brand hover:underline">👑 Admin</Link>
            )}
            <div className="h-8 w-8 rounded-full bg-neutral-200 border border-line flex items-center justify-center font-bold text-xs text-ink overflow-hidden">
              {member?.avatar_url
                ? <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
                : <span>{initials}</span>
              }
            </div>
          </div>
        </header>

        <main className="flex-1 pb-20 lg:pb-0 flex flex-col bg-[#F4F3F0]">
          {renderContent()}
        </main>
      </div>

      {/* ── Mobile bottom tab bar ──────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#E0DDD8] bg-white/90 backdrop-blur-xl lg:hidden select-none">
        <div className="flex items-center justify-around px-1 py-2">
          {MOBILE_NAV_ITEMS.filter(filterItem).map(({ href, label, Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all min-w-[52px]"
                style={{ color: active ? levelColor : "#8A8880" }}
              >
                <Icon width={18} height={18} />
                <span className="text-[9px] font-bold tracking-wide uppercase font-sans">{label}</span>
                {active && <span className="h-1 w-1 rounded-full" style={{ backgroundColor: levelColor }} />}
              </Link>
            );
          })}
          <button
            onClick={() => setMobileMenuOpen(o => !o)}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl min-w-[52px] transition-all ${
              mobileMenuOpen || MOBILE_MORE_ITEMS.some(i => pathname === i.href) ? "text-brand" : "text-[#8A8880]"
            }`}
          >
            {mobileMenuOpen ? <Close width={18} height={18} /> : <Menu width={18} height={18} />}
            <span className="text-[9px] font-bold tracking-wide uppercase font-sans">Plus</span>
          </button>
        </div>

        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 z-30 bg-black/20" onClick={() => setMobileMenuOpen(false)} />
            <div className="absolute bottom-full left-0 right-0 z-40 rounded-t-2xl border-t border-[#E0DDD8] bg-white shadow-2xl">
              <div className="p-4 grid grid-cols-3 gap-2">
                {MOBILE_MORE_ITEMS.filter(filterItem).map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3.5 text-center transition-colors ${
                      pathname === item.href
                        ? "border-brand/20 bg-brand/5 text-brand"
                        : "border-line bg-surface text-muted hover:text-ink"
                    }`}
                  >
                    <item.Icon width={18} height={18} />
                    <span className="text-[11px] font-semibold leading-tight font-sans">{item.label}</span>
                  </Link>
                ))}
                <button
                  onClick={() => { setMobileMenuOpen(false); handleOpenAgent(); }}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-line bg-surface text-muted hover:text-ink p-3.5 text-center"
                >
                  <Spark width={18} height={18} />
                  <span className="text-[11px] font-semibold leading-tight font-sans">Agent IA</span>
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-line bg-surface text-red p-3.5 text-center"
                >
                  <LogOutIcon width={18} height={18} />
                  <span className="text-[11px] font-semibold leading-tight font-sans">Quitter</span>
                </button>
              </div>
            </div>
          </>
        )}
      </nav>
    </div>
  );
}
