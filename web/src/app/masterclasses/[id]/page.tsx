"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/client";
import { Check, ArrowRight, PlayCircle, Star } from "@/components/icons";
import { logActivity } from "@/utils/activity";

/* ─── Types ──────────────────────────────────────────────────── */

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

/* ─── Helpers ─────────────────────────────────────────────────── */

const TIER_ORDER: Record<string, number> = { Standard: 0, Pro: 1, Élite: 2 };
const CAT_COLOR:  Record<string, string> = {
  Vente: "#ff1e58", Négociation: "#3871c2", Stratégie: "#766391",
  Leadership: "#ffac42", Investissement: "#22c55e", Croissance: "#ff6b35",
};

function fmt(min: number) {
  if (!min) return "—";
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60} min` : ""}`;
}

function getVideoPlayerUrl(videoId: string, autoplay: boolean) {
  if (!videoId) return { src: "", isVimeo: false };
  
  if (videoId.startsWith("vimeo:")) {
    const parts = videoId.split(":");
    const id = parts[1];
    const hash = parts[2];
    
    let src = `https://player.vimeo.com/video/${id}?`;
    if (hash) {
      src += `h=${hash}&`;
    }
    src += `autoplay=${autoplay ? "1" : "0"}&color=ffffff&title=0&byline=0&portrait=0`;
    return { src, isVimeo: true };
  }
  
  // YouTube embed
  const src = `https://www.youtube.com/embed/${videoId}?${autoplay ? "autoplay=1&" : ""}rel=0&modestbranding=1&color=white`;
  return { src, isVimeo: false };
}

/* ─── Page ────────────────────────────────────────────────────── */

export default function CoursePlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [userId, setUserId]   = useState<string | null>(null);
  const [userRole, setUserRole] = useState("Standard");
  const [course, setCourse]   = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<Record<string, ModuleProgress>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [autoplay, setAutoplay] = useState(false);
  const [toast, setToast]     = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const loadData = useCallback(async (uid: string | null, role: string) => {
    const { data: c } = await supabase
      .from("masterclasses")
      .select("*")
      .eq("id", id)
      .single();

    if (!c) { setLoading(false); return; }
    setCourse(c as Course);

    const { data: mods } = await supabase
      .from("masterclass_modules")
      .select("id, title, description, youtube_id, duration_min, order_index")
      .eq("masterclass_id", id)
      .eq("is_published", true)
      .order("order_index");

    const modList = (mods ?? []) as Module[];
    setModules(modList);

    if (uid && modList.length > 0) {
      const { data: prog } = await supabase
        .from("module_progress")
        .select("module_id, completed, seconds_watched")
        .eq("member_id", uid)
        .in("module_id", modList.map(m => m.id));

      const map: Record<string, ModuleProgress> = {};
      (prog ?? []).forEach(p => { map[p.module_id] = { completed: p.completed, seconds_watched: p.seconds_watched }; });
      setProgress(map);

      // Reprendre au premier module non terminé
      const firstIncomplete = modList.findIndex(m => !map[m.id]?.completed);
      setCurrentIdx(firstIncomplete >= 0 ? firstIncomplete : 0);
    }

    // Marquer comme "démarré" (1 sec) pour la progression globale + log activité
    if (uid) {
      try {
        await supabase.from("content_progress").upsert(
          { member_id: uid, masterclass_id: id, seconds_watched: 1 },
          { onConflict: "member_id,masterclass_id" }
        );
        logActivity(uid, "masterclass_viewed", { masterclass_id: id, title: c.title });
      } catch { /* ignore */ }
    }

    // Vérifier l'accès
    const locked = (TIER_ORDER[role] ?? 0) < (TIER_ORDER[c.tier_required] ?? 0);
    if (locked) { setLoading(false); return; }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== "INITIAL_SESSION") return;
      let uid: string | null = null;
      let role = "Standard";
      if (session?.user) {
        uid = session.user.id;
        setUserId(uid);
        const { data: m } = await supabase.from("members").select("role").eq("id", uid).single();
        role = m?.role ?? "Standard";
        setUserRole(role);
      }
      await loadData(uid, role);
    });
    return () => subscription.unsubscribe();
  }, [loadData]);

  async function handleMarkComplete(moduleId: string) {
    if (!userId) return;
    const mod = modules.find(m => m.id === moduleId);
    if (!mod) return;

    const newProgress: ModuleProgress = {
      completed: true,
      seconds_watched: mod.duration_min * 60,
    };

    // Optimistic update
    setProgress(prev => ({ ...prev, [moduleId]: newProgress }));

    try {
      await supabase.from("module_progress").upsert(
        { member_id: userId, module_id: moduleId, completed: true, seconds_watched: mod.duration_min * 60, updated_at: new Date().toISOString() },
        { onConflict: "member_id,module_id" }
      );
      // Recalcul progression globale du cours
      await supabase.rpc("refresh_course_progress", { p_member_id: userId, p_masterclass_id: id });
    } catch { /* ignore */ }

    notify("Module terminé ✓");

    // Auto-avance au suivant
    if (currentIdx < modules.length - 1) {
      setTimeout(() => {
        setCurrentIdx(i => i + 1);
        setAutoplay(true);
      }, 800);
    }
  }

  function selectModule(idx: number) {
    if (idx === currentIdx) return;
    setCurrentIdx(idx);
    setAutoplay(true);
    setSidebarOpen(false);
  }

  /* ─── États d'UI ── */

  if (loading) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-night flex flex-col items-center justify-center gap-4 text-white">
        <p className="text-[15px] font-semibold">Parcours introuvable.</p>
        <Link href="/masterclasses" className="text-[13px] text-brand hover:underline">← Retour à la bibliothèque</Link>
      </div>
    );
  }

  const locked = (TIER_ORDER[userRole] ?? 0) < (TIER_ORDER[course.tier_required] ?? 0);
  if (locked) {
    return (
      <div className="min-h-screen bg-night flex flex-col items-center justify-center gap-6 p-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ffac42]/10 text-[#ffac42]">
          <Star width={32} height={32} />
        </span>
        <div>
          <h2 className="text-xl font-bold text-white">Accès {course.tier_required}</h2>
          <p className="mt-2 text-[13px] text-white/60 max-w-xs mx-auto">
            Ce parcours est réservé aux membres {course.tier_required}. Mettez à niveau votre adhésion pour y accéder.
          </p>
        </div>
        <Link href="/masterclasses" className="rounded-full border border-white/20 px-6 py-2.5 text-[13px] font-semibold text-white hover:bg-white/10 transition-colors">
          ← Retour à la bibliothèque
        </Link>
      </div>
    );
  }

  const currentModule   = modules[currentIdx];
  const completedCount  = modules.filter(m => progress[m.id]?.completed).length;
  const isCurrentDone   = currentModule ? (progress[currentModule.id]?.completed ?? false) : false;
  const catColor        = CAT_COLOR[course.category] ?? "#3871c2";
  const iframeKey       = `${currentModule?.youtube_id ?? ""}-${autoplay}`;

  return (
    <div className="flex h-screen flex-col bg-night text-white overflow-hidden">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-2 rounded-full bg-[#22c55e] px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg">
          <Check width={14} height={14} /> {toast}
        </div>
      )}

      {/* ── Header ── */}
      <header className="shrink-0 flex items-center gap-3 border-b border-white/8 bg-night/95 backdrop-blur px-4 py-3 z-20">
        <Link
          href="/masterclasses"
          className="flex items-center gap-1.5 shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-[12px] font-semibold text-white/70 hover:text-white hover:border-white/30 transition-colors"
        >
          <span className="rotate-180 inline-block"><ArrowRight width={12} height={12} /></span>
          Bibliothèque
        </Link>

        <div className="flex-1 min-w-0">
          <p className="truncate text-[13px] font-bold text-white leading-tight">{course.title}</p>
          <p className="text-[10.5px] text-white/45 mt-0.5">{course.instructor}</p>
        </div>

        {/* Progression */}
        {modules.length > 0 && (
          <div className="shrink-0 flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <div className="h-1.5 w-20 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#22c55e] transition-all"
                  style={{ width: `${Math.round(completedCount / modules.length * 100)}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-white/60">{completedCount}/{modules.length}</span>
            </div>
            {/* Mobile : bouton ouvrir sidebar */}
            <button
              className="lg:hidden flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-semibold text-white/70"
              onClick={() => setSidebarOpen(o => !o)}
            >
              Modules ({completedCount}/{modules.length})
            </button>
          </div>
        )}
      </header>

      {/* ── Corps principal ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Zone Player (gauche) ── */}
        <div className="flex flex-1 flex-col overflow-y-auto">

          {/* Player Vidéo */}
          <div className="w-full bg-black" style={{ aspectRatio: "16/9" }}>
            {currentModule ? (
              <iframe
                key={iframeKey}
                className="h-full w-full"
                src={getVideoPlayerUrl(currentModule.youtube_id, autoplay).src}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                title={currentModule.title}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-white/30">
                <PlayCircle width={48} height={48} />
              </div>
            )}
          </div>

          {/* Info module courant */}
          {currentModule && (
            <div className="px-4 py-5 sm:px-6 border-b border-white/8">
              {/* Breadcrumb */}
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-1.5">
                Module {currentIdx + 1} / {modules.length}
              </p>

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-[17px] font-bold text-white leading-snug">{currentModule.title}</h2>
                  {currentModule.description && (
                    <p className="mt-2 text-[13px] text-white/60 leading-relaxed max-w-prose">{currentModule.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-[11px] text-white/35">
                    <span>{course.instructor}</span>
                    <span>·</span>
                    <span>{fmt(currentModule.duration_min)}</span>
                    {isCurrentDone && (
                      <>
                        <span>·</span>
                        <span className="text-[#22c55e] font-semibold flex items-center gap-1">
                          <Check width={11} height={11} /> Terminé
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!isCurrentDone && userId && (
                    <button
                      onClick={() => handleMarkComplete(currentModule.id)}
                      className="flex items-center gap-1.5 rounded-full bg-[#22c55e] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#16a34a] transition-colors"
                    >
                      <Check width={13} height={13} />
                      Marquer terminé
                    </button>
                  )}
                </div>
              </div>

              {/* Navigation précédent / suivant */}
              <div className="mt-5 flex items-center justify-between">
                <button
                  onClick={() => { if (currentIdx > 0) { setCurrentIdx(i => i - 1); setAutoplay(false); } }}
                  disabled={currentIdx === 0}
                  className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-[12px] font-semibold text-white/60 hover:text-white hover:border-white/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="rotate-180 inline-block"><ArrowRight width={13} height={13} /></span>
                  Précédent
                </button>

                <button
                  onClick={() => { if (currentIdx < modules.length - 1) { setCurrentIdx(i => i + 1); setAutoplay(true); } }}
                  disabled={currentIdx >= modules.length - 1}
                  className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-[12px] font-bold text-white hover:bg-brand-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Suivant
                  <ArrowRight width={13} height={13} />
                </button>
              </div>
            </div>
          )}

          {/* Description du cours */}
          <div className="px-4 py-6 sm:px-6">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-white/40 mb-3">À propos du parcours</h3>
            <p className="text-[13px] text-white/65 leading-relaxed max-w-prose">{course.description}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full px-3 py-1 text-[11px] font-bold text-white" style={{ background: catColor }}>
                {course.category}
              </span>
              {course.tier_required !== "Standard" && (
                <span className="rounded-full border border-[#ffac42]/40 px-3 py-1 text-[11px] font-bold text-[#ffac42]">
                  {course.tier_required}
                </span>
              )}
              <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-white/50">
                {fmt(course.duration_min)} · {modules.length} module{modules.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* ── Sidebar Modules (desktop : fixe, mobile : overlay) ── */}
        <>
          {/* Overlay mobile */}
          {sidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/60 z-30"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <aside
            className={`
              shrink-0 w-[300px] xl:w-[320px] border-l border-white/8 bg-[#0d1120] flex flex-col overflow-hidden
              lg:relative lg:flex lg:translate-x-0
              fixed right-0 top-0 bottom-0 z-40 transition-transform duration-300
              ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
            `}
          >
            {/* Header sidebar */}
            <div className="shrink-0 flex items-center justify-between border-b border-white/8 px-4 py-3.5">
              <div>
                <p className="text-[12px] font-bold text-white">Modules du parcours</p>
                <p className="text-[10.5px] text-white/40 mt-0.5">{completedCount}/{modules.length} terminés</p>
              </div>
              <button className="lg:hidden text-white/40 hover:text-white" onClick={() => setSidebarOpen(false)}>
                <span className="text-[18px] leading-none">×</span>
              </button>
            </div>

            {/* Barre de progression globale */}
            <div className="shrink-0 px-4 py-2.5 border-b border-white/5">
              <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#22c55e] transition-all duration-500"
                  style={{ width: `${modules.length > 0 ? Math.round(completedCount / modules.length * 100) : 0}%` }}
                />
              </div>
            </div>

            {/* Liste des modules */}
            <div className="flex-1 overflow-y-auto py-2">
              {modules.length === 0 && (
                <p className="px-4 py-8 text-center text-[12px] text-white/30">Aucun module disponible.</p>
              )}
              {modules.map((mod, idx) => {
                const isDone    = progress[mod.id]?.completed ?? false;
                const isCurrent = idx === currentIdx;
                return (
                  <button
                    key={mod.id}
                    onClick={() => selectModule(idx)}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors ${
                      isCurrent
                        ? "bg-brand/15 border-l-2 border-brand"
                        : "hover:bg-white/5 border-l-2 border-transparent"
                    }`}
                  >
                    {/* Indicateur état */}
                    <span className={`shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-[9px] font-bold transition-all ${
                      isDone
                        ? "bg-[#22c55e] border-[#22c55e] text-white"
                        : isCurrent
                        ? "bg-brand border-brand text-white"
                        : "border-white/20 text-white/30"
                    }`}>
                      {isDone ? <Check width={10} height={10} /> : idx + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className={`text-[12.5px] font-semibold leading-snug truncate ${
                        isCurrent ? "text-white" : isDone ? "text-white/50" : "text-white/75"
                      }`}>
                        {mod.title}
                      </p>
                      <p className={`text-[10.5px] mt-0.5 ${isCurrent ? "text-brand/80" : "text-white/25"}`}>
                        {fmt(mod.duration_min)}
                        {isCurrent && <span className="ml-1.5 font-bold">▶ En cours</span>}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer sidebar : récap */}
            {completedCount === modules.length && modules.length > 0 && (
              <div className="shrink-0 m-3 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/20 p-4 text-center">
                <p className="text-[13px] font-bold text-[#22c55e]">Parcours terminé !</p>
                <p className="text-[11px] text-[#22c55e]/70 mt-1">Vous avez complété tous les modules.</p>
                <Link
                  href="/masterclasses"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#22c55e] px-4 py-2 text-[11px] font-bold text-white hover:bg-[#16a34a] transition-colors"
                >
                  Voir la bibliothèque <ArrowRight width={11} height={11} />
                </Link>
              </div>
            )}
          </aside>
        </>
      </div>
    </div>
  );
}
