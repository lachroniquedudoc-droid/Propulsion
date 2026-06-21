"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/client";
import { Check, ArrowRight, PlayCircle } from "@/components/icons";
import { logActivity } from "@/utils/activity";

/* ── Types ──────────────────────────────────────────────── */

type Course = {
  id: string; title: string; description: string;
  category: string; tier_required: string; duration_min: number;
  instructor: string; is_published: boolean;
};

type Module = {
  id: string; title: string; description: string | null;
  youtube_id: string; duration_min: number; order_index: number;
};

type ModuleProgress = { completed: boolean; seconds_watched: number };

/* ── Helpers ─────────────────────────────────────────────── */

const CAT_COLOR: Record<string,string> = {
  Vente:"#E8385A", Négociation:"#2E6FD4", Stratégie:"#6C3FC5",
  Leadership:"#C9A84C", Investissement:"#16a34a", Croissance:"#D4561A",
};
const SP = "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]";

function fmt(min: number) {
  if (!min) return "—";
  return min < 60 ? `${min} min` : `${Math.floor(min/60)}h${min%60 ? ` ${min%60} min` : ""}`;
}

function getVideoPlayerUrl(videoId: string, autoplay: boolean) {
  if (!videoId) return { src: "", isVimeo: false };
  if (videoId.startsWith("vimeo:")) {
    const parts = videoId.split(":");
    const id = parts[1];
    const hash = parts[2];
    let src = `https://player.vimeo.com/video/${id}?`;
    if (hash) src += `h=${hash}&`;
    src += `autoplay=${autoplay ? "1" : "0"}&color=ffffff&title=0&byline=0&portrait=0`;
    return { src, isVimeo: true };
  }
  const src = `https://www.youtube.com/embed/${videoId}?${autoplay ? "autoplay=1&" : ""}rel=0&modestbranding=1&color=white`;
  return { src, isVimeo: false };
}

/* ── Page ────────────────────────────────────────────────── */

export default function CoursePlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [userId, setUserId]         = useState<string|null>(null);
  const [course, setCourse]         = useState<Course|null>(null);
  const [modules, setModules]       = useState<Module[]>([]);
  const [progress, setProgress]     = useState<Record<string,ModuleProgress>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [autoplay, setAutoplay]     = useState(false);
  const [toast, setToast]           = useState<string|null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasWatched, setHasWatched]   = useState(false);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const loadData = useCallback(async (uid: string|null) => {
    const { data: c } = await supabase
      .from("masterclasses").select("*").eq("id", id).single();
    if (!c) { setLoading(false); return; }
    setCourse(c as Course);

    const { data: mods } = await supabase
      .from("masterclass_modules")
      .select("id,title,description,youtube_id,duration_min,order_index")
      .eq("masterclass_id", id)
      .eq("is_published", true)
      .order("order_index");

    const modList = (mods ?? []) as Module[];
    setModules(modList);

    if (uid && modList.length > 0) {
      const { data: prog } = await supabase
        .from("module_progress")
        .select("module_id,completed,seconds_watched")
        .eq("member_id", uid)
        .in("module_id", modList.map(m => m.id));

      const map: Record<string,ModuleProgress> = {};
      (prog ?? []).forEach(p => { map[p.module_id] = { completed: p.completed, seconds_watched: p.seconds_watched }; });
      setProgress(map);

      const firstIncomplete = modList.findIndex(m => !map[m.id]?.completed);
      setCurrentIdx(firstIncomplete >= 0 ? firstIncomplete : 0);
    }

    if (uid) {
      try {
        await supabase.from("content_progress").upsert(
          { member_id: uid, masterclass_id: id, seconds_watched: 1 },
          { onConflict: "member_id,masterclass_id" }
        );
        logActivity(uid, "masterclass_viewed", { masterclass_id: id, title: c.title });
      } catch { /* ignore */ }
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    const { data:{ subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== "INITIAL_SESSION") return;
      let uid: string|null = null;
      if (session?.user) {
        uid = session.user.id;
        setUserId(uid);
      }
      await loadData(uid);
    });
    return () => subscription.unsubscribe();
  }, [loadData]);

  async function handleMarkComplete(moduleId: string) {
    if (!userId) return;
    const mod = modules.find(m => m.id === moduleId);
    if (!mod) return;

    const newProg: ModuleProgress = { completed: true, seconds_watched: mod.duration_min * 60 };
    setProgress(prev => ({ ...prev, [moduleId]: newProg }));

    try {
      await supabase.from("module_progress").upsert(
        { member_id: userId, module_id: moduleId, completed: true, seconds_watched: mod.duration_min * 60, updated_at: new Date().toISOString() },
        { onConflict: "member_id,module_id" }
      );
      await supabase.rpc("refresh_course_progress", { p_member_id: userId, p_masterclass_id: id });
    } catch { /* ignore */ }

    notify("Module terminé");

    if (currentIdx < modules.length - 1) {
      setTimeout(() => { setCurrentIdx(i => i + 1); setAutoplay(true); }, 800);
    }
  }

  function selectModule(idx: number) {
    if (idx === currentIdx) return;
    setCurrentIdx(idx);
    setAutoplay(true);
    setSidebarOpen(false);
    setHasWatched(false);
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#0C0B09] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#2E6FD4] border-t-transparent"/>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-white/25">Chargement</span>
        </div>
      </div>
    );
  }

  /* ── 404 ── */
  if (!course) {
    return (
      <div className="min-h-[100dvh] bg-[#0C0B09] flex flex-col items-center justify-center gap-5 p-6 text-center">
        <p className="text-[15px] font-bold text-white">Parcours introuvable.</p>
        <Link href="/masterclasses"
          className={`flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-[12px] font-semibold text-white/60 ${SP} hover:border-white/30 hover:text-white`}>
          <span className="rotate-180 inline-block"><ArrowRight width={12} height={12}/></span>
          Bibliothèque
        </Link>
      </div>
    );
  }

  const currentModule  = modules[currentIdx];
  const completedCount = modules.filter(m => progress[m.id]?.completed).length;
  const isCurrentDone  = currentModule ? (progress[currentModule.id]?.completed ?? false) : false;
  const catColor       = CAT_COLOR[course.category] ?? "#2E6FD4";
  const iframeKey      = `${currentModule?.youtube_id ?? ""}-${autoplay}`;
  const globalPct      = modules.length > 0 ? Math.round(completedCount / modules.length * 100) : 0;
  const allDone        = completedCount === modules.length && modules.length > 0;

  return (
    <div className="flex h-[100dvh] flex-col bg-[#0C0B09] text-white overflow-hidden">

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-4 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-2 rounded-full bg-[#16a34a] px-5 py-2.5 text-[12.5px] font-bold text-white shadow-[0_8px_24px_rgba(22,163,74,0.35)] ${SP}`}>
          <Check width={13} height={13}/> {toast}
        </div>
      )}

      {/* ── Header ── */}
      <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-[#0C0B09]/95 backdrop-blur-xl z-20">
        <Link href="/masterclasses"
          className={`shrink-0 flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 text-[11.5px] font-semibold text-white/50 ${SP} hover:text-white hover:border-white/25`}>
          <span className="rotate-180 inline-block"><ArrowRight width={11} height={11}/></span>
          <span className="hidden sm:inline">Bibliothèque</span>
        </Link>

        <div className="flex-1 min-w-0">
          <p className="truncate text-[13px] font-bold text-white leading-tight"
            style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}>
            {course.title}
          </p>
          <p className="text-[10px] text-white/35 mt-0.5 font-medium">{course.instructor}</p>
        </div>

        {modules.length > 0 && (
          <div className="shrink-0 flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              <div className="h-1 w-16 rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full rounded-full bg-[#2E6FD4] ${SP}`} style={{ width: `${globalPct}%` }}/>
              </div>
              <span className="text-[10.5px] font-bold text-white/45">{completedCount}/{modules.length}</span>
            </div>
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className={`lg:hidden flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/60 ${SP} hover:text-white`}>
              Modules <span className="text-white/30 ml-0.5">{completedCount}/{modules.length}</span>
            </button>
          </div>
        )}
      </header>

      {/* ── Main ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Player area ── */}
        <div className="flex flex-1 flex-col overflow-y-auto">

          {/* Video */}
          <div className="w-full bg-black shrink-0" style={{ aspectRatio: "16/9" }}>
            {currentModule ? (
              <iframe key={iframeKey}
                className="h-full w-full"
                src={getVideoPlayerUrl(currentModule.youtube_id, autoplay).src}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                title={currentModule.title}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-white/15">
                <PlayCircle width={56} height={56}/>
              </div>
            )}
          </div>

          {/* Module info */}
          {currentModule && (
            <div className="px-4 py-5 sm:px-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">
                  Module {currentIdx+1}/{modules.length}
                </span>
                <span className="h-[3px] w-[3px] rounded-full bg-white/20"/>
                <span className="rounded-full px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider"
                  style={{ background: catColor }}>
                  {course.category}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-[17px] font-bold text-white leading-snug"
                    style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}>
                    {currentModule.title}
                  </h2>
                  {currentModule.description && (
                    <p className="mt-2 text-[12.5px] text-white/45 leading-relaxed max-w-prose">
                      {currentModule.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2.5 text-[10.5px] text-white/30 font-semibold">
                    <span>{course.instructor}</span>
                    <span>·</span>
                    <span>{fmt(currentModule.duration_min)}</span>
                    {isCurrentDone && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-[#16a34a]">
                          <Check width={10} height={10}/> Terminé
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {!isCurrentDone && userId && (
                  <div className="shrink-0 flex flex-col items-end gap-2 mt-3 sm:mt-0">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={hasWatched} onChange={e => setHasWatched(e.target.checked)}
                        className="peer sr-only" />
                      <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${hasWatched ? 'bg-[#16a34a] border-[#16a34a]' : 'border-white/30 group-hover:border-white/50'}`}>
                        {hasWatched && <Check width={10} height={10} className="text-white" />}
                      </div>
                      <span className="text-[11.5px] font-medium text-white/70 group-hover:text-white transition-colors select-none">
                        J&apos;ai suivi ce module en entier
                      </span>
                    </label>
                    <button onClick={() => handleMarkComplete(currentModule.id)} disabled={!hasWatched}
                      className={`flex items-center gap-2 rounded-full bg-[#16a34a] px-4 py-2.5 text-[12px] font-bold text-white shadow-[0_4px_16px_rgba(22,163,74,0.25)] ${SP} hover:bg-[#15803d] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed`}>
                      <Check width={13} height={13}/>
                      Marquer terminé
                    </button>
                  </div>
                )}
              </div>

              {/* Prev / Next */}
              <div className="mt-5 flex items-center justify-between">
                <button
                  onClick={() => { if (currentIdx > 0) { setCurrentIdx(i => i-1); setAutoplay(false); } }}
                  disabled={currentIdx === 0}
                  className={`flex items-center gap-1.5 rounded-full border border-white/12 px-4 py-2 text-[12px] font-semibold text-white/50 ${SP} hover:text-white hover:border-white/25 disabled:opacity-25 disabled:cursor-not-allowed`}>
                  <span className="rotate-180 inline-block"><ArrowRight width={12} height={12}/></span>
                  Précédent
                </button>

                <button
                  onClick={() => { if (currentIdx < modules.length-1) { setCurrentIdx(i => i+1); setAutoplay(true); } }}
                  disabled={currentIdx >= modules.length-1}
                  className={`flex items-center gap-2 rounded-full bg-[#2E6FD4] px-4 py-2 text-[12px] font-bold text-white ${SP} hover:bg-[#1d5ab5] active:scale-[0.97] disabled:opacity-25 disabled:cursor-not-allowed`}>
                  Suivant
                  <ArrowRight width={12} height={12}/>
                </button>
              </div>
            </div>
          )}

          {/* Course description */}
          <div className="px-4 py-6 sm:px-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30 mb-3">À propos du parcours</h3>
            <p className="text-[12.5px] text-white/45 leading-relaxed max-w-prose">{course.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full px-3 py-1 text-[10.5px] font-bold text-white"
                style={{ background: catColor }}>
                {course.category}
              </span>
              {course.tier_required !== "Standard" && (
                <span className="rounded-full border border-[#C9A84C]/30 px-3 py-1 text-[10.5px] font-bold text-[#C9A84C]">
                  {course.tier_required}
                </span>
              )}
              <span className="rounded-full border border-white/10 px-3 py-1 text-[10.5px] text-white/35">
                {fmt(course.duration_min)} · {modules.length} module{modules.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* ── Sidebar modules ── */}
        <>
          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-30"
              onClick={() => setSidebarOpen(false)}/>
          )}

          <aside className={`
            shrink-0 w-[300px] xl:w-[320px] border-l border-white/[0.06] flex flex-col overflow-hidden
            lg:relative lg:flex lg:translate-x-0
            fixed right-0 top-0 bottom-0 z-40 ${SP}
            ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
          `} style={{ background: "linear-gradient(to bottom, #13120F, #0C0B09)" }}>

            {/* Sidebar header */}
            <div className="shrink-0 px-4 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <p className="text-[12px] font-bold text-white">Modules du parcours</p>
                <p className="text-[10px] text-white/35 mt-0.5 font-semibold">{completedCount}/{modules.length} terminés</p>
              </div>
              <button className="lg:hidden text-white/30 hover:text-white" onClick={() => setSidebarOpen(false)}>
                <span className="text-xl leading-none">×</span>
              </button>
            </div>

            {/* Progress bar */}
            <div className="shrink-0 px-4 py-2.5 border-b border-white/[0.04]">
              <div className="h-[3px] w-full rounded-full bg-white/8 overflow-hidden">
                <div className={`h-full rounded-full bg-[#2E6FD4] ${SP}`} style={{ width: `${globalPct}%` }}/>
              </div>
            </div>

            {/* Module list */}
            <div className="flex-1 overflow-y-auto py-2 [&::-webkit-scrollbar]:hidden">
              {modules.length === 0 && (
                <p className="px-4 py-10 text-center text-[11.5px] text-white/25">Aucun module disponible.</p>
              )}

              {modules.map((mod, idx) => {
                const isDone    = progress[mod.id]?.completed ?? false;
                const isCurrent = idx === currentIdx;
                return (
                  <button key={mod.id}
                    onClick={() => selectModule(idx)}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 text-left ${SP} border-l-2 ${
                      isCurrent
                        ? "bg-[#2E6FD4]/10 border-[#2E6FD4]"
                        : "hover:bg-white/[0.04] border-transparent"
                    }`}>

                    <span className={`shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-[9px] font-bold ${SP} ${
                      isDone
                        ? "bg-[#16a34a] border-[#16a34a] text-white"
                        : isCurrent
                        ? "bg-[#2E6FD4] border-[#2E6FD4] text-white"
                        : "border-white/15 text-white/25"
                    }`}>
                      {isDone ? <Check width={9} height={9}/> : idx+1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className={`text-[12.5px] font-semibold leading-snug truncate ${SP} ${
                        isCurrent ? "text-white" : isDone ? "text-white/40" : "text-white/65"
                      }`}>
                        {mod.title}
                      </p>
                      <p className={`text-[10px] mt-0.5 font-medium ${isCurrent ? "text-[#2E6FD4]/80" : "text-white/20"}`}>
                        {fmt(mod.duration_min)}
                        {isCurrent && <span className="ml-1.5 font-bold">▶ En cours</span>}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Completion celebration */}
            {allDone && (
              <div className="shrink-0 m-3 rounded-[1.5rem] border border-[#16a34a]/20 bg-[#16a34a]/8 p-4 text-center">
                <p className="text-[13px] font-bold text-[#16a34a]">Parcours terminé !</p>
                <p className="text-[10.5px] text-[#16a34a]/60 mt-1">Vous avez complété tous les modules.</p>
                <Link href="/masterclasses"
                  className={`mt-3 inline-flex items-center gap-2 rounded-full bg-[#16a34a] px-4 py-2 text-[11px] font-bold text-white ${SP} hover:bg-[#15803d]`}>
                  Voir la bibliothèque <ArrowRight width={10} height={10}/>
                </Link>
              </div>
            )}
          </aside>
        </>
      </div>
    </div>
  );
}
