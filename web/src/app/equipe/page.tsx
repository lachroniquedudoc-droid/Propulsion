"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/utils/supabase/client";
import { MemberLayout } from "@/components/member-layout";

type TeamMember = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  fonction: string | null;
  avatar_url: string | null;
  city: string | null;
  sector: string | null;
};

const FONCTION_COLOR: Record<string, string> = {
  "Commercial":           "#F97316",
  "Responsable pays":     "#2E6FD4",
  "Responsable contenu":  "#6C3FC5",
  "Responsable support":  "#1D6B45",
};

function TeamCard({ member }: { member: TeamMember }) {
  const roleColor    = member.role === "Admin" ? "#1A1A1A" : "#E8174B";
  const fonctionColor = member.fonction ? (FONCTION_COLOR[member.fonction] ?? "#6B6B6B") : null;

  return (
    <div className="group rounded-2xl border border-[#E0DDD8] bg-white p-5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.07)] hover:-translate-y-0.5">
      <div className="flex items-start gap-4">
        {member.avatar_url ? (
          <img
            src={member.avatar_url}
            alt={`${member.first_name} ${member.last_name}`}
            className="h-14 w-14 rounded-full object-cover shrink-0"
          />
        ) : (
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[16px] font-bold text-white font-sans"
            style={{ background: roleColor }}
          >
            {(member.first_name[0] + member.last_name[0]).toUpperCase()}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-[#1A1A1A] font-sans leading-tight">
            {member.first_name} {member.last_name}
          </p>
          {member.city && (
            <p className="text-[12px] text-[#6B6B6B] font-sans mt-0.5">{member.city}</p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold font-sans uppercase tracking-wide"
              style={{ background: `${roleColor}12`, color: roleColor }}
            >
              {member.role === "Admin" ? "⚙ Admin" : "🛡 Modérateur"}
            </span>
            {member.fonction && fonctionColor && (
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold font-sans uppercase tracking-wide"
                style={{ background: `${fonctionColor}12`, color: fonctionColor }}
              >
                {member.fonction}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EquipeContent() {
  const [team, setTeam]       = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("members")
      .select("id,first_name,last_name,role,fonction,avatar_url,city,sector")
      .in("role", ["Admin", "Modérateur"])
      .order("role")
      .order("first_name")
      .then(({ data }) => {
        if (data) setTeam(data as TeamMember[]);
        setLoading(false);
      });
  }, []);

  const admins     = team.filter(m => m.role === "Admin");
  const moderators = team.filter(m => m.role === "Modérateur");

  return (
    <MemberLayout>
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-10">
          <span className="inline-flex items-center rounded-full border border-[#E0DDD8] bg-[#F4F3F0] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6B6B6B] font-sans mb-4">
            Équipe Propulsion
          </span>
          <h1 className="font-serif text-[28px] font-bold text-[#1A1A1A] leading-tight">
            Les personnes qui font<br />vivre la communauté
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-[#6B6B6B] font-sans max-w-lg">
            Notre équipe est composée d&apos;entrepreneurs comme vous, engagés au quotidien pour animer, soutenir et faire grandir la communauté CNIC Propulsion.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-[#E0DDD8] bg-white p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-[#E0DDD8]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-32 rounded-full bg-[#E0DDD8]" />
                    <div className="h-2.5 w-20 rounded-full bg-[#E0DDD8]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {admins.length > 0 && (
              <section>
                <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6B6B6B] font-sans mb-4">
                  Direction & Administration
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {admins.map(m => <TeamCard key={m.id} member={m} />)}
                </div>
              </section>
            )}

            {moderators.length > 0 && (
              <section>
                <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6B6B6B] font-sans mb-4">
                  Modération & Support
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {moderators.map(m => <TeamCard key={m.id} member={m} />)}
                </div>
              </section>
            )}

            {team.length === 0 && !loading && (
              <div className="rounded-2xl border border-[#E0DDD8] bg-white px-6 py-12 text-center">
                <p className="text-[14px] text-[#6B6B6B] font-sans">L&apos;équipe sera bientôt présentée ici.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </MemberLayout>
  );
}

export default function EquipePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F4F3F0] flex items-center justify-center">
        <div className="animate-pulse text-[#2E6FD4] font-semibold font-sans text-[14px]">Chargement…</div>
      </div>
    }>
      <EquipeContent />
    </Suspense>
  );
}
