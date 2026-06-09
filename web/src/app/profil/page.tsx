"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/utils/supabase/client";
import { Check, Camera } from "@/components/icons";
import { MemberLayout } from "@/components/member-layout";

type ProfileForm = {
  first_name: string; last_name:  string; whatsapp:   string;
  company:    string; sector:     string; city:       string;
  bio:        string; avatar_url: string;
};

const EMPTY: ProfileForm = {
  first_name: "", last_name:  "", whatsapp:   "",
  company:    "", sector:     "", city:       "",
  bio:        "", avatar_url: "",
};

const SECTORS = [
  "Agriculture & Agroalimentaire", "Bâtiment & Immobilier",
  "Commerce & Distribution",       "Conseil & Stratégie",
  "Digital & Tech",                "Éducation & Formation",
  "Finance & Assurance",           "Industrie & Manufacture",
  "Médias & Communication",        "Santé & Bien-être",
  "Services & Artisanat",          "Transport & Logistique",
  "Tourisme & Restauration",       "Autre",
];

const ROLE_COLORS: Record<string, string> = {
  Élite: "#ffac42", Pro: "#3871c2", Standard: "#766391", Admin: "#ff1e58", Modérateur: "#22c55e",
};

export default function ProfilPage() {
  const [form, setForm]       = useState<ProfileForm>(EMPTY);
  const [readOnly, setReadOnly] = useState({ role: "", status: "", unique_id: "" });
  const [userId, setUserId]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null);
  const [error, setError]     = useState("");
  const fileRef               = useRef<HTMLInputElement>(null);
  const [dirty, setDirty]     = useState(false);

  const notify = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function loadProfile(uid: string) {
      try {
        const { data } = await supabase.from("members").select("*").eq("id", uid).single();
        if (data) {
          setForm({
            first_name: data.first_name ?? "", last_name:  data.last_name  ?? "",
            whatsapp:   data.whatsapp   ?? "", company:    data.company    ?? "",
            sector:     data.sector     ?? "", city:       data.city       ?? "",
            bio:        data.bio        ?? "", avatar_url: data.avatar_url ?? "",
          });
          setReadOnly({ role: data.role ?? "", status: data.status ?? "", unique_id: data.unique_id ?? "" });
        }
      } catch { /* offline */ }
      finally { setLoading(false); }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") {
        if (!session?.user) { window.location.href = "/connexion"; return; }
        setUserId(session.user.id);
        loadProfile(session.user.id);
      } else if (event === "SIGNED_OUT") {
        window.location.href = "/connexion";
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  function set(key: keyof ProfileForm, value: string) {
    setForm(f => ({ ...f, [key]: value }));
    setDirty(true);
    setError("");
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { setError("La photo doit faire moins de 4 Mo."); return; }
    setUploadingAvatar(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expirée. Reconnectez-vous.");
      const uid = user.id;
      const ext  = file.name.split(".").pop() ?? "jpg";
      const filePath = `${uid}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const urlWithBust = `${publicUrl}?t=${Date.now()}`;
      const { error: dbErr } = await supabase.from("members").update({ avatar_url: urlWithBust }).eq("id", uid);
      if (dbErr) throw dbErr;
      setForm(f => ({ ...f, avatar_url: urlWithBust }));
      notify("Photo de profil mise à jour ✓");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Échec de l'upload.");
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSave() {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError("Le prénom et le nom sont requis."); return;
    }
    setSaving(true); setError("");
    try {
      const uid = userId;
      if (!uid) throw new Error("Session expirée. Reconnectez-vous.");
      const { error: dbErr } = await supabase.from("members").update({
        first_name: form.first_name.trim(), last_name: form.last_name.trim(),
        whatsapp: form.whatsapp.trim() || null, company: form.company.trim() || null,
        sector: form.sector || null, city: form.city.trim() || null,
        bio: form.bio.trim() || null, avatar_url: form.avatar_url || null,
      }).eq("id", uid);
      if (dbErr) throw dbErr;
      setDirty(false);
      notify("Profil enregistré avec succès ✓");
      setTimeout(() => { window.location.href = "/dashboard"; }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }

  const initials = `${form.first_name[0] ?? ""}${form.last_name[0] ?? ""}`.toUpperCase() || "?";
  const roleColor = ROLE_COLORS[readOnly.role] ?? "#766391";

  if (loading) {
    return (
      <MemberLayout role="">
        <div className="flex-1 flex items-center justify-center py-20">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent"/>
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout role={readOnly.role}>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg transition-all ${toast.ok ? "bg-[#22c55e]" : "bg-[#ff1e58]"}`}>
          {toast.ok && <Check width={14} height={14}/>}
          {toast.msg}
        </div>
      )}

      {/* Sticky header */}
      <div className="sticky top-0 z-30 border-b border-[#E0DDD8] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-bold text-ink">Mon profil</span>
            <div className="flex h-[3px] w-10 overflow-hidden rounded-full">
              {["#3871c2","#ffac42","#766391","#ff1e58","#22c55e"].map(c => (
                <span key={c} className="flex-1" style={{ background: c }}/>
              ))}
            </div>
          </div>
          {dirty ? (
            <span className="text-[11px] font-semibold text-[#f59e0b]">● Non sauvegardé</span>
          ) : (
            <span className="text-[11px] text-faint">Tout est à jour</span>
          )}
        </div>
      </div>

      <div className="min-h-full bg-[#F4F3F0]">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-5">

          {/* Two-column layout on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">

            {/* ── Left: identity card ── */}
            <div className="space-y-4">

              {/* Avatar card */}
              <div className="rounded-2xl border border-[#E0DDD8] bg-white p-6 flex flex-col items-center text-center">
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingAvatar}
                  className="group relative h-24 w-24 rounded-full focus:outline-none mb-4" aria-label="Changer la photo">
                  {form.avatar_url ? (
                    <img src={form.avatar_url} alt="Avatar" className="h-full w-full rounded-full object-cover border-2 border-[#E0DDD8]"/>
                  ) : (
                    <span className="flex h-full w-full items-center justify-center rounded-full bg-brand/10 text-[28px] font-bold text-brand border-2 border-brand/20 select-none">
                      {initials}
                    </span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    {uploadingAvatar
                      ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"/>
                      : <Camera width={20} height={20} className="text-white"/>
                    }
                  </span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange}/>

                <p className="text-[15px] font-bold text-ink">{form.first_name || "Prénom"} {form.last_name || "Nom"}</p>
                {readOnly.role && (
                  <span className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
                    style={{ background: `${roleColor}18`, color: roleColor }}>
                    {readOnly.role}
                  </span>
                )}

                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingAvatar}
                  className="mt-3 text-[12px] font-semibold text-brand hover:underline disabled:opacity-50">
                  {uploadingAvatar ? "Upload en cours…" : "Changer la photo"}
                </button>
                <p className="mt-1 text-[10.5px] text-faint max-w-[200px] leading-relaxed">
                  Photo sauvegardée automatiquement.
                </p>
              </div>

              {/* Membership card */}
              <div className="rounded-2xl border border-[#E0DDD8] bg-white overflow-hidden">
                <div className="flex h-[3px]">
                  {["#3871c2","#ffac42","#766391","#ff1e58","#22c55e"].map(c => (
                    <span key={c} className="flex-1" style={{ background: c }}/>
                  ))}
                </div>
                <div className="divide-y divide-[#E0DDD8]">
                  {[
                    { label: "N° Membre", value: readOnly.unique_id || "—", mono: true },
                    { label: "Niveau",    value: readOnly.role      || "—" },
                    { label: "Statut",    value: readOnly.status    || "—" },
                  ].map(({ label, value, mono }) => (
                    <div key={label} className="flex items-center justify-between px-4 py-3">
                      <span className="text-[12px] text-muted">{label}</span>
                      <span className={`text-[12px] font-semibold text-ink ${mono ? "font-mono tracking-wider" : ""}`}>{value}</span>
                    </div>
                  ))}
                </div>
                <p className="px-4 py-3 text-[10.5px] text-faint border-t border-[#E0DDD8] bg-[#F4F3F0]">
                  Géré par l&apos;administration CNIC.
                </p>
              </div>

              {/* Save button */}
              <button type="button" onClick={handleSave} disabled={saving || uploadingAvatar || !dirty}
                className="w-full rounded-2xl bg-brand py-3.5 text-[14px] font-bold text-white transition-all hover:bg-brand/90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed">
                {saving
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"/>
                      Enregistrement…
                    </span>
                  : dirty ? "Enregistrer les modifications" : "Aucune modification en attente"
                }
              </button>
            </div>

            {/* ── Right: form ── */}
            <div className="space-y-5">

              {/* Error */}
              {error && (
                <p className="rounded-xl border border-[#ff1e58]/20 bg-[#ff1e58]/5 px-4 py-3 text-[13px] text-[#ff1e58]">{error}</p>
              )}

              {/* Identité */}
              <section>
                <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-faint">Identité</h2>
                <div className="rounded-2xl border border-[#E0DDD8] bg-white divide-y divide-[#E0DDD8]">
                  <div className="grid grid-cols-2 divide-x divide-[#E0DDD8]">
                    <Field label="Prénom" required>
                      <input value={form.first_name} onChange={e => set("first_name", e.target.value)} placeholder="Jean" className="w-full bg-transparent text-[13.5px] text-ink placeholder:text-faint focus:outline-none"/>
                    </Field>
                    <Field label="Nom">
                      <input value={form.last_name} onChange={e => set("last_name", e.target.value)} placeholder="Dupont" className="w-full bg-transparent text-[13.5px] text-ink placeholder:text-faint focus:outline-none"/>
                    </Field>
                  </div>
                  <Field label="WhatsApp">
                    <input type="tel" value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} placeholder="+237 6XX XX XX XX" className="w-full bg-transparent text-[13.5px] text-ink placeholder:text-faint focus:outline-none"/>
                  </Field>
                </div>
              </section>

              {/* Activité */}
              <section>
                <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-faint">Activité professionnelle</h2>
                <div className="rounded-2xl border border-[#E0DDD8] bg-white divide-y divide-[#E0DDD8]">
                  <Field label="Entreprise / Organisation">
                    <input value={form.company} onChange={e => set("company", e.target.value)} placeholder="Mon Entreprise SARL" className="w-full bg-transparent text-[13.5px] text-ink placeholder:text-faint focus:outline-none"/>
                  </Field>
                  <Field label="Secteur d'activité">
                    <select value={form.sector} onChange={e => set("sector", e.target.value)} className="w-full bg-transparent text-[13.5px] text-ink focus:outline-none appearance-none cursor-pointer">
                      <option value="">— Choisir —</option>
                      {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Ville">
                    <input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Douala, Yaoundé, Abidjan…" className="w-full bg-transparent text-[13.5px] text-ink placeholder:text-faint focus:outline-none"/>
                  </Field>
                </div>
              </section>

              {/* Bio */}
              <section>
                <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-faint">Bio</h2>
                <div className="rounded-2xl border border-[#E0DDD8] bg-white p-4 space-y-2">
                  <textarea
                    value={form.bio}
                    onChange={e => { if (e.target.value.length <= 280) set("bio", e.target.value); }}
                    rows={5}
                    placeholder="Décrivez votre activité, votre expertise, ce que vous apportez à la communauté…"
                    className="w-full resize-none text-[13.5px] text-ink placeholder:text-faint bg-transparent focus:outline-none leading-relaxed"
                  />
                  <p className="text-right text-[10px] text-faint tabular-nums">{form.bio.length}/280</p>
                </div>
              </section>

              <p className="text-center text-[11px] text-faint pb-4">
                Après sauvegarde, vous serez redirigé vers votre tableau de bord.
              </p>
            </div>

          </div>
        </div>
      </div>
    </MemberLayout>
  );
}

/* ─── Field ──────────────────────────────────────────────────────────────── */

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 space-y-1">
      <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-faint">
        {label}{required && <span className="ml-0.5 text-[#ff1e58]">*</span>}
      </label>
      {children}
    </div>
  );
}
