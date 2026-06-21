"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/utils/supabase/client";
import { MemberLayout } from "@/components/member-layout";
import { AiAgent } from "@/components/ai-agent";
import { Search, MapPin, Briefcase, Filter, ExternalLink } from "@/components/icons";

function LockIcon({ width = 14, height = 14 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

const SP = "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]";

type Contact = {
  id: string; first_name: string; last_name: string;
  company: string | null; sector: string | null;
  city: string | null; country: string | null;
  phone: string | null; email: string | null;
  whatsapp: string | null; website: string | null;
  bio: string | null; avatar_url: string | null;
  is_published: boolean;
  whatsapp_visible: boolean;
  email_visible: boolean;
};

const SECTORS = [
  "Tous secteurs","Commerce","Tech","Immobilier","Agrobusiness",
  "Finance","Conseil","Marketing","Santé","Éducation","Industrie",
] as const;

const PAGE_SIZE = 24;
const CONTACT_SELECT = "id,first_name,last_name,company,sector,city,country,phone,email,whatsapp,website,bio,avatar_url,is_published,whatsapp_visible,email_visible";

function initials(c: Contact) {
  return (c.first_name[0] + (c.last_name[0] ?? "")).toUpperCase();
}

/* ── WhatsApp access logic ──────────────────────────────────────── */
type WaAccess = "full" | "request" | "locked";

function getWaAccess(role: string, targetWaVisible: boolean): WaAccess {
  if (["Admin", "Modérateur"].includes(role)) return "full";
  if (role === "Élite") return targetWaVisible ? "full" : "request";
  if (role === "Pro") return "request";
  return "locked";
}

/* ── Contact card ───────────────────────────────────────────────── */
function ContactCard({ c, viewerRole, onRequestContact }: {
  c: Contact; viewerRole: string; onRequestContact: (c: Contact) => void;
}) {
  const init    = initials(c);
  const access  = getWaAccess(viewerRole, c.whatsapp_visible);
  const waLink  = c.whatsapp ? `https://wa.me/${c.whatsapp.replace(/\D/g, "")}` : null;
  const colors  = ["#2E6FD4","#6C3FC5","#C9A84C","#E8385A","#16a34a"];
  const seed    = (c.first_name.charCodeAt(0) ?? 0) % colors.length;
  const color   = colors[seed];

  return (
    <article className={`group relative flex flex-col rounded-[1.75rem] bg-white border border-[#E8E6E1] overflow-hidden ${SP} hover:shadow-[0_12px_40px_rgba(21,19,14,0.10)] hover:-translate-y-0.5`}>

      {/* Avatar shell */}
      <div className="p-1.5 pb-0">
        <div className="relative rounded-[calc(1.75rem-0.375rem)] overflow-hidden bg-[#F4F3F0]"
          style={{ background: `linear-gradient(135deg, ${color}18 0%, #F4F3F0 100%)` }}>
          <div className="h-20 flex items-center justify-center">
            {c.avatar_url ? (
              <img src={c.avatar_url} alt="" className="h-full w-full object-cover absolute inset-0"/>
            ) : (
              <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl font-bold text-[22px] text-white"
                style={{ background: color }}>{init}</span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3 gap-2.5">
        <div>
          <p className="text-[14px] font-bold text-[#15130E] leading-tight">{c.first_name} {c.last_name}</p>
          {c.company && <p className="mt-0.5 text-[11.5px] text-[#8A857E] font-medium truncate">{c.company}</p>}
        </div>

        <div className="space-y-1">
          {c.sector && (
            <div className="flex items-center gap-1.5 text-[11.5px] text-[#8A857E]">
              <Briefcase width={11} height={11} className="shrink-0 text-[#C8C5BF]"/>
              <span className="truncate">{c.sector}</span>
            </div>
          )}
          {(c.city || c.country) && (
            <div className="flex items-center gap-1.5 text-[11.5px] text-[#8A857E]">
              <MapPin width={11} height={11} className="shrink-0 text-[#C8C5BF]"/>
              <span className="truncate">{[c.city, c.country].filter(Boolean).join(", ")}</span>
            </div>
          )}
        </div>

        {c.bio && (
          <p className="text-[11.5px] text-[#8A857E] leading-relaxed line-clamp-2 flex-1">{c.bio}</p>
        )}

        {/* Footer actions */}
        <div className="flex items-center gap-2 pt-2.5 border-t border-[#F0EDE8]">

          {/* WhatsApp — tiered */}
          {c.whatsapp && access === "full" && waLink && (
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className={`flex items-center gap-1.5 rounded-full bg-[#25d366]/10 px-3 py-1.5 text-[11px] font-bold text-[#1a9e52] ${SP} hover:bg-[#25d366]/20`}>
              <WhatsAppIcon /> WhatsApp
            </a>
          )}

          {c.whatsapp && access === "request" && (
            <button onClick={() => onRequestContact(c)}
              className={`flex items-center gap-1.5 rounded-full bg-[#6C3FC5]/10 px-3 py-1.5 text-[11px] font-bold text-[#6C3FC5] ${SP} hover:bg-[#6C3FC5]/20`}>
              <ContactRequestIcon /> Demander le contact
            </button>
          )}

          {c.whatsapp && access === "locked" && (
            <span className={`flex items-center gap-1.5 rounded-full bg-[#F0EDE8] px-3 py-1.5 text-[11px] font-semibold text-[#C8C5BF] cursor-not-allowed select-none`}
              title="Disponible dès l'abonnement Pro">
              <LockIcon width={11} height={11}/> Contact Pro
            </span>
          )}

          {/* Website */}
          {c.website && (
            <a href={c.website} target="_blank" rel="noopener noreferrer"
              className={`ml-auto flex items-center gap-1 text-[11px] text-[#2E6FD4] font-semibold ${SP} hover:underline`}>
              <ExternalLink width={11} height={11}/> Site
            </a>
          )}

          {/* Email */}
          {c.email && c.email_visible && !c.website && (
            <a href={`mailto:${c.email}`}
              className="ml-auto text-[11px] text-[#2E6FD4] font-semibold hover:underline truncate">
              ✉ Email
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

/* ── Inline SVG icons ───────────────────────────────────────────── */
function WhatsAppIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.374 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.837L.057 23.882a.5.5 0 0 0 .604.627l6.218-1.637A11.94 11.94 0 0 0 12 24c6.626 0 12-5.373 12-12S18.626 0 12 0zm0 22c-1.89 0-3.661-.518-5.176-1.42l-.369-.221-3.843 1.012 1.03-3.762-.24-.386A10 10 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  );
}

function ContactRequestIcon() {
  return (
    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

/* ── Contact request modal ──────────────────────────────────────── */
function ContactRequestModal({ contact, onClose, onConfirm }: {
  contact: Contact; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[#15130E]/50 backdrop-blur-sm"/>
      <div className="relative z-10 w-full max-w-sm rounded-[1.75rem] bg-white border border-[#E8E6E1] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="h-[3px] w-full bg-gradient-to-r from-[#6C3FC5] to-[#2E6FD4]"/>
        <div className="p-6 space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8A857E]">Mise en relation</span>
            <h3 className="mt-1 font-serif text-[18px] font-bold text-[#15130E]">
              Contacter {contact.first_name} {contact.last_name}
            </h3>
            <p className="mt-2 text-[12.5px] text-[#8A857E] leading-relaxed">
              Votre demande sera transmise à l&apos;équipe Propulsion. Un administrateur vous mettra en relation sous 24h.
            </p>
          </div>
          <div className="rounded-2xl border border-[#F0EDE8] bg-[#F9F8F6] p-3.5 space-y-1">
            {contact.company && <p className="text-[12px] font-semibold text-[#15130E]">{contact.company}</p>}
            {contact.sector && <p className="text-[11.5px] text-[#8A857E]">{contact.sector}</p>}
            {(contact.city || contact.country) && (
              <p className="text-[11.5px] text-[#8A857E]">{[contact.city, contact.country].filter(Boolean).join(", ")}</p>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className={`flex-1 h-10 rounded-full border border-[#E8E6E1] text-[12.5px] font-semibold text-[#8A857E] ${SP} hover:border-[#C8C5BF] hover:text-[#15130E]`}>
              Annuler
            </button>
            <button onClick={onConfirm}
              className={`flex-1 h-10 rounded-full bg-[#6C3FC5] text-white text-[12.5px] font-bold ${SP} hover:bg-[#5a33a8] active:scale-95`}>
              Confirmer la demande
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────── */
export default function AnnuairePage() {
  const [role, setRole]               = useState("Standard");
  const [contacts, setContacts]       = useState<Contact[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset]           = useState(0);
  const [search, setSearch]           = useState("");
  const [sectorF, setSectorF]         = useState<string>("Tous secteurs");
  const [countryF, setCountryF]       = useState<string>("Tous pays");
  const [cityF, setCityF]             = useState<string>("Toutes villes");
  const [showFilter, setShowFilter]   = useState(false);
  const [countries, setCountries]     = useState<string[]>(["Tous pays"]);
  const [cities, setCities]           = useState<string[]>(["Toutes villes"]);
  const [requestTarget, setRequestTarget] = useState<Contact | null>(null);
  const [requestSent, setRequestSent]     = useState<string | null>(null);
  const sentinelRef                   = useRef<HTMLDivElement>(null);
  const loadMoreRef                   = useRef<() => Promise<void>>(async () => {});
  const debounceRef                   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender                 = useRef(true);

  const buildQuery = useCallback((from: number, q: string, sector: string, country: string, city: string) => {
    let query = supabase
      .from("annuaire")
      .select(CONTACT_SELECT, { count: "exact" })
      .eq("is_published", true)
      .order("last_name", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (q.trim()) {
      const esc = q.trim();
      query = query.or(
        `first_name.ilike.%${esc}%,last_name.ilike.%${esc}%,company.ilike.%${esc}%,sector.ilike.%${esc}%,city.ilike.%${esc}%,country.ilike.%${esc}%`
      );
    }
    if (sector !== "Tous secteurs") query = query.eq("sector", sector);
    if (country !== "Tous pays")   query = query.eq("country", country);
    if (city !== "Toutes villes")  query = query.eq("city", city);

    return query;
  }, []);

  const fetchFresh = useCallback(async (q: string, sector: string, country: string, city: string) => {
    setLoading(true);
    const { data, count } = await buildQuery(0, q, sector, country, city);
    setContacts((data as Contact[]) ?? []);
    setTotal(count ?? 0);
    setOffset((data?.length ?? 0));
    setLoading(false);
  }, [buildQuery]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== "INITIAL_SESSION") return;
      if (session?.user) {
        const { data: m } = await supabase.from("members").select("role").eq("id", session.user.id).single();
        if (m) setRole(m.role);
      }

      const { data: opts } = await supabase
        .from("annuaire").select("country,city").eq("is_published", true);

      if (opts) {
        const uc  = Array.from(new Set(opts.map(r => r.country).filter(Boolean))).sort() as string[];
        const uci = Array.from(new Set(opts.map(r => r.city).filter(Boolean))).sort() as string[];
        setCountries(["Tous pays", ...uc]);
        setCities(["Toutes villes", ...uci]);
      }

      await fetchFresh("", "Tous secteurs", "Tous pays", "Toutes villes");
    });
    return () => subscription.unsubscribe();
  }, [fetchFresh]);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const delay = search ? 400 : 0;
    debounceRef.current = setTimeout(() => {
      fetchFresh(search, sectorF, countryF, cityF);
    }, delay);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, sectorF, countryF, cityF, fetchFresh]);

  const loadMore = useCallback(async () => {
    if (loadingMore || offset >= total) return;
    setLoadingMore(true);
    const { data } = await buildQuery(offset, search, sectorF, countryF, cityF);
    if (data?.length) {
      setContacts(prev => [...prev, ...(data as Contact[])]);
      setOffset(o => o + data.length);
    }
    setLoadingMore(false);
  }, [loadingMore, offset, total, search, sectorF, countryF, cityF, buildQuery]);

  useEffect(() => { loadMoreRef.current = loadMore; }, [loadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMoreRef.current(); },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const handleRequestConfirm = async () => {
    if (!requestTarget) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("notifications").insert({
        member_id: user?.id,
        title: "Demande de mise en relation",
        message: `Demande de contact pour ${requestTarget.first_name} ${requestTarget.last_name}${requestTarget.company ? ` (${requestTarget.company})` : ""}`,
        type: "info",
      });
    } catch { /* best-effort */ }
    setRequestSent(requestTarget.id);
    setRequestTarget(null);
    setTimeout(() => setRequestSent(null), 4000);
  };

  const hasFilters = search || sectorF !== "Tous secteurs" || countryF !== "Tous pays" || cityF !== "Toutes villes";
  const access     = getWaAccess(role, true);

  return (
    <MemberLayout role={role}>
      <div className="min-h-full bg-[#F4F3F0]">

        {/* Grain overlay */}
        <div className="pointer-events-none fixed inset-0 z-[5] opacity-[0.025]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")` }}/>

        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">

          {/* Brand bar */}
          <div className="flex h-[3px] w-full overflow-hidden rounded-full mb-8">
            {["#2E6FD4","#C9A84C","#6C3FC5","#E8385A","#16a34a"].map(c => (
              <span key={c} className="flex-1" style={{ background: c }}/>
            ))}
          </div>

          {/* Header */}
          <div className="mb-7 flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E0DDD8] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8A857E]">
                Réseau
              </span>
              <h1 className="mt-3 font-serif text-[2rem] sm:text-[2.5rem] font-bold text-[#15130E] leading-tight">
                Annuaire
              </h1>
              <p className="mt-1.5 text-[13.5px] text-[#8A857E] max-w-lg">
                Le répertoire des entrepreneurs membres Propulsion.
              </p>
            </div>
            <div className={`shrink-0 rounded-full border border-[#E8E6E1] bg-white px-3.5 py-1.5 text-[12px] font-bold text-[#15130E] ${SP}`}>
              {loading ? "…" : total} membres
            </div>
          </div>

          {/* Access level banner for Standard */}
          {access === "locked" && (
            <div className="mb-6 rounded-[1.5rem] border border-[#E8E6E1] bg-white p-1.5">
              <div className="flex items-center gap-3 rounded-[calc(1.5rem-0.375rem)] bg-[#F9F8F6] px-4 py-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6C3FC5]/10 text-[#6C3FC5]">
                  <LockIcon width={14} height={14}/>
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-bold text-[#15130E]">Contacts WhatsApp disponibles dès l&apos;abonnement Pro</p>
                  <p className="text-[11.5px] text-[#8A857E] mt-0.5">Vous pouvez consulter les profils — les contacts directs sont réservés aux membres Pro et Élite.</p>
                </div>
              </div>
            </div>
          )}

          {/* Request sent toast */}
          {requestSent && (
            <div className={`mb-4 rounded-2xl border border-[#6C3FC5]/20 bg-[#6C3FC5]/8 px-4 py-3 flex items-center gap-3 ${SP}`}>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6C3FC5] text-white text-[10px] font-bold">✓</span>
              <p className="text-[12.5px] font-semibold text-[#6C3FC5]">Demande de mise en relation envoyée. L&apos;équipe Propulsion vous contactera sous 24h.</p>
            </div>
          )}

          {/* Search + filter */}
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search width={15} height={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C8C5BF]"/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Nom, entreprise, secteur, ville…"
                className="w-full h-10 rounded-xl border border-[#E8E6E1] bg-white pl-9 pr-3 text-[13px] text-[#15130E] outline-none focus:border-[#2E6FD4] shadow-none"/>
            </div>
            <button onClick={() => setShowFilter(f => !f)}
              className={`flex h-10 items-center gap-1.5 rounded-xl border px-3.5 text-[12.5px] font-semibold ${SP} ${
                showFilter ? "border-[#2E6FD4] bg-[#2E6FD4]/5 text-[#2E6FD4]"
                : "border-[#E8E6E1] bg-white text-[#8A857E] hover:text-[#15130E]"
              }`}>
              <Filter width={13} height={13}/> Filtrer
            </button>
          </div>

          {/* Filters panel */}
          {showFilter && (
            <div className="mb-4 rounded-2xl border border-[#E8E6E1] bg-white p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A857E]">Pays</label>
                  <select value={countryF} onChange={e => setCountryF(e.target.value)}
                    className="w-full h-10 rounded-xl border border-[#E8E6E1] bg-white px-3 text-[13px] text-[#15130E] outline-none focus:border-[#2E6FD4]">
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A857E]">Ville</label>
                  <select value={cityF} onChange={e => setCityF(e.target.value)}
                    className="w-full h-10 rounded-xl border border-[#E8E6E1] bg-white px-3 text-[13px] text-[#15130E] outline-none focus:border-[#2E6FD4]">
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A857E]">Secteur d&apos;activité</p>
                <div className="flex flex-wrap gap-1.5">
                  {SECTORS.map(s => (
                    <button key={s} onClick={() => setSectorF(s)}
                      className={`rounded-full px-3 py-1 text-[11.5px] font-semibold ${SP} ${
                        sectorF === s ? "bg-[#15130E] text-white" : "border border-[#E8E6E1] bg-[#F4F3F0] text-[#8A857E] hover:text-[#15130E]"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Results summary */}
          {!loading && (
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[12.5px] text-[#8A857E]">
                <span className="font-bold text-[#15130E]">{total}</span> contact{total !== 1 ? "s" : ""}
                {contacts.length < total && (
                  <span className="text-[#C8C5BF]"> · {contacts.length} chargés</span>
                )}
              </p>
              {hasFilters && (
                <button onClick={() => { setSearch(""); setSectorF("Tous secteurs"); setCountryF("Tous pays"); setCityF("Toutes villes"); }}
                  className="text-[12px] font-semibold text-[#2E6FD4] hover:underline">
                  Réinitialiser
                </button>
              )}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-16">
              <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#2E6FD4] border-t-transparent"/>
            </div>
          )}

          {/* Empty state */}
          {!loading && contacts.length === 0 && (
            <div className="rounded-[1.75rem] border border-dashed border-[#E8E6E1] bg-white py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2E6FD4]/10">
                <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#2E6FD4" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              {hasFilters ? (
                <>
                  <p className="text-[15px] font-bold text-[#15130E]">Aucun résultat</p>
                  <p className="mt-1 text-[13px] text-[#8A857E]">Essayez un autre terme ou réinitialisez les filtres.</p>
                  <button onClick={() => { setSearch(""); setSectorF("Tous secteurs"); setCountryF("Tous pays"); setCityF("Toutes villes"); }}
                    className={`mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#15130E] px-5 py-2 text-[13px] font-semibold text-white ${SP} hover:opacity-90`}>
                    Voir tous les contacts
                  </button>
                </>
              ) : (
                <>
                  <p className="text-[15px] font-bold text-[#15130E]">L&apos;annuaire se construit</p>
                  <p className="mt-1.5 text-[13px] text-[#8A857E] max-w-sm mx-auto leading-relaxed">
                    Les membres qui activent leur visibilité apparaissent ici.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Grid */}
          {!loading && contacts.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {contacts.map(c => (
                <ContactCard key={c.id} c={c} viewerRole={role}
                  onRequestContact={setRequestTarget}/>
              ))}
            </div>
          )}

          {/* Infinite scroll */}
          <div ref={sentinelRef} className="h-1 mt-4"/>
          {loadingMore && (
            <div className="flex justify-center py-4">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#2E6FD4] border-t-transparent"/>
            </div>
          )}
          {!loading && !loadingMore && contacts.length > 0 && offset >= total && (
            <p className="py-4 text-center text-[12px] text-[#C8C5BF]">Tous les contacts ont été chargés.</p>
          )}

        </div>
      </div>

      {/* Contact request modal */}
      {requestTarget && (
        <ContactRequestModal
          contact={requestTarget}
          onClose={() => setRequestTarget(null)}
          onConfirm={handleRequestConfirm}
        />
      )}

      <AiAgent/>
    </MemberLayout>
  );
}
