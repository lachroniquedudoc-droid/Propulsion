"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/utils/supabase/client";
import { MemberLayout } from "@/components/member-layout";
import { AiAgent } from "@/components/ai-agent";
import {
  Search, Plus, ArrowRight, Check, Briefcase,
  ExternalLink, Camera, Close, MapPin,
} from "@/components/icons";

/* ─── Types ──────────────────────────────────────────────────────────────── */

type Author = { first_name: string; last_name: string; role: string; avatar_url: string | null; };
type Offer = {
  id: string; author_id: string; author: Author;
  title: string; description: string; price: string;
  category: string; whatsapp: string; image_url: string | null;
  location: string | null; verified: boolean;
  status: "En attente" | "Approuvé" | "Rejeté";
  admin_note: string | null; created_at: string;
};
type DraftState = { title: string; description: string; price: string; category: string; location: string; whatsapp: string; };

/* ─── Constantes ─────────────────────────────────────────────────────────── */

const CAT_FILTERS = ["Toutes", "Prestation", "Produit", "Formation", "Conseil", "Autre"] as const;
type CatFilter = (typeof CAT_FILTERS)[number];
const POST_CATS = ["Prestation", "Produit", "Formation", "Conseil", "Autre"] as const;

const CAT_COLOR: Record<string, string> = {
  Prestation: "#3871c2", Produit: "#ffac42", Formation: "#766391", Conseil: "#ff1e58", Autre: "#555555",
};
const ROLE_COLOR: Record<string, string> = {
  Élite: "#ffac42", Pro: "#3871c2", Standard: "#766391", Admin: "#ff1e58",
};

const OFFER_SELECT = `
  id, author_id, title, description, price, category, whatsapp,
  image_url, location, verified, status, admin_note, created_at,
  author:members!author_id(first_name, last_name, role, avatar_url)
`.trim();

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function fullName(a: Author) { return `${a.first_name} ${a.last_name}`; }
function avatarInitials(a: Author) { return `${a.first_name?.[0] ?? ""}${a.last_name?.[0] ?? ""}`.toUpperCase(); }
function waLink(phone: string) { return `https://wa.me/${phone.replace(/[\s+()-]/g, "")}`; }

function BrandBar() {
  return (
    <div className="flex h-[3px] w-full overflow-hidden rounded-full">
      {["#3871c2","#ffac42","#766391","#ff1e58","#22c55e"].map(c => (
        <span key={c} className="flex-1" style={{ background: c }}/>
      ))}
    </div>
  );
}

function Avatar({ author, size = 32 }: { author: Author; size?: number }) {
  const bg = ROLE_COLOR[author.role] ?? "#3871c2";
  return author.avatar_url ? (
    <img src={author.avatar_url} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }}/>
  ) : (
    <span className="flex shrink-0 items-center justify-center rounded-full font-bold text-white select-none"
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size < 32 ? 10 : 11 }}>
      {avatarInitials(author)}
    </span>
  );
}

/* ─── Page principale ────────────────────────────────────────────────────── */

export default function OffresPage() {
  const [currentUser, setCurrentUser] = useState<{ id: string; author: Author } | null>(null);
  const [role, setRole]               = useState("Standard");
  const [userWhatsapp, setUserWhatsapp] = useState("");
  const [offers, setOffers]           = useState<Offer[]>([]);
  const [myOffers, setMyOffers]       = useState<Offer[]>([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState<"toutes" | "mes">("toutes");
  const [search, setSearch]           = useState("");
  const [catFilter, setCatFilter]     = useState<CatFilter>("Toutes");
  const [showForm, setShowForm]       = useState(false);
  const [showUpsell, setShowUpsell]   = useState(false);
  const [draft, setDraft]             = useState<DraftState>({
    title: "", description: "", price: "", category: "Prestation", location: "", whatsapp: "",
  });
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting]     = useState(false);
  const [formError, setFormError]       = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== "INITIAL_SESSION") return;
      let uid: string | null = null;
      if (session?.user) {
        uid = session.user.id;
        const { data: member } = await supabase
          .from("members").select("first_name, last_name, role, avatar_url, whatsapp").eq("id", uid).single();
        if (member) {
          const author: Author = { first_name: member.first_name, last_name: member.last_name, role: member.role, avatar_url: member.avatar_url };
          setCurrentUser({ id: uid, author });
          setRole(member.role);
          setUserWhatsapp(member.whatsapp ?? "");
          setDraft(d => ({ ...d, whatsapp: member.whatsapp ?? "" }));
        }
      }

      const { data: allData } = await supabase
        .from("market_offers").select(OFFER_SELECT).eq("status", "Approuvé").order("created_at", { ascending: false }).limit(80);
      if (allData) setOffers(allData as unknown as Offer[]);

      if (uid) {
        const { data: myData } = await supabase
          .from("market_offers").select(OFFER_SELECT).eq("author_id", uid).order("created_at", { ascending: false });
        if (myData) setMyOffers(myData as unknown as Offer[]);
      }
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const canPost = ["Pro", "Élite", "Admin", "Modérateur"].includes(role);

  const filteredOffers = offers.filter(o => {
    const matchCat    = catFilter === "Toutes" || o.category === catFilter;
    const matchSearch = !search.trim() ||
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      fullName(o.author).toLowerCase().includes(search.toLowerCase()) ||
      (o.location ?? "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { alert("L'image doit faire moins de 8 Mo."); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  }
  function removeImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null); setImagePreview(null);
  }

  async function handlePublish(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!currentUser || !draft.title.trim() || !draft.description.trim() || submitting) return;
    setSubmitting(true);
    setFormError(null);
    let image_url: string | null = null;
    if (imageFile) {
      const ext  = imageFile.name.split(".").pop();
      const path = `${currentUser.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("offer-images").upload(path, imageFile);
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from("offer-images").getPublicUrl(path);
        image_url = publicUrl;
      }
    }
    const payload = {
      author_id: currentUser.id, title: draft.title.trim(), description: draft.description.trim(),
      price: draft.price.trim() || "Sur devis", category: draft.category,
      location: draft.location.trim() || null, whatsapp: draft.whatsapp.trim() || userWhatsapp, image_url,
    };
    const { data: newOffer, error } = await supabase.from("market_offers").insert(payload).select(OFFER_SELECT).single();
    if (error) {
      setFormError("Erreur lors de la publication : " + error.message);
      setSubmitting(false);
      return;
    }
    if (newOffer) {
      const offer = newOffer as unknown as Offer;
      setMyOffers(prev => [offer, ...prev]);
    }
    removeImage();
    setDraft({ title: "", description: "", price: "", category: "Prestation", location: "", whatsapp: userWhatsapp });
    setShowForm(false);
    setSubmitting(false);
  }

  async function deleteOffer(id: string) {
    if (!confirm("Supprimer cette offre définitivement ?")) return;
    await supabase.from("market_offers").delete().eq("id", id);
    setMyOffers(prev => prev.filter(o => o.id !== id));
    setOffers(prev => prev.filter(o => o.id !== id));
  }

  return (
    <MemberLayout role={role}>
      <div className="min-h-full bg-[#F4F3F0]">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">

          {/* Brand bar */}
          <BrandBar />

          {/* Header */}
          <div className="mt-7 mb-6 flex items-start justify-between gap-3">
            <div>
              <h1 className="font-serif text-3xl font-bold text-ink">Marché Business</h1>
              <p className="mt-1 text-[13px] text-muted">Services, produits et expertises des membres Propulsion.</p>
            </div>
            <button
              onClick={() => {
                if (!canPost) { setShowUpsell(true); setShowForm(false); return; }
                setShowUpsell(false);
                setShowForm(v => !v);
              }}
              className="shrink-0 flex items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_2px_12px_rgba(56,113,194,0.3)] transition-all hover:bg-brand/90 active:scale-[0.97]"
            >
              <Plus width={15} height={15}/>
              <span className="hidden sm:block">Proposer</span>
            </button>
          </div>

          {/* Tabs */}
          {currentUser && (
            <div className="mb-4 flex gap-1 rounded-2xl border border-[#E0DDD8] bg-white p-1 w-fit">
              {(["toutes", "mes"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`rounded-xl px-4 py-1.5 text-[12.5px] font-semibold transition-colors ${tab === t ? "bg-brand text-white" : "text-muted hover:text-ink"}`}>
                  {t === "toutes" ? "Toutes les offres" : `Mes offres (${myOffers.length})`}
                </button>
              ))}
            </div>
          )}

          {/* Upsell */}
          {showUpsell && !canPost && (
            <div className="mb-4 rounded-2xl border border-brand/15 bg-brand/5 p-4 space-y-2">
              <p className="text-[13.5px] font-semibold text-ink">
                La publication est réservée aux membres <span className="text-brand">Pro</span> et <span className="font-bold text-[#ffac42]">Élite</span>.
              </p>
              <a href="/rejoindre?offer=Pro"
                className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand/90 transition-colors">
                Passer en Pro <ArrowRight width={13} height={13}/>
              </a>
            </div>
          )}

          {/* Form */}
          {showForm && canPost && (
            <div className="mb-5 rounded-2xl border border-[#E0DDD8] bg-white p-5">
              <h3 className="mb-4 text-[14px] font-bold text-ink">Publier une offre</h3>
              <form onSubmit={handlePublish} className="space-y-3">
                {formError && (
                  <div className="rounded-xl border border-[#ff1e58]/20 bg-[#ff1e58]/5 px-4 py-3 text-[12.5px] text-[#cc0033]">
                    {formError}
                  </div>
                )}
                <input required type="text" placeholder="Titre de votre offre *"
                  value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                  className="input-minimal"/>
                <textarea required rows={3}
                  placeholder="Décrivez votre offre, conditions, délais, ce qui la rend unique... *"
                  value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                  className="input-minimal resize-none"/>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-brand uppercase tracking-[0.15em]">Catégorie</label>
                    <select value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}
                      className="input-minimal appearance-none bg-transparent">
                      {POST_CATS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-brand uppercase tracking-[0.15em]">Prix</label>
                    <input type="text" placeholder="Ex : 50 000 FCFA"
                      value={draft.price} onChange={e => setDraft(d => ({ ...d, price: e.target.value }))}
                      className="input-minimal"/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-brand uppercase tracking-[0.15em]">Ville / Pays</label>
                    <input type="text" placeholder="Ex : Douala, Cameroun"
                      value={draft.location} onChange={e => setDraft(d => ({ ...d, location: e.target.value }))}
                      className="input-minimal"/>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-brand uppercase tracking-[0.15em]">WhatsApp</label>
                    <input type="tel" placeholder="Ex : +237 677..."
                      value={draft.whatsapp} onChange={e => setDraft(d => ({ ...d, whatsapp: e.target.value }))}
                      className="input-minimal"/>
                  </div>
                </div>
                {imagePreview && (
                  <div className="relative overflow-hidden rounded-xl border border-[#E0DDD8]">
                    <img src={imagePreview} alt="" className="max-h-40 w-full object-cover"/>
                    <button type="button" onClick={removeImage}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80">
                      <Close width={13} height={13}/>
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 rounded-full border border-[#E0DDD8] px-3 py-2 text-[12.5px] font-medium text-muted hover:border-brand/30 hover:text-brand transition-colors">
                    <Camera width={15} height={15}/>
                    {imagePreview ? "Changer la photo" : "Ajouter une photo"}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect}/>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setShowForm(false); removeImage(); }}
                      className="rounded-full border border-[#E0DDD8] px-4 py-2 text-[13px] font-medium text-muted hover:text-ink transition-colors">
                      Annuler
                    </button>
                    <button type="submit" disabled={submitting || !draft.title.trim() || !draft.description.trim()}
                      className="rounded-full bg-brand px-5 py-2 text-[13px] font-semibold text-white hover:bg-brand/90 transition-colors disabled:opacity-50">
                      {submitting ? "Publication…" : "Publier"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Search + filters (toutes) */}
          {tab === "toutes" && (
            <div className="mb-5 space-y-3">
              <div className="relative">
                <Search width={16} height={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"/>
                <input type="search" placeholder="Rechercher une offre, un membre, une ville..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full rounded-full border border-[#E0DDD8] bg-white py-2.5 pl-10 pr-4 text-[14px] text-ink outline-none focus:border-brand placeholder:text-faint"/>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                {CAT_FILTERS.map(cat => (
                  <button key={cat} onClick={() => setCatFilter(cat)}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${catFilter === cat ? "bg-brand text-white" : "border border-[#E0DDD8] bg-white text-muted hover:text-ink"}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-16">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"/>
            </div>
          )}

          {/* All offers */}
          {!loading && tab === "toutes" && (
            filteredOffers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#E0DDD8] bg-white p-12 text-center">
                <Briefcase width={32} height={32} className="mx-auto mb-3 text-faint"/>
                <p className="text-[15px] font-bold text-ink">Aucune offre trouvée</p>
                <p className="mt-1.5 text-[13px] text-muted">Essayez un autre terme ou une autre catégorie.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredOffers.map(offer => <OfferCard key={offer.id} offer={offer}/>)}
              </div>
            )
          )}

          {/* My offers */}
          {!loading && tab === "mes" && (
            myOffers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#E0DDD8] bg-white p-12 text-center">
                <Briefcase width={32} height={32} className="mx-auto mb-3 text-faint"/>
                <p className="text-[15px] font-bold text-ink">Vous n&apos;avez pas encore publié d&apos;offre.</p>
                {canPost && (
                  <button onClick={() => { setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand/90 transition-colors">
                    <Plus width={14} height={14}/> Publier ma première offre
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myOffers.map(offer => (
                  <OfferCard key={offer.id} offer={offer} isOwnerView onDelete={() => deleteOffer(offer.id)}/>
                ))}
              </div>
            )
          )}

        </div>
      </div>
      <AiAgent/>
    </MemberLayout>
  );
}

/* ─── OfferCard ──────────────────────────────────────────────────────────── */

interface OfferCardProps { offer: Offer; isOwnerView?: boolean; onDelete?: () => void; }

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  "En attente": { bg: "#ffac42/10", text: "#b87a00", label: "En attente de validation" },
  "Approuvé":   { bg: "#22c55e/10", text: "#15803d", label: "Approuvée" },
  "Rejeté":     { bg: "#ff1e58/10", text: "#ff1e58", label: "Rejetée" },
};

function OfferCard({ offer, isOwnerView, onDelete }: OfferCardProps) {
  const catColor  = CAT_COLOR[offer.category] ?? "#3871c2";
  const roleColor = ROLE_COLOR[offer.author.role] ?? "#3871c2";
  const isPending  = offer.status === "En attente";
  const isRejected = offer.status === "Rejeté";
  const ss = STATUS_STYLE[offer.status] ?? STATUS_STYLE["Approuvé"];

  return (
    <article className={`flex flex-col overflow-hidden rounded-2xl border bg-white transition-all ${
      isPending || isRejected
        ? "border-[#E0DDD8] opacity-70"
        : "border-[#E0DDD8] hover:border-brand/20 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
    }`}>
      {/* Category accent strip */}
      <div className="h-1 w-full" style={{ background: catColor }}/>

      {/* Owner status */}
      {isOwnerView && (
        <div className="flex items-center justify-between px-4 pt-3 pb-0">
          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
            style={{ background: `color-mix(in srgb, ${ss.text} 12%, transparent)`, color: ss.text }}>
            {ss.label}
          </span>
          <div className="flex items-center gap-2">
            {isRejected && offer.admin_note && (
              <span className="text-[10px] text-muted max-w-[140px] truncate" title={offer.admin_note}>
                Note : {offer.admin_note}
              </span>
            )}
            <button onClick={onDelete} className="text-[11px] font-semibold text-muted hover:text-[#ff1e58] transition-colors">
              Supprimer
            </button>
          </div>
        </div>
      )}

      {/* Image */}
      {offer.image_url && (
        <div className={`overflow-hidden ${isOwnerView ? "mx-4 mt-3 rounded-xl" : ""}`}>
          <img src={offer.image_url} alt=""
            className={`w-full max-h-44 object-cover ${isOwnerView ? "rounded-xl" : ""}`}
            loading="lazy"/>
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        {/* Author + category */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar author={offer.author} size={30}/>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-semibold text-ink truncate leading-none">{fullName(offer.author)}</span>
                {offer.verified && (
                  <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-brand">
                    <Check width={8} height={8} className="text-white"/>
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold" style={{ color: roleColor }}>{offer.author.role}</span>
            </div>
          </div>
          <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
            style={{ background: `${catColor}12`, color: catColor }}>
            {offer.category}
          </span>
        </div>

        <h3 className="text-[14px] font-bold text-ink leading-snug">{offer.title}</h3>
        <p className="mt-1.5 flex-1 text-[12.5px] leading-[1.65] text-muted line-clamp-3">{offer.description}</p>

        {offer.location && (
          <div className="mt-2 flex items-center gap-1 text-[11px] text-faint">
            <MapPin width={11} height={11}/> {offer.location}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#E0DDD8] pt-3">
          <span className="text-[14px] font-black text-ink">{offer.price || "Sur devis"}</span>
          <a href={waLink(offer.whatsapp)} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#25d366]/10 px-3.5 py-1.5 text-[12px] font-bold text-[#15803d] transition-all hover:bg-[#25d366]/20">
            Contacter
            <ExternalLink width={11} height={11}/>
          </a>
        </div>
      </div>
    </article>
  );
}
