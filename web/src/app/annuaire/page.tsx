"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/utils/supabase/client";
import { MemberLayout } from "@/components/member-layout";
import { AiAgent } from "@/components/ai-agent";
import { Users, Search, MapPin, MessageCircle, Briefcase, Filter, ExternalLink } from "@/components/icons";

type Contact = {
  id: string; first_name: string; last_name: string;
  company: string | null; sector: string | null;
  city: string | null; country: string | null;
  phone: string | null; email: string | null;
  whatsapp: string | null; website: string | null;
  bio: string | null; avatar_url: string | null;
  is_published: boolean;
};

const SECTORS = [
  "Tous secteurs","Commerce","Tech","Immobilier","Agrobusiness",
  "Finance","Conseil","Marketing","Santé","Éducation","Industrie",
] as const;

const PAGE_SIZE = 24;
const CONTACT_SELECT = "id,first_name,last_name,company,sector,city,country,phone,email,whatsapp,website,bio,avatar_url,is_published";

function initials(c: Contact) {
  return (c.first_name[0] + (c.last_name[0] ?? "")).toUpperCase();
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

function ContactCard({ c }: { c: Contact }) {
  const waLink = c.whatsapp ? `https://wa.me/${c.whatsapp.replace(/\D/g, "")}` : null;
  const initials_ = initials(c);

  return (
    <article className="group flex flex-col gap-3 rounded-2xl border border-[#E0DDD8] bg-white p-4 transition-all hover:border-brand/20 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-start gap-3">
        {c.avatar_url ? (
          <img src={c.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-[#E0DDD8] shrink-0"/>
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[14px] font-bold text-brand">{initials_}</div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-ink leading-tight truncate">{c.first_name} {c.last_name}</p>
          {c.company && <p className="mt-0.5 text-[11.5px] text-muted truncate font-medium">{c.company}</p>}
        </div>
        {waLink && (
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#25d366]/10 text-[#25d366] hover:bg-[#25d366]/20 transition-colors">
            <MessageCircle width={15} height={15}/>
          </a>
        )}
      </div>

      <div className="space-y-1.5">
        {c.sector && (
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <Briefcase width={12} height={12} className="shrink-0 text-faint"/>
            <span className="truncate">{c.sector}</span>
          </div>
        )}
        {(c.city || c.country) && (
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <MapPin width={12} height={12} className="shrink-0 text-faint"/>
            <span className="truncate">{[c.city, c.country].filter(Boolean).join(", ")}</span>
          </div>
        )}
      </div>

      {c.bio && <p className="text-[12px] text-muted leading-relaxed line-clamp-2">{c.bio}</p>}

      {(c.email || c.website) && (
        <div className="flex flex-wrap gap-2 pt-1 border-t border-[#E0DDD8]">
          {c.email && (
            <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 text-[11.5px] text-brand hover:underline truncate max-w-full">
              ✉ {c.email}
            </a>
          )}
          {c.website && (
            <a href={c.website} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11.5px] text-brand hover:underline">
              <ExternalLink width={11} height={11}/> Site web
            </a>
          )}
        </div>
      )}
    </article>
  );
}

export default function AnnuairePage() {
  const [role, setRole]           = useState("Standard");
  const [contacts, setContacts]   = useState<Contact[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset]       = useState(0);
  const [search, setSearch]       = useState("");
  const [sectorF, setSectorF]     = useState<string>("Tous secteurs");
  const [countryF, setCountryF]   = useState<string>("Tous pays");
  const [cityF, setCityF]         = useState<string>("Toutes villes");
  const [showFilter, setShowFilter] = useState(false);
  const [countries, setCountries] = useState<string[]>(["Tous pays"]);
  const [cities, setCities]       = useState<string[]>(["Toutes villes"]);
  const sentinelRef               = useRef<HTMLDivElement>(null);
  const loadMoreRef               = useRef<() => Promise<void>>(async () => {});
  const debounceRef               = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender             = useRef(true);

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

  /* Initial load */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== "INITIAL_SESSION") return;
      if (session?.user) {
        const { data: m } = await supabase.from("members").select("role").eq("id", session.user.id).single();
        if (m) setRole(m.role);
      }

      /* Filter dropdown options — lightweight query */
      const { data: opts } = await supabase
        .from("annuaire")
        .select("country,city")
        .eq("is_published", true);

      if (opts) {
        const uc = Array.from(new Set(opts.map(r => r.country).filter(Boolean))).sort() as string[];
        const uci = Array.from(new Set(opts.map(r => r.city).filter(Boolean))).sort() as string[];
        setCountries(["Tous pays", ...uc]);
        setCities(["Toutes villes", ...uci]);
      }

      await fetchFresh("", "Tous secteurs", "Tous pays", "Toutes villes");
    });
    return () => subscription.unsubscribe();
  }, [fetchFresh]);

  /* Re-fetch when filters change (skip first render — initial load handles it) */
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const delay = search ? 400 : 0;
    debounceRef.current = setTimeout(() => {
      fetchFresh(search, sectorF, countryF, cityF);
    }, delay);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, sectorF, countryF, cityF, fetchFresh]);

  /* Infinite scroll — load next page */
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

  const hasFilters = search || sectorF !== "Tous secteurs" || countryF !== "Tous pays" || cityF !== "Toutes villes";

  function resetFilters() {
    setSearch(""); setSectorF("Tous secteurs"); setCountryF("Tous pays"); setCityF("Toutes villes");
  }

  return (
    <MemberLayout role={role}>
      <div className="min-h-full bg-[#F4F3F0]">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">

          <BrandBar />

          <div className="mt-7 mb-7 flex items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold text-ink">Annuaire Professionnel</h1>
              <p className="mt-1 text-[13px] text-muted">Le répertoire de contacts de la communauté Propulsion.</p>
            </div>
            <div className="shrink-0 rounded-full bg-brand/10 px-3.5 py-1.5 text-[12px] font-bold text-brand">
              {loading ? "…" : total} membres
            </div>
          </div>

          {/* Search + filter toggle */}
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search width={15} height={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint"/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Nom, entreprise, secteur, ville…"
                className="w-full h-10 rounded-xl border border-[#E0DDD8] bg-white pl-9 pr-3 text-[13px] text-ink outline-none focus:border-brand shadow-none"/>
            </div>
            <button onClick={() => setShowFilter(f => !f)}
              className={`flex h-10 items-center gap-1.5 rounded-xl border px-3.5 text-[12.5px] font-semibold transition-colors ${showFilter ? "border-brand bg-brand/5 text-brand" : "border-[#E0DDD8] bg-white text-muted hover:text-ink"}`}>
              <Filter width={13} height={13}/> Filtrer
            </button>
          </div>

          {/* Sector / Country / City filters */}
          {showFilter && (
            <div className="mb-4 rounded-2xl border border-[#E0DDD8] bg-white p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-faint">Pays</label>
                  <select value={countryF} onChange={e => setCountryF(e.target.value)}
                    className="w-full h-10 rounded-xl border border-[#E0DDD8] bg-white px-3 text-[13px] text-ink outline-none focus:border-brand">
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-faint">Ville</label>
                  <select value={cityF} onChange={e => setCityF(e.target.value)}
                    className="w-full h-10 rounded-xl border border-[#E0DDD8] bg-white px-3 text-[13px] text-ink outline-none focus:border-brand">
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-faint">Secteur d&apos;activité</p>
                <div className="flex flex-wrap gap-1.5">
                  {SECTORS.map(s => (
                    <button key={s} onClick={() => setSectorF(s)}
                      className={`rounded-full px-3 py-1 text-[11.5px] font-semibold transition-colors ${sectorF === s ? "bg-brand text-white" : "border border-[#E0DDD8] bg-[#F4F3F0] text-muted hover:text-ink"}`}>
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
              <p className="text-[12.5px] text-muted">
                <span className="font-bold text-ink">{total}</span> contact{total !== 1 ? "s" : ""}
                {contacts.length < total && (
                  <span className="text-faint"> · {contacts.length} chargés</span>
                )}
              </p>
              {hasFilters && (
                <button onClick={resetFilters} className="text-[12px] font-semibold text-brand hover:underline">
                  Réinitialiser
                </button>
              )}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="flex justify-center py-16">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"/>
            </div>
          )}

          {/* Empty state */}
          {!loading && contacts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#E0DDD8] bg-white py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
                <Users width={24} height={24} className="text-brand"/>
              </div>
              {hasFilters ? (
                <>
                  <p className="text-[15px] font-bold text-ink">Aucun résultat</p>
                  <p className="mt-1 text-[13px] text-muted">Essayez un autre terme ou réinitialisez les filtres.</p>
                  <button onClick={resetFilters}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2 text-[13px] font-semibold text-white hover:bg-brand/90 transition-colors">
                    Voir tous les contacts
                  </button>
                </>
              ) : (
                <>
                  <p className="text-[15px] font-bold text-ink">L&apos;annuaire se construit</p>
                  <p className="mt-1.5 text-[13px] text-muted max-w-sm mx-auto leading-relaxed">
                    Les membres qui activent leur visibilité apparaissent ici. Complétez votre profil pour rejoindre le réseau.
                  </p>
                  <a href="/profil"
                    className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-brand/90 transition-colors">
                    Compléter mon profil
                  </a>
                </>
              )}
            </div>
          )}

          {/* Grid */}
          {!loading && contacts.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {contacts.map(c => <ContactCard key={c.id} c={c}/>)}
            </div>
          )}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1 mt-4" />
          {loadingMore && (
            <div className="flex justify-center py-4">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent"/>
            </div>
          )}
          {!loading && !loadingMore && contacts.length > 0 && offset >= total && (
            <p className="py-4 text-center text-[12px] text-faint">Tous les contacts ont été chargés.</p>
          )}

        </div>
      </div>
      <AiAgent/>
    </MemberLayout>
  );
}
