"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/client";
import { MemberLayout } from "@/components/member-layout";
import { AiAgent } from "@/components/ai-agent";
import { PlayCircle, Check, Star, ArrowRight } from "@/components/icons";

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

const TIER_ORDER: Record<string,number>  = { Standard:0, Pro:1, Élite:2 };
const TIER_COLOR: Record<string,string>  = { Standard:"#766391", Pro:"#3871c2", Élite:"#ffac42" };
const CAT_COLOR:  Record<string,string>  = {
  Vente:"#ff1e58", Négociation:"#3871c2", Stratégie:"#766391",
  Leadership:"#ffac42", Investissement:"#22c55e", Croissance:"#ff6b35",
};

function fmt(min: number) {
  return min < 60 ? `${min} min` : `${Math.floor(min/60)}h${min%60 ? ` ${min%60} min` : ""}`;
}

function BrandBar() {
  return (
    <div className="flex h-[3px] w-full overflow-hidden rounded-full">
      {["#3871c2","#ffac42","#766391","#ff1e58","#22c55e"].map(c => (
        <span key={c} className="flex-1" style={{ background: c }}/>
      ))}
    </div>
  );
}

export default function MasterclassesPage() {
  const [role, setRole]       = useState("Standard");
  const [userId, setUserId]   = useState<string|null>(null);
  const [classes, setClasses] = useState<Masterclass[]>([]);
  const [loading, setLoading] = useState(true);
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
      const countMap: Record<string, number> = {};
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
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

          {/* Brand bar */}
          <BrandBar />

          {/* Header */}
          <div className="mt-7 mb-7">
            <h1 className="font-serif text-3xl font-bold text-ink">Masterclasses Premium</h1>
            <p className="mt-1 text-[13.5px] text-muted">Formations exclusives d&apos;implémentation des affaires animées par Dr Claudel Noubissie.</p>

            {userId && classes.length > 0 && (
              <div className="mt-5 rounded-2xl border border-[#E0DDD8] bg-white p-5 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12.5px] font-bold text-ink">Ma progression générale</span>
                    <span className="text-[12.5px] font-bold text-brand">{completed}/{classes.length} complétées</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#F4F3F0] overflow-hidden">
                    <div className="h-full rounded-full bg-brand transition-all"
                      style={{ width: `${Math.round(completed / classes.length * 100)}%` }}/>
                  </div>
                </div>
                {completed === classes.length && completed > 0 && (
                  <span className="shrink-0 rounded-full bg-[#22c55e]/10 px-3.5 py-1.5 text-[11px] font-bold text-[#22c55e]">
                    Parcours complété !
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Category filters */}
          <div className="mb-6 flex gap-2 overflow-x-auto pb-1.5 [&::-webkit-scrollbar]:hidden">
            {CAT_FILTERS.map(cat => (
              <button key={cat} onClick={() => setCatFilter(cat)}
                className={`shrink-0 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors ${
                  catFilter === cat ? "bg-brand text-white" : "border border-[#E0DDD8] bg-white text-muted hover:text-ink"
                }`}>
                {cat}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-16">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"/>
            </div>
          )}

          {/* Grid */}
          {!loading && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(mc => {
                const locked          = (TIER_ORDER[role] ?? 0) < (TIER_ORDER[mc.tier_required] ?? 0);
                const done            = mc.progress?.completed ?? false;
                const started         = (mc.progress?.seconds_watched ?? 0) > 0;
                const catColor        = CAT_COLOR[mc.category]  ?? "#3871c2";
                const tierColor       = TIER_COLOR[mc.tier_required] ?? "#3871c2";
                const modCount        = mc.module_count ?? 0;
                const progressPercent = Math.min(100, Math.round(((mc.progress?.seconds_watched ?? 0) / (mc.duration_min * 60)) * 100));

                return (
                  <article key={mc.id}
                    className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white transition-all ${
                      locked
                        ? "border-[#E0DDD8] opacity-65 cursor-not-allowed"
                        : "border-[#E0DDD8] hover:border-brand/20 hover:shadow-[0_4px_24px_rgba(0,0,0,0.07)]"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative h-44 flex items-center justify-center overflow-hidden bg-neutral-950 border-b border-[#E0DDD8]">
                      {!locked && (mc.thumbnail_url || (mc.youtube_id && !mc.youtube_id.startsWith("vimeo:"))) ? (
                        <>
                          <img src={mc.thumbnail_url || `https://img.youtube.com/vi/${mc.youtube_id}/mqdefault.jpg`} alt=""
                            className="absolute inset-0 h-full w-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500"/>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"/>
                        </>
                      ) : (
                        <div className="absolute inset-0 opacity-40"
                          style={{ background: `radial-gradient(circle at 50% 50%, ${catColor}66 0%, #0b0e1a 100%)` }}/>
                      )}

                      {locked ? (
                        <div className="relative z-10 flex flex-col items-center gap-2 text-white/60">
                          <Star width={24} height={24} className="fill-current"/>
                          <span className="text-[10px] font-bold uppercase tracking-wider">Abonnement {mc.tier_required} requis</span>
                        </div>
                      ) : (
                        <span className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-transform group-hover:scale-110 group-hover:bg-brand ${done ? "ring-2 ring-[#22c55e]" : ""}`}>
                          <PlayCircle width={32} height={32}/>
                        </span>
                      )}

                      <div className="absolute top-3 left-3 flex gap-1.5 z-10">
                        <span className="rounded-full px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider" style={{ background: catColor }}>
                          {mc.category}
                        </span>
                        {mc.tier_required !== "Standard" && (
                          <span className="rounded-full px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider" style={{ background: tierColor }}>
                            {mc.tier_required}
                          </span>
                        )}
                      </div>

                      {modCount > 0 && (
                        <span className="absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-0.5 text-[9px] font-bold text-white z-10">
                          {modCount} module{modCount > 1 ? "s" : ""}
                        </span>
                      )}

                      {done && (
                        <span className="absolute bottom-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#22c55e] z-10">
                          <Check width={12} height={12} className="text-white"/>
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="text-[14px] font-bold text-ink leading-snug group-hover:text-brand transition-colors">{mc.title}</h3>
                      <p className="mt-2 flex-1 text-[12px] text-muted leading-relaxed line-clamp-2">{mc.description}</p>

                      {started && !done && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-[10px] text-muted mb-1 font-semibold">
                            <span>Progression</span>
                            <span>{progressPercent}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-[#F4F3F0] overflow-hidden">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${progressPercent}%` }}/>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between border-t border-[#E0DDD8] pt-3">
                        <div className="flex items-center gap-2 text-[11px] text-faint font-semibold">
                          <span>{fmt(mc.duration_min)}</span>
                          {modCount > 0 && <><span>·</span><span>{modCount} module{modCount > 1 ? "s" : ""}</span></>}
                        </div>

                        {locked ? (
                          <span className="text-[11px] font-bold text-faint">Verrouillé</span>
                        ) : (
                          <Link href={`/masterclasses/${mc.id}`}
                            className="flex items-center gap-1 text-[11px] font-bold text-brand hover:gap-1.5 transition-all">
                            {done ? "Revoir" : started ? "Continuer" : "Commencer"}
                            <ArrowRight width={12} height={12}/>
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}

              {filtered.length === 0 && (
                <div className="col-span-full py-16 text-center">
                  <p className="text-[13px] text-muted">Aucune masterclass dans cette catégorie.</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
      <AiAgent/>
    </MemberLayout>
  );
}
