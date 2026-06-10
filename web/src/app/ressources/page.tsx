"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { MemberLayout } from "@/components/member-layout";
import { AiAgent } from "@/components/ai-agent";
import { FolderOpen, Shield, ExternalLink, Star, Crown } from "@/components/icons";
import { logActivity } from "@/utils/activity";

type Resource = {
  id: string; title: string; description: string; category: string;
  file_url: string | null; external_url: string | null;
  resource_type: string; tier_required: string; is_published: boolean;
  download_count: number;
};

const TIER_ORDER: Record<string, number> = { Standard: 0, Pro: 1, Élite: 2 };

const TYPE_STYLE: Record<string, { bg: string; text: string; icon: string }> = {
  PDF:      { bg: "#ff1e58", text: "#ff1e58", icon: "📄" },
  Guide:    { bg: "#3871c2", text: "#3871c2", icon: "📘" },
  Vidéo:    { bg: "#766391", text: "#766391", icon: "🎬" },
  Outil:    { bg: "#22c55e", text: "#22c55e", icon: "🔧" },
  Template: { bg: "#ffac42", text: "#b87a00", icon: "📋" },
  Lien:     { bg: "#3871c2", text: "#3871c2", icon: "🔗" },
  Autre:    { bg: "#555555", text: "#555555", icon: "📁" },
};

const TIER_COLOR: Record<string, string> = { Standard: "#766391", Pro: "#3871c2", Élite: "#ffac42" };

function BrandBar() {
  return (
    <div className="flex h-[3px] w-full overflow-hidden rounded-full">
      {["#3871c2","#ffac42","#766391","#ff1e58","#22c55e"].map(c => (
        <span key={c} className="flex-1" style={{ background: c }}/>
      ))}
    </div>
  );
}

export default function RessourcesPage() {
  const [role, setRole]           = useState("Standard");
  const [userId, setUserId]       = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading]     = useState(true);
  const [catFilter, setCatFilter] = useState("Toutes");
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== "INITIAL_SESSION") return;
      if (session?.user) {
        const uid = session.user.id; setUserId(uid);
        const { data: m } = await supabase.from("members").select("role").eq("id", uid).single();
        if (m) setRole(m.role);
      }
      const { data } = await supabase
        .from("resources")
        .select("id,title,description,category,file_url,external_url,resource_type,tier_required,is_published,download_count")
        .eq("is_published", true).order("category").order("tier_required");
      setResources((data as Resource[]) ?? []);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleOpen(res: Resource) {
    const userTier = TIER_ORDER[role] ?? 0;
    const resTier  = TIER_ORDER[res.tier_required] ?? 0;
    if (userTier < resTier || !userId) return;
    setDownloading(res.id);
    await supabase.from("resources").update({ download_count: res.download_count + 1 }).eq("id", res.id);
    setResources(prev => prev.map(r => r.id === res.id ? { ...r, download_count: r.download_count + 1 } : r));
    logActivity(userId, "resource_downloaded", { resource_id: res.id, title: res.title, category: res.category });
    const raw = res.file_url || res.external_url;
    if (raw) {
      /* Strip Supabase Storage download param so browser renders inline */
      const openUrl = raw.replace(/[?&]download(=[^&]*)?(&|$)/, (_m, _v, trail) => trail === "&" ? "?" : "");
      window.open(openUrl, "_blank", "noopener,noreferrer");
    }
    setDownloading(null);
  }

  const categories = ["Toutes", ...Array.from(new Set(resources.map(r => r.category))).sort()];
  const filtered   = catFilter === "Toutes" ? resources : resources.filter(r => r.category === catFilter);
  const catCounts: Record<string, number> = {};
  resources.forEach(r => { catCounts[r.category] = (catCounts[r.category] ?? 0) + 1; });

  return (
    <MemberLayout role={role}>
      <div className="min-h-full bg-[#F4F3F0]">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">

          {/* Brand bar */}
          <BrandBar />

          {/* Header */}
          <div className="mt-7 mb-7">
            <h1 className="font-serif text-3xl font-bold text-ink">Ressources & Outils</h1>
            <p className="mt-1 text-[13px] text-muted">PDF, guides, templates et outils exclusifs publiés par l&apos;équipe Propulsion.</p>
          </div>

          {/* Category filters */}
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
            {categories.map(cat => (
              <button key={cat} onClick={() => setCatFilter(cat)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${catFilter === cat ? "bg-brand text-white" : "border border-[#E0DDD8] bg-white text-muted hover:text-ink"}`}>
                {cat}
                <span className="ml-1 opacity-60">
                  ({cat === "Toutes" ? resources.length : catCounts[cat] ?? 0})
                </span>
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-16">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"/>
            </div>
          )}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#E0DDD8] bg-white py-16 text-center">
              <FolderOpen width={36} height={36} className="text-faint"/>
              <p className="text-[14px] font-semibold text-muted">Aucune ressource dans cette catégorie</p>
            </div>
          )}

          {/* Grid */}
          {!loading && filtered.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(res => {
                const userTier = TIER_ORDER[role] ?? 0;
                const resTier  = TIER_ORDER[res.tier_required] ?? 0;
                const locked   = userTier < resTier;
                const ts       = TYPE_STYLE[res.resource_type] ?? TYPE_STYLE.Autre;
                const tc       = TIER_COLOR[res.tier_required] ?? "#766391";
                const url      = res.file_url || res.external_url;

                return (
                  <article key={res.id} className={`relative flex flex-col rounded-2xl border bg-white transition-all ${locked ? "border-[#E0DDD8]" : "border-[#E0DDD8] hover:border-brand/20 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"}`}>
                    {/* Type accent strip */}
                    <div className="h-1 w-full rounded-t-2xl" style={{ background: ts.bg }}/>

                    {/* Locked overlay */}
                    {locked && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-white/85 backdrop-blur-[2px]">
                        <Crown width={22} height={22} className="mb-1.5" style={{ color: tc }}/>
                        <p className="text-[12px] font-bold" style={{ color: tc }}>Réservé {res.tier_required}</p>
                        <a href="/rejoindre" className="mt-2 rounded-full bg-brand px-4 py-1.5 text-[11.5px] font-bold text-white hover:bg-brand/90 transition-colors">
                          Passer au niveau {res.tier_required}
                        </a>
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-4">
                      {/* Icon + info */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F4F3F0] text-[26px]">{ts.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13.5px] font-bold text-ink leading-snug">{res.title}</p>
                          <div className="mt-1 flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-semibold text-faint">{res.category}</span>
                            <span className="text-[10px] font-bold" style={{ color: ts.text }}>{res.resource_type}</span>
                            {res.tier_required !== "Standard" && (
                              <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white" style={{ background: tc }}>
                                {res.tier_required}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="flex-1 text-[12px] text-muted leading-relaxed line-clamp-2 mb-3">{res.description}</p>

                      <div className="flex items-center justify-between border-t border-[#E0DDD8] pt-3">
                        <span className="text-[11px] text-faint">{res.download_count} accès</span>
                        <button onClick={() => handleOpen(res)} disabled={locked || downloading === res.id || !url}
                          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-bold transition-colors ${locked ? "cursor-not-allowed opacity-40 bg-[#F4F3F0] text-muted" : "bg-brand text-white hover:bg-brand/90"}`}>
                          {downloading === res.id ? (
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"/>
                          ) : locked ? (
                            <Shield width={12} height={12}/>
                          ) : (
                            <ExternalLink width={12} height={12}/>
                          )}
                          {locked ? "Verrouillé" : downloading === res.id ? "Ouverture…" : "Ouvrir"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Upsell for Standard */}
          {!loading && role === "Standard" && (
            <div className="mt-6 rounded-2xl border border-[#ffac42]/30 bg-[#ffac42]/5 p-5 flex items-start gap-4">
              <Star width={20} height={20} className="shrink-0 mt-0.5 text-[#ffac42]"/>
              <div>
                <p className="text-[13.5px] font-bold text-ink">Accédez à plus de ressources avec Pro ou Élite</p>
                <p className="mt-0.5 text-[12px] text-muted leading-relaxed">Les membres Pro et Élite accèdent aux ressources premium, guides exclusifs et outils avancés.</p>
                <a href="/rejoindre" className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#ffac42] px-4 py-2 text-[12.5px] font-bold text-white hover:bg-[#f09c30] transition-colors">
                  Passer à Pro ou Élite <ExternalLink width={11} height={11}/>
                </a>
              </div>
            </div>
          )}

        </div>
      </div>
      <AiAgent/>
    </MemberLayout>
  );
}
