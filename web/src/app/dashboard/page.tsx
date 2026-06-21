"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/client";
import { MemberLayout } from "@/components/member-layout";
import { AiAgent } from "@/components/ai-agent";
import { NotificationsBell } from "@/components/notifications-bell";
import { Check, Settings, Close, ArrowRight, Wallet, Users, BookOpen } from "@/components/icons";
import { logActivity } from "@/utils/activity";

/* ─── Spring ────────────────────────────────────────────────────── */
const SP = "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]";

/* ─── Helpers ───────────────────────────────────────────────────── */
const getLevelColor = (role: string) => {
  if (role === "Standard") return "#2E6FD4";
  if (role === "Pro")      return "#6C3FC5";
  if (role === "Élite")    return "#C9A84C";
  return "#2E6FD4";
};
const getCardTier = (member: MemberData) => {
  const u = member.unique_id || "";
  if (u.includes("-ELT-")) return "Élite";
  if (u.includes("-PRO-")) return "Pro";
  if (u.includes("-STD-")) return "Standard";
  if (["Standard","Pro","Élite"].includes(member.role)) return member.role;
  return "Admin";
};

type MemberData = {
  id?: string;
  first_name: string; last_name: string; whatsapp: string;
  role: string; status: string; unique_id: string; referral_code?: string;
  city: string; sector: string; company: string; bio: string; avatar_url: string;
  created_at?: string; subscription_expires_at?: string | null;
  is_private?: boolean; reputation_points?: number;
};
const DEFAULT_MEMBER: MemberData = {
  id: undefined, first_name: "", last_name: "", whatsapp: "",
  role: "Standard", status: "En attente de paiement", unique_id: "",
  city: "", sector: "", company: "", bio: "",
  avatar_url: "", is_private: false, reputation_points: 0,
};

/* ─── Member Card ───────────────────────────────────────────────── */
function MemberCard({ member }: { member: MemberData }) {
  const initials  = `${member.first_name[0] ?? ""}${member.last_name[0] ?? ""}`.toUpperCase();
  const tier      = getCardTier(member);
  const displayRole = member.role === "Modérateur" ? "MODÉRATEUR" : member.role === "Admin" ? "ADMINISTRATEUR" : member.role.toUpperCase();
  const expiryDate = member.subscription_expires_at
    ? new Date(member.subscription_expires_at)
    : member.created_at
      ? new Date(new Date(member.created_at).setFullYear(new Date(member.created_at).getFullYear() + 1))
      : null;
  const expiry  = expiryDate ? expiryDate.toLocaleDateString("fr-FR", { month: "2-digit", year: "numeric" }) : "12/2026";
  const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / 86_400_000) : null;
  const cardBg = tier === "Standard" ? "linear-gradient(135deg, #2E6FD4 0%, #153E82 100%)"
    : tier === "Pro"    ? "linear-gradient(135deg, #6C3FC5 0%, #351C66 100%)"
    : tier === "Élite"  ? "linear-gradient(135deg, #C9A84C 0%, #68531D 100%)"
    : "linear-gradient(135deg, #2E2E2C 0%, #111110 100%)";
  return (
    <div className={`relative aspect-[1.586] w-full rounded-2xl overflow-hidden p-5 flex flex-col justify-between select-none text-white border border-white/15 shadow-xl ${SP} hover:scale-[1.01] hover:shadow-2xl`}
      style={{ background: cardBg }}>
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 opacity-60 pointer-events-none" />
      {tier === "Standard" && <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #FFFFFF 1px, transparent 1px)", backgroundSize: "8px 8px" }} />}
      {tier === "Pro"      && <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 1px, transparent 1px, transparent 8px)" }} />}
      {(tier === "Élite" || tier === "Admin") && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 80 0 L 100 0 L 100 20 M 100 8 L 92 0 M 20 100 L 0 100 L 0 80 M 0 92 L 8 100" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
        </svg>
      )}
      <div className="absolute inset-x-0 top-0 h-[3px] flex">
        {["#F0A500","#6C3FC5","#1A1A1A","#2E6FD4","#E8174B"].map(c => <div key={c} className="flex-1" style={{ background: c }} />)}
      </div>
      <div className="flex items-start justify-between z-10">
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">CARTE DE MEMBRE</span>
        <div className="h-11 w-11 rounded-full overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-sm text-white shrink-0">
          {member.avatar_url ? <img src={member.avatar_url} alt="" className="h-full w-full object-cover" /> : <span>{initials}</span>}
        </div>
      </div>
      <div className="my-1 z-10">
        <h2 className="font-serif text-[26px] font-bold text-white leading-none tracking-tight">{displayRole}</h2>
        <p className="text-[15px] font-bold text-white mt-1.5 leading-none">{member.first_name} {member.last_name.toUpperCase()}</p>
        <p className="font-mono text-[10.5px] text-white/70 mt-1.5 leading-none tracking-wide">{member.unique_id}</p>
      </div>
      <div className="flex items-center justify-between mt-auto z-10">
        <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase">
          {member.status === "Gratuit exceptionnel" ? "GRATUIT" : member.status.toUpperCase()}
        </span>
        <span className={`text-[11px] ${daysLeft !== null && daysLeft <= 30 && daysLeft > 0 ? "text-yellow-300 font-bold" : "text-white/70"}`}>
          {member.role === "Admin" || member.role === "Modérateur" ? "PERMANENT"
            : daysLeft !== null && daysLeft <= 30 && daysLeft > 0 ? `Expire dans ${daysLeft}j`
            : daysLeft !== null && daysLeft <= 0 ? "Expiré"
            : `Expire : ${expiry}`}
        </span>
      </div>
    </div>
  );
}

/* ─── KPI Pill ──────────────────────────────────────────────────── */
function KpiPill({ label, display, suffix, pct, Icon, color }: {
  label: string; display: string; suffix: string;
  pct: number; Icon: React.ElementType; color: string;
}) {
  return (
    <div className={`relative bg-white border border-[#E0DDD8]/60 rounded-2xl p-5 flex items-center justify-between overflow-hidden ${SP} hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]`}>
      <div className="space-y-1">
        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#6B6B6B] block">{label}</span>
        <div className="flex items-baseline gap-1.5">
          <span className="font-serif text-[26px] font-bold text-[#1A1A1A] leading-none">{display}</span>
          <span className="text-[11px] text-[#6B6B6B] font-semibold">{suffix}</span>
        </div>
      </div>
      <div className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: `${color}12`, color }}>
        <Icon width={18} height={18} />
      </div>
      {/* Progress bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#F4F3F0]">
        <div className={`h-full rounded-r-full ${SP}`} style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

/* ─── Subscription countdown widget ────────────────────────────── */
function SubscriptionWidget({ member, levelColor }: { member: MemberData; levelColor: string }) {
  if (member.role === "Admin" || member.role === "Modérateur") return null;
  if (member.status === "En attente de paiement" || member.status === "Paiement à valider") return null;

  const expiryDate = member.subscription_expires_at
    ? new Date(member.subscription_expires_at)
    : member.created_at
      ? new Date(new Date(member.created_at).setFullYear(new Date(member.created_at).getFullYear() + 1))
      : null;
  if (!expiryDate) return null;

  const startDate  = member.created_at
    ? new Date(member.created_at)
    : new Date(expiryDate.getTime() - 365 * 86_400_000);
  const daysLeft   = Math.ceil((expiryDate.getTime() - Date.now()) / 86_400_000);
  const isExpired  = daysLeft <= 0;
  const isUrgent   = !isExpired && daysLeft <= 30;
  const isWarning  = !isExpired && !isUrgent && daysLeft <= 60;
  const totalDays  = Math.max(1, Math.ceil((expiryDate.getTime() - startDate.getTime()) / 86_400_000));
  const elapsed    = totalDays - Math.max(0, daysLeft);
  const pct        = Math.min(100, Math.round((elapsed / totalDays) * 100));
  const accent     = isExpired || isUrgent ? "#E8174B" : isWarning ? "#F0A500" : "#16a34a";

  return (
    <div className={`rounded-2xl border bg-white overflow-hidden ${SP} ${
      isExpired || isUrgent ? "border-[#E8174B]/30 shadow-[0_0_0_1px_rgba(232,23,75,0.08)]"
      : isWarning ? "border-[#F0A500]/30"
      : "border-[#E0DDD8]/60"
    }`}>
      <div className="h-[3px] w-full" style={{ background: accent }} />
      <div className="px-4 py-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#6B6B6B]">Abonnement annuel</span>
          <span className="rounded-full px-2.5 py-0.5 text-[9px] font-bold"
            style={{ background: `${accent}14`, color: accent }}>
            {isExpired ? "Expiré" : `${daysLeft}j restants`}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10.5px] text-[#8A8880] mb-2">
          <span>Adhésion {startDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>
          <span>Expire {expiryDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>
        </div>
        <div className="h-[4px] w-full rounded-full bg-[#F4F3F0] overflow-hidden">
          <div className={`h-full rounded-full ${SP}`} style={{ width: `${pct}%`, background: accent }} />
        </div>
        {(isExpired || isUrgent) && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[11px]" style={{ color: accent }}>
              {isExpired ? "Votre accès a expiré." : `Renouvellement dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}.`}
            </p>
            <Link href="/rejoindre"
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-white ${SP} hover:opacity-90 active:scale-95`}
              style={{ background: accent }}>
              Renouveler
              <ArrowRight width={10} height={10} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Feed item card ────────────────────────────────────────────── */
function FeedCard({ category, title, sub, href, accentColor, actionLabel, levelColor }: {
  category: string; title: string; sub: string; href: string;
  accentColor: string; actionLabel: string; levelColor: string;
}) {
  return (
    <Link href={href}
      className={`group relative flex items-start gap-4 bg-white border border-[#E0DDD8]/60 rounded-2xl p-5 ${SP} hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:border-[#E0DDD8]`}>
      <div className="h-10 w-10 rounded-xl shrink-0 flex items-center justify-center"
        style={{ background: `${accentColor}10` }}>
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: accentColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] mb-2"
          style={{ background: `${accentColor}10`, color: accentColor }}>
          {category}
        </span>
        <p className="text-[14px] font-bold text-[#1A1A1A] leading-snug line-clamp-2">{title}</p>
        <p className="text-[12px] text-[#6B6B6B] mt-1">{sub}</p>
      </div>
      <span className={`shrink-0 text-[12px] font-bold mt-0.5 whitespace-nowrap ${SP} group-hover:translate-x-0.5`}
        style={{ color: levelColor }}>
        {actionLabel} →
      </span>
    </Link>
  );
}

/* ─── Avatar Dropdown ───────────────────────────────────────────── */
function AvatarDropdown({ member, levelColor, onSettings, onSignOut }: {
  member: MemberData; levelColor: string;
  onSettings: () => void; onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initials = `${member.first_name[0] ?? ""}${member.last_name[0] ?? ""}`.toUpperCase();
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)}
        className={`h-8 w-8 rounded-full border-2 overflow-hidden flex items-center justify-center font-bold text-[12px] text-white ${SP} hover:scale-105 active:scale-95`}
        style={{ borderColor: `${levelColor}60`, backgroundColor: levelColor }}>
        {member.avatar_url ? <img src={member.avatar_url} alt="" className="h-full w-full object-cover" /> : <span>{initials}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-[#E0DDD8] bg-white shadow-[0_16px_48px_rgba(0,0,0,0.12)] z-50 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-[#E0DDD8]">
            <p className="text-[13px] font-bold text-[#1A1A1A] truncate">{member.first_name} {member.last_name}</p>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white"
              style={{ backgroundColor: levelColor }}>{member.role}</span>
          </div>
          <div className="py-1.5">
            <button onClick={() => { setOpen(false); onSettings(); }}
              className={`flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-[#1A1A1A] ${SP} hover:bg-[#F4F3F0] text-left`}>
              <Settings width={14} height={14} className="text-[#6B6B6B]" />
              Paramètres
            </button>
            <Link href="/profil" onClick={() => setOpen(false)}
              className={`flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-[#1A1A1A] ${SP} hover:bg-[#F4F3F0]`}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              Mon profil
            </Link>
            <button onClick={() => { setOpen(false); onSignOut(); }}
              className={`flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-[#E8174B] ${SP} hover:bg-[#fff0f2] text-left`}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   DASHBOARD PAGE
══════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const [loading, setLoading]         = useState(true);
  const [member, setMember]           = useState<MemberData>(DEFAULT_MEMBER);
  const [isSettingsOpen, setSettings] = useState(false);
  const [updatingPrivacy, setUpdPri]  = useState(false);
  const [goals, setGoals] = useState({ monthlyRevenueGoal: 500000, weeklyNetworkingGoal: 5, weeklyMasterclassGoal: 60 });
  const [actuals, setActuals] = useState({ minutesWatched: 0, challengesCompleted: 0, contactsMade: 0, monthlyRevenueActual: 0, referralCommissions: 0 });
  type VendorReferral = { referral_id: string; referred_name: string; tier: string; commission: number; status: string; paid_at: string | null; created_at: string; };
  const [vendorReferrals, setVendorReferrals] = useState<VendorReferral[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);
  type ActionItem = { type: "live"|"upcoming"|"challenge"; title: string; info: string; buttonText: string; href: string; };
  const [actionItem, setActionItem] = useState<ActionItem>({
    type: "upcoming", title: "Prochaine masterclasse Propulsion",
    info: "Consultez les masterclasses disponibles", buttonText: "Voir les masterclasses", href: "/masterclasses",
  });
  type FeedItem = { id: string; category: string; title: string; sub: string; href: string; accent: string; action: string; } | null;
  const [feedMasterclass, setFeedMasterclass] = useState<FeedItem>(null);
  const [feedChallenge,   setFeedChallenge]   = useState<FeedItem>(null);
  const [feedPost,        setFeedPost]        = useState<FeedItem>(null);

  useEffect(() => {
    try {
      const g = localStorage.getItem("propulsion_dashboard_goals");
      if (g) setTimeout(() => setGoals(JSON.parse(g)), 0);
      const r = localStorage.getItem("propulsion_dashboard_revenue_actual");
      if (r) setTimeout(() => setActuals(p => ({ ...p, monthlyRevenueActual: Number(r) })), 0);
      const c = localStorage.getItem("propulsion_dashboard_contacts_made");
      if (c) setTimeout(() => setActuals(p => ({ ...p, contactsMade: Number(c) })), 0);
    } catch { /* ignore */ }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== "INITIAL_SESSION") return;
      if (!session?.user) { window.location.href = "/connexion"; return; }
      const uid = session.user.id;
      logActivity(uid, "dashboard_viewed");
      try {
        const [
          { data: profileData },
          { data: progressData },
          { data: submissionsData },
          { data: referralsData },
        ] = await Promise.all([
          supabase.from("members").select("id,first_name,last_name,whatsapp,role,status,unique_id,referral_code,city,sector,company,bio,avatar_url,is_private,reputation_points,created_at,subscription_expires_at").eq("id", uid).single(),
          supabase.from("content_progress").select("seconds_watched").eq("member_id", uid),
          supabase.from("challenge_submissions").select("status").eq("member_id", uid),
          supabase.from("referrals").select("commission").eq("referrer_id", uid),
        ]);
        if (profileData) setMember(profileData);
        supabase.rpc("check_my_subscription").then(({ data }) => {
          if (data?.expires_at) setMember(p => ({ ...p, subscription_expires_at: data.expires_at }));
        });
        setActuals(p => ({
          ...p,
          minutesWatched:      progressData ? Math.round(progressData.reduce((s, i) => s + (i.seconds_watched || 0), 0) / 60) : 0,
          challengesCompleted: submissionsData ? submissionsData.filter(s => s.status === "Validé").length : 0,
          referralCommissions: referralsData ? referralsData.reduce((s, i) => s + Number(i.commission || 0), 0) : 0,
        }));
        if (profileData?.role === "Vendeur") {
          const { data: vrData } = await supabase.rpc("get_my_referrals");
          if (vrData) setVendorReferrals(vrData as VendorReferral[]);
          supabase.channel("vendor-referrals")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "referrals", filter: `referrer_id=eq.${uid}` }, async () => {
              const { data: fresh } = await supabase.rpc("get_my_referrals");
              if (fresh) setVendorReferrals(fresh as VendorReferral[]);
            }).subscribe();
        }
        const now = new Date().toISOString();
        const dayStart = new Date(); dayStart.setHours(0,0,0,0);
        const dayEnd   = new Date(); dayEnd.setHours(23,59,59,999);
        const { data: todayEvs } = await supabase.from("events").select("id,title,event_date,event_type,location,tier_required")
          .gte("event_date", dayStart.toISOString()).lte("event_date", dayEnd.toISOString()).limit(1);
        if (todayEvs?.length) {
          const ev = todayEvs[0];
          setActionItem({ type: "live", title: ev.title,
            info: `${ev.location || "En ligne"} · Aujourd'hui à ${new Date(ev.event_date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
            buttonText: "Accéder", href: "/evenements" });
        } else {
          const { data: nextEvs } = await supabase.from("events").select("id,title,event_date,event_type,location,tier_required").gt("event_date", now).order("event_date").limit(1);
          if (nextEvs?.length) {
            const ev = nextEvs[0];
            setActionItem({ type: "upcoming", title: ev.title,
              info: `${ev.location || "En ligne"} · ${new Date(ev.event_date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" })}`,
              buttonText: "Participer", href: "/evenements" });
          } else {
            const { data: chals } = await supabase.from("challenges").select("id,title,week_number,deadline").eq("is_active", true).order("week_number", { ascending: false }).limit(1);
            if (chals?.length) {
              const ch = chals[0];
              setActionItem({ type: "challenge", title: ch.title,
                info: `Semaine ${ch.week_number} · Challenge en cours`,
                buttonText: "Voir le challenge", href: "/challenges" });
            }
          }
        }
        const [{ data: mc }, { data: ch }, { data: post }] = await Promise.all([
          supabase.from("masterclasses").select("id,title,category").eq("is_published", true).order("order_index").limit(1).maybeSingle(),
          supabase.from("challenges").select("id,title,week_number").eq("is_active", true).order("week_number", { ascending: false }).limit(1).maybeSingle(),
          supabase.from("social_posts").select("id,content,category,author:members!author_id(first_name,last_name)").order("created_at", { ascending: false }).limit(1).maybeSingle(),
        ]);
        if (mc) setFeedMasterclass({ id: mc.id, category: mc.category || "Formation", title: mc.title,
          sub: "Parcours disponible", href: `/masterclasses/${mc.id}`, accent: "#6C3FC5", action: "Commencer" });
        if (ch) setFeedChallenge({ id: ch.id, category: "Challenge", title: ch.title,
          sub: `Semaine ${ch.week_number}`, href: "/challenges", accent: "#F0A500", action: "Participer" });
        if (post) {
          const raw = post.author;
          const a = Array.isArray(raw) ? (raw[0] as { first_name: string; last_name: string } | undefined) : (raw as { first_name: string; last_name: string } | null);
          setFeedPost({ id: post.id, category: post.category, title: (post.content as string).slice(0, 72) + "…",
            sub: a ? `${a.first_name} ${a.last_name}` : "Communauté",
            href: "/communaute", accent: "#0D9488", action: "Voir" });
        }
      } catch (err) {
        console.error("Dashboard load error", err);
      } finally {
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut  = async () => { try { await supabase.auth.signOut(); } catch { /* ignore */ } window.location.href = "/"; };
  const saveGoals      = (g: typeof goals)   => { setGoals(g);  try { localStorage.setItem("propulsion_dashboard_goals", JSON.stringify(g)); } catch { /* ignore */ } };
  const saveRevenue    = (v: number) => { setActuals(p => ({ ...p, monthlyRevenueActual: v })); try { localStorage.setItem("propulsion_dashboard_revenue_actual", String(v)); } catch { /* ignore */ } };
  const saveContacts   = (v: number) => { setActuals(p => ({ ...p, contactsMade: v }));        try { localStorage.setItem("propulsion_dashboard_contacts_made", String(v)); } catch { /* ignore */ } };
  const togglePrivacy  = async () => {
    if (!member.id) return;
    const next = !member.is_private;
    setUpdPri(true);
    await supabase.from("members").update({ is_private: next }).eq("id", member.id);
    setMember(p => ({ ...p, is_private: next }));
    setUpdPri(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F3F0] flex items-center justify-center">
        <span className="h-10 w-10 animate-spin border-[3px] border-[#2E6FD4] border-t-transparent rounded-full" />
      </div>
    );
  }

  const cardTier       = getCardTier(member);
  const levelColor     = getLevelColor(cardTier);
  const stepsCompleted = [true, !!member.city, member.status === "Actif", actuals.minutesWatched > 0, member.role !== "Standard"].filter(Boolean).length;
  const feedItems      = [feedMasterclass, feedChallenge, feedPost].filter(Boolean) as NonNullable<FeedItem>[];
  const isAdmin        = member.role === "Admin" || member.role === "Modérateur";
  const isVendeur      = member.role === "Vendeur";
  const vendorLink     = typeof window !== "undefined" && member.referral_code ? `${window.location.origin}/rejoindre?ref=${member.referral_code}` : "";
  const vendorTotalComm   = vendorReferrals.reduce((s, r) => s + (r.status === "Validé" ? Number(r.commission) : 0), 0);
  const vendorPending     = vendorReferrals.reduce((s, r) => s + (r.status === "Validé" && !r.paid_at ? Number(r.commission) : 0), 0);
  const vendorPaid        = vendorReferrals.reduce((s, r) => s + (r.paid_at ? Number(r.commission) : 0), 0);
  const vendorConversions = vendorReferrals.filter(r => r.status === "Validé").length;
  const fmtFcfa = (n: number) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : `${n.toLocaleString("fr-FR")} FCFA`;
  const today   = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const pillConfig = {
    live:      { label: "EN DIRECT",         dot: "#EF4444", bg: "#FEF2F2", text: "#EF4444" },
    upcoming:  { label: "PROCHAINEMENT",     dot: levelColor, bg: `${levelColor}10`, text: levelColor },
    challenge: { label: "CHALLENGE EN COURS", dot: "#F0A500", bg: "#FFF8EB", text: "#D97706" },
  };
  const pill = pillConfig[actionItem.type];

  return (
    <MemberLayout role={member.role}>

      {/* ── Desktop topbar ────────────────────────────────────────── */}
      <header className="hidden lg:flex sticky top-0 z-30 h-[60px] items-center justify-between border-b border-[#E0DDD8]/60 bg-[#F4F3F0]/90 backdrop-blur-xl px-6 shrink-0">
        <div>
          <h1 className="font-serif text-[22px] font-bold text-[#1A1A1A] leading-none">
            Bonjour, <span style={{ color: levelColor }}>{member.first_name}</span>.
          </h1>
          <p className="text-[11px] text-[#6B6B6B] mt-0.5 capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link href="/admin"
              className={`flex items-center gap-1.5 text-[11px] font-bold rounded-full border border-[#F0A500]/30 bg-[#F0A500]/10 px-3 py-1.5 text-[#F0A500] ${SP} hover:bg-[#F0A500]/20`}>
              Panneau Admin
            </Link>
          )}
          <NotificationsBell />
          <AvatarDropdown member={member} levelColor={levelColor} onSettings={() => setSettings(true)} onSignOut={handleSignOut} />
        </div>
      </header>

      {/* ── 2-col body ───────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Main column */}
        <div className="flex-1 min-w-0 overflow-y-auto px-4 md:px-6 py-5 space-y-4">

          {/* Mobile: member card */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#6B6B6B]">Identité Propulsion</p>
              <Link href="/profil" className="text-[12px] font-bold" style={{ color: levelColor }}>Modifier</Link>
            </div>
            <MemberCard member={member} />
          </div>

          {/* Focus card */}
          <section className="relative overflow-hidden rounded-[20px] p-6 sm:p-8 text-white"
            style={{ background: "radial-gradient(ellipse at top left, #1E1C16 0%, #0A0906 100%)" }}>
            <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: "radial-gradient(circle, #FFFFFF 1.5px, transparent 1.5px)", backgroundSize: "16px 16px" }} />
            <div className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(circle at 85% 15%, rgba(240,165,0,0.07) 0%, transparent 55%), radial-gradient(circle at 15% 85%, rgba(46,111,212,0.07) 0%, transparent 55%)" }} />
            <div className="relative space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em]"
                style={{ background: pill.bg, color: pill.text }}>
                {actionItem.type === "live"
                  ? <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                  : <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: pill.dot }} />
                }
                {pill.label}
              </span>
              <h2 className="font-serif text-[22px] sm:text-[26px] font-bold leading-tight text-white max-w-[40ch]">
                {actionItem.title}
              </h2>
              <p className="text-[12px] text-white/45 tracking-wide">{actionItem.info}</p>
              <Link href={actionItem.href}
                className={`inline-flex items-center gap-2.5 text-[13px] font-bold text-white rounded-xl px-5 py-3 ${SP} hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] shadow-md`}
                style={{ background: levelColor }}>
                {actionItem.buttonText}
                <ArrowRight width={14} height={14} />
              </Link>
            </div>
          </section>

          {/* KPI strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Chiffre d'affaires", display: `${(actuals.monthlyRevenueActual / 1000).toFixed(0)}k`, suffix: "FCFA",
                value: actuals.monthlyRevenueActual, max: goals.monthlyRevenueGoal, Icon: Wallet, color: "#F0A500" },
              { label: "Réseautage",          display: String(actuals.contactsMade), suffix: `/ ${goals.weeklyNetworkingGoal}`,
                value: actuals.contactsMade, max: goals.weeklyNetworkingGoal, Icon: Users, color: "#2E6FD4" },
              { label: "Formation",           display: String(actuals.minutesWatched), suffix: "min",
                value: actuals.minutesWatched, max: goals.weeklyMasterclassGoal, Icon: BookOpen, color: "#6C3FC5" },
            ].map(k => {
              const pct = Math.min(100, k.max > 0 ? Math.round((k.value / k.max) * 100) : 0);
              return <KpiPill key={k.label} label={k.label} display={k.display} suffix={k.suffix} pct={pct} Icon={k.Icon} color={k.color} />;
            })}
          </div>

          {/* Subscription countdown */}
          <SubscriptionWidget member={member} levelColor={levelColor} />

          {/* Onboarding progress */}
          <div className={`bg-white border border-[#E0DDD8]/60 rounded-2xl px-5 py-4 ${SP} hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#6B6B6B]">Premiers pas</span>
              <button onClick={() => setSettings(true)}
                className="text-[11px] font-bold" style={{ color: levelColor }}>
                {stepsCompleted} / 5 →
              </button>
            </div>
            <div className="h-[4px] w-full bg-[#F4F3F0] rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${SP}`} style={{ width: `${(stepsCompleted / 5) * 100}%`, background: levelColor }} />
            </div>
            <div className="flex gap-2 mt-3">
              {[0,1,2,3,4].map(i => (
                <span key={i} className={`h-1.5 w-1.5 rounded-full ${SP}`}
                  style={{ background: i < stepsCompleted ? levelColor : "#E0DDD8" }} />
              ))}
            </div>
          </div>

          {/* Feed */}
          <section className="space-y-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#6B6B6B]">Cette semaine</p>
            {feedItems.length > 0
              ? feedItems.map(item => (
                  <FeedCard key={item.id} category={item.category} title={item.title} sub={item.sub}
                    href={item.href} accentColor={item.accent} actionLabel={item.action} levelColor={levelColor} />
                ))
              : (
                <div className="bg-white border border-[#E0DDD8]/60 rounded-2xl p-6 text-center">
                  <p className="text-[13px] text-[#6B6B6B]">Aucune activité récente — explorez les modules.</p>
                  <Link href="/masterclasses" className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold" style={{ color: levelColor }}>
                    Voir les masterclasses <ArrowRight width={12} height={12} />
                  </Link>
                </div>
              )
            }
            {feedItems.length > 0 && (
              <div className="text-right">
                <Link href="/communaute" className="text-[12px] font-bold" style={{ color: levelColor }}>
                  Voir tout →
                </Link>
              </div>
            )}
          </section>

          {/* Vendeur section */}
          {isVendeur && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="h-[3px] w-6 rounded-full" style={{ background: "#E8174B" }} />
                <h2 className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#6B6B6B]">
                  Équipe Propulsion · Mes ventes
                </h2>
              </div>
              <div className={`rounded-2xl border border-[#E0DDD8] bg-white p-5 space-y-3`}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#6B6B6B]">Votre lien personnel</p>
                <div className="flex items-center gap-2">
                  <span className="flex-1 truncate text-[12px] font-mono text-[#1A1A1A] bg-[#F4F3F0] rounded-xl px-3 py-2">{vendorLink || "—"}</span>
                  <button
                    onClick={() => { if (vendorLink) { navigator.clipboard?.writeText(vendorLink); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); } }}
                    className={`h-9 px-4 rounded-full font-bold text-[12px] text-white ${SP} active:scale-95 shrink-0`}
                    style={{ background: linkCopied ? "#1D6B45" : levelColor }}>
                    {linkCopied ? "Copié ✓" : "Copier"}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Conversions",  value: vendorConversions.toString(), color: "#2E6FD4" },
                  { label: "Commissions",  value: fmtFcfa(vendorTotalComm),    color: "#1D6B45" },
                  { label: "À recevoir",   value: fmtFcfa(vendorPending),      color: "#F0A500" },
                  { label: "Déjà reçu",    value: fmtFcfa(vendorPaid),         color: "#6C3FC5" },
                ].map((k, i) => (
                  <div key={i} className="rounded-2xl border border-[#E0DDD8] bg-white p-4 space-y-1">
                    <p className="font-serif text-[22px] font-bold leading-none" style={{ color: k.color }}>{k.value}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#6B6B6B]">{k.label}</p>
                  </div>
                ))}
              </div>
              {vendorReferrals.length > 0 && (
                <div className="rounded-2xl border border-[#E0DDD8] bg-white overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[#E0DDD8]">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[#6B6B6B]">Dernières conversions</p>
                  </div>
                  <div className="divide-y divide-[#E0DDD8]/60">
                    {vendorReferrals.slice(0, 5).map(r => (
                      <div key={r.referral_id} className="flex items-center gap-3 px-5 py-3.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-[#1A1A1A]">{r.referred_name}</p>
                          <p className="text-[11px] text-[#6B6B6B]">{r.tier} · {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[12px] font-bold" style={{ color: r.status === "Validé" ? "#1D6B45" : "#F0A500" }}>
                            {fmtFcfa(Number(r.commission))}
                          </p>
                          <p className="text-[10px]" style={{ color: r.paid_at ? "#6C3FC5" : r.status === "Validé" ? "#1D6B45" : "#F0A500" }}>
                            {r.paid_at ? "Payé" : r.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right panel — desktop */}
        <aside className="hidden lg:flex flex-col w-[280px] shrink-0 border-l border-[#E0DDD8]/50 bg-[#F4F3F0] px-5 py-5 space-y-4 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#6B6B6B]">Identité Propulsion</p>
              <Link href="/profil" className="text-[11px] font-bold" style={{ color: levelColor }}>Modifier</Link>
            </div>
            <MemberCard member={member} />
          </div>

          {/* Completion ring */}
          <div className={`bg-white border border-[#E0DDD8]/60 rounded-2xl p-5 flex flex-col items-center gap-3 ${SP} hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]`}>
            <div className="relative w-[88px] h-[88px]">
              <svg width="88" height="88" viewBox="0 0 88 88">
                <circle cx="44" cy="44" r="38" fill="none" stroke="#F4F3F0" strokeWidth="6" />
                <circle cx="44" cy="44" r="38" fill="none" stroke={levelColor} strokeWidth="6.5"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 38}
                  strokeDashoffset={2 * Math.PI * 38 * (1 - stepsCompleted / 5)}
                  transform="rotate(-90 44 44)"
                  style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-serif text-[22px] font-bold text-[#1A1A1A]">{Math.round((stepsCompleted / 5) * 100)}%</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[13px] font-bold text-[#1A1A1A]">
                {stepsCompleted < 5 ? "Progression" : "Profil complet"}
              </p>
              <p className="text-[11px] text-[#6B6B6B] mt-0.5">{stepsCompleted} / 5 étapes</p>
            </div>
            {stepsCompleted < 5 && (
              <button onClick={() => setSettings(true)} className="text-[11px] font-bold" style={{ color: levelColor }}>
                Voir le détail →
              </button>
            )}
          </div>

          {/* Bio */}
          {member.bio ? (
            <div className={`bg-white border border-[#E0DDD8]/60 rounded-2xl p-4 relative overflow-hidden ${SP} hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]`}>
              <span className="absolute -right-2 -bottom-4 font-serif text-[72px] font-bold text-[#E0DDD8]/40 select-none pointer-events-none leading-none">"</span>
              <p className="text-[13px] text-[#4A4A48] italic leading-relaxed line-clamp-3 font-medium relative z-10">&ldquo;{member.bio}&rdquo;</p>
              <Link href="/profil" className="mt-2.5 inline-block text-[11px] font-bold relative z-10" style={{ color: levelColor }}>
                Modifier →
              </Link>
            </div>
          ) : (
            <div className={`bg-white border border-[#E0DDD8]/60 rounded-2xl p-4 text-center ${SP} hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]`}>
              <p className="text-[12px] text-[#6B6B6B]">Votre bio est vide.</p>
              <Link href="/profil" className="mt-1.5 inline-block text-[11px] font-bold" style={{ color: levelColor }}>
                Ajouter une bio →
              </Link>
            </div>
          )}
        </aside>
      </div>

      <AiAgent />

      {/* Settings drawer */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSettings(false)} />
          <div className="relative z-10 w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-y-auto border-l border-[#E0DDD8]">
            <div className="p-6 border-b border-[#E0DDD8] flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-serif text-[18px] font-bold text-[#1A1A1A]">Paramètres</h3>
                <p className="text-[12px] text-[#6B6B6B] mt-0.5">Personnalisez vos indicateurs</p>
              </div>
              <button onClick={() => setSettings(false)}
                className={`h-8 w-8 rounded-full border border-[#E0DDD8] flex items-center justify-center text-[#6B6B6B] ${SP} hover:text-[#1A1A1A] hover:border-[#1A1A1A]/30`}>
                <Close className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-7 flex-1">

              {/* Checklist */}
              <div className="space-y-3">
                <h4 className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#6B6B6B]">Premiers pas · {stepsCompleted} / 5</h4>
                <div className="space-y-2">
                  {[
                    { label: "Créer et valider son compte membre",                    done: true },
                    { label: "Compléter sa biographie et informations d'annuaire",    done: !!member.city },
                    { label: "Téléverser sa preuve d'adhésion",                       done: member.status === "Actif" },
                    { label: "Visionner la Masterclass d'introduction au Réseau",     done: actuals.minutesWatched > 0 },
                    { label: "Rejoindre l'annuaire général des entrepreneurs",        done: member.role !== "Standard" },
                  ].map((task, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-[#E0DDD8] p-3">
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${task.done ? "bg-[#22c55e] text-white" : "bg-[#F4F3F0] text-[#6B6B6B]"}`}>
                        <Check width={10} height={10} />
                      </span>
                      <span className={`text-[13px] ${task.done ? "text-[#6B6B6B] line-through" : "text-[#1A1A1A]"}`}>{task.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy toggle */}
              <div className="space-y-3">
                <h4 className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#6B6B6B]">Confidentialité</h4>
                <div className="flex items-center justify-between rounded-xl border border-[#E0DDD8] p-4 bg-[#F4F3F0]">
                  <div>
                    <p className="text-[13px] font-bold text-[#1A1A1A]">Profil public dans l&apos;annuaire</p>
                    <p className="text-[11px] text-[#6B6B6B] mt-0.5">Permettre aux membres de vous contacter.</p>
                  </div>
                  <button onClick={togglePrivacy} disabled={updatingPrivacy}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent ${SP} ${!member.is_private ? "bg-[#1A1A1A]" : "bg-[#E0DDD8]"}`}>
                    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow ${SP} ${!member.is_private ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>

              {/* Goals */}
              <div className="space-y-3">
                <h4 className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#6B6B6B]">Objectifs</h4>
                <div className="space-y-4 rounded-xl border border-[#E0DDD8] p-4 bg-[#F4F3F0]">
                  {[
                    { label: "OBJECTIF CA MENSUEL (FCFA)",       value: goals.monthlyRevenueGoal,     onChange: (v: number) => saveGoals({ ...goals, monthlyRevenueGoal: v }) },
                    { label: "CA ACTUEL CE MOIS (FCFA)",         value: actuals.monthlyRevenueActual, onChange: saveRevenue },
                    { label: "OBJECTIF CONTACTS / SEMAINE",      value: goals.weeklyNetworkingGoal,   onChange: (v: number) => saveGoals({ ...goals, weeklyNetworkingGoal: v }) },
                    { label: "CONTACTS CETTE SEMAINE",           value: actuals.contactsMade,          onChange: saveContacts },
                    { label: "OBJECTIF FORMATION SEMAINE (MIN)", value: goals.weeklyMasterclassGoal,  onChange: (v: number) => saveGoals({ ...goals, weeklyMasterclassGoal: v }) },
                  ].map(f => (
                    <div key={f.label} className="space-y-1.5">
                      <label className="block text-[9.5px] font-bold text-[#6B6B6B] tracking-wider">{f.label}</label>
                      <input type="number" value={f.value} onChange={e => f.onChange(Number(e.target.value) || 0)}
                        className="w-full rounded-xl border border-[#E0DDD8] bg-white px-3 py-2.5 text-[13px] text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]/40" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[#E0DDD8] bg-[#F4F3F0] shrink-0">
              <button onClick={() => setSettings(false)}
                className="w-full rounded-xl py-3 text-[14px] font-bold text-white"
                style={{ background: levelColor }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </MemberLayout>
  );
}
