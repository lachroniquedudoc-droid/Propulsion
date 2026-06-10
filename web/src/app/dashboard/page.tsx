"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/client";
import { MemberLayout } from "@/components/member-layout";
import { AiAgent } from "@/components/ai-agent";
import { NotificationsBell } from "@/components/notifications-bell";
import { Check, Settings, Close, ArrowRight, Wallet, Users, BookOpen } from "@/components/icons";

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
  role: string; status: string; unique_id: string;
  city: string; sector: string; company: string; bio: string; avatar_url: string;
  created_at?: string; subscription_expires_at?: string | null;
  is_private?: boolean; reputation_points?: number;
};

const DEFAULT_MEMBER: MemberData = {
  id: undefined,
  first_name: "", last_name: "", whatsapp: "",
  role: "Standard", status: "En attente de paiement", unique_id: "",
  city: "", sector: "", company: "", bio: "",
  avatar_url: "", is_private: false, reputation_points: 0,
};

/* ─── Member Card (right panel + mobile top) ────────────────────── */
function MemberCard({ member }: { member: MemberData }) {
  const initials  = `${member.first_name[0] ?? ""}${member.last_name[0] ?? ""}`.toUpperCase();
  const tier      = getCardTier(member);
  const displayRole = member.role === "Modérateur" ? "MODÉRATEUR" : member.role === "Admin" ? "ADMINISTRATEUR" : member.role.toUpperCase();

  const expiryDate = member.subscription_expires_at
    ? new Date(member.subscription_expires_at)
    : member.created_at
      ? new Date(new Date(member.created_at).setFullYear(new Date(member.created_at).getFullYear() + 1))
      : null;
  const expiry   = expiryDate ? expiryDate.toLocaleDateString("fr-FR", { month: "2-digit", year: "numeric" }) : "12/2026";
  // eslint-disable-next-line react-hooks/purity
  const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / 86_400_000) : null;

  const cardBg = tier === "Standard" ? "linear-gradient(135deg, #2E6FD4 0%, #153E82 100%)"
    : tier === "Pro"    ? "linear-gradient(135deg, #6C3FC5 0%, #351C66 100%)"
    : tier === "Élite"  ? "linear-gradient(135deg, #C9A84C 0%, #68531D 100%)"
    : "linear-gradient(135deg, #2E2E2C 0%, #111110 100%)";

  return (
    <div
      className="relative aspect-[1.586] w-full rounded-2xl overflow-hidden p-5 flex flex-col justify-between select-none text-white border border-white/15 shadow-xl transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl"
      style={{ background: cardBg }}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 opacity-60 pointer-events-none" />
      {tier === "Standard" && (
        <div className="absolute inset-0 opacity-[0.1] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #FFFFFF 1px, transparent 1px)", backgroundSize: "8px 8px" }} />
      )}
      {tier === "Pro" && (
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 1px, transparent 1px, transparent 8px)" }} />
      )}
      {(tier === "Élite" || tier === "Admin") && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 80 0 L 100 0 L 100 20 M 100 8 L 92 0 M 20 100 L 0 100 L 0 80 M 0 92 L 8 100" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
        </svg>
      )}
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
        <p className="font-mono text-[10.5px] text-white/70 mt-1.5 leading-none tracking-wide">{member.unique_id}</p>
      </div>
      <div className="flex items-center justify-between mt-auto z-10">
        <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-[10px] font-sans font-bold tracking-wide uppercase">
          {member.status === "Gratuit exceptionnel" ? "GRATUIT" : member.status.toUpperCase()}
        </span>
        <span className={`text-[11px] font-sans ${daysLeft !== null && daysLeft <= 30 && daysLeft > 0 ? "text-yellow-300 font-bold" : "text-white/70"}`}>
          {member.role === "Admin" || member.role === "Modérateur" ? "PERMANENT"
            : daysLeft !== null && daysLeft <= 30 && daysLeft > 0 ? `⚠ Expire dans ${daysLeft}j`
            : daysLeft !== null && daysLeft <= 0 ? "⚠ Expiré"
            : `Expire : ${expiry}`}
        </span>
      </div>
    </div>
  );
}

/* ─── Metric Ring ────────────────────────────────────────────────── */
function MetricRing({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct         = Math.min(100, max > 0 ? Math.round((value / max) * 100) : 0);
  const r           = 44;
  const circumf     = 2 * Math.PI * r;
  const dashOffset  = circumf * (1 - pct / 100);
  const gradId      = `ring-grad-${label.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <div className="relative w-[100px] h-[100px] hover:scale-105 transition-transform duration-300">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={`${color}80`} />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r={r} fill="none" stroke="#F4F3F0" strokeWidth="6.5" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={`url(#${gradId})`} strokeWidth="7"
            strokeLinecap="round" strokeDasharray={circumf} strokeDashoffset={dashOffset}
            transform="rotate(-90 50 50)" style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-serif text-[26px] font-bold text-ink leading-none">{pct}%</span>
        </div>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B6B6B] font-sans">{label}</span>
    </div>
  );
}

/* ─── Feed Card ──────────────────────────────────────────────────── */
function FeedCard({ category, title, sub, href, accentColor, actionLabel, levelColor }: {
  category: string; title: string; sub: string; href: string;
  accentColor: string; actionLabel: string; levelColor: string;
}) {
  return (
    <div className="group relative bg-white border border-[#E0DDD8]/60 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.005] hover:shadow-[0_8px_25px_rgba(0,0,0,0.03)] hover:border-brand/10">
      <div className="absolute left-0 top-0 bottom-0 w-[4px]" style={{ backgroundColor: accentColor }} />
      <div className="pl-5 pr-5 py-[18px]">
        <span className="text-[9px] font-bold uppercase tracking-[0.15em] font-sans px-2.5 py-0.5 rounded-full inline-block" style={{ backgroundColor: `${accentColor}10`, color: accentColor }}>
          {category}
        </span>
        <p className="text-[15px] font-bold text-[#1A1A1A] mt-2.5 leading-snug font-sans">{title}</p>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-50">
          <span className="text-[12px] text-[#6B6B6B] font-sans font-medium">{sub}</span>
          <Link href={href} className="text-[12.5px] font-bold font-sans whitespace-nowrap ml-3 inline-flex items-center gap-0.5 transition-colors" style={{ color: levelColor }}>
            {actionLabel} <span className="group-hover:translate-x-0.5 transition-transform duration-200">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Avatar Dropdown ────────────────────────────────────────────── */
function AvatarDropdown({ member, levelColor, onSettings, onSignOut }: {
  member: MemberData; levelColor: string;
  onSettings: () => void; onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initials = `${member.first_name[0] ?? ""}${member.last_name[0] ?? ""}`.toUpperCase();

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="h-8 w-8 rounded-full border-2 overflow-hidden flex items-center justify-center font-bold text-[12px] text-white focus:outline-none transition-transform hover:scale-105 active:scale-95"
        style={{ borderColor: `${levelColor}60`, backgroundColor: levelColor }}
      >
        {member.avatar_url
          ? <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
          : <span>{initials}</span>
        }
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[#E0DDD8] bg-white shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E0DDD8]">
            <p className="text-[13px] font-bold text-ink truncate">{member.first_name} {member.last_name}</p>
            <span
              className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white"
              style={{ backgroundColor: levelColor }}
            >
              {member.role}
            </span>
          </div>
          <div className="py-1">
            <button
              onClick={() => { setOpen(false); onSettings(); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-[#1A1A1A] hover:bg-[#F4F3F0] transition-colors font-sans text-left"
            >
              <Settings width={14} height={14} className="text-muted" />
              Paramètres
            </button>
            <Link
              href="/profil"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-[#1A1A1A] hover:bg-[#F4F3F0] transition-colors font-sans"
            >
              <span className="h-3.5 w-3.5 rounded-full border border-muted flex items-center justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-muted" />
              </span>
              Mon profil
            </Link>
            <button
              onClick={() => { setOpen(false); onSignOut(); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-[#E8174B] hover:bg-[#fff0f2] transition-colors font-sans text-left"
            >
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

/* ─── Main Dashboard ─────────────────────────────────────────────── */
export default function DashboardPage() {
  const [loading, setLoading]         = useState(true);
  const [member, setMember]           = useState<MemberData>(DEFAULT_MEMBER);
  const [isSettingsOpen, setSettings] = useState(false);
  const [updatingPrivacy, setUpdPri]  = useState(false);

  const [goals, setGoals] = useState({ monthlyRevenueGoal: 500000, weeklyNetworkingGoal: 5, weeklyMasterclassGoal: 60 });
  const [actuals, setActuals] = useState({ minutesWatched: 0, challengesCompleted: 0, contactsMade: 0, monthlyRevenueActual: 0, referralCommissions: 0 });

  type ActionItem = { type: "live"|"upcoming"|"challenge"; title: string; info: string; buttonText: string; href: string; };
  const [actionItem, setActionItem] = useState<ActionItem>({
    type: "upcoming",
    title: "Prochaine masterclasse Propulsion",
    info: "Consultez les masterclasses disponibles",
    buttonText: "Voir les masterclasses",
    href: "/masterclasses",
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
      try {
        const [
          { data: profileData },
          { data: progressData },
          { data: submissionsData },
          { data: referralsData },
        ] = await Promise.all([
          supabase.from("members").select("id,first_name,last_name,whatsapp,role,status,unique_id,city,sector,company,bio,avatar_url,is_private,reputation_points,created_at,subscription_expires_at").eq("id", uid).single(),
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
          minutesWatched:     progressData ? Math.round(progressData.reduce((s, i) => s + (i.seconds_watched || 0), 0) / 60) : 0,
          challengesCompleted: submissionsData ? submissionsData.filter(s => s.status === "Validé").length : 0,
          referralCommissions: referralsData ? referralsData.reduce((s, i) => s + Number(i.commission || 0), 0) : 0,
        }));

        /* ── Focus card: priority logic ── */
        const now      = new Date().toISOString();
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

        /* ── Feed data ── */
        const [{ data: mc }, { data: ch }, { data: post }] = await Promise.all([
          supabase.from("masterclasses").select("id,title,category").eq("is_published", true).order("order_index").limit(1).single(),
          supabase.from("challenges").select("id,title,week_number").eq("is_active", true).order("week_number", { ascending: false }).limit(1).single(),
          supabase.from("social_posts")
            .select("id,content,category,author:members!author_id(first_name,last_name)")
            .order("created_at", { ascending: false }).limit(1).single(),
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

  const handleSignOut = async () => { try { await supabase.auth.signOut(); } catch { /* ignore */ } window.location.href = "/"; };

  const saveGoals  = (g: typeof goals)   => { setGoals(g);  try { localStorage.setItem("propulsion_dashboard_goals", JSON.stringify(g)); } catch { /* ignore */ } };
  const saveRevenue = (v: number) => { setActuals(p => ({ ...p, monthlyRevenueActual: v })); try { localStorage.setItem("propulsion_dashboard_revenue_actual", String(v)); } catch { /* ignore */ } };
  const saveContacts = (v: number) => { setActuals(p => ({ ...p, contactsMade: v }));       try { localStorage.setItem("propulsion_dashboard_contacts_made", String(v)); } catch { /* ignore */ } };
  const togglePrivacy = async () => {
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
        <span className="h-10 w-10 animate-spin border-4 border-brand border-t-transparent rounded-full" />
      </div>
    );
  }

  const cardTier    = getCardTier(member);
  const levelColor  = getLevelColor(cardTier);
  const stepsCompleted = [
    true, !!member.city, member.status === "Actif", actuals.minutesWatched > 0, member.role !== "Standard",
  ].filter(Boolean).length;

  const feedItems = [feedMasterclass, feedChallenge, feedPost].filter(Boolean) as NonNullable<FeedItem>[];

  const isAdmin = member.role === "Admin" || member.role === "Modérateur";

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  /* ── PILL LABEL MAP for focus card ── */
  const pillConfig = {
    live:      { label: "EN DIRECT",       dotColor: "#EF4444", bg: "#FEF2F2", text: "#EF4444" },
    upcoming:  { label: "PROCHAINEMENT",   dotColor: levelColor, bg: `${levelColor}15`, text: levelColor },
    challenge: { label: "CHALLENGE EN COURS", dotColor: "#F0A500", bg: "#FFF8EB", text: "#D97706" },
  };
  const pill = pillConfig[actionItem.type];

  return (
    <MemberLayout role={member.role}>

      {/* ── Desktop Topbar ── */}
      <header className="hidden lg:flex sticky top-0 z-30 h-14 items-center justify-between border-b border-[#E0DDD8]/60 bg-white px-6 shrink-0">
        <div>
          <h1 className="font-serif text-[22px] font-bold text-[#1A1A1A] leading-none">
            Bonjour, {member.first_name}.
          </h1>
          <p className="text-[12px] text-[#6B6B6B] font-sans mt-0.5 capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link href="/admin" className="flex items-center gap-1.5 text-[11px] font-bold text-brand rounded-full border border-brand/20 bg-brand/5 px-3 py-1.5 hover:bg-brand/10 transition-colors">
              👑 Admin
            </Link>
          )}
          <NotificationsBell />
          <AvatarDropdown
            member={member}
            levelColor={levelColor}
            onSettings={() => setSettings(true)}
            onSignOut={handleSignOut}
          />
        </div>
      </header>

      {/* ── 3-column body: main + right panel ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Main column ── */}
        <div className="flex-1 min-w-0 overflow-y-auto px-4 md:px-6 py-5 space-y-4">

          {/* Mobile: member card first */}
          <div className="lg:hidden space-y-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6B6B6B] font-sans">Identité Propulsion</p>
              <Link href="/profil" className="text-[12px] font-semibold font-sans" style={{ color: levelColor }}>Modifier</Link>
            </div>
            <MemberCard member={member} />
          </div>

          {/* ── Zone A — Focus card ── */}
          <section
            className="relative overflow-hidden rounded-[24px] p-8 text-white border border-white/5 shadow-2xl transition-all duration-300 hover:shadow-brand/5"
            style={{ background: "radial-gradient(ellipse at top left, #1E1E1C 0%, #0A0A09 100%)" }}
          >
            <div className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay"
              style={{ backgroundImage: "radial-gradient(circle, #FFFFFF 1.5px, transparent 1.5px)", backgroundSize: "16px 16px" }} />
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(circle at 80% 20%, rgba(255, 172, 66, 0.08) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(56, 113, 194, 0.08) 0%, transparent 60%)" }} />
            <div className="relative space-y-5">
              {/* Status pill */}
              <div className="flex">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] font-sans"
                  style={{ backgroundColor: pill.bg, color: pill.text }}
                >
                  {actionItem.type === "live" ? (
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: pill.text }} />
                  )}
                  {pill.label}
                </span>
              </div>
              {/* Title */}
              <h2 className="font-serif text-[24px] sm:text-[28px] font-bold leading-tight text-white max-w-[40ch]">
                {actionItem.title}
              </h2>
              {/* Supporting info */}
              <p className="text-[13px] font-sans text-white/50 tracking-wide">{actionItem.info}</p>
              {/* CTA */}
              <div className="pt-2">
                <Link
                  href={actionItem.href}
                  className="inline-flex items-center gap-2.5 font-sans text-[13.5px] font-bold text-white rounded-xl px-6 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] duration-200 cursor-pointer shadow-md"
                  style={{ backgroundColor: levelColor, height: "46px" }}
                >
                  {actionItem.buttonText}
                  <ArrowRight width={14} height={14} />
                </Link>
              </div>
            </div>
          </section>

          {/* ── Zone B — Progress strip ── */}
          <section className="space-y-3">
            {/* 3 pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  value: actuals.monthlyRevenueActual,
                  max: goals.monthlyRevenueGoal,
                  label: "Chiffre d'affaires",
                  display: `${(actuals.monthlyRevenueActual / 1000).toFixed(0)}k`,
                  suffix: "FCFA",
                  Icon: Wallet,
                  iconBg: "#ffac42",
                },
                {
                  value: actuals.contactsMade,
                  max: goals.weeklyNetworkingGoal,
                  label: "Réseautage",
                  display: String(actuals.contactsMade),
                  suffix: `/ ${goals.weeklyNetworkingGoal}`,
                  Icon: Users,
                  iconBg: "#3871c2",
                },
                {
                  value: actuals.minutesWatched,
                  max: goals.weeklyMasterclassGoal,
                  label: "Formation",
                  display: String(actuals.minutesWatched),
                  suffix: "min",
                  Icon: BookOpen,
                  iconBg: "#766391",
                },
              ].map((pill) => {
                const pct = Math.min(100, pill.max > 0 ? Math.round((pill.value / pill.max) * 100) : 0);
                return (
                  <div key={pill.label} className="relative bg-white border border-[#E0DDD8]/60 rounded-2xl p-4 flex items-center justify-between shadow-none transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)] overflow-hidden">
                    <div className="space-y-1">
                      <span className="text-[10px] text-[#6B6B6B] font-sans font-bold uppercase tracking-wider block">{pill.label}</span>
                      <div className="flex items-baseline gap-1">
                        <span className="font-serif text-[24px] font-bold text-[#1A1A1A] leading-none">{pill.display}</span>
                        <span className="text-[11px] text-[#6B6B6B] font-semibold">{pill.suffix}</span>
                      </div>
                    </div>
                    <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${pill.iconBg}15`, color: pill.iconBg }}>
                      <pill.Icon width={18} height={18} />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#F4F3F0]">
                      <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: pill.iconBg }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Onboarding progress bar */}
            <div className="bg-white border border-[#E0DDD8]/60 rounded-2xl px-4 py-3.5 shadow-none hover:shadow-[0_4px_15px_rgba(0,0,0,0.02)] transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#6B6B6B] font-sans font-bold uppercase tracking-wider">Premiers pas d&apos;intégration</span>
                <Link href="#" onClick={(e) => { e.preventDefault(); setSettings(true); }}
                  className="text-[11px] font-bold font-sans" style={{ color: levelColor }}>
                  {stepsCompleted} / 5 complétés →
                </Link>
              </div>
              <div className="h-[4px] w-full bg-[#F4F3F0] rounded-full overflow-hidden">
                <div className="h-full transition-all duration-700 rounded-full" style={{ width: `${(stepsCompleted / 5) * 100}%`, backgroundColor: levelColor }} />
              </div>
            </div>
          </section>

          {/* ── Zone C — Feed ── */}
          <section className="space-y-3">
            <p className="text-[12px] font-sans uppercase tracking-[0.12em] text-[#6B6B6B]">Cette semaine</p>
            {feedItems.length > 0
              ? feedItems.map(item => (
                  <FeedCard key={item.id}
                    category={item.category} title={item.title} sub={item.sub}
                    href={item.href} accentColor={item.accent}
                    actionLabel={item.action} levelColor={levelColor}
                  />
                ))
              : (
                <div className="bg-white border border-[#E0DDD8]/80 rounded-xl p-6 text-center">
                  <p className="text-[13px] text-[#6B6B6B] font-sans">Aucune activité récente — explorez les modules.</p>
                  <Link href="/masterclasses" className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold font-sans" style={{ color: levelColor }}>
                    Voir les masterclasses <ArrowRight width={12} height={12} />
                  </Link>
                </div>
              )
            }
            {feedItems.length > 0 && (
              <div className="text-right">
                <Link href="/communaute" className="text-[12px] font-semibold font-sans" style={{ color: levelColor }}>
                  Voir tout →
                </Link>
              </div>
            )}
          </section>

        </div>

        {/* ── Right panel — desktop only ── */}
        <aside className="hidden lg:flex flex-col w-[300px] shrink-0 border-l border-[#E0DDD8]/50 px-5 py-5 space-y-5 overflow-y-auto bg-[#F4F3F0]">

          {/* Block 1 — Member card */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6B6B6B] font-sans">Identité Propulsion</p>
              <Link href="/profil" className="text-[12px] font-semibold font-sans" style={{ color: levelColor }}>Modifier</Link>
            </div>
            <MemberCard member={member} />
          </div>

           {/* Block 2 — Metric ring */}
          <div className="bg-white border border-[#E0DDD8]/60 rounded-2xl p-5 flex flex-col items-center gap-1.5 shadow-none hover:shadow-[0_4px_15px_rgba(0,0,0,0.015)] transition-shadow">
            <MetricRing
              value={stepsCompleted}
              max={5}
              label={stepsCompleted < 5 ? "Premiers pas" : "Engagement"}
              color={levelColor}
            />
            {stepsCompleted < 5 && (
              <Link href="#" onClick={(e) => { e.preventDefault(); setSettings(true); }}
                className="text-[11px] font-bold font-sans mt-1" style={{ color: levelColor }}>
                Voir le détail →
              </Link>
            )}
          </div>

          {/* Block 3 — Bio */}
          {member.bio ? (
            <div className="bg-white border border-[#E0DDD8]/60 rounded-2xl p-4 relative overflow-hidden group shadow-none hover:shadow-[0_4px_15px_rgba(0,0,0,0.015)] transition-shadow">
              <span className="absolute -right-2 -bottom-4 font-serif text-[72px] font-bold text-[#E0DDD8]/30 select-none pointer-events-none">”</span>
              <p className="text-[13.5px] text-[#4A4A48] font-sans italic leading-relaxed line-clamp-3 font-medium">&ldquo;{member.bio}&rdquo;</p>
              <Link href="/profil" className="mt-2.5 inline-block text-[11px] font-bold font-sans transition-colors relative z-10" style={{ color: levelColor }}>
                Modifier →
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-[#E0DDD8]/60 rounded-2xl p-4 text-center shadow-none hover:shadow-[0_4px_15px_rgba(0,0,0,0.015)] transition-shadow">
              <p className="text-[12px] text-[#6B6B6B] font-sans">Votre bio est vide.</p>
              <Link href="/profil" className="mt-1.5 inline-block text-[11px] font-bold font-sans" style={{ color: levelColor }}>
                Ajouter une bio →
              </Link>
            </div>
          )}

        </aside>
      </div>

      <AiAgent />

      {/* ── Settings drawer ── */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSettings(false)} />
          <div className="relative z-10 w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-y-auto border-l border-line">
            <div className="p-6 border-b border-line flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-[16px] font-bold text-ink">Paramètres</h3>
                <p className="text-[12px] text-muted mt-0.5 font-sans">Personnalisez vos indicateurs</p>
              </div>
              <button onClick={() => setSettings(false)} className="h-8 w-8 rounded-full border border-line flex items-center justify-center text-muted hover:text-ink transition-colors">
                <Close className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-6 flex-1 font-sans">

              {/* Checklist détail */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-faint">Premiers pas · {stepsCompleted} / 5</h4>
                <div className="space-y-2">
                  {[
                    { label: "Créer et valider son compte membre",                       done: true },
                    { label: "Compléter sa biographie et informations d'annuaire",       done: !!member.city },
                    { label: "Téléverser sa preuve d'adhésion",                          done: member.status === "Actif" },
                    { label: "Visionner la Masterclass d'introduction au Réseau",        done: actuals.minutesWatched > 0 },
                    { label: "Rejoindre l'annuaire général des entrepreneurs",           done: member.role !== "Standard" },
                  ].map((task, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-line p-3">
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${task.done ? "bg-[#22c55e] text-white" : "bg-line text-muted"}`}>
                        <Check width={10} height={10} />
                      </span>
                      <span className={`text-[13px] font-sans ${task.done ? "text-muted line-through" : "text-ink"}`}>{task.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-faint">Confidentialité</h4>
                <div className="flex items-center justify-between rounded-xl border border-line p-4 bg-paper">
                  <div>
                    <p className="text-[13px] font-bold text-ink">Profil public dans l&apos;annuaire</p>
                    <p className="text-[11px] text-muted mt-0.5">Permettre aux membres de vous contacter.</p>
                  </div>
                  <button
                    onClick={togglePrivacy} disabled={updatingPrivacy}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${!member.is_private ? "bg-brand" : "bg-line"}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${!member.is_private ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>

              {/* Goals */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-faint">Objectifs</h4>
                <div className="space-y-4 rounded-xl border border-line p-4 bg-paper">
                  {[
                    { label: "OBJECTIF CA MENSUEL (FCFA)",        value: goals.monthlyRevenueGoal,    onChange: (v: number) => saveGoals({ ...goals, monthlyRevenueGoal: v }) },
                    { label: "CA ACTUEL CE MOIS (FCFA)",          value: actuals.monthlyRevenueActual, onChange: saveRevenue },
                    { label: "OBJECTIF CONTACTS / SEMAINE",        value: goals.weeklyNetworkingGoal,  onChange: (v: number) => saveGoals({ ...goals, weeklyNetworkingGoal: v }) },
                    { label: "CONTACTS CETTE SEMAINE",            value: actuals.contactsMade,         onChange: saveContacts },
                    { label: "OBJECTIF FORMATION SEMAINE (MIN)",  value: goals.weeklyMasterclassGoal, onChange: (v: number) => saveGoals({ ...goals, weeklyMasterclassGoal: v }) },
                  ].map(f => (
                    <div key={f.label} className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-muted tracking-wider">{f.label}</label>
                      <input type="number" value={f.value} onChange={e => f.onChange(Number(e.target.value) || 0)}
                        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[12.5px] text-ink focus:border-brand/40 focus:outline-none" />
                    </div>
                  ))}
                </div>
              </div>

            </div>
            <div className="p-6 border-t border-line bg-paper shrink-0">
              <button onClick={() => setSettings(false)}
                className="w-full rounded-xl py-3 text-[14px] font-semibold text-white transition-colors font-sans"
                style={{ backgroundColor: levelColor }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </MemberLayout>
  );
}
