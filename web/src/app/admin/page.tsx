"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { supabase } from "@/utils/supabase/client";
import {
  Star, Check, PlayCircle, Users, ArrowRight, Shield,
  Card, Crown, Search, Plus, Bell, ExternalLink, Camera, Close, Filter
} from "@/components/icons";
import { NotificationsBell } from "@/components/notifications-bell";

const GeoMap = dynamic(() => import("./geo-map").then(m => m.GeoMap), {
  ssr: false,
  loading: () => <div className="h-52 animate-pulse rounded-xl bg-[#e0ddd8]/30"/>,
});

/* ─── Types ──────────────────────────────────────────────────────── */
type Payment = {
  id: string; member_id: string; method: string; sender_info: string;
  amount: number; proof_url: string | null; status: string; created_at: string;
  member: { first_name: string; last_name: string; role: string; avatar_url: string | null } | null;
};
type Member = {
  id: string; first_name: string; last_name: string; role: string;
  status: string; city: string | null; created_at: string; avatar_url: string | null;
  whatsapp: string | null; sector: string | null;
  badges: string[] | null; reputation_points: number | null;
};
type Masterclass = {
  id: string; title: string; description: string | null; youtube_id: string | null;
  category: string; tier_required: string; duration_min: number;
  is_published: boolean; created_at: string; module_count?: number;
  course_type?: string; thumbnail_url?: string | null;
};
type CourseModule = {
  id: string; masterclass_id: string; title: string; description: string | null;
  youtube_id: string; duration_min: number; order_index: number; is_published: boolean;
};
type AdminEvent = {
  id: string; title: string; description: string; event_date: string;
  event_type: string; location: string; meet_link: string | null; price: number;
  spots_max: number | null; tier_required: string; created_at: string;
  event_registrations?: { id: string; confirmed_at: string | null }[];
};
type AdminPost = {
  id: string; title: string; content: string; category: string; created_at: string;
  author?: { first_name: string; last_name: string };
};
type MarketOffer = {
  id: string; title: string; description: string; price: string; category: string;
  whatsapp: string; status: string; admin_note: string | null; created_at: string;
  author?: { first_name: string; last_name: string; avatar_url: string | null };
};
type Contact = {
  id: string; member_id: string | null; first_name: string; last_name: string;
  company: string | null; sector: string | null; city: string | null; country: string | null;
  phone: string | null; email: string | null; whatsapp: string | null;
  website: string | null; bio: string | null; avatar_url: string | null;
  is_published: boolean; created_at: string;
};
type Resource = {
  id: string; title: string; description: string; category: string;
  file_url: string | null; external_url: string | null; resource_type: string;
  tier_required: string; is_published: boolean; download_count: number; created_at: string;
};
type Stats = {
  total: number; active: number; pending_payments: number;
  elite: number; new_this_week: number; revenue: number;
};
type ActivityLog = {
  id: string; member_id: string; event_type: string;
  metadata: Record<string, unknown>; created_at: string;
  member: { first_name: string; last_name: string; role: string } | null;
};

type AdminChallenge = {
  id: string;
  week_number: number;
  title: string;
  context: string;
  objective: string;
  mission: string;
  deliverable: string;
  resources: string[] | null;
  category: string;
  difficulty: string;
  points: number;
  deadline: string | null;
  tier_required: string;
  is_active: boolean;
  created_at: string;
};

type AdminSubmission = {
  id: string;
  challenge_id: string | null;
  submission_url: string;
  description: string | null;
  status: string;
  created_at: string;
  member_id: string;
  member: { first_name: string; last_name: string; role: string; avatar_url: string | null } | null;
  challenge: { title: string; points: number } | null;
};

type Tab = "overview" | "onboarding" | "members" | "content" | "annuaire" | "settings" | "analytics" | "equipe";
type OnboardingSub = "paiements" | "marche" | "submissions" | "annuaire_add";

type TeamMember = {
  member_id: string; first_name: string; last_name: string;
  referral_code: string; avatar_url: string | null; created_at: string;
  total_referrals: number; conversions: number;
  total_commission: number; pending_payment: number; paid_commission: number;
};
type TeamReferral = {
  referral_id: string; referred_name: string; tier: string;
  commission: number; status: string; paid_at: string | null; created_at: string;
};
type ContentSub = "masterclasses" | "challenges" | "evenements" | "ressources" | "publications";

/* ─── Level Colors ────────────────────────────────────────────────── */
const TIER_COLOR: Record<string, string> = {
  Standard: "#2E6FD4",
  Pro: "#6C3FC5",
  Élite: "#C9A84C",
  Modérateur: "#E8174B",
  Admin: "#1A1A1A",
};

const STATUS_COLOR: Record<string, string> = {
  Actif: "#1D6B45",
  "En attente de paiement": "#F0A500",
  "Paiement à valider": "#2E6FD4",
  Suspendu: "#E8174B",
  Expiré: "#6B6B6B",
};

function fmtAmount(n: number) {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M FCFA` : `${n.toLocaleString("fr-FR")} FCFA`;
}
function initials(m: { first_name: string; last_name: string }) {
  return (m.first_name[0] + (m.last_name[0] ?? "")).toUpperCase();
}
function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 3_600_000)  return `Il y a ${Math.round(diff / 60_000)} min`;
  if (diff < 86_400_000) return `Il y a ${Math.round(diff / 3_600_000)}h`;
  return `Il y a ${Math.round(diff / 86_400_000)}j`;
}

function parseVideoUrl(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  
  if (trimmed.startsWith("vimeo:")) {
    return trimmed;
  }
  
  // Vimeo URL patterns
  const vimeoRegex = /(?:vimeo\.com\/(?:video\/|channels\/[^\/]+\/|groups\/[^\/]+\/videos\/|showcase\/[^\/]+\/video\/|)?|player\.vimeo\.com\/video\/)(\d+)(?:\/([a-zA-Z0-9]+))?/;
  const vimeoMatch = trimmed.match(vimeoRegex);
  if (vimeoMatch) {
    const videoId = vimeoMatch[1];
    const hash = vimeoMatch[2];
    return hash ? `vimeo:${videoId}:${hash}` : `vimeo:${videoId}`;
  }
  
  if (/^\d+$/.test(trimmed)) {
    return `vimeo:${trimmed}`;
  }
  
  // YouTube URL patterns
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
  const ytMatch = trimmed.match(youtubeRegex);
  if (ytMatch) {
    return ytMatch[1];
  }
  
  return trimmed;
}

const CITY_ISO: [string, string][] = [
  ["douala","120"],["yaoundé","120"],["yaounde","120"],["bafoussam","120"],
  ["garoua","120"],["maroua","120"],["bamenda","120"],["kribi","120"],
  ["limbe","120"],["buea","120"],["ebolowa","120"],
  ["abidjan","384"],["yamoussoukro","384"],["bouaké","384"],
  ["dakar","686"],["thiès","686"],
  ["lomé","768"],
  ["cotonou","204"],["porto-novo","204"],
  ["libreville","266"],["port-gentil","266"],
  ["brazzaville","178"],["pointe-noire","178"],
  ["kinshasa","180"],["lubumbashi","180"],["goma","180"],
  ["lagos","566"],["abuja","566"],["ibadan","566"],
  ["accra","288"],["kumasi","288"],
  ["bamako","466"],["ouagadougou","854"],["conakry","324"],
  ["n'djamena","148"],["ndjamena","148"],["kigali","646"],
  ["paris","250"],["lyon","250"],["marseille","250"],["bordeaux","250"],
  ["toulouse","250"],["lille","250"],["nantes","250"],["strasbourg","250"],
  ["montpellier","250"],["rennes","250"],["nice","250"],
  ["bruxelles","56"],["liège","56"],
  ["montréal","124"],["montreal","124"],["toronto","124"],["ottawa","124"],["vancouver","124"],
  ["london","826"],["londres","826"],["manchester","826"],
  ["new york","840"],["los angeles","840"],["chicago","840"],["houston","840"],["atlanta","840"],
  ["berlin","276"],["munich","276"],
  ["madrid","724"],["rome","380"],["amsterdam","528"],
  ["zurich","756"],["lausanne","756"],["genève","756"],["geneve","756"],
  ["casablanca","504"],["tunis","788"],["dubai","784"],
  // Pays (Fallbacks)
  ["cameroun","120"],["cameroon","120"],
  ["côte d'ivoire","384"],["cote d'ivoire","384"],["ivory coast","384"],
  ["sénégal","686"],["senegal","686"],
  ["togo","768"],
  ["bénin","204"],["benin","204"],
  ["gabon","266"],
  ["congo-brazzaville","178"],["congo brazzaville","178"],
  ["rdc","180"],["congo-kinshasa","180"],["congo kinshasa","180"],["democratic republic of the congo","180"],
  ["nigeria","566"],
  ["ghana","288"],
  ["mali","466"],
  ["burkina faso","854"],
  ["guinée","324"],["guinee","324"],["guinea","324"],
  ["tchad","148"],["chad","148"],
  ["rwanda","646"],
  ["france","250"],
  ["belgique","56"],["belgium","56"],
  ["canada","124"],
  ["royaume-uni","826"],["united kingdom","826"],["uk","826"],
  ["états-unis","840"],["etats-unis","840"],["united states","840"],["usa","840"],
  ["allemagne","276"],["germany","276"],
  ["espagne","724"],["spain","724"],
  ["italie","380"],["italy","380"],
  ["pays-bas","528"],["netherlands","528"],
  ["suisse","756"],["switzerland","756"],
  ["maroc","504"],["morocco","504"],
  ["tunisie","788"],["tunisia","788"],
  ["émirats arabes unis","784"],["emirats arabes unis","784"],["uae","784"],["united arab emirates","784"]
];

/* ─── Country names (ISO numeric → label) ────────────────────────── */
const COUNTRY_NAMES: Record<string, string> = {
  "120": "Cameroun", "384": "Côte d'Ivoire", "686": "Sénégal", "768": "Togo",
  "204": "Bénin", "266": "Gabon", "178": "Congo-Brazzaville", "180": "RDC",
  "566": "Nigeria", "288": "Ghana", "466": "Mali", "854": "Burkina Faso",
  "324": "Guinée", "148": "Tchad", "646": "Rwanda", "250": "France",
  "56": "Belgique", "124": "Canada", "826": "Royaume-Uni", "840": "États-Unis",
  "276": "Allemagne", "724": "Espagne", "380": "Italie", "528": "Pays-Bas",
  "756": "Suisse", "504": "Maroc", "788": "Tunisie", "784": "Émirats Arabes Unis",
};

/* ─── Badges de certification ─────────────────────────────────────── */
const BADGES = [
  { id: "Certifié",          color: "#2E6FD4", bg: "#EEF5FF",  icon: "✓" },
  { id: "Expert",            color: "#6C3FC5", bg: "#F3EEFF",  icon: "★" },
  { id: "Ambassadeur",       color: "#C9A84C", bg: "#FFF8E6",  icon: "◈" },
  { id: "Mentor",            color: "#1D6B45", bg: "#E8F5EE",  icon: "♦" },
  { id: "Fondateur",         color: "#1A1A1A", bg: "#F4F3F0",  icon: "⬡" },
  { id: "Top Contributeur",  color: "#E8174B", bg: "#FFF0F3",  icon: "↑" },
  { id: "Partenaire",        color: "#F0A500", bg: "#FFFAEB",  icon: "⚡" },
] as const;

function BadgePill({ badge, small }: { badge: string; small?: boolean }) {
  const def = BADGES.find(b => b.id === badge);
  if (!def) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full font-bold font-sans"
      style={{
        background: def.bg, color: def.color,
        fontSize: small ? "9px" : "10px",
        padding: small ? "1px 6px" : "2px 8px",
      }}
    >
      <span style={{ fontSize: small ? "9px" : "10px" }}>{def.icon}</span>
      {def.id}
    </span>
  );
}

function cityToIso(city: string | null): string | null {
  if (!city) return null;
  const l = city.toLowerCase().trim();
  for (const [k, iso] of CITY_ISO) { if (l.includes(k)) return iso; }
  return null;
}
function computeGeoData(members: Member[]): Record<string, number> {
  const c: Record<string, number> = {};
  for (const m of members) { const iso = cityToIso(m.city); if (iso) c[iso] = (c[iso] ?? 0) + 1; }
  return c;
}

/* ─── Icons ──────────────────────────────────────────────────────── */
const Icons = {
  CurrencyFranc: (props: any) => (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5M12 9H5M12 17H5" />
    </svg>
  ),
  Users: (props: any) => (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.85" />
    </svg>
  ),
  CircleCheck: (props: any) => (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Bell: (props: any) => (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  ),
  Star: (props: any) => (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  TrendingUp: (props: any) => (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m23 6-10 10-6-6-7 7M17 6h6v6" />
    </svg>
  ),
  PlayerPlay: (props: any) => (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 9l5 3-5 3z" />
    </svg>
  ),
  GripVertical: (props: any) => (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="5" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="19" r="1" />
    </svg>
  ),
  ShieldCheck: (props: any) => (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 11 2 2 4-4" />
    </svg>
  ),
  ChevronRight: (props: any) => (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  ),
  Check: (props: any) => (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
};

/* ─── FiveColorBar ────────────────────────────────────────────────── */
function FiveColorBar() {
  return (
    <div className="flex h-[3px] w-24 rounded-full overflow-hidden my-3">
      <div className="flex-1 bg-[#766391]" />
      <div className="flex-1 bg-[#3871c2]" />
      <div className="flex-1 bg-[#ffac42]" />
      <div className="flex-1 bg-[#1A1A1A]" />
      <div className="flex-1 bg-[#E8174B]" />
    </div>
  );
}

/* ─── Growth bar chart (redesigned) ──────────────────────────────── */
function GrowthChart({ data }: { data: { month: string; count: number }[] }) {
  const max = Math.max(1, ...data.map(d => d.count));
  const W = 600, H = 180, PB = 24, PT = 16, innerH = H - PB - PT;
  const bw = (W / data.length) * 0.45, gap = W / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden>
      {/* Baseline only */}
      <line x1={0} y1={H - PB} x2={W} y2={H - PB} stroke="#E0DDD8" strokeWidth={0.5} />
      {data.map((d, i) => {
        const x = gap * i + (gap - bw) / 2;
        const barH = d.count === 0 ? 2 : Math.max(5, (d.count / max) * innerH);
        const y = H - PB - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={barH} rx={4} fill="#2E6FD4" />
            <text x={x + bw / 2} y={H - PB + 16} textAnchor="middle" className="text-[11px] font-sans fill-[#6B6B6B]">{d.month}</text>
            {d.count > 0 && <text x={x + bw / 2} y={y - 6} textAnchor="middle" className="text-[11px] font-sans font-bold fill-[#2E6FD4]">{d.count}</text>}
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Vue d'ensemble KPI Card ─────────────────────────────────────── */
function AdminMetricCard({ label, value, Icon, color, dotColor }: { label: string; value: string; Icon: any; color: string; dotColor?: string }) {
  return (
    <div className="relative rounded-2xl bg-white border border-[#E0DDD8] flex flex-col justify-between h-full shadow-none" style={{ padding: "16px 20px" }}>
      {dotColor && (
        <span className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dotColor }} />
      )}
      <div className="flex flex-col items-start gap-4">
        <span style={{ color }} className="shrink-0"><Icon width={20} height={20} /></span>
        <span className="text-[11px] font-sans font-bold uppercase tracking-[0.1em] text-[#6B6B6B]">{label}</span>
      </div>
      <p className="mt-4 font-serif text-[28px] font-bold text-[#1A1A1A] leading-none">{value}</p>
    </div>
  );
}

/* ─── Underline Form Field Elements ────────────────────────────── */
function AdminUnderlineInput({ label, type = "text", value, onChange, placeholder, required, error, ...props }: any) {
  const [focused, setFocused] = useState(false);
  const isEmpty = required && (value === undefined || value === null || String(value).trim() === "");
  
  let borderColor = "#E0DDD8";
  if (error) {
    borderColor = "#E8174B";
  } else if (focused) {
    borderColor = "#2E6FD4";
  } else if (isEmpty) {
    borderColor = "#F0A500";
  }

  return (
    <div className="flex flex-col mb-4">
      {label && <label className="text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-[#6B6B6B] mb-2">{label}</label>}
      <input
        type={type}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        className="w-full bg-transparent border-t-0 border-l-0 border-r-0 border-b outline-none text-[15px] font-sans transition-colors duration-200"
        style={{
          height: "40px",
          borderColor: borderColor,
        }}
        {...props}
      />
      {error && <span className="text-[12px] font-sans text-[#E8174B] mt-1.5">{error}</span>}
      {!error && isEmpty && <span className="text-[11px] font-sans text-[#F0A500] mt-1.5">Requis</span>}
    </div>
  );
}

function AdminUnderlineSelect({ label, value, onChange, required, children, error }: any) {
  const [focused, setFocused] = useState(false);
  const isEmpty = required && (value === undefined || value === null || String(value).trim() === "");
  
  let borderColor = "#E0DDD8";
  if (error) {
    borderColor = "#E8174B";
  } else if (focused) {
    borderColor = "#2E6FD4";
  } else if (isEmpty) {
    borderColor = "#F0A500";
  }

  return (
    <div className="flex flex-col mb-4">
      {label && <label className="text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-[#6B6B6B] mb-2">{label}</label>}
      <select
        value={value ?? ""}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        className="w-full bg-transparent border-t-0 border-l-0 border-r-0 border-b outline-none text-[15px] font-sans transition-colors duration-200"
        style={{
          height: "40px",
          borderColor: borderColor,
        }}
      >
        {children}
      </select>
      {error && <span className="text-[12px] font-sans text-[#E8174B] mt-1.5">{error}</span>}
      {!error && isEmpty && <span className="text-[11px] font-sans text-[#F0A500] mt-1.5">Requis</span>}
    </div>
  );
}

function AdminUnderlineTextarea({ label, value, onChange, placeholder, required, rows = 3, error }: any) {
  const [focused, setFocused] = useState(false);
  const isEmpty = required && (value === undefined || value === null || String(value).trim() === "");
  
  let borderColor = "#E0DDD8";
  if (error) {
    borderColor = "#E8174B";
  } else if (focused) {
    borderColor = "#2E6FD4";
  } else if (isEmpty) {
    borderColor = "#F0A500";
  }

  return (
    <div className="flex flex-col mb-4">
      {label && <label className="text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-[#6B6B6B] mb-2">{label}</label>}
      <textarea
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        className="w-full bg-transparent border-t-0 border-l-0 border-r-0 border-b outline-none text-[15px] font-sans transition-colors duration-200 py-2 resize-none"
        style={{
          borderColor: borderColor,
        }}
      />
      {error && <span className="text-[12px] font-sans text-[#E8174B] mt-1.5">{error}</span>}
      {!error && isEmpty && <span className="text-[11px] font-sans text-[#F0A500] mt-1.5">Requis</span>}
    </div>
  );
}

/* ─── Empty state component ───────────────────────────────────────── */
function AdminEmptyState({ title, subtitle, ctaLabel, onCtaClick }: { title: string; subtitle: string; ctaLabel?: string; onCtaClick?: () => void }) {
  return (
    <div className="rounded-2xl border border-[#E0DDD8] bg-white p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-none">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1D6B45]/10 text-[#1D6B45]">
        <Icons.Check width={20} height={20} />
      </div>
      <h3 className="font-serif text-[18px] font-bold text-[#1A1A1A]">{title}</h3>
      <p className="max-w-md text-[14px] font-sans text-[#6B6B6B] leading-relaxed">{subtitle}</p>
      
      <FiveColorBar />

      {ctaLabel && onCtaClick && (
        <button
          onClick={onCtaClick}
          className="h-10 px-5 bg-[#1A1A1A] text-white rounded-lg text-[14px] font-semibold transition-all hover:scale-[1.015] active:scale-[0.98] cursor-pointer"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}

/* ─── Sub-tab selector (Redesigned pills) ────────────────────────── */
function SubTabs<T extends string>({ tabs, active, onChange }: {
  tabs: { id: T; label: string; badge?: number }[];
  active: T;
  onChange: (t: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 py-2">
      {tabs.map(t => {
        const isAct = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="flex items-center gap-2 px-4 transition-all cursor-pointer font-sans text-[13px] font-semibold"
            style={{
              height: "34px",
              borderRadius: "8px",
              backgroundColor: isAct ? "#1A1A1A" : "#F4F3F0",
              color: isAct ? "#FFFFFF" : "#6B6B6B",
            }}
          >
            <span>{t.label}</span>
            {t.badge !== undefined && t.badge > 0 && (
              <span
                className="flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9.5px] font-bold"
                style={{
                  backgroundColor: isAct ? "rgba(255,255,255,0.2)" : "#E8174B",
                  color: "#FFFFFF"
                }}
              >
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */
export default function AdminPage() {
  const [adminRole, setAdminRole]   = useState<string | null>(null);
  const [adminUid, setAdminUid]     = useState<string | null>(null);
  const [tab, setTab]               = useState<Tab>("overview");
  const [onboardSub, setOnboardSub] = useState<OnboardingSub>("paiements");
  const [contentSub, setContentSub] = useState<ContentSub>("masterclasses");

  /* Data */
  const [payments, setPayments]       = useState<Payment[]>([]);
  const [members, setMembers]         = useState<Member[]>([]);
  const [masterclasses, setMasterclasses] = useState<Masterclass[]>([]);
  const [events, setEvents]           = useState<AdminEvent[]>([]);
  const [posts, setPosts]             = useState<AdminPost[]>([]);
  const [offers, setOffers]           = useState<MarketOffer[]>([]);
  const [contacts, setContacts]       = useState<Contact[]>([]);
  const [resources, setResources]     = useState<Resource[]>([]);
  const [challenges, setChallenges]   = useState<AdminChallenge[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<AdminSubmission[]>([]);
  const [stats, setStats]             = useState<Stats | null>(null);
  const [geoData, setGeoData]         = useState<Record<string, number>>({});
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [teamMembers, setTeamMembers]   = useState<TeamMember[]>([]);
  const [teamReferrals, setTeamReferrals] = useState<Record<string, TeamReferral[]>>({});
  const [expandedVendeur, setExpandedVendeur] = useState<string | null>(null);
  const [vendeurSearch, setVendeurSearch] = useState("");
  const [addVendeurSearch, setAddVendeurSearch] = useState("");
  const [addVendeurResults, setAddVendeurResults] = useState<Member[]>([]);

  const [systemSettings, setSystemSettings] = useState<{
    maintenanceMode: boolean;
    maintenanceMessage: string;
    enableSocialFeed: boolean;
    enableMarketplace: boolean;
    enableChallenges: boolean;
    enableMessaging: boolean;
    commissionStandard: number | "";
    commissionPro: number | "";
    commissionElite: number | "";
    pointsPerChallenge: number | "";
  }>({
    maintenanceMode: false,
    maintenanceMessage: "La plateforme Propulsion est en cours de maintenance. Revenez très vite !",
    enableSocialFeed: true, enableMarketplace: true,
    enableChallenges: true, enableMessaging: true,
    commissionStandard: 2500, commissionPro: 11250, commissionElite: 30000,
    pointsPerChallenge: 50,
  });

  /* Analytics */
  const [analyticsPostsWeek,   setAnalyticsPostsWeek]   = useState(0);
  const [analyticsPostsMonth,  setAnalyticsPostsMonth]  = useState(0);
  const [analyticsChallTotal,  setAnalyticsChallTotal]  = useState(0);
  const [analyticsChallDone,   setAnalyticsChallDone]   = useState(0);
  const [analyticsRevByTier,   setAnalyticsRevByTier]   = useState<Record<string, number>>({});
  const [topContributors,      setTopContributors]      = useState<Member[]>([]);
  const [monthlyGrowth12,      setMonthlyGrowth12]      = useState<{ month: string; count: number }[]>([]);

  /* UI state */
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [membersPage, setMembersPage] = useState(0);
  const [membersTotal, setMembersTotal] = useState(0);
  const MEMBERS_PER_PAGE = 50;
  const [memberFilter, setMemberFilter] = useState("Tous");
  const [contactSearch, setContactSearch] = useState("");
  const [contactSectorFilter, setContactSectorFilter] = useState("Tous");
  const [contactCountryFilter, setContactCountryFilter] = useState("Tous");
  const [contactCityFilter, setContactCityFilter] = useState("Tous");
  const [showContactFilters, setShowContactFilters] = useState(false);
  const [showImportZone, setShowImportZone] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [parsedContacts, setParsedContacts] = useState<any[]>([]);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const resourceFileRef           = useRef<HTMLInputElement>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
  } | null>(null);

  /* Form toggles */
  const [showCreateMasterclass, setShowCreateMasterclass] = useState(false);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateResource, setShowCreateResource] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);

  /* Form: masterclass */
  const [mc, setMc] = useState({ title: "", description: "", youtubeId: "", category: "Vente", tier: "Standard", duration: "", courseType: "Masterclass", thumbnailUrl: "", instructor: "Dr Claudel Noubissie" });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const thumbnailFileRef = useRef<HTMLInputElement>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [courseModules, setCourseModules]   = useState<Record<string, CourseModule[]>>({});
  const [newMod, setNewMod]     = useState({ title: "", description: "", youtubeId: "", duration: "" });
  const [addingModule, setAddingModule] = useState(false);

  /* Form: event */
  const [ev, setEv] = useState({ title: "", description: "", date: "", time: "18:00", location: "", meetLink: "", type: "En ligne", price: "0", spots: "", tier: "Standard" });
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [eventImagePreview, setEventImagePreview] = useState<string | null>(null);
  const eventFileRef = useRef<HTMLInputElement>(null);

  /* Form: post */
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "Annonces" });

  /* Form: contact (annuaire) */
  const [ct, setCt] = useState({ firstName: "", lastName: "", company: "", sector: "", city: "", country: "Cameroun", phone: "", email: "", whatsapp: "", website: "", bio: "", memberId: "" });

  /* Form: resource */
  const [res, setRes] = useState({ title: "", description: "", category: "Général", type: "PDF", tier: "Standard", externalUrl: "", fileUrl: "" });

  /* Form: challenge */
  const [chForm, setChForm] = useState({
    weekNumber: "", title: "", context: "", objective: "", mission: "", deliverable: "",
    resources: "", category: "Business", difficulty: "Intermédiaire", points: "50",
    deadlineDate: "", deadlineTime: "23:59", tier: "Standard", isActive: false
  });

  const notify = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  async function viewProof(proofUrl: string) {
    // Extract the storage path from the stored public URL and create a short-lived signed URL.
    // Pattern: .../storage/v1/object/public/payment-proofs/<path>
    const marker = "/storage/v1/object/public/payment-proofs/";
    if (proofUrl.includes(marker)) {
      const filePath = decodeURIComponent(proofUrl.split(marker)[1]?.split("?")[0] ?? "");
      if (filePath) {
        const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(filePath, 600);
        if (data?.signedUrl) { window.open(data.signedUrl, "_blank", "noopener"); return; }
        if (error) { notify("Impossible d'ouvrir la preuve : " + error.message, false); return; }
      }
    }
    // Fallback for plain-text proof (reference number typed by hand)
    window.open(proofUrl, "_blank", "noopener");
  }

  /* ── Load ── Toutes les données en un seul aller-retour ─────────── */
  const loadAll = useCallback(async () => {
    const sevenDaysAgo  = new Date(Date.now() - 7  * 86400_000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString();

    const [
      { data: pays },  { data: mems, count: memsTotal },   { data: mcs },
      { data: evts },  { data: postsD },
      { data: offersD }, { data: contactsD }, { data: resD },
      { data: chs },   { data: pSubs },
      { data: revTier },
      { count: pw },   { count: pm },
      { count: challTotal }, { count: challDone },
    ] = await Promise.all([
      /* Paiements en attente de validation */
      supabase.from("payments")
        .select("id,member_id,method,sender_info,amount,proof_url,status,created_at,member:members!member_id(first_name,last_name,role,avatar_url)")
        .eq("status","En attente").order("created_at",{ascending:false}),

      /* Membres — source unique, toutes colonnes utiles */
      supabase.from("members")
        .select("id,first_name,last_name,role,status,city,created_at,avatar_url,whatsapp,sector,badges,reputation_points", { count: "exact" })
        .order("created_at",{ascending:false})
        .range(0, 49),

      /* Contenu */
      supabase.from("masterclasses").select("id,title,description,youtube_id,category,tier_required,duration_min,is_published,created_at").order("order_index"),
      supabase.from("events").select("id,title,description,event_date,event_type,location,meet_link,price,spots_max,tier_required,image_url,created_at,event_registrations(id,confirmed_at)").order("event_date",{ascending:false}),
      supabase.from("social_posts").select("id,title,content,category,created_at,author:members!author_id(first_name,last_name)").order("created_at",{ascending:false}).limit(50),

      /* Validation Marché */
      supabase.from("market_offers")
        .select("id,title,description,price,category,whatsapp,status,admin_note,created_at,author:members!author_id(first_name,last_name,avatar_url)")
        .eq("status","En attente").order("created_at",{ascending:false}),

      /* Annuaire & Ressources */
      supabase.from("annuaire").select("id,first_name,last_name,company,sector,city,country,phone,email,whatsapp,website,bio,avatar_url,is_published,created_at").order("created_at",{ascending:false}),
      supabase.from("resources").select("id,title,description,category,resource_type,tier_required,external_url,file_url,is_published,created_at").order("created_at",{ascending:false}),

      /* Challenges & soumissions en cours */
      supabase.from("challenges").select("id,week_number,title,context,objective,mission,deliverable,category,difficulty,points,deadline,tier_required,is_active,created_at").order("week_number",{ascending:false}),
      supabase.from("challenge_submissions")
        .select("id,challenge_id,submission_url:deliverable_url,description:comments,status,created_at,member_id,member:members!member_id(first_name,last_name,role,avatar_url),challenge:challenges!challenge_id(title,points)")
        .eq("status","En cours").order("created_at",{ascending:false}),

      /* Revenus validés avec rôle — source unique pour stats.revenue ET analyticsRevByTier */
      supabase.from("payments").select("amount,member:members!member_id(role)").eq("status","Validé"),

      /* Activité sociale */
      supabase.from("social_posts").select("*",{count:"exact",head:true}).gte("created_at",sevenDaysAgo),
      supabase.from("social_posts").select("*",{count:"exact",head:true}).gte("created_at",thirtyDaysAgo),

      /* Challenges — taux de complétion */
      supabase.from("challenge_submissions").select("*",{count:"exact",head:true}),
      supabase.from("challenge_submissions").select("*",{count:"exact",head:true}).eq("status","Validé"),
    ]);

    /* Logs d'activité — séparés car non critiques */
    const { data: logsData } = await supabase
      .from("member_activity_logs")
      .select("id,member_id,event_type,metadata,created_at,member:members!member_id(first_name,last_name,role)")
      .order("created_at", { ascending: false })
      .limit(100);

    /* ── Membres : source de vérité pour tous les dérivés ── */
    const allMembers = (mems as Member[]) ?? [];
    const allPays    = (pays as unknown as Payment[]) ?? [];
    setMembersTotal(memsTotal ?? 0);

    /* Stats : total vient du count DB (exact), les filtres sur la page courante */
    const total         = memsTotal ?? allMembers.length;
    const active        = allMembers.filter(m => m.status === "Actif").length;
    const elite         = allMembers.filter(m => m.role === "Élite").length;
    const new_this_week = allMembers.filter(m => m.created_at >= sevenDaysAgo).length;
    const pending_payments = allPays.length;

    /* Revenus : une seule source, deux usages */
    const byTier: Record<string, number> = {};
    for (const p of (revTier as any[]) ?? []) {
      const r = (p.member as any)?.role ?? "Standard";
      byTier[r] = (byTier[r] ?? 0) + Number(p.amount);
    }
    const revenue = Object.values(byTier).reduce((a, b) => a + b, 0);

    /* Classement : trié en mémoire depuis allMembers */
    const topC = [...allMembers]
      .sort((a, b) => (b.reputation_points ?? 0) - (a.reputation_points ?? 0))
      .slice(0, 8);

    /* Croissance 12 mois : calculée une seule fois depuis allMembers */
    const now = new Date();
    const growth12 = Array.from({ length: 12 }, (_, i) => {
      const d     = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const start = d.toISOString();
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
      return { month: d.toLocaleDateString("fr-FR", { month: "short" }), count: allMembers.filter(m => m.created_at >= start && m.created_at < end).length };
    });

    /* ── Set state ── */
    setPayments(allPays);
    setMembers(allMembers);
    setMasterclasses((mcs as Masterclass[]) ?? []);
    setEvents((evts as AdminEvent[]) ?? []);
    setPosts((postsD as unknown as AdminPost[]) ?? []);
    setOffers((offersD as unknown as MarketOffer[]) ?? []);
    setContacts((contactsD as Contact[]) ?? []);
    setResources((resD as Resource[]) ?? []);
    setChallenges((chs as AdminChallenge[]) ?? []);
    setPendingSubmissions((pSubs as unknown as AdminSubmission[]) ?? []);
    setStats({ total, active, pending_payments, elite, new_this_week, revenue });
    setGeoData(computeGeoData(allMembers));
    setAnalyticsPostsWeek(pw ?? 0);
    setAnalyticsPostsMonth(pm ?? 0);
    setAnalyticsChallTotal(challTotal ?? 0);
    setAnalyticsChallDone(challDone ?? 0);
    setAnalyticsRevByTier(byTier);
    setTopContributors(topC);
    setMonthlyGrowth12(growth12);
    setActivityLogs((logsData as unknown as ActivityLog[]) ?? []);

    /* Équipe Propulsion — stats via RPC */
    const { data: teamData } = await supabase.rpc("get_team_stats");
    setTeamMembers((teamData as unknown as TeamMember[]) ?? []);
  }, []);

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase.from("system_settings").select("*").eq("id",1).single();
        if (data && !error) setSystemSettings({ maintenanceMode: data.maintenance_mode, maintenanceMessage: data.maintenance_message, enableSocialFeed: data.enable_social_feed, enableMarketplace: data.enable_marketplace, enableChallenges: data.enable_challenges, enableMessaging: data.enable_messaging, commissionStandard: Number(data.commission_standard), commission_pro: Number(data.commission_pro), commissionElite: Number(data.commission_elite), pointsPerChallenge: Number(data.points_per_challenge) } as any);
      } catch {}
    }
    loadSettings();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== "INITIAL_SESSION") return;
      if (!session?.user) { window.location.href = "/connexion"; return; }
      setAdminUid(session.user.id);
      const { data: m } = await supabase.from("members").select("role").eq("id", session.user.id).single();
      const role = m?.role ?? "Standard";
      setAdminRole(role);
      if (role === "Admin" || role === "Modérateur") await loadAll();
    });
    return () => subscription.unsubscribe();
  }, [loadAll]);

  const saveSettings = async (next: typeof systemSettings) => {
    setSystemSettings(next);
    try {
      await supabase.from("system_settings").update({ maintenance_mode: next.maintenanceMode, maintenance_message: next.maintenanceMessage, enable_social_feed: next.enableSocialFeed, enable_marketplace: next.enableMarketplace, enable_challenges: next.enableChallenges, enable_messaging: next.enableMessaging, commission_standard: next.commissionStandard, commission_pro: next.commissionPro, commission_elite: next.commissionElite, points_per_challenge: next.pointsPerChallenge }).eq("id", 1);
      notify("Paramètres enregistrés.");
    } catch { notify("Échec de l'enregistrement.", false); }
  };

  /* ── Paiements ──────────────────────────────────────────────────── */
  async function approvePayment(pay: Payment) {
    setSaving(true);
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    await Promise.all([
      supabase.from("payments").update({ status: "Validé" }).eq("id", pay.id),
      supabase.from("members").update({ status: "Actif", role: pay.member?.role ?? "Standard", subscription_expires_at: expiresAt }).eq("id", pay.member_id),
    ]);
    // Notify the member their subscription is active
    await supabase.from("member_notifications").insert({
      member_id: pay.member_id,
      type: "subscription_activated",
      category: "Finance",
      title: "Bienvenue dans Propulsion CNIC !",
      body: "Votre adhésion est active pour 1 an. Explorez la communauté, les masterclasses et le marché.",
      link: "/dashboard",
    });
    setPayments(p => p.filter(x => x.id !== pay.id));
    notify(`${pay.member?.first_name} ${pay.member?.last_name} activé.`);
    setSaving(false);
  }
  async function rejectPayment(pay: Payment) {
    await supabase.from("payments").update({ status: "Rejeté" }).eq("id", pay.id);
    setPayments(p => p.filter(x => x.id !== pay.id));
    notify(`Paiement de ${pay.member?.first_name} rejeté.`, false);
  }

  /* ── Membres ────────────────────────────────────────────────────── */
  async function loadMoreMembers() {
    const nextPage = membersPage + 1;
    const from = nextPage * MEMBERS_PER_PAGE;
    const to   = from + MEMBERS_PER_PAGE - 1;
    const { data } = await supabase.from("members")
      .select("id,first_name,last_name,role,status,city,created_at,avatar_url,whatsapp,sector,badges,reputation_points")
      .order("created_at", { ascending: false })
      .range(from, to);
    if (data?.length) {
      setMembers(prev => [...prev, ...(data as Member[])]);
      setMembersPage(nextPage);
    }
  }

  async function changeMemberRole(id: string, role: string) {
    await supabase.from("members").update({ role }).eq("id", id);
    setMembers(m => m.map(x => x.id === id ? { ...x, role } : x));
    notify(`Niveau changé en ${role}.`);
  }
  async function changeMemberStatus(id: string, status: string) {
    await supabase.from("members").update({ status }).eq("id", id);
    setMembers(m => m.map(x => x.id === id ? { ...x, status } : x));
    notify(`Statut : ${status}.`);
  }
  async function deleteMember(id: string) {
    setConfirmDialog({
      title: "Supprimer le membre",
      message: "Êtes-vous sûr de vouloir supprimer ce membre définitivement ? Cette action supprimera également son profil et toutes ses données associées.",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      isDanger: true,
      onConfirm: async () => {
        try {
          setSaving(true);
          const { error } = await supabase.from("members").delete().eq("id", id);
          if (error) throw error;
          setMembers(m => m.filter(x => x.id !== id));
          notify("Membre supprimé.");
        } catch (err: unknown) {
          notify("Erreur : " + (err instanceof Error ? err.message : "inconnue"), false);
        } finally {
          setSaving(false);
        }
      }
    });
  }

  /* ── Badges ─────────────────────────────────────────────────────── */
  async function toggleBadge(member: Member, badge: string) {
    const current = member.badges ?? [];
    const next = current.includes(badge)
      ? current.filter(b => b !== badge)
      : [...current, badge];
    const { error } = await supabase.from("members").update({ badges: next }).eq("id", member.id);
    if (error) { notify("Erreur badge : " + error.message, false); return; }
    setMembers(ms => ms.map(m => m.id === member.id ? { ...m, badges: next } : m));
    notify(current.includes(badge) ? `Badge "${badge}" retiré.` : `Badge "${badge}" attribué.`);
  }

  /* ── Marché — validation ────────────────────────────────────────── */
  async function approveOffer(offer: MarketOffer) {
    await supabase.from("market_offers").update({ status: "Approuvé" }).eq("id", offer.id);
    setOffers(o => o.filter(x => x.id !== offer.id));
    notify(`Offre «${offer.title}» approuvée et visible.`);
  }
  async function rejectOffer(offer: MarketOffer) {
    await supabase.from("market_offers").update({ status: "Rejeté" }).eq("id", offer.id);
    setOffers(o => o.filter(x => x.id !== offer.id));
    notify(`Offre rejetée.`, false);
  }

  /* ── Challenges & Soumissions ──────────────────────────────────── */
  async function approveSubmission(sub: AdminSubmission, points: number) {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("challenge_submissions")
        .update({ status: "Validé", points_awarded: points })
        .eq("id", sub.id);
      if (error) throw error;
      setPendingSubmissions(s => s.filter(x => x.id !== sub.id));
      notify(`Soumission de ${sub.member?.first_name} validée (${points} pts attribués).`);
    } catch (err: unknown) {
      notify("Erreur : " + (err instanceof Error ? err.message : "inconnue"), false);
    } finally {
      setSaving(false);
    }
  }

  async function rejectSubmission(sub: AdminSubmission) {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("challenge_submissions")
        .update({ status: "Rejeté" })
        .eq("id", sub.id);
      if (error) throw error;
      setPendingSubmissions(s => s.filter(x => x.id !== sub.id));
      notify(`Soumission de ${sub.member?.first_name} rejetée.`, false);
    } catch (err: unknown) {
      notify("Erreur : " + (err instanceof Error ? err.message : "inconnue"), false);
    } finally {
      setSaving(false);
    }
  }

  async function addChallenge(e: React.FormEvent) {
    e.preventDefault();
    if (!chForm.title || !chForm.weekNumber) {
      notify("Titre et numéro de semaine requis.", false);
      return;
    }
    setSaving(true);
    try {
      const deadlineDt = chForm.deadlineDate 
        ? new Date(`${chForm.deadlineDate}T${chForm.deadlineTime || "23:59"}`).toISOString()
        : null;

      const resourcesList = chForm.resources
        ? chForm.resources.split("\n").map(r => r.trim()).filter(Boolean)
        : null;

      const { data, error } = await supabase
        .from("challenges")
        .insert({
          week_number: parseInt(chForm.weekNumber),
          title: chForm.title,
          context: chForm.context,
          objective: chForm.objective,
          mission: chForm.mission,
          deliverable: chForm.deliverable,
          resources: resourcesList,
          category: chForm.category,
          difficulty: chForm.difficulty,
          points: parseInt(chForm.points) || 50,
          deadline: deadlineDt,
          tier_required: chForm.tier,
          is_active: chForm.isActive,
        })
        .select()
        .single();

      if (error) throw error;
      setChallenges(prev => [data as AdminChallenge, ...prev]);
      notify(`Challenge «${chForm.title}» créé.`);
      setChForm({
        weekNumber: "", title: "", context: "", objective: "", mission: "", deliverable: "",
        resources: "", category: "Business", difficulty: "Intermédiaire", points: "50",
        deadlineDate: "", deadlineTime: "23:59", tier: "Standard", isActive: false
      });
    } catch (err: unknown) {
      notify("Erreur : " + (err instanceof Error ? err.message : "inconnue"), false);
    } finally {
      setSaving(false);
    }
  }

  async function toggleChallengeActive(ch: AdminChallenge) {
    try {
      const { error } = await supabase
        .from("challenges")
        .update({ is_active: !ch.is_active })
        .eq("id", ch.id);
      if (error) throw error;
      setChallenges(prev => prev.map(x => x.id === ch.id ? { ...x, is_active: !ch.is_active } : x));
      notify(ch.is_active ? "Challenge désactivé." : "Challenge activé.");
    } catch (err: unknown) {
      notify("Erreur : " + (err instanceof Error ? err.message : "inconnue"), false);
    }
  }

  async function deleteChallenge(id: string) {
    setConfirmDialog({
      title: "Supprimer le challenge",
      message: "Êtes-vous sûr de vouloir supprimer ce challenge définitivement ? Toutes les soumissions associées à ce challenge seront également supprimées ou détachées.",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      isDanger: true,
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from("challenges")
            .delete()
            .eq("id", id);
          if (error) throw error;
          setChallenges(prev => prev.filter(x => x.id !== id));
          notify("Challenge supprimé.");
        } catch (err: unknown) {
          notify("Erreur : " + (err instanceof Error ? err.message : "inconnue"), false);
        }
      }
    });
  }

  /* ── Annuaire ────────────────────────────────────────────────────── */
  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    if (!ct.firstName || !ct.lastName) { notify("Prénom et nom requis.", false); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase.from("annuaire").insert({
        member_id:  ct.memberId || null,
        first_name: ct.firstName, last_name: ct.lastName,
        company: ct.company || null, sector: ct.sector || null,
        city: ct.city || null, country: ct.country || null,
        phone: ct.phone || null, email: ct.email || null,
        whatsapp: ct.whatsapp || null, website: ct.website || null,
        bio: ct.bio || null, is_published: true, created_by: adminUid,
      }).select().single();
      if (error) throw error;
      setContacts(prev => [data as Contact, ...prev]);
      notify(`${ct.firstName} ${ct.lastName} ajouté à l'annuaire.`);
      setCt({ firstName: "", lastName: "", company: "", sector: "", city: "", country: "Cameroun", phone: "", email: "", whatsapp: "", website: "", bio: "", memberId: "" });
    } catch (err: unknown) {
      notify("Erreur : " + (err instanceof Error ? err.message : "inconnue"), false);
    } finally { setSaving(false); }
  }
  async function toggleContactPublished(c: Contact) {
    await supabase.from("annuaire").update({ is_published: !c.is_published }).eq("id", c.id);
    setContacts(prev => prev.map(x => x.id === c.id ? { ...x, is_published: !c.is_published } : x));
    notify(c.is_published ? "Contact masqué." : "Contact visible.");
  }
  async function deleteContact(id: string) {
    setConfirmDialog({
      title: "Supprimer du répertoire",
      message: "Êtes-vous sûr de vouloir supprimer ce contact du répertoire de l'annuaire ?",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      isDanger: true,
      onConfirm: async () => {
        await supabase.from("annuaire").delete().eq("id", id);
        setContacts(prev => prev.filter(x => x.id !== id));
        notify("Contact supprimé.");
      }
    });
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setParsedContacts([]);

    try {
      const XLSX = await import("xlsx");
      const reader = new FileReader();
      
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

          if (data.length <= 1) {
            setImportError("Le fichier est vide ou ne contient que des en-têtes.");
            return;
          }

          const headers = data[0].map(h => String(h).trim().toLowerCase());
          
          const getFieldIndex = (aliases: string[]) => {
            return headers.findIndex(h => aliases.includes(h));
          };

          const idxFirstName = getFieldIndex(["prénom", "prenom", "first name", "firstname", "first_name", "first"]);
          const idxLastName = getFieldIndex(["nom", "last name", "lastname", "last_name", "last", "family name"]);
          const idxCompany = getFieldIndex(["entreprise", "company", "société", "societe", "compagnie"]);
          const idxSector = getFieldIndex(["secteur", "sector", "secteur d'activité", "secteur d'activite", "domaine"]);
          const idxCity = getFieldIndex(["ville", "city"]);
          const idxCountry = getFieldIndex(["pays", "country"]);
          const idxPhone = getFieldIndex(["téléphone", "telephone", "phone", "tél", "tel"]);
          const idxEmail = getFieldIndex(["email", "e-mail", "courriel", "mél", "mel"]);
          const idxWhatsapp = getFieldIndex(["whatsapp", "whats app"]);
          const idxWebsite = getFieldIndex(["site web", "website", "site", "web"]);
          const idxBio = getFieldIndex(["bio", "biographie", "description", "infos"]);

          if (idxFirstName === -1 && idxLastName === -1) {
            setImportError("Impossible de trouver les colonnes de nom ou prénom. Assurez-vous d'avoir des en-têtes comme 'Prénom' ou 'Nom'.");
            return;
          }

          const records: any[] = [];
          for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;

            const getVal = (idx: number) => {
              if (idx === -1 || idx >= row.length) return "";
              const val = row[idx];
              return val !== undefined && val !== null ? String(val).trim() : "";
            };

            const firstName = getVal(idxFirstName);
            const lastName = getVal(idxLastName);

            if (!firstName && !lastName) continue;

            records.push({
              first_name: firstName || "Membre",
              last_name: lastName || "Propulsion",
              company: getVal(idxCompany) || null,
              sector: getVal(idxSector) || null,
              city: getVal(idxCity) || null,
              country: getVal(idxCountry) || "Cameroun",
              phone: getVal(idxPhone) || null,
              email: getVal(idxEmail) || null,
              whatsapp: getVal(idxWhatsapp) || null,
              website: getVal(idxWebsite) || null,
              bio: getVal(idxBio) || null,
              is_published: true,
              created_by: adminUid
            });
          }

          if (records.length === 0) {
            setImportError("Aucune ligne de contact valide n'a été trouvée.");
          } else {
            setParsedContacts(records);
          }
        } catch (err: any) {
          setImportError("Erreur lors de la lecture du fichier : " + err.message);
        }
      };

      reader.onerror = () => {
        setImportError("Erreur lors de la lecture du fichier.");
      };

      reader.readAsBinaryString(file);
    } catch (err: any) {
      setImportError("Impossible de charger la bibliothèque de traitement Excel.");
    }
  };

  const submitImportedContacts = async () => {
    if (parsedContacts.length === 0) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("annuaire").insert(parsedContacts);
      if (error) {
        notify("Erreur lors de l'enregistrement des contacts : " + error.message, false);
      } else {
        notify(`${parsedContacts.length} contacts importés avec succès.`);
        setParsedContacts([]);
        setShowImportZone(false);
        const { data: contactsData } = await supabase.from("annuaire").select("*").order("created_at", { ascending: false });
        if (contactsData) setContacts(contactsData);
      }
    } catch (err: any) {
      notify("Une erreur est survenue lors de l'enregistrement : " + err.message, false);
    } finally {
      setSaving(false);
    }
  };
  /* ── Équipe Propulsion ──────────────────────────────────────────── */
  async function assignVendeur(member: Member) {
    await supabase.from("members").update({ role: "Vendeur" }).eq("id", member.id);
    setMembers(m => m.map(x => x.id === member.id ? { ...x, role: "Vendeur" } : x));
    notify(`${member.first_name} ${member.last_name} ajouté à l'équipe Propulsion.`);
    const { data: teamData } = await supabase.rpc("get_team_stats");
    setTeamMembers((teamData as unknown as TeamMember[]) ?? []);
    setAddVendeurResults([]);
    setAddVendeurSearch("");
  }
  async function removeVendeur(tm: TeamMember) {
    await supabase.from("members").update({ role: "Standard" }).eq("id", tm.member_id);
    setTeamMembers(prev => prev.filter(x => x.member_id !== tm.member_id));
    notify(`${tm.first_name} ${tm.last_name} retiré de l'équipe.`, false);
  }
  async function markVendeurPaid(tm: TeamMember) {
    const now = new Date().toISOString();
    await supabase.from("referrals")
      .update({ paid_at: now })
      .eq("referrer_id", tm.member_id)
      .eq("status", "Validé")
      .is("paid_at", null);
    const { data: teamData } = await supabase.rpc("get_team_stats");
    setTeamMembers((teamData as unknown as TeamMember[]) ?? []);
    notify(`Commission de ${tm.first_name} marquée comme payée.`);
  }
  async function loadVendeurReferrals(memberId: string) {
    if (teamReferrals[memberId]) {
      setExpandedVendeur(expandedVendeur === memberId ? null : memberId);
      return;
    }
    const { data } = await supabase
      .from("referrals")
      .select("id,tier,commission,status,paid_at,created_at,referred:members!referred_id(first_name,last_name)")
      .eq("referrer_id", memberId)
      .order("created_at", { ascending: false });
    const formatted = (data ?? []).map((r: any) => ({
      referral_id: r.id, referred_name: `${r.referred?.first_name ?? ""} ${(r.referred?.last_name ?? "").slice(0,1)}.`,
      tier: r.tier, commission: r.commission, status: r.status, paid_at: r.paid_at, created_at: r.created_at,
    }));
    setTeamReferrals(prev => ({ ...prev, [memberId]: formatted }));
    setExpandedVendeur(memberId);
  }
  async function searchAddVendeur(q: string) {
    setAddVendeurSearch(q);
    if (q.trim().length < 2) { setAddVendeurResults([]); return; }
    const { data } = await supabase.from("members")
      .select("id,first_name,last_name,role,avatar_url")
      .ilike("first_name", `%${q}%`)
      .neq("role", "Vendeur").neq("role", "Admin").neq("role", "Modérateur")
      .limit(5);
    setAddVendeurResults((data as Member[]) ?? []);
  }

  async function sendMemberEmailReminders() {
    try {
      setSaving(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      notify("E-mails de rappel envoyés avec succès aux membres !");
    } catch (err: unknown) {
      notify("Erreur lors de l'envoi des rappels.", false);
    } finally {
      setSaving(false);
    }
  }

  /* ── Ressources ──────────────────────────────────────────────────── */
  async function handleResourceFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !adminUid) return;
    setUploadingFile(true);
    try {
      const ext = file.name.split(".").pop() ?? "pdf";
      const path = `${adminUid}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("resources").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("resources").getPublicUrl(path);
      setRes(r => ({ ...r, fileUrl: publicUrl }));
      notify("Fichier uploadé ✓");
    } catch (err: unknown) {
      notify("Erreur upload : " + (err instanceof Error ? err.message : "inconnue"), false);
    } finally {
      setUploadingFile(false);
      if (resourceFileRef.current) resourceFileRef.current.value = "";
    }
  }
  async function addResource(e: React.FormEvent) {
    e.preventDefault();
    if (!res.title || (!res.fileUrl && !res.externalUrl)) { notify("Titre et fichier/lien requis.", false); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase.from("resources").insert({
        title: res.title, description: res.description || "",
        category: res.category, resource_type: res.type, tier_required: res.tier,
        file_url: res.fileUrl || null, external_url: res.externalUrl || null,
        is_published: true, download_count: 0, created_by: adminUid,
      }).select().single();
      if (error) throw error;
      setResources(prev => [data as Resource, ...prev]);
      notify(`Ressource «${res.title}» publiée.`);
      setRes({ title: "", description: "", category: "Général", type: "PDF", tier: "Standard", externalUrl: "", fileUrl: "" });
    } catch (err: unknown) {
      notify("Erreur : " + (err instanceof Error ? err.message : "inconnue"), false);
    } finally { setSaving(false); }
  }
  async function toggleResourcePublished(r: Resource) {
    await supabase.from("resources").update({ is_published: !r.is_published }).eq("id", r.id);
    setResources(prev => prev.map(x => x.id === r.id ? { ...x, is_published: !r.is_published } : x));
    notify(r.is_published ? "Ressource masquée." : "Ressource visible.");
  }
  async function deleteResource(id: string) {
    setConfirmDialog({
      title: "Supprimer la ressource",
      message: "Êtes-vous sûr de vouloir supprimer cette ressource de la bibliothèque ?",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      isDanger: true,
      onConfirm: async () => {
        await supabase.from("resources").delete().eq("id", id);
        setResources(prev => prev.filter(x => x.id !== id));
        notify("Ressource supprimée.");
      }
    });
  }

  /* ── Masterclasses ──────────────────────────────────────────────── */
  async function addMasterclass(e: React.FormEvent) {
    e.preventDefault();
    if (!mc.title) { notify("Le titre est requis.", false); return; }
    setSaving(true);
    try {
      const parsedVideoId = parseVideoUrl(mc.youtubeId);

      let finalThumbnailUrl = mc.thumbnailUrl || null;

      if (thumbnailFile) {
        const ext = thumbnailFile.name.split(".").pop() ?? "jpg";
        const path = `${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("course-thumbnails")
          .upload(path, thumbnailFile, { upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("course-thumbnails")
            .getPublicUrl(path);
          finalThumbnailUrl = urlData?.publicUrl ?? null;
        }
      }

      if (!finalThumbnailUrl && parsedVideoId && !parsedVideoId.startsWith("vimeo:")) {
        finalThumbnailUrl = `https://img.youtube.com/vi/${parsedVideoId}/mqdefault.jpg`;
      }

      const { data, error } = await supabase.from("masterclasses").insert({
        title: mc.title,
        description: mc.description || null,
        youtube_id: parsedVideoId || null,
        category: mc.category,
        tier_required: mc.tier,
        duration_min: parseInt(mc.duration) || 0,
        is_published: true,
        order_index: masterclasses.length + 1,
        course_type: mc.courseType,
        thumbnail_url: finalThumbnailUrl,
        instructor: mc.instructor || "Dr Claudel Noubissie"
      }).select().single();
      if (error) throw error;
      const course = { ...data as Masterclass, module_count: 0 };
      if (parsedVideoId && data) {
         const { data: modData } = await supabase.from("masterclass_modules").insert({ masterclass_id: course.id, title: mc.title, description: mc.description || null, youtube_id: parsedVideoId, duration_min: parseInt(mc.duration) || 0, order_index: 0, is_published: true }).select().single();
         if (modData) { course.module_count = 1; setCourseModules(prev => ({ ...prev, [course.id]: [modData as CourseModule] })); }
      }
      setMasterclasses(prev => [...prev, course]);
      if (adminUid) {
        await supabase.rpc("notify_all_members", {
          p_type: "masterclass_new", p_category: "Événement",
          p_title: `Nouveau cours : ${mc.title.slice(0, 60)}`,
          p_body: mc.description?.slice(0, 120) || null,
          p_link: "/masterclasses", p_actor_id: adminUid,
        });
      }
      notify(`Cours «${mc.title.slice(0, 28)}» créé.`);
      setMc({ title: "", description: "", youtubeId: "", category: "Vente", tier: "Standard", duration: "", courseType: "Masterclass", thumbnailUrl: "", instructor: "Dr Claudel Noubissie" });
      setThumbnailFile(null);
      setThumbnailPreview(null);
    } catch (err: any) { notify("Erreur : " + (err?.message || err?.details || (err instanceof Error ? err.message : "inconnue")), false); }
    finally { setSaving(false); }
  }
  async function togglePublished(m: Masterclass) {
    await supabase.from("masterclasses").update({ is_published: !m.is_published }).eq("id", m.id);
    setMasterclasses(prev => prev.map(x => x.id === m.id ? { ...x, is_published: !m.is_published } : x));
    notify(m.is_published ? "Masqué." : "Publié.");
  }
  async function deleteMasterclass(id: string) {
    setConfirmDialog({
      title: "Supprimer le parcours",
      message: "Êtes-vous sûr de vouloir supprimer ce parcours pédagogique ainsi que l'ensemble de ses modules vidéo ?",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      isDanger: true,
      onConfirm: async () => {
        await supabase.from("masterclasses").delete().eq("id", id);
        setMasterclasses(m => m.filter(x => x.id !== id));
        setCourseModules(prev => { const n = { ...prev }; delete n[id]; return n; });
        if (expandedCourse === id) setExpandedCourse(null);
        notify("Parcours supprimé.");
      }
    });
  }
  async function toggleExpanded(courseId: string) {
    if (expandedCourse === courseId) { setExpandedCourse(null); return; }
    setExpandedCourse(courseId);
    if (!courseModules[courseId]) {
      const { data } = await supabase.from("masterclass_modules").select("*").eq("masterclass_id", courseId).order("order_index");
      setCourseModules(prev => ({ ...prev, [courseId]: (data ?? []) as CourseModule[] }));
    }
    setNewMod({ title: "", description: "", youtubeId: "", duration: "" });
  }
  async function addModule(courseId: string, e: React.FormEvent) {
    e.preventDefault();
    if (!newMod.title || !newMod.youtubeId) { notify("Titre et ID/Lien Vidéo requis.", false); return; }
    setAddingModule(true);
    try {
      const parsedVideoId = parseVideoUrl(newMod.youtubeId);
      const existing = courseModules[courseId] ?? [];
      const { data, error } = await supabase.from("masterclass_modules").insert({ masterclass_id: courseId, title: newMod.title, description: newMod.description || null, youtube_id: parsedVideoId, duration_min: parseInt(newMod.duration) || 0, order_index: existing.length, is_published: true }).select().single();
      if (error) throw error;
      setCourseModules(prev => ({ ...prev, [courseId]: [...(prev[courseId] ?? []), data as CourseModule] }));
      setMasterclasses(prev => prev.map(m => m.id === courseId ? { ...m, module_count: (m.module_count ?? 0) + 1 } : m));
      setNewMod({ title: "", description: "", youtubeId: "", duration: "" });
      notify("Module ajouté.");
    } catch (err: unknown) { notify("Erreur : " + (err instanceof Error ? err.message : "inconnue"), false); }
    finally { setAddingModule(false); }
  }
  async function deleteModule(moduleId: string, courseId: string) {
    setConfirmDialog({
      title: "Supprimer le module",
      message: "Êtes-vous sûr de vouloir supprimer ce module de ce parcours ?",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      isDanger: true,
      onConfirm: async () => {
        await supabase.from("masterclass_modules").delete().eq("id", moduleId);
        setCourseModules(prev => ({ ...prev, [courseId]: (prev[courseId] ?? []).filter(m => m.id !== moduleId) }));
        setMasterclasses(prev => prev.map(m => m.id === courseId ? { ...m, module_count: Math.max(0, (m.module_count ?? 1) - 1) } : m));
        notify("Module supprimé.");
      }
    });
  }

  function handleEventImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { notify("L'image doit faire moins de 8 Mo.", false); return; }
    setEventImageFile(file);
    setEventImagePreview(URL.createObjectURL(file));
  }
  function removeEventImage() {
    if (eventImagePreview) URL.revokeObjectURL(eventImagePreview);
    setEventImageFile(null);
    setEventImagePreview(null);
  }

  /* ── Événements ─────────────────────────────────────────────────── */
  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!ev.title || !ev.date) { notify("Titre et date requis.", false); return; }
    if (ev.meetLink.trim() && !/^https?:\/\/.+/.test(ev.meetLink.trim())) { notify("Le lien Google Meet doit être une URL valide (https://…).", false); return; }
    setSaving(true);
    try {
      let image_url: string | null = null;
      if (eventImageFile) {
        const ext = eventImageFile.name.split(".").pop();
        const path = `${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("event-images").upload(path, eventImageFile);
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from("event-images").getPublicUrl(path);
          image_url = publicUrl;
        } else {
          notify("Erreur lors de l'envoi de l'affiche : " + upErr.message, false);
        }
      }

      const dt = new Date(`${ev.date}T${ev.time || "18:00"}`).toISOString();
      const eventPayload: Record<string, unknown> = {
        title: ev.title,
        description: ev.description,
        event_date: dt,
        event_type: ev.type,
        location: ev.location,
        meet_link: ev.meetLink.trim() || null,
        price: parseInt(ev.price) || 0,
        spots_max: ev.spots ? parseInt(ev.spots) : null,
        tier_required: ev.tier,
      };
      if (image_url !== null) eventPayload.image_url = image_url;
      const { data, error } = await supabase.from("events").insert(eventPayload).select().single();
      
      if (error) throw error;
      setEvents(prev => [data as AdminEvent, ...prev]);
      if (adminUid) {
        await supabase.rpc("notify_all_members", {
          p_type: "event_new", p_category: "Événement",
          p_title: `Nouvel événement : ${ev.title.slice(0, 60)}`,
          p_body: ev.description?.slice(0, 120) || null,
          p_link: "/evenements", p_actor_id: adminUid,
        });
      }
      notify(`Événement «${ev.title}» créé.`);
      setEv({ title: "", description: "", date: "", time: "18:00", location: "", meetLink: "", type: "En ligne", price: "0", spots: "", tier: "Standard" });
      setEventImageFile(null);
      if (eventImagePreview) {
        URL.revokeObjectURL(eventImagePreview);
        setEventImagePreview(null);
      }
    } catch (err: unknown) { notify("Erreur : " + (err instanceof Error ? err.message : "inconnue"), false); }
    finally { setSaving(false); }
  }
  async function deleteEvent(id: string) {
    setConfirmDialog({
      title: "Supprimer l'événement",
      message: "Êtes-vous sûr de vouloir supprimer cet événement ? Les membres ne pourront plus s'y inscrire.",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      isDanger: true,
      onConfirm: async () => {
        await supabase.from("events").delete().eq("id", id);
        setEvents(prev => prev.filter(x => x.id !== id));
        notify("Événement supprimé.");
      }
    });
  }

  /* ── Publications ────────────────────────────────────────────────── */
  async function addPost(e: React.FormEvent) {
    e.preventDefault();
    if (!newPost.content.trim() || !adminUid) { notify("Contenu requis.", false); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase.from("social_posts").insert({ author_id: adminUid, title: newPost.title, content: newPost.content, category: newPost.category }).select("id,title,content,category,created_at,author:members!author_id(first_name,last_name)").single();
      if (error) throw error;
      setPosts(prev => [data as unknown as AdminPost, ...prev]);
      notify("Publication créée.");
      setNewPost({ title: "", content: "", category: "Annonces" });
    } catch (err: unknown) { notify("Erreur : " + (err instanceof Error ? err.message : "inconnue"), false); }
    finally { setSaving(false); }
  }
  async function deletePost(id: string) {
    setConfirmDialog({
      title: "Supprimer la publication",
      message: "Êtes-vous sûr de vouloir supprimer cette publication du fil d'actualité ?",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      isDanger: true,
      onConfirm: async () => {
        await supabase.from("social_posts").delete().eq("id", id);
        setPosts(prev => prev.filter(x => x.id !== id));
        notify("Publication supprimée.");
      }
    });
  }

  if (adminRole === null) return <div className="flex min-h-screen items-center justify-center bg-[#F4F3F0] bg-halftone-light"><span className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"/></div>;

  if (adminRole !== "Admin" && adminRole !== "Modérateur") {
    return (
      <div className="min-h-screen bg-[#F4F3F0] flex items-center justify-center p-6 bg-halftone-light">
        <div className="max-w-sm w-full rounded-2xl border border-line bg-white p-8 text-center space-y-4 shadow-none">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E8174B]/10 text-[#E8174B]"><Shield width={22} height={22}/></span>
          <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">Accès interdit</h3>
          <p className="text-[13px] text-[#6B6B6B]">Vous ne possédez pas les privilèges d&apos;administration.</p>
          <a href="/dashboard" className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-[#1A1A1A] text-white font-semibold text-[14px] transition-all hover:scale-[1.015] active:scale-[0.98] duration-200">Retourner au Dashboard <ArrowRight width={14} height={14}/></a>
        </div>
      </div>
    );
  }

  const filteredMembers = members.filter(m => {
    const matchesSearch = !memberSearch || `${m.first_name} ${m.last_name} ${m.city ?? ""} ${m.sector ?? ""}`.toLowerCase().includes(memberSearch.toLowerCase());
    if (memberFilter === "Tous") return matchesSearch;
    if (memberFilter === "Actif" || memberFilter === "Suspendu") return matchesSearch && m.status === memberFilter;
    return matchesSearch && m.role === memberFilter;
  });
  const contactSectors = ["Tous", ...Array.from(new Set(contacts.map(c => c.sector).filter((x): x is string => !!x))).sort()];
  const contactCountries = ["Tous", ...Array.from(new Set(contacts.map(c => c.country).filter((x): x is string => !!x))).sort()];
  const contactCities = ["Tous", ...Array.from(new Set(contacts.map(c => c.city).filter((x): x is string => !!x))).sort()];

  const filteredContacts = contacts.filter(c => {
    const q = contactSearch.toLowerCase();
    const matchesSearch = !q || `${c.first_name} ${c.last_name} ${c.company ?? ""} ${c.city ?? ""} ${c.country ?? ""}`.toLowerCase().includes(q);
    const matchesSector = contactSectorFilter === "Tous" || c.sector === contactSectorFilter;
    const matchesCountry = contactCountryFilter === "Tous" || c.country === contactCountryFilter;
    const matchesCity = contactCityFilter === "Tous" || c.city === contactCityFilter;
    return matchesSearch && matchesSector && matchesCountry && matchesCity;
  });
  const roleCounts = members.reduce<Record<string, number>>((acc, m) => { acc[m.role] = (acc[m.role] ?? 0) + 1; return acc; }, {});
  const onboardBadge = payments.length + offers.length;

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: "overview",   label: "Vue d'ensemble" },
    { id: "onboarding", label: "Onboarding", badge: onboardBadge },
    { id: "members",    label: "Membres" },
    { id: "content",    label: "Contenu" },
    { id: "annuaire",   label: "Annuaire" },
    { id: "equipe",     label: "Équipe", badge: teamMembers.length || undefined },
    { id: "analytics",  label: "Analytics" },
    { id: "settings",   label: "Paramètres" },
  ];

  return (
    <div className="min-h-screen bg-[#F4F3F0] bg-halftone-light select-none pb-12">
      
      {toast && (
        <div className="fixed bottom-6 right-4 z-50 left-4 sm:left-auto max-w-sm">
          <div className="flex items-center gap-2.5 rounded-lg px-4 py-3 text-[13px] font-semibold text-white shadow-none bg-[#1A1A1A]">
            {toast.ok ? <Check width={15} height={15} className="text-[#22c55e]"/> : <span className="font-bold text-[#E8174B]">✕</span>}
            {toast.msg}
          </div>
        </div>
      )}

      {/* ── Top Bar (Redesigned) ── */}
      <header className="sticky top-0 z-40 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6" style={{ height: "56px", borderBottom: "0.5px solid #E0DDD8" }}>
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center">
              <img src="/branding/logo.jpg" alt="Propulsion" style={{ height: "44px", width: "auto" }} className="mix-blend-multiply" />
            </Link>
            <span className="text-[13px] font-sans font-bold uppercase tracking-[0.1em] text-[#6B6B6B]">
              PORTAIL ADMIN
            </span>
          </div>
          <div className="flex items-center gap-4">
            <NotificationsBell />
            <Link href="/dashboard" className="px-4 py-1.5 border border-[#E0DDD8] rounded-lg text-[13px] font-sans font-semibold text-[#1A1A1A] hover:bg-[#F4F3F0] transition-all duration-200">
              Quitter
            </Link>
          </div>
        </div>

        {/* Tab Navigation (Underline Style) */}
        <div className="border-b border-[#E0DDD8] overflow-x-auto [&::-webkit-scrollbar]:hidden bg-white">
          <div className="mx-auto max-w-6xl flex">
            {TABS.map(({ id, label, badge }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className="relative shrink-0 flex items-center gap-2 px-6 py-4 text-[14px] font-sans transition-all cursor-pointer"
                  style={{
                    color: active ? "#1A1A1A" : "#6B6B6B",
                    fontWeight: active ? "bold" : "normal",
                  }}
                >
                  <span>{label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E8174B] px-1 text-[9.5px] font-bold text-white">
                      {badge}
                    </span>
                  )}
                  {active && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2E6FD4]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="mx-auto max-w-6xl px-6 mt-8">

        {/* ══ VUE D'ENSEMBLE ══════════════════════════════════════════ */}
        {tab === "overview" && stats && (
          <div className="space-y-6">
            
            {/* 6 Metric Cards strip */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              <AdminMetricCard label="Chiffre d'affaires" value={fmtAmount(stats.revenue)} Icon={Icons.CurrencyFranc} color="#F0A500" />
              <AdminMetricCard label="Membres totaux" value={stats.total.toLocaleString("fr-FR")} Icon={Icons.Users} color="#2E6FD4" />
              <AdminMetricCard label="Abonnés actifs" value={stats.active.toLocaleString("fr-FR")} Icon={Icons.CircleCheck} color="#1D6B45" />
              <AdminMetricCard label="En attente" value={stats.pending_payments.toString()} Icon={Icons.Bell} color="#F0A500" dotColor={stats.pending_payments > 0 ? "#F0A500" : undefined} />
              <AdminMetricCard label="Membres Élite" value={stats.elite.toString()} Icon={Icons.Star} color="#C9A84C" />
              <AdminMetricCard label="Nouveaux (7j)" value={`+${stats.new_this_week}`} Icon={Icons.TrendingUp} color="#6C3FC5" />
            </div>

            {/* Charts & breakdown layout */}
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              
              {/* Growth Chart */}
              <div className="rounded-2xl border border-[#E0DDD8] bg-white p-6 shadow-none">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-[14px] font-sans font-bold text-[#1A1A1A]">Croissance des membres</h3>
                    <p className="text-[12px] text-[#6B6B6B] mt-0.5 font-sans">12 derniers mois</p>
                  </div>
                  <span className="rounded-full bg-[#EEF0FF] px-3 py-1 text-[12px] font-bold text-[#6C3FC5] font-sans">
                    {stats?.total ?? 0} au total
                  </span>
                </div>
                <div className="pt-2">
                  <GrowthChart data={monthlyGrowth12}/>
                </div>
              </div>

              {/* Stacked Cards: Levels Breakdown & Actions Requises */}
              <div className="space-y-6">
                {/* Levels Breakdown */}
                <div className="rounded-2xl border border-[#E0DDD8] bg-white p-6 shadow-none">
                  <h3 className="text-[14px] font-sans font-bold text-[#1A1A1A] mb-5">Niveaux d&apos;adhésion</h3>
                  <div className="space-y-4">
                    {(["Standard", "Pro", "Élite", "Admin"] as const).map(lvl => {
                      const count = lvl === "Admin" ? (roleCounts["Admin"] ?? 0) + (roleCounts["Modérateur"] ?? 0) : (roleCounts[lvl] ?? 0);
                      const colors = { Standard: "#2E6FD4", Pro: "#6C3FC5", Élite: "#C9A84C", Admin: "#1A1A1A" };
                      const barColor = colors[lvl];
                      const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                      return (
                        <div key={lvl} className="space-y-1">
                          <div className="flex justify-between items-center text-[13px] font-sans">
                            <span className="font-bold text-[#1A1A1A]">{lvl}</span>
                            <span className="text-[#6B6B6B]">{count}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-1 w-full bg-[#E0DDD8]/40 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, height: "4px", backgroundColor: barColor }} />
                            </div>
                            <span className="text-[11px] font-sans text-[#6B6B6B] shrink-0 min-w-[30px] text-right">{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions Requises */}
                <div className="rounded-2xl border border-[#E0DDD8] bg-white p-6 shadow-none">
                  <h3 className="text-[14px] font-sans font-bold text-[#1A1A1A] mb-4">Actions requises</h3>
                  {(() => {
                    const acts = [];
                    if (payments.length > 0) {
                      acts.push({
                        id: "payments",
                        urgent: true,
                        desc: `${payments.length} paiement${payments.length > 1 ? "s" : ""} en attente.`,
                        onClick: () => { setTab("onboarding"); setOnboardSub("paiements"); }
                      });
                    }
                    if (pendingSubmissions.length > 0) {
                      acts.push({
                        id: "submissions",
                        urgent: false,
                        desc: `${pendingSubmissions.length} devoir${pendingSubmissions.length > 1 ? "s" : ""} en attente.`,
                        onClick: () => { setTab("onboarding"); setOnboardSub("submissions"); }
                      });
                    }
                    if (offers.length > 0) {
                      acts.push({
                        id: "offers",
                        urgent: false,
                        desc: `${offers.length} offre${offers.length > 1 ? "s" : ""} de marché en attente.`,
                        onClick: () => { setTab("onboarding"); setOnboardSub("marche"); }
                      });
                    }

                    if (acts.length === 0) {
                      return (
                        <div className="flex items-center gap-2 text-[#1D6B45]">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1D6B45]/10 font-bold text-[12px]">✓</span>
                          <span className="text-[13px] font-sans font-semibold">Tout est à jour.</span>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {acts.map(act => (
                          <div
                            key={act.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-[#E0DDD8]/60 bg-[#F4F3F0]/20 gap-3"
                            style={{ borderLeftWidth: "3px", borderLeftColor: act.urgent ? "#E8174B" : "#F0A500" }}
                          >
                            <span className="text-[13px] font-sans text-[#1A1A1A] leading-tight font-medium">{act.desc}</span>
                            <button
                              onClick={act.onClick}
                              className="text-[13px] font-sans font-bold text-[#2E6FD4] hover:underline shrink-0 cursor-pointer"
                            >
                              Traiter &rarr;
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

            </div>

            {/* Geographical map */}
            <div className="rounded-2xl border border-[#E0DDD8] bg-white p-6 shadow-none">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-[14px] font-sans font-bold text-[#1A1A1A]">Répartition géographique</h3>
                  <p className="text-[12px] text-[#6B6B6B] mt-0.5 font-sans">Membres Propulsion par pays</p>
                </div>
                <span className="rounded-full bg-[#EEF5FF] px-3 py-1 text-[11px] font-bold text-[#2E6FD4] font-sans">
                  {Object.values(geoData).reduce((a, b) => a + b, 0)} localisés
                </span>
              </div>
              <GeoMap data={geoData}/>
              {/* Country breakdown list */}
              {Object.keys(geoData).length > 0 ? (
                <div className="mt-5 space-y-2.5 border-t border-[#E0DDD8] pt-5">
                  <p className="text-[11px] font-sans font-bold uppercase tracking-[0.1em] text-[#6B6B6B] mb-3">Par pays</p>
                  {Object.entries(geoData)
                    .sort(([, a], [, b]) => b - a)
                    .map(([iso, count]) => {
                      const name = COUNTRY_NAMES[iso] ?? `Pays ${iso}`;
                      const maxCount = Math.max(...Object.values(geoData));
                      const pct = Math.round((count / maxCount) * 100);
                      return (
                        <div key={iso} className="flex items-center gap-3">
                          <span className="text-[12.5px] font-sans font-semibold text-[#1A1A1A] w-40 shrink-0 truncate">{name}</span>
                          <div className="h-1.5 flex-1 bg-[#E0DDD8]/50 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-[#2E6FD4] transition-all" style={{ width: `${pct}%` }}/>
                          </div>
                          <span className="text-[12px] font-bold font-sans text-[#2E6FD4] w-6 text-right shrink-0">{count}</span>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-[12.5px] text-[#6B6B6B] font-sans text-center py-4 mt-4 border-t border-[#E0DDD8]">
                  Aucune donnée géographique — les membres doivent renseigner leur ville à l&apos;inscription.
                </p>
              )}
            </div>

            {/* Recents and fast access */}
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              
              <div className="rounded-2xl border border-[#E0DDD8] bg-white p-6 space-y-4 shadow-none">
                <h3 className="text-[14px] font-sans font-bold text-[#1A1A1A]">Inscriptions récentes</h3>
                <div className="divide-y divide-[#E0DDD8] divide-dashed">
                  {members.slice(0, 5).map(m => {
                    const tc = TIER_COLOR[m.role] ?? "#2E6FD4";
                    return (
                      <div key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                        {m.avatar_url ? (
                          <img src={m.avatar_url} className="h-9 w-9 rounded-full object-cover shrink-0" alt=""/>
                        ) : (
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white font-sans" style={{ backgroundColor: tc }}>{initials(m)}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13.5px] font-semibold text-[#1A1A1A] truncate font-sans">{m.first_name} {m.last_name}</p>
                          <p className="text-[11px] text-[#6B6B6B] font-sans mt-0.5">{m.city ?? "–"} · {m.sector ?? m.role}</p>
                        </div>
                        <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[9.5px] font-bold font-sans" style={{ background: `${tc}15`, color: tc }}>{m.role}</span>
                        <span className="shrink-0 text-[11px] text-[#6B6B6B] font-sans">{relativeTime(m.created_at)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-[#E0DDD8] bg-white p-6 space-y-4 shadow-none">
                <h3 className="text-[14px] font-sans font-bold text-[#1A1A1A]">Accès rapides</h3>
                <div className="space-y-2.5">
                  {[
                    { label: "Valider paiements",    count: payments.length, action: () => { setTab("onboarding"); setOnboardSub("paiements"); },    color: "#E8174B" },
                    { label: "Valider devoirs",      count: pendingSubmissions.length, action: () => { setTab("onboarding"); setOnboardSub("submissions"); }, color: "#6C3FC5" },
                    { label: "Valider offres marché", count: offers.length,   action: () => { setTab("onboarding"); setOnboardSub("marche"); },       color: "#F0A500" },
                    { label: "Ajouter à l'annuaire", count: contacts.length,  action: () => { setTab("onboarding"); setOnboardSub("annuaire_add"); }, color: "#1D6B45" },
                    { label: "Gérer membres",         count: members.length,  action: () => setTab("members"),                                        color: "#2E6FD4" },
                    { label: "Ressources",            count: resources.length,action: () => { setTab("content"); setContentSub("ressources"); },      color: "#6C3FC5" },
                  ].map(item => (
                    <button key={item.label} onClick={item.action} className="w-full flex items-center justify-between rounded-xl border border-[#E0DDD8] p-3 text-left hover:bg-[#F4F3F0] transition-colors cursor-pointer">
                      <span className="text-[13px] font-medium text-[#1A1A1A] font-sans">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full px-2 py-0.5 text-[9.5px] font-bold text-white font-sans" style={{ backgroundColor: item.color }}>{item.count}</span>
                        <ArrowRight width={12} height={12} className="text-[#6B6B6B]"/>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ══ ONBOARDING ══════════════════════════════════════════════ */}
        {tab === "onboarding" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-[18px] font-bold text-[#1A1A1A]">Onboarding</h2>
              <p className="mt-0.5 text-[13px] text-[#6B6B6B] font-sans">Validez les paiements, devoirs, et annonces.</p>
            </div>
            
            {/* Filled pills tabs */}
            <SubTabs<OnboardingSub>
              tabs={[
                { id: "paiements",    label: "Paiements",    badge: payments.length },
                { id: "submissions",  label: "Soumissions",  badge: pendingSubmissions.length },
                { id: "marche",       label: "Marché",        badge: offers.length },
                { id: "annuaire_add", label: "Annuaire +" },
              ]}
              active={onboardSub} onChange={setOnboardSub}
            />

            {/* Paiements */}
            {onboardSub === "paiements" && (
              <div className="space-y-3">
                {payments.length === 0 ? (
                  <div className="rounded-2xl border border-[#E0DDD8] bg-white p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-none">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1D6B45]/10 text-[#1D6B45]">
                      <Icons.Check width={24} height={24} />
                    </div>
                    <h3 className="font-serif text-[18px] font-bold text-[#1A1A1A]">Tous les paiements sont traités.</h3>
                    <p className="max-w-md text-[14px] font-sans text-[#6B6B6B] leading-relaxed">Revenez ici dès qu&apos;un nouveau membre soumet une preuve.</p>
                    <FiveColorBar />
                  </div>
                ) : (
                  payments.map(pay => {
                    const m = pay.member;
                    const tc = TIER_COLOR[m?.role ?? "Standard"] ?? "#2E6FD4";
                    return (
                      <article key={pay.id} className="rounded-2xl border border-[#E0DDD8] bg-white p-6 shadow-none">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                          
                          {/* Left: Avatar + Name + Level Badge + Date */}
                          <div className="flex items-center gap-3">
                            {m?.avatar_url ? (
                              <img src={m.avatar_url} className="h-10 w-10 rounded-full object-cover shrink-0" alt="" />
                            ) : (
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white font-sans" style={{ backgroundColor: tc }}>
                                {m ? initials(m) : "?"}
                              </span>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-[14px] font-sans font-bold text-[#1A1A1A] truncate">
                                  {m ? `${m.first_name} ${m.last_name}` : "Membre inconnu"}
                                </p>
                                <span className="rounded-full px-2 py-0.5 text-[9.5px] font-bold font-sans" style={{ background: `${tc}15`, color: tc }}>
                                  {m?.role ?? "Standard"}
                                </span>
                              </div>
                              <p className="text-[12px] text-[#6B6B6B] font-sans mt-0.5">
                                {relativeTime(pay.created_at)}
                              </p>
                            </div>
                          </div>

                          {/* Center: Amount + Method + Proof Link */}
                          <div className="flex flex-col space-y-1 md:text-center md:items-center">
                            <p className="font-serif text-[20px] font-bold text-[#1A1A1A]">
                              {fmtAmount(pay.amount)}
                            </p>
                            <p className="text-[13px] text-[#6B6B6B] font-sans">
                              {pay.method} · {pay.sender_info}
                            </p>
                            {pay.proof_url && (
                              <button
                                type="button"
                                onClick={() => viewProof(pay.proof_url!)}
                                className="inline-flex items-center gap-1 text-[13px] font-sans font-medium text-[#2E6FD4] hover:underline cursor-pointer"
                              >
                                Preuve de paiement →
                              </button>
                            )}
                          </div>

                          {/* Right: Valider & Rejeter Buttons */}
                          <div className="flex gap-3 md:justify-end">
                            <button
                              onClick={() => rejectPayment(pay)}
                              disabled={saving}
                              className="h-10 px-5 border border-[#FECACA] text-[#E8174B] bg-transparent rounded-lg text-[13.5px] font-sans font-semibold hover:bg-red-50/50 transition-colors cursor-pointer shrink-0"
                            >
                              Rejeter
                            </button>
                            <button
                              onClick={() => approvePayment(pay)}
                              disabled={saving}
                              className="h-10 px-5 bg-[#1D6B45] text-white rounded-lg text-[13.5px] font-sans font-semibold transition-all hover:scale-[1.015] active:scale-[0.98] cursor-pointer shrink-0"
                            >
                              Valider
                            </button>
                          </div>

                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            )}

            {/* Marché */}
            {onboardSub === "marche" && (
              <div className="space-y-4">
                {offers.length === 0 ? (
                  <AdminEmptyState
                    title="Toutes les offres sont traitées"
                    subtitle="Il n'y a aucune offre de produit ou service en attente de modération."
                  />
                ) : (
                  offers.map(offer => {
                    const au = offer.author;
                    const CAT_C: Record<string, string> = {
                      Prestation: "#2E6FD4",
                      Produit: "#6C3FC5",
                      Formation: "#F0A500",
                      Conseil: "#1D6B45",
                      Autre: "#E8174B",
                    };
                    const cc = CAT_C[offer.category] ?? "#6C3FC5";
                    return (
                      <article key={offer.id} className="rounded-2xl border border-[#E0DDD8] bg-white p-6 shadow-none">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                          {/* Left: Author Info */}
                          <div className="flex items-center gap-3">
                            {au?.avatar_url ? (
                              <img src={au.avatar_url} className="h-10 w-10 rounded-full object-cover shrink-0" alt="" />
                            ) : (
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white font-sans bg-[#6C3FC5]">
                                {au ? initials(au) : "?"}
                              </span>
                            )}
                            <div className="min-w-0">
                              <p className="text-[14px] font-sans font-bold text-[#1A1A1A] truncate">
                                {au ? `${au.first_name} ${au.last_name}` : "Auteur inconnu"}
                              </p>
                              <p className="text-[12px] text-[#6B6B6B] font-sans mt-0.5">
                                {relativeTime(offer.created_at)}
                              </p>
                            </div>
                          </div>

                          {/* Center: Offer Details */}
                          <div className="flex flex-col space-y-1 md:text-center md:items-center">
                            <div className="flex items-center gap-2 md:justify-center flex-wrap">
                              <p className="text-[14px] font-sans font-bold text-[#1A1A1A] truncate">
                                {offer.title}
                              </p>
                              <span className="rounded-full px-2 py-0.5 text-[9.5px] font-bold font-sans" style={{ background: `${cc}15`, color: cc }}>
                                {offer.category}
                              </span>
                            </div>
                            <p className="text-[13px] text-[#6B6B6B] font-sans line-clamp-2 leading-relaxed">
                              {offer.description}
                            </p>
                            <p className="font-serif text-[18px] font-bold text-[#1A1A1A] mt-1">
                              {offer.price}
                            </p>
                          </div>

                          {/* Right: Approve/Reject buttons */}
                          <div className="flex gap-3 md:justify-end">
                            <button
                              onClick={() => rejectOffer(offer)}
                              className="h-10 px-5 border border-[#FECACA] text-[#E8174B] bg-transparent rounded-lg text-[13.5px] font-sans font-semibold hover:bg-red-50/50 transition-colors cursor-pointer shrink-0"
                            >
                              Rejeter
                            </button>
                            <button
                              onClick={() => approveOffer(offer)}
                              className="h-10 px-5 bg-[#1D6B45] text-white rounded-lg text-[13.5px] font-sans font-semibold transition-all hover:scale-[1.015] active:scale-[0.98] cursor-pointer shrink-0"
                            >
                              Approuver
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            )}

            {/* Soumissions */}
            {onboardSub === "submissions" && (
              <div className="space-y-4">
                {pendingSubmissions.length === 0 ? (
                  <AdminEmptyState
                    title="Tous les livrables sont validés"
                    subtitle="Aucun travail pratique n'est en attente de notation pour le moment."
                  />
                ) : (
                  pendingSubmissions.map(sub => {
                    const m = sub.member;
                    const tc = TIER_COLOR[m?.role ?? "Standard"] ?? "#2E6FD4";
                    return (
                      <article key={sub.id} className="rounded-2xl border border-[#E0DDD8] bg-white p-6 shadow-none">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                          {/* Left: Member info */}
                          <div className="flex items-center gap-3">
                            {m?.avatar_url ? (
                              <img src={m.avatar_url} className="h-10 w-10 rounded-full object-cover shrink-0" alt="" />
                            ) : (
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white font-sans" style={{ backgroundColor: tc }}>
                                {m ? initials(m) : "?"}
                              </span>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-[14px] font-sans font-bold text-[#1A1A1A] truncate">
                                  {m ? `${m.first_name} ${m.last_name}` : "Membre inconnu"}
                                </p>
                                <span className="rounded-full px-2 py-0.5 text-[9.5px] font-bold font-sans" style={{ background: `${tc}15`, color: tc }}>
                                  {m?.role ?? "Standard"}
                                </span>
                              </div>
                              <p className="text-[12px] text-[#6B6B6B] font-sans mt-0.5">
                                {relativeTime(sub.created_at)}
                              </p>
                            </div>
                          </div>

                          {/* Center: Submission details */}
                          <div className="flex flex-col space-y-1 md:text-center md:items-center">
                            <p className="text-[14px] font-sans font-bold text-[#1A1A1A]">
                              Challenge : {sub.challenge?.title}
                            </p>
                            <div className="flex items-center gap-2 md:justify-center text-[13px] text-[#6B6B6B] font-sans">
                              <span>Livrable public:</span>
                              <a
                                href={sub.submission_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-medium text-[#2E6FD4] hover:underline"
                              >
                                Ouvrir <ExternalLink width={11} height={11} />
                              </a>
                            </div>
                            {sub.description && (
                              <p className="text-[12px] text-[#6B6B6B] font-sans italic line-clamp-1">
                                &ldquo;{sub.description}&rdquo;
                              </p>
                            )}
                          </div>

                          {/* Right: Actions */}
                          <div className="flex gap-3 md:justify-end">
                            <button
                              onClick={() => rejectSubmission(sub)}
                              disabled={saving}
                              className="h-10 px-5 border border-[#FECACA] text-[#E8174B] bg-transparent rounded-lg text-[13.5px] font-sans font-semibold hover:bg-red-50/50 transition-colors cursor-pointer shrink-0"
                            >
                              Rejeter
                            </button>
                            <button
                              onClick={() => approveSubmission(sub, sub.challenge?.points ?? 50)}
                              disabled={saving}
                              className="h-10 px-5 bg-[#1D6B45] text-white rounded-lg text-[13.5px] font-sans font-semibold transition-all hover:scale-[1.015] active:scale-[0.98] cursor-pointer shrink-0"
                            >
                              Valider ({sub.challenge?.points ?? 50} pts)
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            )}

            {/* Annuaire ajout */}
            {onboardSub === "annuaire_add" && (
              <div className="rounded-2xl border border-[#E0DDD8] bg-white p-6 max-w-2xl">
                <h3 className="font-serif text-[15px] font-bold text-[#1A1A1A] mb-4">Ajouter un contact</h3>
                <form onSubmit={addContact} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <AdminUnderlineInput label="Prénom" value={ct.firstName} onChange={(e: any) => setCt({...ct, firstName: e.target.value})} required placeholder="Jean" />
                    <AdminUnderlineInput label="Nom" value={ct.lastName} onChange={(e: any) => setCt({...ct, lastName: e.target.value})} required placeholder="Dupont" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <AdminUnderlineInput label="Entreprise" value={ct.company} onChange={(e: any) => setCt({...ct, company: e.target.value})} placeholder="Mon Entreprise SA" />
                    <AdminUnderlineInput label="Secteur" value={ct.sector} onChange={(e: any) => setCt({...ct, sector: e.target.value})} placeholder="Technologie, Agro..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <AdminUnderlineInput label="Ville" value={ct.city} onChange={(e: any) => setCt({...ct, city: e.target.value})} placeholder="Douala" />
                    <AdminUnderlineInput label="Pays" value={ct.country} onChange={(e: any) => setCt({...ct, country: e.target.value})} placeholder="Cameroun" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <AdminUnderlineInput label="Téléphone" value={ct.phone} onChange={(e: any) => setCt({...ct, phone: e.target.value})} placeholder="+237 ..." />
                    <AdminUnderlineInput label="WhatsApp" value={ct.whatsapp} onChange={(e: any) => setCt({...ct, whatsapp: e.target.value})} placeholder="+237 ..." />
                  </div>
                  <AdminUnderlineTextarea label="Biographie" value={ct.bio} onChange={(e: any) => setCt({...ct, bio: e.target.value})} placeholder="Description courte..." />
                  
                  <AdminUnderlineSelect label="Lier à un membre existant" value={ct.memberId} onChange={(e: any) => setCt({...ct, memberId: e.target.value})}>
                    <option value="">— Aucun membre —</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name} ({m.role})</option>)}
                  </AdminUnderlineSelect>

                  <div className="flex justify-end pt-3">
                    <button type="submit" disabled={saving} className="h-11 px-6 bg-[#1A1A1A] text-white rounded-lg text-[14px] font-semibold transition-all hover:scale-[1.015] active:scale-[0.98] cursor-pointer">
                      Enregistrer
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ══ MEMBRES ═════════════════════════════════════════════════ */}
        {tab === "members" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-serif text-[18px] font-bold text-[#1A1A1A]">Gestion des membres</h2>
              <p className="text-[13px] text-[#6B6B6B] font-sans">{members.length} inscrits</p>
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <Search width={16} height={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"/>
                <input type="search" placeholder="Rechercher par nom, ville, secteur…" value={memberSearch} onChange={e => setMemberSearch(e.target.value)} className="w-full rounded-full border border-[#E0DDD8] bg-white py-2.5 pl-10 pr-4 text-[14px] text-ink outline-none focus:border-[#2E6FD4]"/>
              </div>

              {/* Horizontal Category Chips */}
              <div className="flex flex-wrap gap-2 py-1">
                {["Tous", "Standard", "Pro", "Élite", "Actif", "Suspendu"].map(f => {
                  const isActive = memberFilter === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setMemberFilter(f)}
                      className={`h-[34px] px-4 rounded-lg text-[13px] font-sans font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#1A1A1A] text-white"
                          : "border border-[#E0DDD8] text-[#1A1A1A] bg-transparent hover:bg-[#E0DDD8]/20"
                      }`}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              {filteredMembers.map(m => {
                const isOpen = selectedMember === m.id;
                const tc = TIER_COLOR[m.role] ?? "#2E6FD4";
                const sc = STATUS_COLOR[m.status] ?? "#6B6B6B";
                return (
                  <div key={m.id} className="rounded-xl border border-[#E0DDD8] bg-white overflow-hidden shadow-none">
                    <button onClick={() => setSelectedMember(isOpen ? null : m.id)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#F4F3F0] transition-colors cursor-pointer">
                      {m.avatar_url ? <img src={m.avatar_url} className="h-9 w-9 shrink-0 rounded-full object-cover" alt=""/> : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white font-sans" style={{ backgroundColor: tc }}>{initials(m)}</span>}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13.5px] font-semibold text-ink font-sans">{m.first_name} {m.last_name}</span>
                          <span className="rounded-full px-2 py-0.5 text-[9.5px] font-bold font-sans" style={{ background: `${tc}15`, color: tc }}>{m.role}</span>
                          {(m.badges ?? []).map(b => <BadgePill key={b} badge={b} small/>)}
                        </div>
                        <span className="text-[11.5px] text-faint font-sans">{[m.city, m.sector].filter(Boolean).join(" · ") || "–"}</span>
                      </div>
                      <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold font-sans" style={{ background: `${sc}15`, color: sc }}>{m.status}</span>
                      <span className={`text-faint text-sm transition-transform ${isOpen ? "rotate-90" : ""}`}>›</span>
                    </button>
                    {isOpen && (
                      <div className="border-t border-[#E0DDD8] bg-[#F4F3F0] p-5 space-y-5">
                        {/* Role / Status */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                          <AdminUnderlineSelect label="Niveau" value={m.role} onChange={(e: any) => changeMemberRole(m.id, e.target.value)}>
                            {["Standard","Pro","Élite","Modérateur","Admin"].map(r => <option key={r}>{r}</option>)}
                          </AdminUnderlineSelect>

                          <AdminUnderlineSelect label="Statut" value={m.status} onChange={(e: any) => changeMemberStatus(m.id, e.target.value)}>
                            {["Actif","En attente de paiement","Paiement à valider","Suspendu","Expiré"].map(s => <option key={s}>{s}</option>)}
                          </AdminUnderlineSelect>

                          <div className="flex gap-3 col-span-2">
                            {m.whatsapp ? (
                              <a
                                href={`https://wa.me/${m.whatsapp.replace(/\D/g,"")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-11 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#25d366]/30 bg-[#25d366]/5 px-5 text-[13.5px] font-sans font-semibold text-[#1d6b45] hover:bg-[#25d366]/10 transition-colors w-full"
                              >
                                Contacter sur WhatsApp
                              </a>
                            ) : (
                              <div className="h-11 w-full" />
                            )}
                            <button
                              onClick={() => deleteMember(m.id)}
                              disabled={saving}
                              className="h-11 px-4 border border-[#FECACA] text-[#E8174B] bg-transparent rounded-lg text-[13px] font-sans font-semibold hover:bg-red-50/50 transition-colors cursor-pointer shrink-0"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>

                        {/* Badge de certification */}
                        <div className="pt-1">
                          <p className="text-[11px] font-sans font-bold uppercase tracking-[0.12em] text-[#6B6B6B] mb-3">Badges de certification</p>
                          <div className="flex flex-wrap gap-2">
                            {BADGES.map(b => {
                              const has = (m.badges ?? []).includes(b.id);
                              return (
                                <button
                                  key={b.id}
                                  onClick={() => toggleBadge(m, b.id)}
                                  title={has ? `Retirer "${b.id}"` : `Attribuer "${b.id}"`}
                                  className="inline-flex items-center gap-1.5 rounded-full border text-[11px] font-bold font-sans transition-all cursor-pointer"
                                  style={{
                                    padding: "4px 12px",
                                    borderColor: has ? b.color : "#E0DDD8",
                                    background: has ? b.bg : "transparent",
                                    color: has ? b.color : "#6B6B6B",
                                    boxShadow: has ? `0 0 0 1px ${b.color}30` : "none",
                                  }}
                                >
                                  <span>{b.icon}</span>
                                  {b.id}
                                  {has && <span className="ml-0.5 opacity-60 text-[9px]">✕</span>}
                                </button>
                              );
                            })}
                          </div>
                          {(m.badges ?? []).length > 0 && (
                            <p className="mt-2 text-[11px] text-[#6B6B6B] font-sans">
                              {(m.badges ?? []).length} badge{(m.badges ?? []).length > 1 ? "s" : ""} attribué{(m.badges ?? []).length > 1 ? "s" : ""} · Points de réputation&nbsp;: <strong>{m.reputation_points ?? 0}</strong>
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Load more */}
              {members.length < membersTotal && !memberSearch && memberFilter === "Tous" && (
                <div className="pt-4 flex items-center justify-between text-[13px] text-[#6B6B6B]">
                  <span>{members.length} / {membersTotal} membres chargés</span>
                  <button
                    onClick={loadMoreMembers}
                    className="rounded-full border border-[#E0DDD8] bg-white px-5 py-2 text-[13px] font-semibold text-[#1A1A1A] hover:bg-[#F4F3F0] transition-colors"
                  >
                    Charger {Math.min(MEMBERS_PER_PAGE, membersTotal - members.length)} de plus
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ CONTENU ══════════════════════════════════════════════ */}
        {tab === "content" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-[18px] font-bold text-[#1A1A1A]">Gestion du contenu</h2>
              <p className="text-[13px] text-[#6B6B6B] font-sans">Administrez les vidéos, sprints, et ressources.</p>
            </div>
            
            <SubTabs<ContentSub>
              tabs={[
                { id: "masterclasses", label: `Masterclasses (${masterclasses.length})` },
                { id: "challenges",    label: `Challenges (${challenges.length})` },
                { id: "evenements",    label: `Événements (${events.length})` },
                { id: "ressources",    label: `Ressources (${resources.length})` },
                { id: "publications",  label: `Publications (${posts.length})` },
              ]}
              active={contentSub} onChange={setContentSub}
            />

            {/* Masterclasses */}
            {contentSub === "masterclasses" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-[12px] font-sans font-bold text-[#6B6B6B] uppercase tracking-[0.1em]">Gestion des cours</h3>
                  <button
                    onClick={() => setShowCreateMasterclass(!showCreateMasterclass)}
                    className={`h-[34px] px-4 rounded-lg text-[13px] font-sans font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      showCreateMasterclass
                        ? "bg-[#1A1A1A] text-white"
                        : "border border-[#E0DDD8] text-[#1A1A1A] bg-transparent hover:bg-[#E0DDD8]/20"
                    }`}
                  >
                    {showCreateMasterclass ? "Fermer le formulaire" : "+ Nouveau cours"}
                  </button>
                </div>

                {showCreateMasterclass && (
                  <div className="rounded-2xl border border-[#E0DDD8] bg-white p-6 shadow-none">
                    <h3 className="font-serif text-[15px] font-bold text-[#1A1A1A] mb-4">Nouveau cours</h3>
                    <form onSubmit={addMasterclass} className="space-y-4">
                      <AdminUnderlineInput label="Titre" value={mc.title} onChange={(e: any) => setMc({...mc, title: e.target.value})} placeholder="Construire sa force commerciale" required />
                      <AdminUnderlineInput label="Orateur / Formateur" value={mc.instructor} onChange={(e: any) => setMc({...mc, instructor: e.target.value})} placeholder="Dr Claudel Noubissie" />
                      <AdminUnderlineTextarea label="Description" value={mc.description} onChange={(e: any) => setMc({...mc, description: e.target.value})} placeholder="Sujet, objectifs..." />
                      <AdminUnderlineInput label="Lien ou ID Vidéo premier module (YouTube / Vimeo - optionnel)" value={mc.youtubeId} onChange={(e: any) => setMc({...mc, youtubeId: e.target.value})} placeholder="Ex: https://vimeo.com/... ou https://youtube.com/watch?v=..." />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <AdminUnderlineSelect label="Type de cours" value={mc.courseType} onChange={(e: any) => setMc({...mc, courseType: e.target.value})}>
                          <option value="Masterclass">Masterclass</option>
                          <option value="Replay">Replay</option>
                        </AdminUnderlineSelect>
                        <AdminUnderlineSelect label="Thème" value={mc.category} onChange={(e: any) => setMc({...mc, category: e.target.value})}>
                          {["Vente","Négociation","Stratégie","Leadership","Investissement","Croissance"].map(c => <option key={c}>{c}</option>)}
                        </AdminUnderlineSelect>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <AdminUnderlineSelect label="Niveau requis" value={mc.tier} onChange={(e: any) => setMc({...mc, tier: e.target.value})}>
                          {["Standard","Pro","Élite"].map(t => <option key={t}>{t}</option>)}
                        </AdminUnderlineSelect>
                        <AdminUnderlineInput label="Durée totale estimée (min)" value={mc.duration} onChange={(e: any) => setMc({...mc, duration: e.target.value})} type="number" />
                      </div>

                      <div className="border-t border-[#E0DDD8] pt-4">
                        <label className="text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-[#6B6B6B] block mb-2">Image de couverture / Miniature</label>
                        <div className="flex items-center gap-4">
                          <input
                            type="file"
                            accept="image/*"
                            ref={thumbnailFileRef}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setThumbnailFile(file);
                                setThumbnailPreview(URL.createObjectURL(file));
                              }
                            }}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => thumbnailFileRef.current?.click()}
                            className="h-10 px-4 border border-[#E0DDD8] rounded-lg text-[13px] font-sans font-semibold text-[#1A1A1A] hover:bg-[#F4F3F0] transition-colors shrink-0 cursor-pointer"
                          >
                            Téléverser une image
                          </button>
                          
                          <div className="flex-1">
                            <AdminUnderlineInput
                              label="Ou collez l'URL de la miniature"
                              value={mc.thumbnailUrl}
                              onChange={(e: any) => setMc({...mc, thumbnailUrl: e.target.value})}
                              placeholder="Laissez vide pour importer automatiquement depuis YouTube"
                            />
                          </div>
                        </div>

                        {thumbnailPreview && (
                          <div className="mt-3 relative w-32 aspect-video rounded-lg overflow-hidden border border-[#E0DDD8]">
                            <img src={thumbnailPreview} alt="Aperçu miniature" className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => { setThumbnailFile(null); setThumbnailPreview(null); }}
                              className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 leading-none text-[12px] flex items-center justify-center h-5 w-5 hover:bg-red-700 cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end pt-3">
                        <button type="submit" disabled={saving} className="h-11 px-6 bg-[#1A1A1A] text-white rounded-lg text-[14px] font-semibold transition-all hover:scale-[1.015] active:scale-[0.98] cursor-pointer">
                          Créer le cours
                        </button>
                      </div>
                    </form>
                  </div>
                )}
                
                <div className="space-y-3">
                  {masterclasses.map(m => {
                    const tc = TIER_COLOR[m.tier_required] ?? "#2E6FD4";
                    const isOpen = expandedCourse === m.id;
                    const mods = courseModules[m.id] ?? [];
                    const modCount = m.module_count ?? mods.length;
                    return (
                      <div key={m.id} className="rounded-xl border border-[#E0DDD8] bg-white overflow-hidden shadow-none">
                        <div className="flex items-center gap-3 p-4 flex-wrap sm:flex-nowrap">
                          {/* Drag handle icon */}
                          <div className="text-[#6B6B6B] cursor-grab shrink-0">
                            <Icons.GripVertical className="h-5 w-5" />
                          </div>
                          
                          {/* Video backdrop thumbnail representation */}
                          <div className="relative w-16 h-10 bg-gradient-to-br from-[#1A1A1A] to-[#2B2B2B] rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-[#E0DDD8]">
                            <Icons.PlayerPlay className="h-4 w-4 text-white fill-white" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-[13.5px] font-bold text-[#1A1A1A] truncate font-sans">{m.title}</p>
                            <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px] text-[#6B6B6B] font-sans">
                              <span className="font-semibold">{m.category}</span>
                              <span>·</span>
                              <span>{m.duration_min} min</span>
                              <span>·</span>
                              <span className="rounded-full px-1.5 py-0.5 text-[9.5px] font-bold" style={{ background: `${tc}15`, color: tc }}>{m.tier_required}</span>
                              <span>·</span>
                              <span>{modCount} module{modCount!==1?"s":""}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 w-full sm:w-auto justify-end">
                            <button
                              onClick={() => toggleExpanded(m.id)}
                              className={`h-9 px-3 rounded-lg border text-[11.5px] font-sans font-semibold transition-colors cursor-pointer ${
                                isOpen
                                  ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                                  : "border-[#E0DDD8] text-[#1A1A1A] bg-transparent hover:bg-neutral-50"
                              }`}
                            >
                              {isOpen ? "Fermer ▲" : "Modules ▼"}
                            </button>
                            <button
                              onClick={() => togglePublished(m)}
                              className={`h-9 px-3 rounded-lg border text-[11.5px] font-sans font-semibold transition-colors cursor-pointer ${
                                m.is_published
                                  ? "border-[#E0DDD8] text-[#6B6B6B] bg-transparent hover:bg-neutral-50"
                                  : "border-[#1D6B45]/20 bg-[#1D6B45]/5 text-[#1D6B45] hover:bg-[#1D6B45]/10"
                              }`}
                            >
                              {m.is_published ? "Masquer" : "Publier"}
                            </button>
                            <button
                              onClick={() => deleteMasterclass(m.id)}
                              className="h-9 px-3 border border-[#FECACA] text-[#E8174B] bg-transparent rounded-lg text-[11.5px] font-sans font-semibold hover:bg-red-50/50 transition-colors cursor-pointer shrink-0"
                            >
                              Suppr.
                            </button>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="border-t border-[#E0DDD8] bg-[#F4F3F0] p-5 space-y-4">
                            <div className="space-y-2">
                              {mods.length === 0 && <p className="text-center text-[12.5px] text-[#6B6B6B] py-2 font-sans">Aucun module dans ce parcours.</p>}
                              {mods.map((mod, idx) => (
                                <div key={mod.id} className="flex items-center gap-3 rounded-lg border border-[#E0DDD8] bg-white p-3 shadow-none">
                                  <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#F4F3F0] text-[11px] font-bold text-ink font-sans">{idx+1}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-semibold text-[#1A1A1A] truncate font-sans">{mod.title}</p>
                                    <p className="text-[10.5px] text-[#6B6B6B] font-mono mt-0.5">{mod.youtube_id} · {mod.duration_min} min</p>
                                  </div>
                                  <button onClick={() => deleteModule(mod.id, m.id)} className="text-[11px] font-bold text-[#E8174B] hover:underline">Suppr.</button>
                                </div>
                              ))}
                            </div>

                            <form onSubmit={e => addModule(m.id, e)} className="rounded-xl border border-[#E0DDD8] bg-white p-4 space-y-4 shadow-none">
                              <p className="text-[12px] font-bold text-[#2E6FD4] font-sans">+ Ajouter un module</p>
                              <AdminUnderlineInput label="Titre du module" value={newMod.title} onChange={(e: any) => setNewMod({...newMod, title: e.target.value})} required />
                              <div className="grid grid-cols-2 gap-4">
                                <AdminUnderlineInput label="Lien ou ID Vidéo (YouTube / Vimeo)" value={newMod.youtubeId} onChange={(e: any) => setNewMod({...newMod, youtubeId: e.target.value})} placeholder="Ex: https://vimeo.com/... ou https://youtube.com/..." required />
                                <AdminUnderlineInput label="Durée (min)" value={newMod.duration} onChange={(e: any) => setNewMod({...newMod, duration: e.target.value})} type="number" />
                              </div>
                              <div className="flex justify-end pt-2">
                                <button type="submit" disabled={addingModule} className="h-10 px-5 bg-[#1A1A1A] text-white rounded-lg text-[13px] font-semibold transition-all hover:scale-[1.015] active:scale-[0.98] cursor-pointer">
                                  Ajouter le module
                                </button>
                              </div>
                            </form>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Challenges */}
            {contentSub === "challenges" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-[12px] font-sans font-bold text-[#6B6B6B] uppercase tracking-[0.1em]">Challenges hebdomadaires</h3>
                  <button
                    onClick={() => setShowCreateChallenge(!showCreateChallenge)}
                    className={`h-[34px] px-4 rounded-lg text-[13px] font-sans font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      showCreateChallenge
                        ? "bg-[#1A1A1A] text-white"
                        : "border border-[#E0DDD8] text-[#1A1A1A] bg-transparent hover:bg-[#E0DDD8]/20"
                    }`}
                  >
                    {showCreateChallenge ? "Fermer le formulaire" : "+ Nouveau challenge"}
                  </button>
                </div>

                {showCreateChallenge && (
                  <div className="rounded-2xl border border-[#E0DDD8] bg-white p-6 shadow-none">
                    <h3 className="font-serif text-[15px] font-bold text-[#1A1A1A] mb-4">Nouveau Challenge</h3>
                    <form onSubmit={addChallenge} className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <AdminUnderlineInput label="Semaine #" value={chForm.weekNumber} onChange={(e: any) => setChForm({...chForm, weekNumber: e.target.value})} required type="number" />
                        <div className="col-span-2">
                          <AdminUnderlineInput label="Titre du Challenge" value={chForm.title} onChange={(e: any) => setChForm({...chForm, title: e.target.value})} required />
                        </div>
                      </div>
                      
                      <AdminUnderlineTextarea label="Contexte" value={chForm.context} onChange={(e: any) => setChForm({...chForm, context: e.target.value})} placeholder="Problématique business..." />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <AdminUnderlineTextarea label="Objectif" value={chForm.objective} onChange={(e: any) => setChForm({...chForm, objective: e.target.value})} />
                        <AdminUnderlineTextarea label="Mission" value={chForm.mission} onChange={(e: any) => setChForm({...chForm, mission: e.target.value})} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <AdminUnderlineInput label="Livrable attendu" value={chForm.deliverable} onChange={(e: any) => setChForm({...chForm, deliverable: e.target.value})} placeholder="Ex: PDF ou lien drive" />
                        <AdminUnderlineTextarea label="Ressources utiles (liens)" value={chForm.resources} onChange={(e: any) => setChForm({...chForm, resources: e.target.value})} placeholder="https://..." />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <AdminUnderlineSelect label="Thématique" value={chForm.category} onChange={(e: any) => setChForm({...chForm, category: e.target.value})}>
                          {["Business", "Marketing", "Vente", "Finance", "Opérations", "Mindset"].map(c => <option key={c} value={c}>{c}</option>)}
                        </AdminUnderlineSelect>
                        
                        <AdminUnderlineSelect label="Difficulté" value={chForm.difficulty} onChange={(e: any) => setChForm({...chForm, difficulty: e.target.value})}>
                          {["Débutant", "Intermédiaire", "Avancé"].map(d => <option key={d} value={d}>{d}</option>)}
                        </AdminUnderlineSelect>
                        
                        <AdminUnderlineInput label="Points accordés" value={chForm.points} onChange={(e: any) => setChForm({...chForm, points: e.target.value})} type="number" />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <AdminUnderlineInput label="Date Limite" value={chForm.deadlineDate} onChange={(e: any) => setChForm({...chForm, deadlineDate: e.target.value})} type="date" />
                        <AdminUnderlineInput label="Heure Limite" value={chForm.deadlineTime} onChange={(e: any) => setChForm({...chForm, deadlineTime: e.target.value})} type="time" />
                        
                        <AdminUnderlineSelect label="Niveau requis" value={chForm.tier} onChange={(e: any) => setChForm({...chForm, tier: e.target.value})}>
                          {["Standard", "Pro", "Élite"].map(t => <option key={t} value={t}>{t}</option>)}
                        </AdminUnderlineSelect>
                      </div>

                      <div className="flex items-center justify-between pt-3">
                        <label className="flex items-center gap-2 text-[13px] font-sans font-medium text-ink cursor-pointer">
                          <input type="checkbox" checked={chForm.isActive} onChange={e => setChForm({...chForm, isActive: e.target.checked})} className="rounded text-[#2E6FD4] focus:ring-[#2E6FD4]"/>
                          <span>Activer immédiatement</span>
                        </label>
                        <button type="submit" disabled={saving} className="h-11 px-6 bg-[#1A1A1A] text-white rounded-lg text-[14px] font-semibold transition-all hover:scale-[1.015] active:scale-[0.98] cursor-pointer">
                          Publier le challenge
                        </button>
                      </div>
                    </form>
                  </div>
                )}
                
                <div className="space-y-3">
                  {challenges.map(ch => {
                    const tc = TIER_COLOR[ch.tier_required] ?? "#2E6FD4";
                    return (
                      <div key={ch.id} className="rounded-xl border border-[#E0DDD8] bg-white overflow-hidden">
                        <div className="h-1" style={{ backgroundColor: ch.is_active ? "#1D6B45" : "#E0DDD8" }}/>
                        <div className="p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="shrink-0 rounded-lg border border-[#E0DDD8] bg-[#F4F3F0] px-3 py-1.5 text-center min-w-[50px]">
                              <p className="text-[9px] font-bold text-[#6B6B6B] uppercase">Sem</p>
                              <p className="text-xl font-bold text-[#1A1A1A] leading-none">{ch.week_number}</p>
                            </div>
                            <div>
                              <p className="text-[13.5px] font-bold text-[#1A1A1A] font-sans">{ch.title}</p>
                              <div className="mt-1 flex items-center gap-2 text-[11px] text-[#6B6B6B] font-sans flex-wrap">
                                <span>{ch.category}</span>
                                <span>·</span>
                                <span>{ch.difficulty}</span>
                                <span>·</span>
                                <span className="font-semibold text-brand">{ch.points} pts</span>
                                <span className="rounded-full px-1.5 py-0.5 text-[9.5px] font-bold" style={{ background: `${tc}15`, color: tc }}>{ch.tier_required}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button onClick={() => toggleChallengeActive(ch)} className="rounded-lg border border-[#E0DDD8] px-3 py-1.5 text-[11.5px] font-semibold text-muted hover:border-brand/40 transition-colors">
                              {ch.is_active ? "Désactiver" : "Activer"}
                            </button>
                            <button onClick={() => deleteChallenge(ch.id)} className="rounded-lg border border-[#E8174B]/20 px-3 py-1.5 text-[11.5px] font-semibold text-[#E8174B] hover:bg-[#E8174B]/5 transition-colors">
                              Suppr.
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Événements */}
            {contentSub === "evenements" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-[12px] font-sans font-bold text-[#6B6B6B] uppercase tracking-[0.1em]">Cocktails & Événements</h3>
                  <button
                    onClick={() => setShowCreateEvent(!showCreateEvent)}
                    className={`h-[34px] px-4 rounded-lg text-[13px] font-sans font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      showCreateEvent
                        ? "bg-[#1A1A1A] text-white"
                        : "border border-[#E0DDD8] text-[#1A1A1A] bg-transparent hover:bg-[#E0DDD8]/20"
                    }`}
                  >
                    {showCreateEvent ? "Fermer le formulaire" : "+ Nouvel événement"}
                  </button>
                </div>

                {showCreateEvent && (
                  <div className="rounded-2xl border border-[#E0DDD8] bg-white p-6 shadow-none">
                    <h3 className="font-serif text-[15px] font-bold text-[#1A1A1A] mb-4">Nouveau Cocktail / Événement</h3>
                    <form onSubmit={addEvent} className="space-y-4">
                      <AdminUnderlineInput label="Titre" value={ev.title} onChange={(e: any) => setEv({...ev, title: e.target.value})} required />
                      <AdminUnderlineTextarea label="Description" value={ev.description} onChange={(e: any) => setEv({...ev, description: e.target.value})} />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <AdminUnderlineInput label="Date" value={ev.date} onChange={(e: any) => setEv({...ev, date: e.target.value})} type="date" required />
                        <AdminUnderlineInput label="Heure" value={ev.time} onChange={(e: any) => setEv({...ev, time: e.target.value})} type="time" />
                      </div>

                      <AdminUnderlineInput label="Lieu / Salle" value={ev.location} onChange={(e: any) => setEv({...ev, location: e.target.value})} />

                      {ev.type === "En ligne" && (
                        <div className="space-y-1">
                          <AdminUnderlineInput
                            label="Lien Google Meet"
                            value={ev.meetLink}
                            onChange={(e: any) => setEv({...ev, meetLink: e.target.value})}
                            type="url"
                          />
                          <p className="text-[11px] text-[#6B6B6B] pl-0.5">
                            Visible uniquement pour les membres inscrits à l&apos;événement.
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-4 gap-4">
                        <AdminUnderlineSelect label="Type" value={ev.type} onChange={(e: any) => setEv({...ev, type: e.target.value})}>
                          <option>En ligne</option>
                          <option>Physique</option>
                        </AdminUnderlineSelect>
                        
                        <AdminUnderlineSelect label="Niveau requis" value={ev.tier} onChange={(e: any) => setEv({...ev, tier: e.target.value})}>
                          {["Standard","Pro","Élite"].map(t => <option key={t}>{t}</option>)}
                        </AdminUnderlineSelect>
                        
                        <AdminUnderlineInput label="Prix (FCFA)" value={ev.price} onChange={(e: any) => setEv({...ev, price: e.target.value})} type="number" />
                        <AdminUnderlineInput label="Places max" value={ev.spots} onChange={(e: any) => setEv({...ev, spots: e.target.value})} type="number" />
                      </div>

                      {/* Affiche de l'événement */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-sans font-bold uppercase tracking-[0.12em] text-[#6B6B6B]">
                          Affiche de l&apos;événement (Format rectangulaire ou carré)
                        </label>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => eventFileRef.current?.click()}
                            className="flex h-10 items-center gap-2 rounded-lg border border-dashed border-[#E0DDD8] bg-[#F4F3F0]/20 px-4 text-[13px] font-semibold text-[#6B6B6B] hover:border-brand/40 hover:text-brand transition-colors cursor-pointer"
                          >
                            <Camera width={16} height={16} />
                            Choisir un visuel
                          </button>
                          <input
                            ref={eventFileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleEventImageSelect}
                          />
                          {eventImagePreview && (
                            <div className="relative h-16 w-28 overflow-hidden rounded-lg border border-[#E0DDD8] bg-[#F4F3F0]">
                              <img src={eventImagePreview} alt="Aperçu" className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={removeEventImage}
                                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                              >
                                <Close width={10} height={10} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end pt-3">
                        <button type="submit" disabled={saving} className="h-11 px-6 bg-[#1A1A1A] text-white rounded-lg text-[14px] font-semibold transition-all hover:scale-[1.015] active:scale-[0.98] cursor-pointer">
                          Créer
                        </button>
                      </div>
                    </form>
                  </div>
                )}
                
                <div className="space-y-3">
                  {events.map(e => {
                    const tc = TIER_COLOR[e.tier_required] ?? "#2E6FD4";
                    const dt = new Date(e.event_date);
                    return (
                      <div key={e.id} className="rounded-xl border border-[#E0DDD8] bg-white overflow-hidden p-4 flex items-center justify-between gap-4 shadow-none">
                        <div className="flex items-center gap-3">
                          <div className="shrink-0 rounded-lg border border-[#E0DDD8] bg-[#F4F3F0] px-3 py-1.5 text-center min-w-[50px]">
                            <p className="text-[9px] font-bold text-[#6B6B6B] uppercase">{dt.toLocaleDateString("fr-FR", { month: "short" })}</p>
                            <p className="text-xl font-bold text-[#1A1A1A] leading-none">{dt.getDate()}</p>
                          </div>
                          <div>
                            <p className="text-[13.5px] font-bold text-[#1A1A1A] font-sans">{e.title}</p>
                            <div className="mt-1 flex items-center gap-2 text-[11px] text-[#6B6B6B] font-sans flex-wrap">
                              <span className={e.event_type === "En ligne" ? "text-[#2E6FD4]" : "text-[#1D6B45]"}>{e.event_type}</span>
                              <span>·</span>
                              <span>{e.location}</span>
                              <span className="rounded-full px-1.5 py-0.5 text-[9.5px] font-bold" style={{ background: `${tc}15`, color: tc }}>{e.tier_required}</span>
                              {e.event_registrations && (() => {
                                const total = e.event_registrations.length;
                                const confirmed = e.event_registrations.filter(r => r.confirmed_at).length;
                                return total > 0 ? (
                                  <span className="flex items-center gap-1">
                                    <span className="text-[#1A1A1A] font-semibold">{total} inscrits</span>
                                    <span>·</span>
                                    <span className={confirmed === total ? "text-[#16a34a] font-semibold" : "text-[#ffac42] font-semibold"}>
                                      {confirmed} confirmé{confirmed > 1 ? "s" : ""}
                                    </span>
                                  </span>
                                ) : null;
                              })()}
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => deleteEvent(e.id)}
                          className="h-9 px-3 border border-[#FECACA] text-[#E8174B] bg-transparent rounded-lg text-[11.5px] font-sans font-semibold hover:bg-red-50/50 transition-colors cursor-pointer shrink-0"
                        >
                          Suppr.
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ressources */}
            {contentSub === "ressources" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-[12px] font-sans font-bold text-[#6B6B6B] uppercase tracking-[0.1em]">Ressources utiles</h3>
                  <button
                    onClick={() => setShowCreateResource(!showCreateResource)}
                    className={`h-[34px] px-4 rounded-lg text-[13px] font-sans font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      showCreateResource
                        ? "bg-[#1A1A1A] text-white"
                        : "border border-[#E0DDD8] text-[#1A1A1A] bg-transparent hover:bg-[#E0DDD8]/20"
                    }`}
                  >
                    {showCreateResource ? "Fermer le formulaire" : "+ Nouvelle ressource"}
                  </button>
                </div>

                {showCreateResource && (
                  <div className="rounded-2xl border border-[#E0DDD8] bg-white p-6 shadow-none">
                    <h3 className="font-serif text-[15px] font-bold text-[#1A1A1A] mb-4">Nouvelle ressource utile</h3>
                    <form onSubmit={addResource} className="space-y-4">
                      <AdminUnderlineInput label="Titre" value={res.title} onChange={(e: any) => setRes({...res, title: e.target.value})} required />
                      <AdminUnderlineTextarea label="Description" value={res.description} onChange={(e: any) => setRes({...res, description: e.target.value})} />
                      
                      <div className="grid grid-cols-3 gap-4">
                        <AdminUnderlineInput label="Catégorie" value={res.category} onChange={(e: any) => setRes({...res, category: e.target.value})} />
                        <AdminUnderlineSelect label="Type" value={res.type} onChange={(e: any) => setRes({...res, type: e.target.value})}>
                          {["PDF","Guide","Vidéo","Outil","Template","Lien","Autre"].map(t => <option key={t}>{t}</option>)}
                        </AdminUnderlineSelect>
                        <AdminUnderlineSelect label="Niveau requis" value={res.tier} onChange={(e: any) => setRes({...res, tier: e.target.value})}>
                          {["Standard","Pro","Élite"].map(t => <option key={t}>{t}</option>)}
                        </AdminUnderlineSelect>
                      </div>

                      <div className="rounded-xl border border-dashed border-[#E0DDD8] bg-[#F4F3F0] p-5 space-y-3">
                        <p className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#6B6B6B]">Fichier à téléverser (PDF, xls, ppt...)</p>
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => resourceFileRef.current?.click()} disabled={uploadingFile}
                            className="h-10 px-4 bg-white border border-[#E0DDD8] rounded-lg text-[13px] font-semibold text-[#1A1A1A] hover:bg-neutral-50 transition-colors disabled:opacity-50 cursor-pointer">
                            {uploadingFile ? "Upload en cours..." : "Choisir un fichier"}
                          </button>
                          {res.fileUrl && <span className="text-[11px] text-[#1D6B45] font-bold">✓ Fichier prêt</span>}
                        </div>
                        <input ref={resourceFileRef} type="file" className="hidden" onChange={handleResourceFile}/>
                      </div>

                      <div className="flex items-center gap-2 py-2">
                        <div className="flex-1 h-[0.5px] bg-[#E0DDD8]"/>
                        <span className="text-[10px] text-[#6B6B6B] font-bold font-sans uppercase">ou lien externe</span>
                        <div className="flex-1 h-[0.5px] bg-[#E0DDD8]"/>
                      </div>

                      <AdminUnderlineInput label="Lien externe (Google Drive...)" value={res.externalUrl} onChange={(e: any) => setRes({...res, externalUrl: e.target.value})} placeholder="https://..." />

                      <div className="flex justify-end pt-3">
                        <button type="submit" disabled={saving||uploadingFile} className="h-11 px-6 bg-[#1A1A1A] text-white rounded-lg text-[14px] font-semibold transition-all hover:scale-[1.015] active:scale-[0.98] cursor-pointer font-sans">
                          Publier
                        </button>
                      </div>
                    </form>
                  </div>
                )}
                
                <div className="space-y-2">
                  {resources.map(r => {
                    const tc = TIER_COLOR[r.tier_required] ?? "#2E6FD4";
                    return (
                      <div key={r.id} className="rounded-xl border border-[#E0DDD8] bg-white p-4 flex items-center justify-between gap-4 shadow-none">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">📂</span>
                          <div>
                            <p className="text-[13.5px] font-bold text-[#1A1A1A] font-sans">{r.title}</p>
                            <div className="mt-1 flex items-center gap-2 text-[11px] text-[#6B6B6B] font-sans flex-wrap">
                              <span>{r.category}</span>
                              <span>·</span>
                              <span>{r.resource_type}</span>
                              <span>·</span>
                              <span className="rounded-full px-1.5 py-0.5 text-[9.5px] font-bold" style={{ background: `${tc}15`, color: tc }}>{r.tier_required}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleResourcePublished(r)}
                            className={`h-9 px-3 rounded-lg border text-[11.5px] font-sans font-semibold transition-colors cursor-pointer ${
                              r.is_published
                                ? "border-[#E0DDD8] text-[#6B6B6B] bg-transparent hover:bg-neutral-50"
                                : "border-[#1D6B45]/20 bg-[#1D6B45]/5 text-[#1D6B45] hover:bg-[#1D6B45]/10"
                            }`}
                          >
                            {r.is_published ? "Masquer" : "Publier"}
                          </button>
                          <button
                            onClick={() => deleteResource(r.id)}
                            className="h-9 px-3 border border-[#FECACA] text-[#E8174B] bg-transparent rounded-lg text-[11.5px] font-sans font-semibold hover:bg-red-50/50 transition-colors cursor-pointer shrink-0"
                          >
                            Suppr.
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Publications */}
            {contentSub === "publications" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-[12px] font-sans font-bold text-[#6B6B6B] uppercase tracking-[0.1em]">Annonces de la communauté</h3>
                  <button
                    onClick={() => setShowCreatePost(!showCreatePost)}
                    className={`h-[34px] px-4 rounded-lg text-[13px] font-sans font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      showCreatePost
                        ? "bg-[#1A1A1A] text-white"
                        : "border border-[#E0DDD8] text-[#1A1A1A] bg-transparent hover:bg-[#E0DDD8]/20"
                    }`}
                  >
                    {showCreatePost ? "Fermer le formulaire" : "+ Nouvelle publication"}
                  </button>
                </div>

                {showCreatePost && (
                  <div className="rounded-2xl border border-[#E0DDD8] bg-white p-6 shadow-none">
                    <h3 className="font-serif text-[15px] font-bold text-[#1A1A1A] mb-4">Nouvelle Annonce / Publication</h3>
                    <form onSubmit={addPost} className="space-y-4">
                      <AdminUnderlineSelect label="Catégorie" value={newPost.category} onChange={(e: any) => setNewPost({...newPost, category: e.target.value})}>
                        {["Annonces","Business","Opportunités","Entraide"].map(c => <option key={c}>{c}</option>)}
                      </AdminUnderlineSelect>
                      
                      <AdminUnderlineInput label="Titre (optionnel)" value={newPost.title} onChange={(e: any) => setNewPost({...newPost, title: e.target.value})} />
                      
                      <AdminUnderlineTextarea label="Message" value={newPost.content} onChange={(e: any) => setNewPost({...newPost, content: e.target.value})} rows={4} required />
                      
                      <div className="flex justify-end pt-3">
                        <button type="submit" disabled={saving} className="h-11 px-6 bg-[#1A1A1A] text-white rounded-lg text-[14px] font-semibold transition-all hover:scale-[1.015] active:scale-[0.98] cursor-pointer">
                          Publier
                        </button>
                      </div>
                    </form>
                  </div>
                )}
                
                <div className="space-y-3">
                  {posts.map(p => {
                    const CAT_C: Record<string,string> = { Annonces:"#F0A500", Business:"#2E6FD4", Opportunités:"#1D6B45", Entraide:"#6C3FC5" };
                    const cc = CAT_C[p.category] ?? "#6C3FC5";
                    return (
                      <div key={p.id} className="rounded-xl border border-[#E0DDD8] bg-white p-5 space-y-3 shadow-none">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap text-[11px] text-[#6B6B6B] font-sans">
                              <span className="rounded-full px-2 py-0.5 text-[9.5px] font-bold" style={{ background: `${cc}15`, color: cc }}>{p.category}</span>
                              {p.author && <span>par {p.author.first_name} {p.author.last_name}</span>}
                              <span>{relativeTime(p.created_at)}</span>
                            </div>
                            {p.title && <p className="text-[14px] font-bold text-[#1A1A1A] mt-2 font-sans">{p.title}</p>}
                            <p className="text-[13px] text-[#6B6B6B] leading-relaxed mt-1 font-sans">{p.content}</p>
                          </div>
                          
                          <button
                            onClick={() => deletePost(p.id)}
                            className="h-9 px-3 border border-[#FECACA] text-[#E8174B] bg-transparent rounded-lg text-[11.5px] font-sans font-semibold hover:bg-red-50/50 transition-colors cursor-pointer shrink-0"
                          >
                            Suppr.
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ══ ANNUAIRE ════════════════════════════════════════════════ */}
        {tab === "annuaire" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-[18px] font-bold text-[#1A1A1A]">Annuaire Membres</h2>
                <p className="text-[13px] text-[#6B6B6B] font-sans">{contacts.length} fiches répertoriées</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowImportZone(z => !z)}
                  className={`h-10 px-4 rounded-lg text-[13px] font-semibold font-sans transition-all hover:scale-[1.015] active:scale-[0.98] cursor-pointer border ${
                    showImportZone
                      ? "bg-[#E8174B]/5 border-[#E8174B]/20 text-[#E8174B]"
                      : "bg-transparent border-[#E0DDD8] text-[#1A1A1A] hover:bg-neutral-50"
                  }`}
                >
                  {showImportZone ? "Annuler l'import" : "Importer Excel / CSV"}
                </button>
                <button onClick={() => { setTab("onboarding"); setOnboardSub("annuaire_add"); }} className="h-10 px-4 bg-[#1A1A1A] text-white rounded-lg text-[13px] font-semibold font-sans transition-all hover:scale-[1.015] active:scale-[0.98] cursor-pointer">
                  Ajouter une fiche
                </button>
              </div>
            </div>

            {showImportZone && (
              <div className="rounded-2xl border border-dashed border-[#E0DDD8] bg-white p-6 space-y-4">
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                    <span className="text-xl">📊</span>
                  </div>
                  <h3 className="text-[14px] font-bold text-[#1A1A1A]">Importer depuis un fichier Excel ou CSV</h3>
                  <p className="mt-1 text-[12px] text-[#6B6B6B] max-w-sm font-sans">
                    Sélectionnez un fichier .xlsx, .xls ou .csv. Les colonnes seront automatiquement associées (Prénom, Nom, Entreprise, Secteur, Ville, Pays, Téléphone, WhatsApp, Email, Site web, Bio).
                  </p>
                  
                  <input
                    type="file"
                    ref={importFileRef}
                    accept=".xlsx,.xls,.csv"
                    onChange={handleImportFile}
                    className="hidden"
                  />

                  <button
                    onClick={() => importFileRef.current?.click()}
                    className="mt-4 h-9 px-4 border border-[#E0DDD8] rounded-lg text-[12.5px] font-semibold text-[#1A1A1A] bg-transparent hover:bg-neutral-50 transition-colors cursor-pointer font-sans"
                  >
                    Choisir un fichier
                  </button>

                  {importError && (
                    <p className="mt-3 text-[12.5px] font-semibold text-[#E8174B] font-sans">{importError}</p>
                  )}
                </div>

                {parsedContacts.length > 0 && (
                  <div className="border-t border-[#E0DDD8] pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-bold text-[#1A1A1A]">{parsedContacts.length} contacts détectés</p>
                      <button
                        onClick={submitImportedContacts}
                        disabled={saving}
                        className="h-9 px-4 bg-[#1D6B45] text-white rounded-lg text-[12.5px] font-semibold transition-all hover:scale-[1.015] active:scale-[0.98] cursor-pointer font-sans"
                      >
                        {saving ? "Importation..." : "Valider l'importation"}
                      </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-[#E0DDD8] rounded-xl divide-y divide-[#E0DDD8] bg-[#F4F3F0]/30">
                      {parsedContacts.slice(0, 10).map((c, i) => (
                        <div key={i} className="p-2.5 text-[11.5px] flex items-center justify-between font-sans">
                          <div>
                            <span className="font-bold text-[#1A1A1A]">{c.first_name} {c.last_name}</span>
                            {c.company && <span className="text-[#6B6B6B]"> · {c.company}</span>}
                            {c.sector && <span className="text-[#6B6B6B]/60"> ({c.sector})</span>}
                          </div>
                          <span className="text-[#6B6B6B]">{[c.city, c.country].filter(Boolean).join(", ")}</span>
                        </div>
                      ))}
                      {parsedContacts.length > 10 && (
                        <div className="p-2.5 text-[11.5px] text-center font-semibold text-[#6B6B6B] bg-neutral-50 font-sans">
                          Et {parsedContacts.length - 10} autres contacts...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search width={16} height={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"/>
                <input type="search" placeholder="Rechercher par nom, entreprise, ville…" value={contactSearch} onChange={e => setContactSearch(e.target.value)} className="w-full h-11 rounded-xl border border-[#E0DDD8] bg-white pl-10 pr-4 text-[14px] text-ink outline-none focus:border-[#2E6FD4]"/>
              </div>
              <button
                onClick={() => setShowContactFilters(f => !f)}
                className={`flex h-11 items-center gap-1.5 rounded-xl border px-4 text-[13px] font-semibold transition-colors cursor-pointer ${
                  showContactFilters ? "border-[#1A1A1A] bg-[#1A1A1A]/5 text-[#1A1A1A]" : "border-[#E0DDD8] bg-white text-[#6B6B6B] hover:text-[#1A1A1A]"
                }`}
              >
                <Filter width={14} height={14}/> Filtrer
              </button>
            </div>

            {showContactFilters && (
              <div className="rounded-2xl border border-[#E0DDD8] bg-white p-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block mb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-[#6B6B6B]">Pays</label>
                  <select
                    value={contactCountryFilter}
                    onChange={e => setContactCountryFilter(e.target.value)}
                    className="w-full h-10 rounded-xl border border-[#E0DDD8] bg-white px-3 text-[13px] text-ink outline-none focus:border-[#1A1A1A]"
                  >
                    {contactCountries.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-[#6B6B6B]">Ville</label>
                  <select
                    value={contactCityFilter}
                    onChange={e => setContactCityFilter(e.target.value)}
                    className="w-full h-10 rounded-xl border border-[#E0DDD8] bg-white px-3 text-[13px] text-ink outline-none focus:border-[#1A1A1A]"
                  >
                    {contactCities.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-[#6B6B6B]">Secteur d&apos;activité</label>
                  <select
                    value={contactSectorFilter}
                    onChange={e => setContactSectorFilter(e.target.value)}
                    className="w-full h-10 rounded-xl border border-[#E0DDD8] bg-white px-3 text-[13px] text-ink outline-none focus:border-[#1A1A1A]"
                  >
                    {contactSectors.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {(contactSearch || contactSectorFilter !== "Tous" || contactCountryFilter !== "Tous" || contactCityFilter !== "Tous") && (
              <div className="flex items-center justify-between text-[13px] text-[#6B6B6B]">
                <span>{filteredContacts.length} résultat{filteredContacts.length !== 1 ? "s" : ""} trouvé{filteredContacts.length !== 1 ? "s" : ""}</span>
                <button
                  onClick={() => {
                    setContactSearch("");
                    setContactSectorFilter("Tous");
                    setContactCountryFilter("Tous");
                    setContactCityFilter("Tous");
                  }}
                  className="text-[12.5px] font-semibold text-[#2E6FD4] hover:underline cursor-pointer"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}

            {filteredContacts.length === 0 ? (
              <AdminEmptyState
                title="Aucun contact répertorié"
                subtitle="Aucune fiche de l'annuaire ne correspond à votre recherche. Vous pouvez ajouter un contact ou envoyer un e-mail de rappel aux membres."
                ctaLabel="Notifier les membres par email"
                onCtaClick={sendMemberEmailReminders}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredContacts.map(c => {
                  const COUNTRY_FLAGS: Record<string, string> = {
                    "Cameroun": "🇨🇲",
                    "Côte d'Ivoire": "🇨🇮",
                    "Cote d'Ivoire": "🇨🇮",
                    "Sénégal": "🇸🇳",
                    "Senegal": "🇸🇳",
                    "Togo": "🇹🇬",
                    "Bénin": "🇧🇯",
                    "Benin": "🇧🇯",
                    "Gabon": "🇬🇦",
                    "Congo": "🇨🇬",
                    "RDC": "🇨🇩",
                    "France": "🇫🇷"
                  };
                  const flag = c.country ? (COUNTRY_FLAGS[c.country] ?? "") : "";
                  return (
                    <div key={c.id} className="rounded-2xl border border-[#E0DDD8] bg-white p-5 space-y-4 flex flex-col justify-between shadow-none">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          {c.avatar_url ? (
                            <img src={c.avatar_url} className="h-10 w-10 rounded-full object-cover shrink-0" alt=""/>
                          ) : (
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F4F3F0] text-[13px] font-bold text-[#1A1A1A] font-sans border border-[#E0DDD8]">
                              {(c.first_name[0] + (c.last_name[0] ?? "")).toUpperCase()}
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-[14px] font-bold text-[#1A1A1A] truncate font-sans">{c.first_name} {c.last_name}</p>
                              {c.member_id && (
                                <span className="text-[#2E6FD4] shrink-0" title="Membre vérifié">
                                  <Icons.ShieldCheck className="h-4 w-4" />
                                </span>
                              )}
                            </div>
                            {c.company && <p className="text-[12px] text-[#6B6B6B] truncate font-sans mt-0.5">{c.company}</p>}
                          </div>
                        </div>
                        
                        <div className="space-y-1.5 text-[12px] text-[#6B6B6B] font-sans border-t border-[#E0DDD8] pt-3">
                          {c.sector && <p>💼 {c.sector}</p>}
                          {(c.city || c.country) && <p>📍 {[c.city, c.country].filter(Boolean).join(", ")} {flag}</p>}
                          {c.whatsapp && <p>📱 {c.whatsapp}</p>}
                          {c.email && <p className="truncate">✉ {c.email}</p>}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-[#E0DDD8] border-dashed">
                        <button
                          onClick={() => toggleContactPublished(c)}
                          className={`flex-1 h-9 rounded-lg border text-[11.5px] font-sans font-semibold transition-colors cursor-pointer ${
                            c.is_published
                              ? "border-[#E0DDD8] text-[#6B6B6B] bg-transparent hover:bg-neutral-50"
                              : "border-[#1D6B45]/20 bg-[#1D6B45]/5 text-[#1D6B45] hover:bg-[#1D6B45]/10"
                          }`}
                        >
                          {c.is_published ? "Masquer" : "Publier"}
                        </button>
                        <button
                          onClick={() => deleteContact(c.id)}
                          className="flex-1 h-9 border border-[#FECACA] text-[#E8174B] bg-transparent rounded-lg text-[11.5px] font-sans font-semibold hover:bg-red-50/50 transition-colors cursor-pointer"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ PARAMÈTRES ══════════════════════════════════════════════ */}
        {tab === "settings" && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="font-serif text-[18px] font-bold text-[#1A1A1A]">Paramètres de la plateforme</h2>
              <p className="text-[13px] text-[#6B6B6B] font-sans">Gérez le fonctionnement et les commissions.</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              
              <div className="space-y-6">
                
                {/* Modules switches */}
                <div className="rounded-2xl border border-[#E0DDD8] bg-white p-6 space-y-4">
                  <h3 className="font-serif text-[15px] font-bold text-[#1A1A1A]">Fonctionnalités</h3>
                  <div className="divide-y divide-[#E0DDD8]">
                    {[
                      { key:"enableSocialFeed",  label:"Fil social (Kpaka)",         desc:"Publications libres des membres." },
                      { key:"enableMarketplace", label:"Marché & Offres", desc:"Validation requise pour les offres." },
                      { key:"enableChallenges",  label:"Challenges & Sprints",        desc:"Tableau d'exécution hebdomadaire." },
                    ].map(mod => (
                      <div key={mod.key} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                        <div className="pr-4">
                          <p className="text-[13px] font-bold text-[#1A1A1A] font-sans">{mod.label}</p>
                          <p className="text-[11px] text-[#6B6B6B] mt-0.5 font-sans leading-relaxed">{mod.desc}</p>
                        </div>
                        
                        {/* Toggle Switch in Level-color (#2E6FD4) */}
                        <button
                          onClick={() => saveSettings({ ...systemSettings, [mod.key]: !systemSettings[mod.key as keyof typeof systemSettings] })}
                          className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
                          style={{
                            backgroundColor: systemSettings[mod.key as keyof typeof systemSettings] ? "#2E6FD4" : "#E0DDD8"
                          }}
                        >
                          <span
                            className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200"
                            style={{
                              transform: systemSettings[mod.key as keyof typeof systemSettings] ? "translateX(20px)" : "translateX(0px)"
                            }}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Maintenance mode */}
                <div className="rounded-2xl border border-[#E0DDD8] bg-white p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-[15px] font-bold text-[#1A1A1A]">Mode maintenance</h3>
                    <button
                      onClick={() => saveSettings({...systemSettings, maintenanceMode:!systemSettings.maintenanceMode})}
                      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
                      style={{
                        backgroundColor: systemSettings.maintenanceMode ? "#E8174B" : "#E0DDD8"
                      }}
                    >
                      <span
                        className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200"
                        style={{
                          transform: systemSettings.maintenanceMode ? "translateX(20px)" : "translateX(0px)"
                        }}
                      />
                    </button>
                  </div>
                  <p className="text-[12px] text-[#6B6B6B] font-sans">Bloque les connexions standard de la plateforme.</p>
                  
                  {systemSettings.maintenanceMode && (
                    <div className="space-y-3 pt-2">
                      <div className="rounded-lg border border-[#FECACA] bg-[#E8174B]/5 p-3 text-[12px] text-[#E8174B] font-sans leading-relaxed">
                        <strong>Attention :</strong> Le mode maintenance est actif. Seuls les administrateurs et modérateurs peuvent accéder à la plateforme.
                      </div>
                      <AdminUnderlineTextarea label="Message de maintenance" value={systemSettings.maintenanceMessage} onChange={(e: any) => setSystemSettings(s => ({...s, maintenanceMessage:e.target.value}))} required />
                      <button onClick={() => saveSettings(systemSettings)} className="h-10 px-5 bg-[#1A1A1A] text-white rounded-lg text-[13px] font-semibold font-sans transition-all hover:scale-[1.015] active:scale-[0.98] cursor-pointer">
                        Enregistrer
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {/* Barème de parrainage (underline style) */}
              <div className="rounded-2xl border border-[#E0DDD8] bg-white p-6 space-y-6">
                <h3 className="font-serif text-[15px] font-bold text-[#1A1A1A]">Barème de parrainage</h3>
                <div className="space-y-4">
                  {[
                    { key:"commissionStandard", label:"Standard", color:TIER_COLOR.Standard },
                    { key:"commissionPro",      label:"Pro",      color:TIER_COLOR.Pro },
                    { key:"commissionElite",    label:"Élite",    color:TIER_COLOR.Élite },
                  ].map(({ key, label, color }) => (
                    <div key={key}>
                      <AdminUnderlineInput
                        label={`Parrainage ${label}`}
                        value={systemSettings[key as keyof typeof systemSettings]}
                        onChange={(e: any) => setSystemSettings(s => ({...s, [key]: e.target.value === "" ? "" : (parseInt(e.target.value) || 0)}))}
                        type="number"
                        required
                      />
                    </div>
                  ))}
                  <button onClick={() => saveSettings(systemSettings)} className="w-full h-11 bg-[#1A1A1A] text-white rounded-lg text-[13.5px] font-semibold transition-all hover:scale-[1.015] active:scale-[0.98] cursor-pointer">
                    Enregistrer le barème
                  </button>
                </div>

                <div className="pt-5 border-t border-[#E0DDD8] space-y-4">
                  <h3 className="font-serif text-[15px] font-bold text-[#1A1A1A]">Points par challenge</h3>
                  <AdminUnderlineInput
                    label="Nombre de points accordés par défaut"
                    value={systemSettings.pointsPerChallenge}
                    onChange={(e: any) => setSystemSettings(s => ({...s, pointsPerChallenge: e.target.value === "" ? "" : (parseInt(e.target.value) || 0)}))}
                    type="number"
                    required
                  />
                  <button onClick={() => saveSettings(systemSettings)} className="w-full h-11 bg-transparent border border-[#1A1A1A] text-[#1A1A1A] rounded-lg text-[13.5px] font-semibold transition-all hover:scale-[1.015] active:scale-[0.98] cursor-pointer">
                    Mettre à jour
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ══ ANALYTICS ════════════════════════════════════════════════ */}
        {tab === "analytics" && stats && (
          <div className="space-y-8">

            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-serif text-[22px] font-bold text-[#1A1A1A]">Analytics & Insights</h2>
                <p className="text-[13px] text-[#6B6B6B] font-sans mt-1">Vue complète de la santé de la communauté Propulsion.</p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-[#1D6B45]/10 px-3 py-1.5 text-[11px] font-bold text-[#1D6B45] font-sans">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1D6B45] animate-pulse inline-block"/>
                Données en direct
              </span>
            </div>

            {/* Row 1 — 4 KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "Publications / 7j",
                  value: analyticsPostsWeek.toString(),
                  sub: `${analyticsPostsMonth} ce mois`,
                  color: "#2E6FD4",
                  bg: "#EEF5FF",
                  icon: (
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  ),
                },
                {
                  label: "Taux d'activité",
                  value: stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}%` : "–",
                  sub: `${stats.active} actifs / ${stats.total}`,
                  color: "#1D6B45",
                  bg: "#E8F5EE",
                  icon: (
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="m22 12-4-4-6 8-4-4-4 4"/></svg>
                  ),
                },
                {
                  label: "Challenges validés",
                  value: analyticsChallTotal > 0 ? `${Math.round((analyticsChallDone / analyticsChallTotal) * 100)}%` : "–",
                  sub: `${analyticsChallDone} / ${analyticsChallTotal} soumissions`,
                  color: "#6C3FC5",
                  bg: "#F3EEFF",
                  icon: (
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 11 2 2 4-4"/></svg>
                  ),
                },
                {
                  label: "CA total validé",
                  value: fmtAmount(stats.revenue),
                  sub: `${payments.length} paiement${payments.length !== 1 ? "s" : ""} en attente`,
                  color: "#F0A500",
                  bg: "#FFFAEB",
                  icon: (
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5M12 9H5M12 17H5"/></svg>
                  ),
                },
              ].map((k, i) => (
                <div key={i} className="rounded-2xl border border-[#E0DDD8] bg-white p-5 space-y-3 shadow-none">
                  <div className="flex items-center justify-between">
                    <span style={{ color: k.color }}>{k.icon}</span>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold font-sans" style={{ background: k.bg, color: k.color }}>{k.sub}</span>
                  </div>
                  <p className="font-serif text-[28px] font-bold text-[#1A1A1A] leading-none">{k.value}</p>
                  <p className="text-[11px] font-sans font-bold uppercase tracking-[0.1em] text-[#6B6B6B]">{k.label}</p>
                </div>
              ))}
            </div>

            {/* Row 2 — Growth (12 months) + Revenue by tier */}
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              {/* 12-month growth chart */}
              <div className="rounded-2xl border border-[#E0DDD8] bg-white p-6 shadow-none">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-[14px] font-sans font-bold text-[#1A1A1A]">Croissance membres — 12 mois</h3>
                    <p className="text-[12px] text-[#6B6B6B] mt-0.5 font-sans">Inscriptions par mois</p>
                  </div>
                  <span className="rounded-full bg-[#EEF0FF] px-3 py-1 text-[12px] font-bold text-[#6C3FC5] font-sans">
                    {stats.total} total
                  </span>
                </div>
                <GrowthChart data={monthlyGrowth12}/>
              </div>

              {/* Revenue by tier */}
              <div className="rounded-2xl border border-[#E0DDD8] bg-white p-6 shadow-none space-y-5">
                <h3 className="text-[14px] font-sans font-bold text-[#1A1A1A]">Revenus par niveau</h3>
                {(["Standard","Pro","Élite"] as const).map(tier => {
                  const amt = analyticsRevByTier[tier] ?? 0;
                  const total_ = Object.values(analyticsRevByTier).reduce((a, b) => a + b, 0) || 1;
                  const pct = Math.round((amt / total_) * 100);
                  const colors = { Standard: "#2E6FD4", Pro: "#6C3FC5", Élite: "#C9A84C" };
                  const c = colors[tier];
                  return (
                    <div key={tier} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] font-bold text-[#1A1A1A] font-sans">{tier}</span>
                        <span className="text-[12px] text-[#6B6B6B] font-sans font-semibold">{fmtAmount(amt)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-full bg-[#E0DDD8]/50 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: c }}/>
                        </div>
                        <span className="text-[11px] font-sans text-[#6B6B6B] shrink-0 min-w-[30px] text-right">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
                <div className="pt-3 border-t border-[#E0DDD8]">
                  <div className="flex justify-between text-[13px] font-sans">
                    <span className="font-bold text-[#1A1A1A]">Total</span>
                    <span className="font-bold text-[#1A1A1A]">{fmtAmount(stats.revenue)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3 — Member status distribution + Content metrics */}
            <div className="grid gap-6 lg:grid-cols-2">

              {/* Status distribution */}
              <div className="rounded-2xl border border-[#E0DDD8] bg-white p-6 shadow-none space-y-4">
                <h3 className="text-[14px] font-sans font-bold text-[#1A1A1A]">Distribution des statuts</h3>
                {(["Actif","En attente de paiement","Paiement à valider","Suspendu","Expiré"] as const).map(status => {
                  const count = members.filter(m => m.status === status).length;
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  const c = STATUS_COLOR[status] ?? "#6B6B6B";
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: c }}/>
                          <span className="text-[12.5px] font-sans text-[#1A1A1A]">{status}</span>
                        </div>
                        <span className="text-[12px] font-bold font-sans" style={{ color: c }}>{count}</span>
                      </div>
                      <div className="h-1 w-full bg-[#E0DDD8]/40 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c }}/>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Platform content metrics */}
              <div className="rounded-2xl border border-[#E0DDD8] bg-white p-6 shadow-none">
                <h3 className="text-[14px] font-sans font-bold text-[#1A1A1A] mb-5">Métriques de contenu</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Masterclasses",    value: masterclasses.length,  color: "#6C3FC5", icon: "▶" },
                    { label: "Challenges actifs", value: challenges.filter(c => c.is_active).length, color: "#E8174B", icon: "⚡" },
                    { label: "Événements",       value: events.length,          color: "#2E6FD4", icon: "📅" },
                    { label: "Ressources",       value: resources.length,       color: "#1D6B45", icon: "📚" },
                    { label: "Publications",     value: posts.length,           color: "#F0A500", icon: "✍" },
                    { label: "Offres marché",    value: offers.length + contacts.length, color: "#C9A84C", icon: "🏪" },
                  ].map((m, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl bg-[#F4F3F0] p-3">
                      <span className="text-lg">{m.icon}</span>
                      <div>
                        <p className="font-serif text-[20px] font-bold text-[#1A1A1A] leading-none">{m.value}</p>
                        <p className="text-[11px] font-sans text-[#6B6B6B] mt-0.5">{m.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 4 — Top contributors */}
            <div className="rounded-2xl border border-[#E0DDD8] bg-white p-6 shadow-none">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-[14px] font-sans font-bold text-[#1A1A1A]">Top Contributeurs</h3>
                <span className="text-[12px] text-[#6B6B6B] font-sans">Classé par points de réputation</span>
              </div>
              {topContributors.length === 0 ? (
                <p className="text-[13px] text-[#6B6B6B] font-sans text-center py-6">Aucun contributeur encore classé.</p>
              ) : (
                <div className="space-y-2">
                  {topContributors.map((m, idx) => {
                    const tc = TIER_COLOR[m.role] ?? "#2E6FD4";
                    const pts = m.reputation_points ?? 0;
                    const maxPts = Math.max(1, topContributors[0]?.reputation_points ?? 1);
                    return (
                      <div key={m.id} className="flex items-center gap-4 py-2.5 px-3 rounded-xl hover:bg-[#F4F3F0] transition-colors">
                        {/* Rank */}
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold font-sans"
                          style={{
                            background: idx === 0 ? "#C9A84C20" : idx === 1 ? "#6B6B6B15" : "#E0DDD8",
                            color: idx === 0 ? "#C9A84C" : idx === 1 ? "#6B6B6B" : "#1A1A1A",
                          }}
                        >
                          {idx + 1}
                        </span>
                        {/* Avatar */}
                        {m.avatar_url
                          ? <img src={m.avatar_url} className="h-9 w-9 shrink-0 rounded-full object-cover" alt=""/>
                          : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white font-sans" style={{ background: tc }}>{initials(m)}</span>
                        }
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13.5px] font-semibold text-[#1A1A1A] font-sans">{m.first_name} {m.last_name}</span>
                            <span className="rounded-full px-1.5 py-0.5 text-[9.5px] font-bold font-sans" style={{ background: `${tc}15`, color: tc }}>{m.role}</span>
                            {(m.badges ?? []).map(b => <BadgePill key={b} badge={b} small/>)}
                          </div>
                          {/* Progress bar */}
                          <div className="mt-1.5 h-1 w-full max-w-xs bg-[#E0DDD8]/50 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-[#2E6FD4]" style={{ width: `${Math.round((pts / maxPts) * 100)}%` }}/>
                          </div>
                        </div>
                        {/* Points */}
                        <span className="shrink-0 text-[14px] font-bold font-sans text-[#2E6FD4]">{pts} pts</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Row 5 — Géo map */}
            <div className="rounded-2xl border border-[#E0DDD8] bg-white p-6 shadow-none">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-[14px] font-sans font-bold text-[#1A1A1A]">Répartition géographique</h3>
                  <p className="text-[12px] text-[#6B6B6B] mt-0.5 font-sans">Membres Propulsion par pays</p>
                </div>
                <span className="rounded-full bg-[#EEF5FF] px-3 py-1 text-[11px] font-bold text-[#2E6FD4] font-sans">
                  {Object.values(geoData).reduce((a, b) => a + b, 0)} localisés
                </span>
              </div>
              <GeoMap data={geoData}/>
              {/* Country breakdown list */}
              {Object.keys(geoData).length > 0 ? (
                <div className="mt-5 space-y-2.5 border-t border-[#E0DDD8] pt-5">
                  <p className="text-[11px] font-sans font-bold uppercase tracking-[0.1em] text-[#6B6B6B] mb-3">Par pays</p>
                  {Object.entries(geoData)
                    .sort(([, a], [, b]) => b - a)
                    .map(([iso, count]) => {
                      const name = COUNTRY_NAMES[iso] ?? `Pays ${iso}`;
                      const maxCount = Math.max(...Object.values(geoData));
                      const pct = Math.round((count / maxCount) * 100);
                      return (
                        <div key={iso} className="flex items-center gap-3">
                          <span className="text-[12.5px] font-sans font-semibold text-[#1A1A1A] w-40 shrink-0 truncate">{name}</span>
                          <div className="h-1.5 flex-1 bg-[#E0DDD8]/50 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-[#2E6FD4] transition-all" style={{ width: `${pct}%` }}/>
                          </div>
                          <span className="text-[12px] font-bold font-sans text-[#2E6FD4] w-6 text-right shrink-0">{count}</span>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-[12.5px] text-[#6B6B6B] font-sans text-center py-4 mt-4 border-t border-[#E0DDD8]">
                  Aucune donnée géographique — les membres doivent renseigner leur ville à l&apos;inscription.
                </p>
              )}
            </div>

            {/* Row 6 — Activité récente */}
            <div className="rounded-2xl border border-[#E0DDD8] bg-white shadow-none overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#E0DDD8]">
                <div>
                  <h3 className="text-[14px] font-sans font-bold text-[#1A1A1A]">Activité récente</h3>
                  <p className="text-[12px] text-[#6B6B6B] mt-0.5 font-sans">100 dernières actions membres</p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-[#2E6FD4]/10 px-3 py-1.5 text-[11px] font-bold text-[#2E6FD4] font-sans">
                  {activityLogs.length} entrées
                </span>
              </div>
              {activityLogs.length === 0 ? (
                <p className="text-[13px] text-[#6B6B6B] font-sans text-center py-10">Aucune activité enregistrée.</p>
              ) : (
                <div className="divide-y divide-[#E0DDD8]">
                  {activityLogs.map(log => {
                    const EVENT_META: Record<string, { label: string; color: string; icon: string }> = {
                      dashboard_viewed:    { label: "Connexion",            color: "#2E6FD4", icon: "◉" },
                      masterclass_viewed:  { label: "Masterclass vue",      color: "#6C3FC5", icon: "▶" },
                      resource_downloaded: { label: "Ressource téléch.",    color: "#1D6B45", icon: "↓" },
                      event_registered:    { label: "Inscription événement", color: "#F0A500", icon: "📅" },
                      challenge_submitted: { label: "Challenge soumis",     color: "#E8174B", icon: "⚡" },
                      post_created:        { label: "Publication",          color: "#0D9488", icon: "✍" },
                      offer_submitted:     { label: "Offre marché",         color: "#C9A84C", icon: "🏪" },
                      payment_submitted:   { label: "Paiement soumis",      color: "#1D6B45", icon: "💳" },
                    };
                    const meta = EVENT_META[log.event_type] ?? { label: log.event_type, color: "#6B6B6B", icon: "·" };
                    const memberName = log.member
                      ? `${log.member.first_name} ${log.member.last_name}`
                      : log.member_id.slice(0, 8) + "…";
                    const memberRole = log.member?.role ?? "Standard";
                    const tc = TIER_COLOR[memberRole] ?? "#6B6B6B";
                    const extraLabel = (() => {
                      const m = log.metadata as Record<string, unknown>;
                      if (log.event_type === "masterclass_viewed" && m.title) return String(m.title);
                      if (log.event_type === "resource_downloaded" && m.title) return String(m.title);
                      if (log.event_type === "offer_submitted" && m.title) return String(m.title);
                      if (log.event_type === "payment_submitted" && m.amount) return `${Number(m.amount).toLocaleString("fr-FR")} FCFA`;
                      return null;
                    })();
                    return (
                      <div key={log.id} className="flex items-center gap-4 px-6 py-3 hover:bg-[#F4F3F0] transition-colors">
                        <span className="text-[16px] shrink-0 w-6 text-center">{meta.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13px] font-semibold text-[#1A1A1A] font-sans">{memberName}</span>
                            <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold font-sans" style={{ background: `${tc}15`, color: tc }}>{memberRole}</span>
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold font-sans" style={{ background: `${meta.color}12`, color: meta.color }}>{meta.label}</span>
                            {extraLabel && <span className="text-[11px] text-[#6B6B6B] font-sans truncate max-w-[200px]">{extraLabel}</span>}
                          </div>
                        </div>
                        <span className="shrink-0 text-[11px] text-[#6B6B6B] font-sans">{relativeTime(log.created_at)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── Onglet Équipe Propulsion ─────────────────────────────────── */}
        {tab === "equipe" && (
          <div className="space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h2 className="font-serif text-[22px] font-bold text-[#1A1A1A]">Équipe Propulsion</h2>
                <p className="text-[13px] text-[#6B6B6B] font-sans mt-1">
                  Vendeurs actifs · Suivi des conversions et commissions
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[#1D6B45]/10 px-4 py-1.5 text-[12px] font-bold text-[#1D6B45] font-sans">
                  {teamMembers.length} vendeur{teamMembers.length !== 1 ? "s" : ""}
                </div>
                <div className="rounded-full bg-[#F0A500]/10 px-4 py-1.5 text-[12px] font-bold text-[#F0A500] font-sans">
                  {fmtAmount(teamMembers.reduce((s, t) => s + Number(t.pending_payment), 0))} à payer
                </div>
              </div>
            </div>

            {/* KPIs équipe */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Conversions totales", value: teamMembers.reduce((s,t)=>s+Number(t.conversions),0).toString(), color: "#2E6FD4", bg: "#EEF5FF" },
                { label: "CA généré",           value: fmtAmount(teamMembers.reduce((s,t)=>s+Number(t.total_commission),0)), color: "#1D6B45", bg: "#E8F5EE" },
                { label: "Commissions dues",    value: fmtAmount(teamMembers.reduce((s,t)=>s+Number(t.pending_payment),0)), color: "#F0A500", bg: "#FFFAEB" },
                { label: "Commissions payées",  value: fmtAmount(teamMembers.reduce((s,t)=>s+Number(t.paid_commission),0)), color: "#6C3FC5", bg: "#F3EEFF" },
              ].map((k, i) => (
                <div key={i} className="rounded-2xl border border-[#E0DDD8] bg-white p-5 shadow-none space-y-3">
                  <p className="text-[11px] font-sans font-bold uppercase tracking-[0.1em] text-[#6B6B6B]">{k.label}</p>
                  <p className="font-serif text-[26px] font-bold leading-none" style={{ color: k.color }}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* Ajouter un vendeur */}
            <div className="rounded-2xl border border-[#E0DDD8] bg-white p-6 shadow-none">
              <h3 className="text-[14px] font-sans font-bold text-[#1A1A1A] mb-4">Ajouter un vendeur</h3>
              <div className="relative max-w-sm">
                <input
                  value={addVendeurSearch}
                  onChange={e => searchAddVendeur(e.target.value)}
                  placeholder="Rechercher un membre par prénom…"
                  className="w-full border-b border-[#E0DDD8] focus:border-[#2E6FD4] bg-transparent outline-none text-[14px] font-sans pb-2 pr-8"
                />
                {addVendeurResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-[#E0DDD8] bg-white shadow-lg z-10 overflow-hidden">
                    {addVendeurResults.map(m => (
                      <button key={m.id} onClick={() => assignVendeur(m)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F4F3F0] transition-colors text-left cursor-pointer">
                        {m.avatar_url
                          ? <img src={m.avatar_url} className="h-8 w-8 rounded-full object-cover shrink-0" alt="" />
                          : <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white bg-[#2E6FD4]">{initials(m)}</span>}
                        <div>
                          <p className="text-[13px] font-semibold font-sans text-[#1A1A1A]">{m.first_name} {m.last_name}</p>
                          <p className="text-[11px] text-[#6B6B6B] font-sans">{m.role}</p>
                        </div>
                        <span className="ml-auto text-[11px] font-bold text-[#1D6B45]">+ Ajouter</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Liste vendeurs */}
            {teamMembers.length === 0 ? (
              <AdminEmptyState
                title="Aucun vendeur pour l'instant"
                subtitle="Ajoutez des membres à l'équipe Propulsion pour suivre leurs conversions et commissions."
              />
            ) : (
              <div className="space-y-3">
                {/* Barre recherche */}
                <div className="relative max-w-xs">
                  <input value={vendeurSearch} onChange={e => setVendeurSearch(e.target.value)}
                    placeholder="Filtrer par nom…"
                    className="w-full border-b border-[#E0DDD8] bg-transparent outline-none text-[13px] font-sans pb-1.5" />
                </div>

                {teamMembers
                  .filter(t => !vendeurSearch || `${t.first_name} ${t.last_name}`.toLowerCase().includes(vendeurSearch.toLowerCase()))
                  .map(tm => {
                    const tc = "#E8174B";
                    const link = `${typeof window !== "undefined" ? window.location.origin : "https://propulsion.com"}/rejoindre?ref=${tm.referral_code}`;
                    const isExpanded = expandedVendeur === tm.member_id;
                    const refs = teamReferrals[tm.member_id] ?? [];
                    return (
                      <div key={tm.member_id} className="rounded-2xl border border-[#E0DDD8] bg-white shadow-none overflow-hidden">
                        {/* Row principale */}
                        <div className="flex items-center gap-4 px-6 py-4 flex-wrap">
                          {/* Avatar */}
                          {tm.avatar_url
                            ? <img src={tm.avatar_url} className="h-10 w-10 rounded-full object-cover shrink-0" alt="" />
                            : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white font-sans" style={{ background: tc }}>
                                {(tm.first_name[0] + tm.last_name[0]).toUpperCase()}
                              </span>}
                          {/* Nom + lien */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-bold text-[#1A1A1A] font-sans">{tm.first_name} {tm.last_name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-[#6B6B6B] font-sans truncate max-w-[220px]">{link}</span>
                              <button onClick={() => { navigator.clipboard?.writeText(link); notify("Lien copié !"); }}
                                className="shrink-0 text-[10px] font-bold text-[#2E6FD4] hover:underline cursor-pointer">
                                Copier
                              </button>
                            </div>
                          </div>
                          {/* Stats */}
                          <div className="flex items-center gap-6 text-center shrink-0">
                            <div>
                              <p className="font-serif text-[22px] font-bold text-[#1A1A1A]">{tm.conversions}</p>
                              <p className="text-[10px] font-sans text-[#6B6B6B] uppercase tracking-wide">Convs.</p>
                            </div>
                            <div>
                              <p className="font-serif text-[18px] font-bold text-[#1D6B45]">{fmtAmount(Number(tm.total_commission))}</p>
                              <p className="text-[10px] font-sans text-[#6B6B6B] uppercase tracking-wide">Total</p>
                            </div>
                            <div>
                              <p className="font-serif text-[18px] font-bold text-[#F0A500]">{fmtAmount(Number(tm.pending_payment))}</p>
                              <p className="text-[10px] font-sans text-[#6B6B6B] uppercase tracking-wide">À payer</p>
                            </div>
                          </div>
                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            {Number(tm.pending_payment) > 0 && (
                              <button onClick={() => markVendeurPaid(tm)}
                                className="h-8 px-3 bg-[#1D6B45] text-white rounded-lg text-[12px] font-semibold hover:opacity-90 transition-all cursor-pointer">
                                Payé ✓
                              </button>
                            )}
                            <button onClick={() => loadVendeurReferrals(tm.member_id)}
                              className="h-8 px-3 bg-[#F4F3F0] text-[#1A1A1A] rounded-lg text-[12px] font-semibold hover:bg-[#E0DDD8] transition-all cursor-pointer">
                              {isExpanded ? "Masquer" : "Détails"}
                            </button>
                            <button onClick={() => setConfirmDialog({ title: "Retirer de l'équipe", message: `${tm.first_name} redeviendra membre Standard. Ses commissions validées sont conservées.`, confirmText: "Retirer", cancelText: "Annuler", isDanger: true, onConfirm: () => removeVendeur(tm) })}
                              className="h-8 px-3 bg-[#F4F3F0] text-[#E8174B] rounded-lg text-[12px] font-semibold hover:bg-[#FFF0F3] transition-all cursor-pointer">
                              Retirer
                            </button>
                          </div>
                        </div>

                        {/* Détails referrals */}
                        {isExpanded && (
                          <div className="border-t border-[#E0DDD8]">
                            {refs.length === 0 ? (
                              <p className="px-6 py-4 text-[13px] text-[#6B6B6B] font-sans">Aucune conversion enregistrée.</p>
                            ) : (
                              <table className="w-full text-[12px] font-sans">
                                <thead>
                                  <tr className="bg-[#F4F3F0]">
                                    {["Membre", "Niveau", "Commission", "Statut", "Payé le", "Date"].map(h => (
                                      <th key={h} className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E0DDD8]">
                                  {refs.map(r => (
                                    <tr key={r.referral_id} className="hover:bg-[#F4F3F0] transition-colors">
                                      <td className="px-4 py-2.5 font-semibold text-[#1A1A1A]">{r.referred_name}</td>
                                      <td className="px-4 py-2.5">
                                        <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: `${TIER_COLOR[r.tier] ?? "#6B6B6B"}15`, color: TIER_COLOR[r.tier] ?? "#6B6B6B" }}>{r.tier}</span>
                                      </td>
                                      <td className="px-4 py-2.5 font-bold text-[#1D6B45]">{fmtAmount(Number(r.commission))}</td>
                                      <td className="px-4 py-2.5">
                                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${r.status === "Validé" ? "bg-[#1D6B45]/10 text-[#1D6B45]" : "bg-[#F0A500]/10 text-[#F0A500]"}`}>{r.status}</span>
                                      </td>
                                      <td className="px-4 py-2.5 text-[#6B6B6B]">{r.paid_at ? new Date(r.paid_at).toLocaleDateString("fr-FR") : "—"}</td>
                                      <td className="px-4 py-2.5 text-[#6B6B6B]">{new Date(r.created_at).toLocaleDateString("fr-FR")}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Custom Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-md scale-100 transform overflow-hidden rounded-2xl border border-[#E0DDD8] bg-white p-6 shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                confirmDialog.isDanger ? 'bg-[#ff1e58]/10 text-[#ff1e58]' : 'bg-[#ffac42]/10 text-[#ffac42]'
              }`}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">{confirmDialog.title}</h3>
                <p className="mt-1 text-[13.5px] leading-relaxed text-[#6B6B6B]">{confirmDialog.message}</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="rounded-full border border-[#E0DDD8] bg-white px-5 py-2 text-[13px] font-bold text-[#6B6B6B] transition-all hover:bg-[#F4F3F0] hover:text-[#1A1A1A] active:scale-95 cursor-pointer"
              >
                {confirmDialog.cancelText || "Annuler"}
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className={`rounded-full px-5 py-2 text-[13px] font-bold text-white transition-all active:scale-95 cursor-pointer ${
                  confirmDialog.isDanger ? 'bg-[#ff1e58] hover:bg-[#ff1e58]/90' : 'bg-[#2E6FD4] hover:bg-[#2E6FD4]/90'
                }`}
              >
                {confirmDialog.confirmText || "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
