"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/client";
import { MemberLayout } from "@/components/member-layout";
import { AiAgent } from "@/components/ai-agent";
import { PlayCircle, Check, Star, ArrowRight } from "@/components/icons";

/* ── Types ──────────────────────────────────────────────── */

type Masterclass = {
  id: string; title: string; description: string;
  category: string; tier_required: string; duration_min: number;
  instructor: string; order_index: number;
  youtube_id: string | null;
  module_count?: number;
  progress?: { seconds_watched: number; completed: boolean };
  course_type?: string;
  thumbnail_url?: string | null;
};

const CAT_FILTERS = ["Toutes","Vente","Négociation","Stratégie","Leadership","Investissement","Croissance"] as const;
type CatFilter = (typeof CAT_FILTERS)[number];

const TIER_ORDER: Record<string,number> = { Standard:0, Pro:1, Élite:2 };
const TIER_COLOR: Record<string,string> = { Standard:"#6C3FC5", Pro:"#2E6FD4", Élite:"#C9A84C" };
const CAT_COLOR:  Record<string,string> = {
  Vente:"#E8385A", Négociation:"#2E6FD4", Stratégie:"#6C3FC5",
  Leadership:"#C9A84C", Investissement:"#16a34a", Croissance:"#D4561A",
};

const SP = "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]";

function fmt(min: number) {
  if (!min) return "—";
  return min < 60 ? `${min} min` : `${Math.floor(min/60)}h${min%60 ? ` ${min%60}` : ""}`;
}

/* ── Reveal ─────────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`${SP} ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ── Category pill ──────────────────────────────────────── */
function CatPill({ cat, active, onClick }: { cat: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`shrink-0 relative px-4 py-2 rounded-full text-[12.5px] font-semibold ${SP} ${
        active
          ? "bg-[#15130E] text-[#F4F3F0]"
          : "bg-white/60 text-[#6B6560] border border-[#E0DDD8] hover:border-[#C8C5BF] hover:text-[#15130E]"
      }`}>
      {cat}
    </button>
  );
}

/* ── Masterclass Card ────────────────────────────────────── */
function McCard({ mc, role, idx }: { mc: Masterclass; role: string; idx: number }) {
  const locked = (TIER_ORDER[role] ?? 0) < (TIER_ORDER[mc.tier_required] ?? 0);
  const done   = mc.progress?.completed ?? false;
  const started = (mc.progress?.seconds_watched ?? 0) > 0;
  const catColor   = CAT_COLOR[mc.category] ?? "#2E6FD4";
  const tierColor  = TIER_COLOR[mc.tier_required] ?? "#2E6FD4";
  const modCount   = mc.module_count ?? 0;
  const progressPct = Math.min(100, Math.round(((mc.progress?.seconds_watched ?? 0) / ((mc.duration_min || 1) * 60)) * 100));

  const thumb = mc.thumbnail_url || (mc.youtube_id && !mc.youtube_id.startsWith("vimeo:")
    ? `https://img.youtube.com/vi/${mc.youtube_id}/mqdefault.jpg`
    : null);

  return (
    <Reveal delay={idx * 60}
      className={`group flex flex-col overflow-hidden rounded-[1.75rem] bg-white border border-[#E8E6E1] ${SP} ${
        locked ? "opacity-60 cursor-not-allowed" : "hover:shadow-[0_12px_40px_rgba(21,19,14,0.10)] hover:-translate-y-0.5"
      }`}>

      {/* Thumbnail shell */}
      <div className="relative p-1.5">
        <div className={`relative h-44 overflow-hidden rounded-[calc(1.75rem-0.375rem)] bg-[#0C0B09] flex items-center justify-center`}>
          {thumb && !locked ? (
            <>
              <img src={thumb} alt="" className={`absolute inset-0 h-full w-full object-cover ${SP} group-hover:scale-105`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"/>
            </>
          ) : (
            <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 40%, ${catColor}44 0%, #0C0B09 70%)` }}/>
          )}

          {/* Lock / Play */}
          {locked ? (
            <div className="relative z-10 flex flex-col items-center gap-2">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm text-white/50">
                <Star width={20} height={20} />
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">
                {mc.tier_required}
              </span>
            </div>
          ) : (
            <span className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm ${SP} group-hover:scale-110 group-hover:bg-white group-hover:text-[#15130E]`}>
              {done
                ? <Check width={22} height={22} />
                : <PlayCircle width={26} height={26} />
              }
            </span>
          )}

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex gap-1.5 z-10">
            <span className="rounded-full px-2.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider"
              style={{ background: catColor }}>
              {mc.category}
            </span>
            {mc.tier_required !== "Standard" && mc.tier_required !== "Tous" && (
              <span className="rounded-full px-2.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider"
                style={{ background: tierColor }}>
                {mc.tier_required}
              </span>
            )}
          </div>

          {modCount > 0 && (
            <span className="absolute top-3 right-3 z-10 rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-0.5 text-[9px] font-bold text-white">
              {modCount} mod.
            </span>
          )}

          {done && (
            <span className="absolute bottom-3 right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#16a34a]">
              <Check width={11} height={11} className="text-white"/>
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-1">
        <h3 className={`text-[13.5px] font-bold leading-snug text-[#15130E] ${SP} group-hover:text-[#2E6FD4]`} style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}>
          {mc.title}
        </h3>
        <p className="mt-1.5 flex-1 text-[11.5px] text-[#8A857E] leading-relaxed line-clamp-2">{mc.description}</p>

        {/* Progress bar */}
        {started && !done && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#A09B94]">Progression</span>
              <span className="text-[9.5px] font-bold text-[#2E6FD4]">{progressPct}%</span>
            </div>
            <div className="h-[3px] w-full rounded-full bg-[#F0EDE8] overflow-hidden">
              <div className={`h-full rounded-full bg-[#2E6FD4] ${SP}`} style={{ width: `${progressPct}%` }}/>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between pt-3 border-t border-[#F0EDE8]">
          <div className="flex items-center gap-2 text-[10.5px] font-semibold text-[#A09B94]">
            <span>{fmt(mc.duration_min)}</span>
            {modCount > 0 && <><span>·</span><span>{modCount} module{modCount > 1 ? "s" : ""}</span></>}
          </div>

          {locked ? (
            <span className="text-[10.5px] font-bold text-[#C8C5BF]">Verrouillé</span>
          ) : (
            <Link href={`/masterclasses/${mc.id}`}
              className={`group/btn flex items-center gap-1.5 rounded-full bg-[#F0EDE8] px-3 py-1.5 text-[11px] font-bold text-[#15130E] ${SP} hover:bg-[#15130E] hover:text-white`}>
              {done ? "Revoir" : started ? "Continuer" : "Commencer"}
              <span className={`flex h-4 w-4 items-center justify-center rounded-full bg-black/5 ${SP} group-hover/btn:bg-white/20`}>
                <ArrowRight width={9} height={9} />
              </span>
            </Link>
          )}
        </div>
      </div>
    </Reveal>
  );
}

/* ── Page ────────────────────────────────────────────────── */
export default function MasterclassesPage() {
  const [role, setRole]         = useState("Standard");
  const [userId, setUserId]     = useState<string|null>(null);
  const [classes, setClasses]   = useState<Masterclass[]>([]);
  const [loading, setLoading]   = useState(true);
  const [catFilter, setCatFilter] = useState<CatFilter>("Toutes");

  useEffect(() => {
    const { data:{ subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== "INITIAL_SESSION") return;
      let uid: string|null = null;
      if (session?.user) {
        uid = session.user.id;
        setUserId(uid);
        const { data: m } = await supabase.from("members").select("role").eq("id", uid).single();
        if (m) setRole(m.role);
      }

      const { data: mcs } = await supabase
        .from("masterclasses")
        .select("id,title,description,category,tier_required,duration_min,instructor,order_index,youtube_id,course_type,thumbnail_url")
        .eq("is_published", true)
        .order("order_index");

      if (!mcs) { setLoading(false); return; }

      const { data: modCounts } = await supabase
        .from("masterclass_modules").select("masterclass_id").eq("is_published", true);
      const countMap: Record<string,number> = {};
      (modCounts ?? []).forEach(m => { countMap[m.masterclass_id] = (countMap[m.masterclass_id] ?? 0) + 1; });

      if (uid) {
        const { data: prog } = await supabase
          .from("content_progress").select("masterclass_id,seconds_watched,completed").eq("member_id", uid);
        const map = Object.fromEntries((prog ?? []).map(p => [p.masterclass_id, p]));
        setClasses(mcs.map(mc => ({ ...mc, module_count: countMap[mc.id] ?? 0, progress: map[mc.id] })));
      } else {
        setClasses(mcs.map(mc => ({ ...mc, module_count: countMap[mc.id] ?? 0 })));
      }
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const filtered  = catFilter === "Toutes" ? classes : classes.filter(c => c.category === catFilter);
  const completed = classes.filter(c => c.progress?.completed).length;

  return (
    <MemberLayout role={role}>
      <div className="min-h-full bg-[#F4F3F0]">

        {/* Grain overlay */}
        <div className="pointer-events-none fixed inset-0 z-[5] opacity-[0.025]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")` }}/>

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

          {/* ── Brand bar ── */}
          <div className="flex h-[3px] w-full overflow-hidden rounded-full mb-8">
            {["#2E6FD4","#C9A84C","#6C3FC5","#E8385A","#16a34a"].map(c => (
              <span key={c} className="flex-1" style={{ background: c }}/>
            ))}
          </div>

          {/* ── Header ── */}
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E0DDD8] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8A857E]">
              Bibliothèque
            </span>
            <h1 className="mt-3 font-serif text-[2rem] sm:text-[2.5rem] font-bold text-[#15130E] leading-tight">
              Masterclasses
            </h1>
            <p className="mt-1.5 text-[13.5px] text-[#8A857E] max-w-lg">
              Formations exclusives d&apos;implémentation des affaires, animées par Dr Claudel Noubissie.
            </p>
          </Reveal>

          {/* ── Progression globale ── */}
          {userId && classes.length > 0 && (
            <Reveal delay={80} className="mt-6">
              <div className="rounded-[1.5rem] border border-[#E8E6E1] bg-white p-1.5">
                <div className="rounded-[calc(1.5rem-0.375rem)] bg-[#F9F8F6] px-5 py-4 flex items-center gap-5">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[12px] font-bold uppercase tracking-wider text-[#8A857E]">Ma progression</span>
                      <span className="text-[12px] font-bold text-[#2E6FD4]">
                        {completed}<span className="text-[#A09B94]">/{classes.length}</span> complétées
                      </span>
                    </div>
                    <div className="h-[5px] w-full rounded-full bg-[#E8E6E1] overflow-hidden">
                      <div className={`h-full rounded-full bg-[#2E6FD4] ${SP}`}
                        style={{ width: `${classes.length > 0 ? Math.round(completed / classes.length * 100) : 0}%` }}/>
                    </div>
                  </div>
                  {completed === classes.length && completed > 0 && (
                    <span className="shrink-0 flex items-center gap-1.5 rounded-full bg-[#16a34a]/10 border border-[#16a34a]/20 px-3.5 py-1.5 text-[11px] font-bold text-[#16a34a]">
                      <Check width={12} height={12}/> Tout complété
                    </span>
                  )}
                </div>
              </div>
            </Reveal>
          )}

          {/* ── Category filters ── */}
          <Reveal delay={120} className="mt-6 mb-7">
            <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
              {CAT_FILTERS.map(cat => (
                <CatPill key={cat} cat={cat} active={catFilter === cat} onClick={() => setCatFilter(cat)}/>
              ))}
            </div>
          </Reveal>

          {/* ── Loading ── */}
          {loading && (
            <div className="flex justify-center py-20">
              <span className={`h-8 w-8 animate-spin rounded-full border-[3px] border-[#2E6FD4] border-t-transparent`}/>
            </div>
          )}

          {/* ── Grid ── */}
          {!loading && (
            <>
              {filtered.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-[13px] text-[#8A857E]">Aucune masterclass dans cette catégorie.</p>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((mc, idx) => (
                    <McCard key={mc.id} mc={mc} role={role} idx={idx}/>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </div>
      <AiAgent/>
    </MemberLayout>
  );
}
