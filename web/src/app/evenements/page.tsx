"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { MemberLayout } from "@/components/member-layout";
import { AiAgent } from "@/components/ai-agent";
import { MapPin, Calendar, Check, ArrowRight, Ticket, Star, Users } from "@/components/icons";

/* ─── Types ────────────────────────────────────────────────────────────── */

type DbEvent = {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_type: "Physique" | "En ligne";
  location: string;
  meet_link?: string | null;
  price: number;
  spots_max: number | null;
  tier_required: string;
  created_at: string;
  image_url?: string | null;
  event_registrations: { id: string }[];
};

type DerivedEvent = DbEvent & {
  color: string;
  day: string;
  month: string;
  dateLabel: string;
  timeLabel: string;
  spotsLeft: number | null;
};

/* ─── Constantes ────────────────────────────────────────────────────────── */

const TIER_RANK: Record<string, number> = { Standard: 1, Pro: 2, Élite: 3 };

const TIER_COLOR: Record<string, string> = {
  Standard: "#766391",
  Pro:      "#3871c2",
  Élite:    "#ffac42",
};

const MONTH_FR = [
  "JAN","FÉV","MAR","AVR","MAI","JUN",
  "JUL","AOÛ","SEP","OCT","NOV","DÉC",
];

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function deriveEvent(e: DbEvent): DerivedEvent {
  const d = new Date(e.event_date);
  const regCount = e.event_registrations?.length ?? 0;
  return {
    ...e,
    color:     TIER_COLOR[e.tier_required] ?? "#766391",
    day:       String(d.getDate()).padStart(2, "0"),
    month:     MONTH_FR[d.getMonth()],
    dateLabel: d.toLocaleDateString("fr-FR", {
      weekday: "short", day: "numeric", month: "long", year: "numeric",
    }),
    timeLabel: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    spotsLeft: e.spots_max !== null ? Math.max(0, e.spots_max - regCount) : null,
  };
}

function generateTicketCode(userId: string): string {
  const ts  = Date.now().toString(36).toUpperCase().slice(-5);
  const uid = userId.slice(0, 4).toUpperCase();
  return `PROP-${ts}-${uid}`;
}

function getConfirmUrgency(eventDate: string): "ok" | "warning" | "urgent" {
  const days = (new Date(eventDate).getTime() - Date.now()) / 86400000;
  if (days <= 1) return "urgent";
  if (days <= 3) return "warning";
  return "ok";
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

/* ─── Composant billet ──────────────────────────────────────────────────── */

function TicketCard({ event, ticketCode, confirmedAt, onConfirm }: {
  event: DerivedEvent; ticketCode: string;
  confirmedAt?: string | null; onConfirm?: () => void;
}) {
  const urgency = confirmedAt ? "done" : getConfirmUrgency(event.event_date);
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E0DDD8] bg-white">
      <div className="px-5 py-3" style={{ background: event.color }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Billet officiel Propulsion</p>
        <p className="mt-0.5 text-[13px] font-bold text-white">{event.title}</p>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="grid grid-cols-2 gap-3 text-[12.5px]">
          <div>
            <p className="text-[9.5px] font-bold uppercase tracking-widest text-faint">Date</p>
            <p className="mt-0.5 font-semibold text-ink">{event.dateLabel} · {event.timeLabel}</p>
          </div>
          <div>
            <p className="text-[9.5px] font-bold uppercase tracking-widest text-faint">Lieu</p>
            <p className="mt-0.5 font-semibold text-ink">{event.location}</p>
          </div>
        </div>

        <div className="space-y-2 rounded-xl bg-[#F4F3F0] px-4 py-3 text-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted">Numéro de billet</p>
          <p className="font-mono text-xl font-bold tracking-wider text-ink">{ticketCode}</p>
          <div className="flex items-end justify-center gap-[2px] py-1">
            {Array.from(ticketCode.replace(/-/g, "")).map((c, i) => (
              <div key={i} className="rounded-sm bg-ink"
                style={{ width: i % 3 === 0 ? "3px" : "2px", height: `${20 + (c.charCodeAt(0) % 16)}px`, opacity: 0.85 }}/>
            ))}
          </div>
          <p className="text-[10.5px] text-muted">
            {event.event_type === "En ligne" ? "Code d'accès à l'événement en ligne" : "Présentez ce code à l'entrée de l'événement"}
          </p>
        </div>

        {event.event_type === "En ligne" && event.meet_link && (
          <a
            href={event.meet_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-[#34A853]/30 bg-[#34A853]/8 px-4 py-3 text-[13px] font-semibold text-[#1E7E34] transition-colors hover:bg-[#34A853]/15"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14"/>
              <rect x="3" y="8" width="12" height="8" rx="2"/>
            </svg>
            Rejoindre sur Google Meet
          </a>
        )}

        {/* Confirmation de présence */}
        {urgency === "done" ? (
          <div className="flex items-center gap-2 rounded-xl bg-[#22c55e]/10 px-4 py-3 text-[13px] font-semibold text-[#16a34a]">
            <Check width={15} height={15}/> Présence confirmée
          </div>
        ) : (
          <button onClick={onConfirm}
            className={`w-full rounded-xl px-4 py-3 text-[13px] font-bold transition-all active:scale-[0.98] ${
              urgency === "urgent"
                ? "animate-pulse bg-[#ff1e58] text-white"
                : urgency === "warning"
                  ? "bg-[#ffac42] text-white"
                  : "border border-brand/30 bg-brand/8 text-brand hover:bg-brand/15"
            }`}>
            {urgency === "urgent" ? "⚠ Confirmez maintenant — dernier délai !" :
             urgency === "warning" ? "⏳ Confirmez votre présence (J-3)" :
             "Confirmer ma présence"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function EvenementsPage() {
  const [role, setRole]                   = useState("Standard");
  const [userId, setUserId]               = useState<string | null>(null);
  const [events, setEvents]               = useState<DerivedEvent[]>([]);
  const [registrations, setRegistrations] = useState<string[]>([]);
  const [tickets, setTickets]             = useState<Record<string, string>>({});
  const [confirmations, setConfirmations] = useState<Record<string, string>>({});
  const [activeTicket, setActiveTicket]   = useState<string | null>(null);
  const [upsellFor, setUpsellFor]         = useState<string | null>(null);
  const [tab, setTab]                     = useState<"events" | "billets">("events");
  const [loading, setLoading]             = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event !== "INITIAL_SESSION") return;

        const { data: evts } = await supabase
          .from("events")
          .select("id,title,description,event_date,event_type,location,meet_link,price,spots_max,tier_required,created_at,image_url,event_registrations(id)")
          .gte("event_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order("event_date")
          .limit(100);

        if (evts) setEvents((evts as unknown as DbEvent[]).map(deriveEvent));
        setEventsLoading(false);

        if (!session?.user) return;
        const uid = session.user.id;
        setUserId(uid);

        const [{ data: m }, { data: regs }] = await Promise.all([
          supabase.from("members").select("role").eq("id", uid).single(),
          supabase.from("event_registrations").select("event_id,ticket_code,confirmed_at").eq("member_id", uid),
        ]);

        if (m?.role) setRole(m.role);
        if (regs) {
          setRegistrations(regs.map((r) => r.event_id));
          const tmap: Record<string, string> = {};
          const cmap: Record<string, string> = {};
          regs.forEach((r) => {
            tmap[r.event_id] = r.ticket_code;
            if (r.confirmed_at) cmap[r.event_id] = r.confirmed_at;
          });
          setTickets(tmap);
          setConfirmations(cmap);
        }
      },
    );
    return () => subscription.unsubscribe();
  }, []);

  const userRank = TIER_RANK[role] ?? 1;

  const handleRegister = async (eventId: string, tierRequired: string) => {
    const required = TIER_RANK[tierRequired] ?? 1;
    if (userRank < required) { setUpsellFor(eventId); return; }

    if (registrations.includes(eventId)) {
      setRegistrations((prev) => prev.filter((x) => x !== eventId));
      setEvents((prev) =>
        prev.map((e) => e.id === eventId && e.spots_max !== null
          ? { ...e, spotsLeft: (e.spotsLeft ?? 0) + 1 } : e),
      );
      if (userId) {
        await supabase.from("event_registrations").delete().eq("member_id", userId).eq("event_id", eventId);
      }
      return;
    }

    if (!userId) return;
    setLoading(true);
    const ticketCode = generateTicketCode(userId);
    const { error } = await supabase.from("event_registrations").insert({
      member_id: userId, event_id: eventId, ticket_code: ticketCode,
    });
    if (!error) {
      setRegistrations((prev) => [...prev, eventId]);
      setTickets((prev) => ({ ...prev, [eventId]: ticketCode }));
      setEvents((prev) =>
        prev.map((e) => e.id === eventId && e.spots_max !== null
          ? { ...e, spotsLeft: Math.max(0, (e.spotsLeft ?? 1) - 1) } : e),
      );
    }
    setLoading(false);
  };

  const handleConfirm = async (eventId: string) => {
    if (!userId || confirmations[eventId]) return;
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("event_registrations")
      .update({ confirmed_at: now })
      .eq("member_id", userId)
      .eq("event_id", eventId);
    if (!error) setConfirmations(prev => ({ ...prev, [eventId]: now }));
  };

  const myEvents = events.filter((e) => registrations.includes(e.id));

  return (
    <MemberLayout role={role}>
      <div className="min-h-full bg-[#F4F3F0]">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

          {/* Brand bar */}
          <BrandBar />

          {/* Header */}
          <div className="mt-7 mb-7">
            <h1 className="font-serif text-3xl font-bold text-ink">Événements</h1>
            <p className="mt-1 text-[13px] text-muted">Masterclasses physiques, Apéros Business et sprints en ligne.</p>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-1 rounded-2xl border border-[#E0DDD8] bg-white p-1">
            {(["events", "billets"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 rounded-xl py-2 text-[13px] font-semibold transition-colors ${tab === t ? "bg-brand text-white shadow-sm" : "text-muted hover:text-ink"}`}>
                {t === "events" ? "Événements" : `Mes billets${myEvents.length > 0 ? ` (${myEvents.length})` : ""}`}
              </button>
            ))}
          </div>

          {/* ── Liste des événements ── */}
          {tab === "events" && (
            <div className="space-y-4">
              {eventsLoading && (
                <div className="flex justify-center py-16">
                  <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"/>
                </div>
              )}

              {!eventsLoading && events.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#E0DDD8] bg-white p-12 text-center">
                  <Calendar width={32} height={32} className="mx-auto mb-3 text-faint"/>
                  <p className="text-[15px] font-bold text-ink">Aucun événement à venir</p>
                  <p className="mt-1.5 text-[13px] text-muted">Revenez prochainement pour les prochains événements Propulsion.</p>
                </div>
              )}

              {events.map((evt) => {
                const isRegistered = registrations.includes(evt.id);
                const hasAccess    = userRank >= (TIER_RANK[evt.tier_required] ?? 1);
                const showUpsell   = upsellFor === evt.id;

                return (
                  <article key={evt.id} className="overflow-hidden rounded-2xl border border-[#E0DDD8] bg-white transition-all hover:border-brand/20 hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)]">

                    {/* Color accent strip or image */}
                    {evt.image_url ? (
                      <div className="relative h-44 w-full overflow-hidden bg-neutral-900">
                        <img src={evt.image_url} alt="" className="h-full w-full object-cover"/>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"/>
                        <span className="absolute bottom-3 right-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white"
                          style={{ background: evt.color }}>{evt.tier_required}</span>
                      </div>
                    ) : (
                      <div className="h-1.5 w-full" style={{ background: evt.color }}/>
                    )}

                    <div className="p-5">
                      <div className="flex gap-5">
                        {/* Date block */}
                        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl text-white shadow-sm"
                          style={{ background: evt.color }}>
                          <span className="text-[22px] font-black leading-none">{evt.day}</span>
                          <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5">{evt.month}</span>
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2 flex-wrap mb-1">
                            <h3 className="text-[15px] font-bold text-ink leading-snug">{evt.title}</h3>
                            <span className="shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold"
                              style={{ background: `${evt.color}15`, color: evt.color }}>
                              {evt.tier_required}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-[12.5px] leading-snug text-muted mb-3">{evt.description}</p>

                          <div className="flex flex-wrap gap-3 text-[12px] text-faint">
                            <span className="flex items-center gap-1">
                              <Calendar width={12} height={12}/> {evt.dateLabel} · {evt.timeLabel}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin width={12} height={12}/> {evt.location}
                            </span>
                            {evt.event_type === "Physique" && evt.spotsLeft !== null && (
                              <span className="flex items-center gap-1">
                                <Users width={12} height={12}/>
                                {evt.spotsLeft} place{evt.spotsLeft > 1 ? "s" : ""} restante{evt.spotsLeft > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Upsell */}
                      {showUpsell && !hasAccess && (
                        <div className="mt-4 rounded-xl border border-[#E0DDD8] bg-[#F4F3F0] p-3.5">
                          <p className="text-[12.5px] font-medium text-ink">
                            Cet événement est réservé aux membres <span className="font-bold text-brand">{evt.tier_required}</span>.
                          </p>
                          <a href={`/rejoindre?offer=${evt.tier_required}`}
                            className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-brand/90 transition-colors">
                            Passer en {evt.tier_required} <ArrowRight width={13} height={13}/>
                          </a>
                        </div>
                      )}

                      {/* Lien Google Meet pour les inscrits */}
                      {isRegistered && evt.event_type === "En ligne" && evt.meet_link && (
                        <a
                          href={evt.meet_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-[#34A853]/30 bg-[#34A853]/8 px-4 py-2.5 text-[13px] font-semibold text-[#1E7E34] transition-colors hover:bg-[#34A853]/15"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14"/>
                            <rect x="3" y="8" width="12" height="8" rx="2"/>
                          </svg>
                          Rejoindre sur Google Meet
                        </a>
                      )}

                      {/* Confirmation badge (registered only, before event) */}
                      {isRegistered && new Date(evt.event_date) > new Date() && (() => {
                        const confirmed = !!confirmations[evt.id];
                        const urgency   = confirmed ? "done" : getConfirmUrgency(evt.event_date);
                        return confirmed ? (
                          <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-[#22c55e]/10 px-3 py-2 text-[12px] font-semibold text-[#16a34a]">
                            <Check width={13} height={13}/> Présence confirmée
                          </div>
                        ) : (
                          <button onClick={() => handleConfirm(evt.id)}
                            className={`mt-3 w-full rounded-xl px-3 py-2 text-[12.5px] font-bold transition-all active:scale-[0.98] ${
                              urgency === "urgent" ? "animate-pulse bg-[#ff1e58] text-white" :
                              urgency === "warning" ? "bg-[#ffac42] text-white" :
                              "border border-brand/30 bg-brand/8 text-brand hover:bg-brand/15"
                            }`}>
                            {urgency === "urgent" ? "⚠ Confirmez maintenant — dernier délai !" :
                             urgency === "warning" ? "⏳ Confirmez votre présence (J-3)" :
                             "Confirmer ma présence"}
                          </button>
                        );
                      })()}

                      {/* Footer */}
                      <div className="mt-4 flex items-center justify-between border-t border-[#E0DDD8] pt-3">
                        <span className="rounded-full px-2.5 py-1 text-[10.5px] font-bold"
                          style={{
                            background: evt.event_type === "En ligne" ? "#f5f0ff" : `${evt.color}12`,
                            color:      evt.event_type === "En ligne" ? "#766391" : evt.color,
                          }}>
                          {evt.event_type}
                        </span>

                        <button
                          onClick={() => { setUpsellFor(null); handleRegister(evt.id, evt.tier_required); }}
                          disabled={loading}
                          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition-all active:scale-[0.97] disabled:opacity-60 ${
                            isRegistered
                              ? "bg-[#E0DDD8] text-muted hover:bg-[#ff1e58]/10 hover:text-[#ff1e58]"
                              : hasAccess
                                ? "text-white hover:opacity-90"
                                : "border border-[#E0DDD8] text-muted hover:border-brand/30 hover:text-brand"
                          }`}
                          style={!isRegistered && hasAccess ? { background: evt.color } : undefined}
                        >
                          {isRegistered ? (
                            <><Check width={13} height={13}/> Inscrit</>
                          ) : hasAccess ? (
                            <><Ticket width={13} height={13}/> S&apos;inscrire</>
                          ) : (
                            <><Star width={13} height={13}/> {evt.tier_required} requis</>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* ── Mes billets ── */}
          {tab === "billets" && (
            <div>
              {myEvents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#E0DDD8] bg-white p-12 text-center">
                  <Ticket width={32} height={32} className="mx-auto mb-3 text-faint"/>
                  <p className="text-[15px] font-bold text-ink">Aucun billet pour l&apos;instant</p>
                  <p className="mt-1.5 text-[13px] text-muted">Inscrivez-vous à un événement pour obtenir votre billet.</p>
                  <button onClick={() => setTab("events")}
                    className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-brand/90 transition-colors">
                    Voir les événements <ArrowRight width={13} height={13}/>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myEvents.map((evt) => {
                    const ticketCode = tickets[evt.id] ?? `PROP-${evt.id.slice(0, 8).toUpperCase()}`;
                    const isOpen     = activeTicket === evt.id;
                    return (
                      <div key={evt.id}>
                        <button
                          onClick={() => setActiveTicket(isOpen ? null : evt.id)}
                          className="flex w-full items-center gap-3 rounded-2xl border border-[#E0DDD8] bg-white p-4 text-left transition-colors hover:border-brand/30"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: evt.color }}>
                            <Ticket width={18} height={18}/>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13.5px] font-bold text-ink">{evt.title}</p>
                            <p className="text-[12px] text-muted">{evt.dateLabel}</p>
                          </div>
                          <span className={`text-[14px] font-semibold text-brand transition-transform ${isOpen ? "rotate-90" : ""}`}>›</span>
                        </button>
                        {isOpen && (
                          <div className="mt-2">
                            <TicketCard event={evt} ticketCode={ticketCode}
                              confirmedAt={confirmations[evt.id]}
                              onConfirm={() => handleConfirm(evt.id)}/>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
