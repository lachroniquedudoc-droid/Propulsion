"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase/client";
import { MemberLayout } from "@/components/member-layout";
import { AiAgent } from "@/components/ai-agent";
import { Trophy, Zap, Calendar, Check, Star, Crown, ArrowRight } from "@/components/icons";

type Challenge = {
  id: string; week_number: number; title: string;
  context: string; objective: string; mission: string;
  deliverable: string; resources: string[]|null;
  category: string; difficulty: string; points: number;
  deadline: string|null; tier_required: string; is_active: boolean;
};
type Submission = {
  id: string; challenge_id: string|null; challenge_week: number;
  deliverable_url: string; comments: string|null; status: string; created_at: string;
};
type LeaderEntry = { id:string; first_name:string; last_name:string; avatar_url:string|null; reputation_points:number; role:string };

const DIFF_COLOR: Record<string,string> = { Débutant:"#22c55e", Intermédiaire:"#3871c2", Avancé:"#ff1e58" };
const TIER_ORDER: Record<string,number> = { Standard:0, Pro:1, Élite:2 };

function BrandBar() {
  return (
    <div className="flex h-[3px] w-full overflow-hidden rounded-full">
      {["#3871c2","#ffac42","#766391","#ff1e58","#22c55e"].map(c => (
        <span key={c} className="flex-1" style={{ background: c }}/>
      ))}
    </div>
  );
}

function countdown(deadline:string|null){
  if (!deadline) return null;
  const diff = new Date(deadline).getTime()-Date.now();
  if (diff<=0) return "Terminé";
  const d=Math.floor(diff/86400000); const h=Math.floor((diff%86400000)/3600000);
  return d>0?`${d}j ${h}h`:`${h}h`;
}

export default function ChallengesPage() {
  const [role, setRole]       = useState("Standard");
  const [userId, setUserId]   = useState<string|null>(null);
  const [reputation, setReputation] = useState(0);
  const [active, setActive]   = useState<Challenge|null>(null);
  const [past, setPast]       = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<"challenge"|"leaderboard"|"historique">("challenge");
  const [url, setUrl]         = useState("");
  const [desc, setDesc]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadData = useCallback(async (uid:string) => {
    const [{ data:challenges }, { data:subs }, { data:lead }] = await Promise.all([
      supabase.from("challenges").select("id,week_number,title,context,objective,mission,deliverable,resources,category,difficulty,points,deadline,tier_required,is_active").order("week_number", { ascending:false }).limit(50),
      supabase.from("challenge_submissions").select("id,challenge_id,challenge_week,deliverable_url,comments,status,created_at").eq("member_id",uid).order("created_at",{ascending:false}).limit(100),
      supabase.from("members").select("id,first_name,last_name,avatar_url,reputation_points,role").order("reputation_points",{ascending:false}).limit(10),
    ]);
    const all = (challenges??[]) as Challenge[];
    setActive(all.find(c=>c.is_active)??null);
    setPast(all.filter(c=>!c.is_active));
    setSubmissions((subs??[]) as unknown as Submission[]);
    setLeaders((lead??[]) as LeaderEntry[]);
  },[]);

  useEffect(()=>{
    const { data:{ subscription } } = supabase.auth.onAuthStateChange(async (event, session)=>{
      if (event!=="INITIAL_SESSION") return;
      if (session?.user) {
        const uid = session.user.id; setUserId(uid);
        const { data:m } = await supabase.from("members").select("role,reputation_points").eq("id",uid).single();
        if (m) { setRole(m.role); setReputation(m.reputation_points??0); }
        await loadData(uid);
      }
      setLoading(false);
    });
    return ()=>subscription.unsubscribe();
  },[loadData]);

  async function submitChallenge(e:{preventDefault():void}) {
    e.preventDefault();
    if (!userId||!active||!url.trim()) return;
    const locked = (TIER_ORDER[role]??0)<(TIER_ORDER[active.tier_required]??0);
    if (locked) return;
    setSubmitting(true);
    const { error } = await supabase.from("challenge_submissions").insert({
      member_id: userId, challenge_id: active.id, challenge_week: active.week_number,
      deliverable_url: url.trim(), comments: desc.trim()||null, status:"En cours",
    });
    if (!error) { setSubmitted(true); setUrl(""); setDesc(""); await loadData(userId); }
    setSubmitting(false);
  }

  const alreadySubmitted = active ? submissions.some(s=>s.challenge_id===active.id) : false;
  const locked = active ? (TIER_ORDER[role]??0)<(TIER_ORDER[active.tier_required]??0) : false;

  return (
    <MemberLayout role={role}>
      <div className="min-h-full bg-[#F4F3F0]">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

          {/* Brand bar */}
          <BrandBar />

          {/* Header */}
          <div className="mt-7 mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold text-ink">Challenges Premium</h1>
              <p className="mt-1 text-[13px] text-muted">Sprints hebdomadaires pour bâtir votre business.</p>
            </div>
            {userId && (
              <div className="shrink-0 flex items-center gap-2 rounded-2xl border border-[#E0DDD8] bg-white px-3.5 py-2">
                <Trophy width={15} height={15} className="text-[#ffac42]"/>
                <span className="text-[13px] font-bold text-ink">{reputation} pts</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="mb-5 flex gap-1 rounded-2xl border border-[#E0DDD8] bg-white p-1">
            {(["challenge","leaderboard","historique"] as const).map(t=>(
              <button key={t} onClick={()=>setTab(t)}
                className={`flex-1 rounded-xl py-2 text-[12.5px] font-semibold transition-colors capitalize ${tab===t?"bg-brand text-white shadow-sm":"text-muted hover:text-ink"}`}>
                {t==="challenge"?"Sprint actuel":t==="leaderboard"?"Classement":"Historique"}
              </button>
            ))}
          </div>

          {loading && <div className="flex justify-center py-16"><span className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"/></div>}

          {/* ── Sprint actuel ── */}
          {!loading && tab==="challenge" && (
            <>
              {!active && (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#E0DDD8] bg-white py-16 text-center">
                  <Zap width={36} height={36} className="text-faint"/>
                  <p className="text-[14px] font-semibold text-muted">Aucun sprint actif en ce moment</p>
                  <p className="text-[12.5px] text-faint">Le prochain challenge sera publié prochainement.</p>
                </div>
              )}

              {active && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#E0DDD8] bg-white overflow-hidden">
                    <div className="h-1.5 w-full" style={{ background: DIFF_COLOR[active.difficulty]??"#3871c2" }}/>
                    <div className="p-5 sm:p-6">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white" style={{background:DIFF_COLOR[active.difficulty]??"#3871c2"}}>{active.difficulty}</span>
                          <span className="rounded-full bg-[#ffac42]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#b87a00]">+{active.points} pts</span>
                          {active.tier_required!=="Standard" && (
                            <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-bold text-brand">{active.tier_required}</span>
                          )}
                        </div>
                        {active.deadline && (
                          <div className="shrink-0 text-right">
                            <div className="flex items-center gap-1 text-[10px] text-muted justify-end"><Calendar width={10} height={10}/> Deadline</div>
                            <p className="text-[15px] font-black text-[#ff1e58]">{countdown(active.deadline)}</p>
                          </div>
                        )}
                      </div>

                      <h2 className="font-serif text-[18px] font-bold text-ink leading-snug mb-5">{active.title}</h2>

                      <div className="space-y-4 text-[13px] leading-relaxed text-ink">
                        <Section label="Contexte" text={active.context}/>
                        <Section label="Objectif" text={active.objective}/>
                        <Section label="Votre mission" text={active.mission}/>
                        <Section label="Ce que vous soumettez" text={active.deliverable}/>
                        {active.resources && active.resources.length>0 && (
                          <div>
                            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-faint">Ressources</p>
                            <ul className="space-y-1">
                              {active.resources.map((r,i)=>(
                                <li key={i} className="flex items-start gap-1.5 text-[12.5px] text-muted">
                                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand/40 shrink-0"/>
                                  {r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {locked ? (
                    <div className="rounded-2xl border border-dashed border-[#E0DDD8] bg-white p-5 text-center">
                      <Crown width={24} height={24} className="mx-auto mb-2 text-faint"/>
                      <p className="text-[13px] font-semibold text-muted">Ce sprint est réservé aux membres <strong>{active.tier_required}</strong>.</p>
                      <a href="/rejoindre" className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-brand hover:underline">
                        Passer à {active.tier_required} <ArrowRight width={12} height={12}/>
                      </a>
                    </div>
                  ) : alreadySubmitted ? (
                    <div className="rounded-2xl border border-[#22c55e]/30 bg-[#22c55e]/5 p-5 flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#22c55e]">
                        <Check width={16} height={16} className="text-white"/>
                      </span>
                      <div>
                        <p className="text-[13.5px] font-bold text-ink">Soumission envoyée !</p>
                        <p className="text-[12px] text-muted">Votre travail est en cours d&apos;évaluation. Résultat sous 72h.</p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={submitChallenge} className="rounded-2xl border border-[#E0DDD8] bg-white p-6 space-y-4">
                      <p className="text-[14px] font-bold text-ink">Soumettre votre travail</p>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-faint">Lien de votre livrable *</label>
                        <input value={url} onChange={e=>setUrl(e.target.value)} required type="url"
                          placeholder="https://docs.google.com/… ou Notion, YouTube, etc."
                          className="input-minimal text-[13px]"/>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-faint">Note (optionnel)</label>
                        <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3}
                          placeholder="Décrivez brièvement ce que vous avez accompli…"
                          className="input-minimal resize-none text-[13px]"/>
                      </div>
                      <button disabled={submitting||!url.trim()} type="submit"
                        className="w-full rounded-xl bg-[#ffac42] py-3.5 text-[13.5px] font-bold text-white disabled:opacity-50 hover:bg-[#f09c30] transition-colors cursor-pointer">
                        {submitting?"Envoi en cours…":"Soumettre le sprint"}
                      </button>
                      {submitted && <p className="text-center text-[12px] text-[#22c55e] font-semibold">Soumission envoyée avec succès !</p>}
                    </form>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── Classement ── */}
          {!loading && tab==="leaderboard" && (
            <div className="space-y-2">
              <p className="mb-4 text-[13px] text-muted">Classement général basé sur les points de réputation cumulés.</p>
              {leaders.map((l,i)=>(
                <div key={l.id} className={`flex items-center gap-3 rounded-2xl border bg-white p-3.5 ${i<3?"border-[#ffac42]/30":"border-[#E0DDD8]"}`}>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${i===0?"bg-[#ffac42] text-white":i===1?"bg-[#c0c0c0] text-white":i===2?"bg-[#cd7f32] text-white":"bg-[#F4F3F0] text-muted"}`}>{i+1}</span>
                  {l.avatar_url ? (
                    <img src={l.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-[#E0DDD8] shrink-0"/>
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[12px] font-bold text-brand">
                      {(l.first_name[0]+(l.last_name[0]??"")).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-ink truncate">{l.first_name} {l.last_name}</p>
                    <p className="text-[11px] text-muted">{l.role}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Trophy width={13} height={13} className="text-[#ffac42]"/>
                    <span className="text-[13px] font-bold text-ink">{l.reputation_points}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Historique ── */}
          {!loading && tab==="historique" && (
            <div className="space-y-3">
              {submissions.length===0 && (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#E0DDD8] bg-white py-16 text-center">
                  <Star width={32} height={32} className="text-faint"/>
                  <p className="text-[14px] font-semibold text-muted">Aucune soumission pour l&apos;instant</p>
                  <p className="text-[12.5px] text-faint">Participez au sprint actif pour voir votre historique ici.</p>
                </div>
              )}
              {submissions.map(s=>{
                const ch = past.find(c=>c.id===s.challenge_id)??active;
                return (
                  <div key={s.id} className="rounded-2xl border border-[#E0DDD8] bg-white p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-[13px] font-bold text-ink leading-snug">{ch?.title??"Sprint"}</p>
                      <StatusBadge status={s.status}/>
                    </div>
                    <a href={s.deliverable_url} target="_blank" rel="noopener noreferrer"
                      className="text-[12px] text-brand hover:underline truncate block">{s.deliverable_url}</a>
                    {s.comments && <p className="mt-2 text-[12px] text-muted leading-relaxed">{s.comments}</p>}
                    <p className="mt-2 text-[11px] text-faint">
                      {new Date(s.created_at).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
      <AiAgent/>
    </MemberLayout>
  );
}

function Section({ label, text }: { label:string; text:string }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-faint">{label}</p>
      <p className="text-[13px] text-ink leading-relaxed whitespace-pre-line">{text}</p>
    </div>
  );
}

function StatusBadge({ status }:{ status:string }) {
  const config: Record<string,{bg:string;text:string}> = {
    "En cours":{ bg:"#3871c2/10", text:"#3871c2" },
    "Validé":  { bg:"#22c55e/10", text:"#15803d" },
    "Rejeté":  { bg:"#ff1e58/10", text:"#ff1e58" },
  };
  const c = config[status]??{ bg:"#766391/10", text:"#766391" };
  return (
    <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
      style={{background:`color-mix(in srgb, ${c.text} 12%, transparent)`,color:c.text}}>
      {status}
    </span>
  );
}
