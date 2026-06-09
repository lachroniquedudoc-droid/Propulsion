"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../utils/supabase/client";
import { ArrowRight, Check, Star, Logo, Card, PropulsionMark } from "./icons";

/* ─── Config paiements ─────────────────────────────────────────────── */
const PAYMENTS_CONFIG = {
  Cameroun: {
    currency: "FCFA",
    methods: [
      { name: "MTN MoMo",     number: "677 88 99 00",  instruction: "Tapez *126*1*1# puis transférez au numéro ci-dessus.", dbMethod: "MTN MoMo"     },
      { name: "Orange Money", number: "699 00 11 22",  instruction: "Tapez #150*47# puis transférez au numéro ci-dessus.", dbMethod: "Orange Money" },
    ],
  },
  "Côte d'Ivoire": {
    currency: "FCFA",
    methods: [
      { name: "Wave",         number: "07 55 66 77 88", instruction: "Transférez via l'application Wave au numéro ci-dessus.",       dbMethod: "Wave"         },
      { name: "Orange Money", number: "07 00 11 22 33", instruction: "Composez #144# puis transférez au numéro ci-dessus.",           dbMethod: "Orange Money" },
      { name: "MTN MoMo",     number: "05 44 55 66 77", instruction: "Composez *133# puis transférez au numéro ci-dessus.",           dbMethod: "MTN MoMo"     },
    ],
  },
  RDC: {
    currency: "USD / CDF",
    methods: [
      { name: "M-Pesa",       number: "081 22 33 444", instruction: "Composez *1222# puis envoyez au numéro ci-dessus.",             dbMethod: "M-Pesa"       },
      { name: "Orange Money", number: "089 99 88 777", instruction: "Composez *144# puis envoyez au numéro ci-dessus.",              dbMethod: "Orange Money" },
      { name: "Airtel Money", number: "099 11 22 333", instruction: "Composez *501# puis envoyez au numéro ci-dessus.",              dbMethod: "Airtel Money" },
    ],
  },
  Sénégal: {
    currency: "FCFA",
    methods: [
      { name: "Wave",         number: "77 123 45 67",  instruction: "Transférez via l'application Wave au numéro ci-dessus.",       dbMethod: "Wave"         },
      { name: "Orange Money", number: "77 987 65 43",  instruction: "Composez #144# puis transférez au numéro ci-dessus.",           dbMethod: "Orange Money" },
    ],
  },
  "Burkina Faso": {
    currency: "FCFA",
    methods: [
      { name: "Orange Money", number: "76 00 11 22",   instruction: "Composez *144*4*6# puis transférez au numéro ci-dessus.",       dbMethod: "Orange Money" },
      { name: "Moov Money",   number: "70 33 44 55",   instruction: "Composez *555# puis transférez au numéro ci-dessus.",           dbMethod: "Moov Money"   },
    ],
  },
  Gabon: {
    currency: "FCFA",
    methods: [
      { name: "Airtel Money", number: "077 11 22 33",  instruction: "Composez *150# puis effectuez le transfert.",                   dbMethod: "Airtel Money" },
      { name: "Moov Money",   number: "066 44 55 66",  instruction: "Composez *888# puis effectuez le transfert.",                   dbMethod: "Moov Money"   },
    ],
  },
  International: {
    currency: "EUR / USD",
    methods: [
      { name: "Carte de Crédit",  number: "Paiement en ligne sécurisé",         instruction: "Sélectionnez cette option pour saisir vos coordonnées bancaires instantanément.", dbMethod: "Stripe"   },
      { name: "Virement Bancaire", number: "IBAN BNP Paribas FR76 3000 4000 …", instruction: "Effectuez votre virement avec votre identifiant Propulsion en libellé.",           dbMethod: "Virement" },
    ],
  },
} as const;

type Country = keyof typeof PAYMENTS_CONFIG;

const OFFRES_DETAILS = {
  Standard: { price: "25 000 FCFA / an",  desc: "Accès à la communauté et masterclasses hebdomadaires.", accentColor: "#2E6FD4" },
  Pro:      { price: "75 000 FCFA / an",  desc: "Networking, annuaire complet et opportunités d'affaires.", accentColor: "#6C3FC5" },
  Élite:    { price: "250 000 FCFA / an", desc: "Accompagnement rapproché du Dr Claudel, badge Élite & Apéros.", accentColor: "#C9A84C" },
} as const;

type Offer = keyof typeof OFFRES_DETAILS;

const getLevelColor = (role: string) => {
  if (role === "Standard") return "#2E6FD4";
  if (role === "Pro") return "#6C3FC5";
  if (role === "Élite") return "#C9A84C";
  return "#2E6FD4";
};

/* ─── Underline Input FormField Component ────────────────────────── */
function FormField({
  label, hint, children, levelColor
}: {
  label: string;
  hint?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: React.ReactElement<any>;
  levelColor: string;
}) {
  const [focused, setFocused] = useState(false);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onFocus = (e: any) => {
    setFocused(true);
    if (children.props.onFocus) children.props.onFocus(e);
  };
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onBlur = (e: any) => {
    setFocused(false);
    if (children.props.onBlur) children.props.onBlur(e);
  };

  const child = React.cloneElement(children, {
    onFocus,
    onBlur,
    className: `w-full bg-transparent border-t-0 border-l-0 border-r-0 border-b outline-none text-[15px] font-sans transition-colors duration-200 ${children.props.className || ""}`,
    style: {
      height: "48px",
      borderColor: focused ? levelColor : "#E0DDD8",
      ...children.props.style
    }
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-[#6B6B6B]">
          {label}
        </label>
        {hint && <span className="text-[10px] font-medium font-sans" style={{ color: levelColor }}>{hint}</span>}
      </div>
      {child}
    </div>
  );
}

/* ─── Hero Member Card Preview Component ─────────────────────────── */
function PreviewBadge({
  firstName, lastName, role, sector, company, statusText, uniqueId, avatarUrl
}: {
  firstName: string; lastName: string; role: string; sector: string; company: string; statusText: string; uniqueId: string; avatarUrl?: string;
}) {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "?";
  const fullName = firstName || lastName ? `${firstName} ${lastName.toUpperCase()}` : "";

  // Dynamic premium gradient matching each membership tier
  const cardBg = role === "Standard"
    ? "linear-gradient(135deg, #2E6FD4 0%, #153E82 100%)"
    : role === "Pro"
      ? "linear-gradient(135deg, #6C3FC5 0%, #351C66 100%)"
      : "linear-gradient(135deg, #C9A84C 0%, #68531D 100%)";

  return (
    <div
      className="relative aspect-[1.586] w-full rounded-2xl overflow-hidden text-white border border-white/15 shadow-2xl flex flex-col justify-between p-6 transition-all duration-500"
      style={{ background: cardBg }}
    >
      
      {/* 5-color Brand Bar on top edge */}
      <div className="absolute top-0 left-0 right-0 h-[3px] flex">
        <div className="flex-1 bg-[#F0A500]" />
        <div className="flex-1 bg-[#6C3FC5]" />
        <div className="flex-1 bg-[#1A1A1A]" />
        <div className="flex-1 bg-[#2E6FD4]" />
        <div className="flex-1 bg-[#E8174B]" />
      </div>

      {/* Top row: Logo and "CARTE DE MEMBRE" */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full overflow-hidden bg-white border border-white/10 shrink-0 relative">
            <img src="/branding/logo.jpg" alt="" className="absolute h-full w-full object-cover scale-[1.45] origin-[50%_33%]" />
          </div>
          <span className="font-serif text-[12px] font-bold tracking-wider text-white">
            PROPULSION
          </span>
        </div>
        <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-white/60">
          CARTE DE MEMBRE
        </span>
      </div>

      {/* Middle row: Level name and Avatar */}
      <div className="flex items-center justify-between my-2">
        <h2 className="font-serif text-[28px] font-bold leading-none text-white tracking-tight">
          {role.toUpperCase()}
        </h2>
        
        {/* Avatar */}
        <div className="relative h-14 w-14 rounded-full p-[1.5px] shrink-0 border border-white/30">
          <div className="h-full w-full rounded-full overflow-hidden bg-white/10 backdrop-blur-md flex items-center justify-center text-white font-sans font-bold text-sm">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row: Info block */}
      <div className="flex items-end justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-bold text-white truncate font-sans">
            {fullName || <span className="text-white/40 italic">Votre Nom</span>}
          </p>
          <p className="text-[13px] text-white/70 truncate font-sans mt-0.5">
            {sector ? `${sector} · ${company || "Propulsion"}` : <span className="text-white/40 italic">Secteur · Entreprise</span>}
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="font-mono text-[11px] text-white/60 tracking-wider">
            {uniqueId || "PROP-XXX-2026-0000"}
          </span>
          <div className="flex gap-1.5 items-center">
            {/* Status badge */}
            <span className="text-[10px] font-bold font-sans uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/25 text-white">
              {statusText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main OnboardingFlow Component ──────────────────────────────── */
export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep]                   = useState(1);
  const [selectedOffer, setSelectedOffer] = useState<Offer>("Pro");
  const [userId, setUserId]               = useState<string | null>(null);
  const [memberId, setMemberId]           = useState("");
  const [isCompleted, setIsCompleted]     = useState(false);

  const [formData, setFormData]           = useState({ firstName: "", lastName: "", whatsapp: "", email: "", password: "", referralCode: "" });
  const [referredByCode, setReferredByCode] = useState<string | null>(null);
  const [country, setCountry]             = useState<Country>("Cameroun");
  const [selectedMethodIndex, setSelectedMethodIndex] = useState(0);
  const [paymentSender, setPaymentSender] = useState("");

  const [avatarFile, setAvatarFile]         = useState<File | null>(null);
  const [avatarFileName, setAvatarFileName] = useState("");
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarFileName(file.name);
      setAvatarPreviewUrl(URL.createObjectURL(file));
    }
  };
  
  const paymentAmount = useMemo(() => {
    const prices = { Standard: 25000, Pro: 75000, Élite: 250000 };
    const eurPrices = { Standard: "39", Pro: "119", Élite: "390" };
    if (country === "International") {
      return `${eurPrices[selectedOffer]} €`;
    } else {
      return `${prices[selectedOffer].toLocaleString()} FCFA`;
    }
  }, [selectedOffer, country]);

  const [paymentFile, setPaymentFile]     = useState<File | null>(null);
  const [paymentFileName, setPaymentFileName] = useState("");
  const [profileData, setProfileData]     = useState({ city: "", sector: "", company: "", bio: "" });

  const [isLoading, setIsLoading]         = useState(false);
  const [stepError, setStepError]         = useState("");
  const [stripeSimulated, setStripeSimulated] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);
        const { data: m } = await supabase
          .from("members")
          .select("unique_id, role, city, status")
          .eq("id", user.id)
          .single();
        if (m?.unique_id) setMemberId(m.unique_id);
        if (m?.role && (m.role === "Standard" || m.role === "Pro" || m.role === "Élite")) {
          setSelectedOffer(m.role as Offer);
        }
        if ((m?.city && m?.status === "Paiement à valider") || m?.status === "Actif") {
          router.push("/dashboard");
          return;
        }
        if (m?.status === "Paiement à valider") {
          setStep(4);
        } else if (m?.status === "En attente de paiement") {
          setStep(3);
        } else {
          setStep(1);
        }
      } catch { /* offline ou non configuré */ }
    }
    checkSession();
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const searchParams = new URLSearchParams(window.location.search);
    const p = searchParams.get("offer");
    if (p === "Standard" || p === "Pro" || p === "Élite") {
      setTimeout(() => setSelectedOffer(p as Offer), 0);
    }

    const ref = searchParams.get("ref");
    if (ref) {
      setTimeout(() => {
        setReferredByCode(ref);
        setFormData(prev => ({ ...prev, referralCode: ref }));
      }, 0);
    }
  }, []);

  useEffect(() => {
    async function initLocation() {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) throw new Error();
        const ipData = await res.json();
        if (ipData?.city && ipData?.country_name) {
          setProfileData(prev => prev.city ? prev : { ...prev, city: `${ipData.city}, ${ipData.country_name}` });
          return;
        }
      } catch { /* ignored, try fallback */ }

      try {
        const res = await fetch("https://freeipapi.com/api/json");
        if (!res.ok) throw new Error();
        const ipData = await res.json();
        if (ipData?.cityName && ipData?.countryName) {
          setProfileData(prev => prev.city ? prev : { ...prev, city: `${ipData.cityName}, ${ipData.countryName}` });
        }
      } catch { /* ignored */ }
    }
    initLocation();
  }, []);

  useEffect(() => {
    if (step === 4 && !memberId) {
      const code = selectedOffer === "Standard" ? "STD" : selectedOffer === "Pro" ? "PRO" : "ELT";
      setTimeout(() => setMemberId(`PROP-${code}-2026-${Math.floor(1000 + Math.random() * 9000)}`), 0);
    }
  }, [step, selectedOffer, memberId]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStepError("");
    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name:  formData.lastName,
            whatsapp:   formData.whatsapp,
            role:       selectedOffer,
          },
        },
      });

      if (authError) {
        const msg = authError.message.toLowerCase();
        setStepError(
          msg.includes("already registered") || msg.includes("user already registered")
            ? "Cette adresse e-mail est déjà utilisée. Connectez-vous plutôt."
            : msg.includes("rate limit") || msg.includes("email rate limit") || msg.includes("too many")
              ? "Trop de tentatives. Attendez quelques minutes."
              : `Erreur : ${authError.message}`
        );
        setIsLoading(false);
        return;
      }

      if (!authData?.user) {
        setStepError("Création de compte impossible.");
        setIsLoading(false);
        return;
      }

      if (!authData.session) {
        setStepError("Un email de confirmation a été envoyé à " + formData.email + ".");
        setIsLoading(false);
        return;
      }

      const uid = authData.user.id;
      setUserId(uid);

      let referrerId: string | null = null;
      const refCodeToUse = formData.referralCode.trim() || referredByCode;
      if (refCodeToUse) {
        try {
          // 1. Try calling the RPC function (handles RLS bypass safely)
          const { data: refId, error: rpcErr } = await supabase
            .rpc("get_member_id_by_referral_code", { p_code: refCodeToUse });
            
          if (!rpcErr && refId) {
            referrerId = refId;
          } else {
            // 2. Fallback to direct query if RPC is not available
            const { data: refMem } = await supabase
              .from("members")
              .select("id")
              .eq("referral_code", refCodeToUse)
              .single();
            if (refMem) referrerId = refMem.id;
          }
        } catch {}
      }

      await supabase.from("members").upsert(
        {
          id:         uid,
          first_name: formData.firstName,
          last_name:  formData.lastName,
          whatsapp:   formData.whatsapp,
          role:       selectedOffer,
          status:     "En attente de paiement",
          referred_by: referrerId,
        },
        { onConflict: "id" }
      );

      const { data: memberRow } = await supabase
        .from("members")
        .select("unique_id")
        .eq("id", uid)
        .single();
      if (memberRow?.unique_id) setMemberId(memberRow.unique_id);

      setStep(3);
    } catch {
      setStepError("Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setPaymentFile(file); setPaymentFileName(file.name); }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStepError("");
    setIsLoading(true);

    const methods = PAYMENTS_CONFIG[country].methods;
    const method  = methods[selectedMethodIndex];
    const isStripe = country === "International" && selectedMethodIndex === 0;

    if (!isStripe && (!paymentSender.trim() || !paymentFile)) {
      setStepError("Veuillez remplir la preuve.");
      setIsLoading(false);
      return;
    }

    try {
      let proofUrl: string | null = null;

      if (paymentFile && userId) {
        const ext  = paymentFile.name.split(".").pop() ?? "jpg";
        const path = `${userId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("payment-proofs")
          .upload(path, paymentFile, { upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("payment-proofs")
            .getPublicUrl(path);
          proofUrl = urlData?.publicUrl ?? null;
        }
      }

      if (userId) {
        const amount = parseFloat(paymentAmount.replace(/[^\d.]/g, "")) || 75000;
        await supabase.from("payments").insert({
          member_id:   userId,
          method:      method.dbMethod,
          sender_info: isStripe ? "Stripe Transaction" : paymentSender,
          amount,
          proof_url:   proofUrl,
          status:      isStripe ? "Validé" : "En attente",
          country,
          currency:    PAYMENTS_CONFIG[country].currency,
          tier:        selectedOffer,
        });

        // Mettre à jour le statut du membre dans la base de données
        const nextStatus = isStripe ? "Actif" : "Paiement à valider";
        const updateFields: any = { status: nextStatus };
        if (isStripe) {
          updateFields.subscription_expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        }
        await supabase.from("members").update(updateFields).eq("id", userId);
      }

      if (isStripe) {
        setStripeSimulated(true);
        await new Promise((r) => setTimeout(r, 1500));
        setStripeSimulated(false);
      }

      setStep(4);
    } catch {
      setStepError("Erreur d'enregistrement.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStepError("");
    setIsLoading(true);

    if (!userId) {
      setStepError("Session expirée.");
      setIsLoading(false);
      return;
    }

    try {
      let avatarUrl = "";
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop() ?? "jpg";
        const path = `${userId}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(path);
          avatarUrl = urlData?.publicUrl ?? "";
        }
      }

      const updateData: any = {
        city:       profileData.city,
        sector:     profileData.sector,
        company:    profileData.company,
        bio:        profileData.bio,
        is_private: false,
      };

      if (avatarUrl) {
        updateData.avatar_url = avatarUrl;
      }

      const { error: updateError } = await supabase
        .from("members")
        .update(updateData)
        .eq("id", userId);

      if (updateError) {
        setStepError("Sauvegarde impossible.");
        setIsLoading(false);
        return;
      }

      setIsCompleted(true);
      setTimeout(() => router.push("/dashboard"), 2500);
    } catch {
      setStepError("Erreur de sauvegarde.");
    } finally {
      setIsLoading(false);
    }
  };

  const levelColor = getLevelColor(selectedOffer);

  return (
    <div className="w-full max-w-6xl mx-auto px-5 py-10 sm:py-14 select-none">

      {/* ── Step Indicator timeline (redesigned) ── */}
      <div className="mb-14 max-w-md mx-auto">
        <div className="relative flex justify-between items-center">
          <div className="absolute left-[8%] right-[8%] top-[16px] h-[1px] bg-[#E0DDD8] -z-10" />
          <div
            className="absolute left-[8%] top-[16px] h-[1px] transition-all duration-500 -z-10"
            style={{ width: `${(Math.max(1, step - 1) / 3) * 84}%`, backgroundColor: "#1D6B45" }}
          />
          {[
            { s: 1, label: "Offre" },
            { s: 2, label: "Compte" },
            { s: 3, label: "Paiement" },
            { s: 4, label: "Profil" },
          ].map((item) => {
            const done    = step > item.s;
            const current = step === item.s;
            return (
              <div key={item.s} className="flex flex-col items-center gap-2 flex-1">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300 border"
                  style={{
                    backgroundColor: current ? "#2E6FD4" : done ? "#1D6B45" : "transparent",
                    borderColor: current ? "#2E6FD4" : done ? "#1D6B45" : "#E0DDD8",
                    color: current || done ? "#FFFFFF" : "#8A8880",
                  }}
                >
                  {done ? <Check width={12} height={12} className="text-white" /> : item.s}
                </div>
                <span 
                  className="text-[12px] font-sans font-medium transition-colors"
                  style={{ color: current ? "#2E6FD4" : done ? "#1D6B45" : "#8A8880" }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Two Column Form Layout ── */}
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-stretch">

        {/* ── Left Column: Form Forms ── */}
        <div className="relative overflow-hidden rounded-2xl border border-[#E0DDD8] bg-white p-8 sm:p-12">
          
          {stepError && (
            <div className="mb-5 rounded-xl border border-red/20 bg-red/5 px-4 py-3 text-[12.5px] font-medium text-red">
              ⚠ {stepError}
            </div>
          )}

          {/* ───── step 1 ───── */}
          {step === 1 && (
            <div className="space-y-7 animate-prop-fade-in">
              <div>
                <span className="text-[12px] font-sans font-bold uppercase tracking-wider block" style={{ color: levelColor }}>
                  Étape 1 sur 4
                </span>
                <h2 className="font-serif mt-2 text-3xl font-bold tracking-tight text-[#1A1A1A]">
                  Choisissez votre niveau
                </h2>
                <p className="mt-2 text-[14px] text-[#6B6B6B]">
                  Sélectionnez la formule d&apos;adhésion qui correspond à vos objectifs de croissance.
                </p>
              </div>

              <div className="space-y-3">
                {(["Standard", "Pro", "Élite"] as Offer[]).map((tierName) => {
                  const details    = OFFRES_DETAILS[tierName];
                  const isSelected = selectedOffer === tierName;
                  const itemColor  = getLevelColor(tierName);
                  return (
                    <button
                      key={tierName}
                      type="button"
                      onClick={() => setSelectedOffer(tierName)}
                      className="w-full text-left p-6 rounded-2xl border transition-all flex items-center justify-between gap-4 cursor-pointer"
                      style={{
                        borderColor: isSelected ? itemColor : "#E0DDD8",
                        backgroundColor: isSelected ? `${itemColor}08` : "transparent"
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <span className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: itemColor }}>
                          <PropulsionMark mono={true} width={22} height={22} />
                        </span>
                        <div>
                          <h3 className="text-[14px] font-bold text-[#1A1A1A] flex items-center gap-2 font-sans">
                            {tierName}
                            {isSelected && (
                              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${itemColor}15`, color: itemColor }}>
                                Sélectionné
                              </span>
                            )}
                          </h3>
                          <p className="text-[12px] text-[#6B6B6B] mt-0.5 font-sans">{details.desc}</p>
                        </div>
                      </div>
                      <span className="text-[13px] font-bold shrink-0 text-[#1A1A1A] font-sans">
                        {details.price}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-[#E0DDD8]">
                <Link
                  href="/connexion"
                  className="text-[13.5px] font-medium text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                >
                  Déjà membre ? <span className="font-semibold" style={{ color: levelColor }}>Se connecter</span>
                </Link>
                <button
                  type="button"
                  onClick={() => { setStepError(""); setStep(2); }}
                  className="w-full sm:w-auto h-12 inline-flex items-center justify-center gap-2 rounded-lg text-white font-semibold text-[15px] font-sans transition-all hover:scale-[1.015] active:scale-[0.98] duration-200 px-6 cursor-pointer shrink-0"
                  style={{ backgroundColor: levelColor }}
                >
                  Continuer vers l&apos;inscription
                  <ArrowRight width={15} height={15} />
                </button>
              </div>
            </div>
          )}

          {/* ───── step 2 ───── */}
          {step === 2 && (
            <div className="space-y-7 animate-prop-fade-in">
              <div>
                <span className="text-[12px] font-sans font-bold uppercase tracking-wider block" style={{ color: levelColor }}>
                  Étape 2 sur 4
                </span>
                <h2 className="font-serif mt-2 text-3xl font-bold tracking-tight text-[#1A1A1A]">Créez votre compte</h2>
                <p className="mt-2 text-[14px] text-[#6B6B6B]">Saisissez vos coordonnées entrepreneuriales indispensables.</p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Prénom" levelColor={levelColor}>
                    <input type="text" required placeholder="Claudel" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                  </FormField>
                  <FormField label="Nom de famille" levelColor={levelColor}>
                    <input type="text" required placeholder="Noubissie" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                  </FormField>
                </div>
                
                <FormField label="Numéro WhatsApp" hint="Pour rejoindre les canaux" levelColor={levelColor}>
                  <input type="tel" required placeholder="+237 677 88 99 00" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} />
                </FormField>
                
                <FormField label="Adresse e-mail" levelColor={levelColor}>
                  <input type="email" required placeholder="contact@propulsion.club" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </FormField>
                
                <FormField label="Mot de passe" hint="8 caractères minimum" levelColor={levelColor}>
                  <input type="password" required minLength={8} placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                </FormField>
                
                <FormField label="Code de parrainage (Optionnel)" levelColor={levelColor}>
                  <input type="text" placeholder="PROP-XXXXXX" value={formData.referralCode} onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })} />
                </FormField>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E0DDD8]">
                  <button type="button" onClick={() => { setStepError(""); setStep(1); }} className="w-full sm:w-auto h-12 rounded-lg border border-[#1A1A1A] bg-transparent text-[#1A1A1A] px-6 text-[15px] font-semibold font-sans transition-all hover:scale-[1.015] active:scale-[0.98] duration-200 cursor-pointer">
                    ← Retour
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto h-12 inline-flex items-center justify-center gap-2 rounded-lg text-white font-semibold text-[15px] font-sans transition-all hover:scale-[1.015] active:scale-[0.98] duration-200 px-6 cursor-pointer"
                    style={{ backgroundColor: levelColor }}
                  >
                    {isLoading ? (
                      <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Création...</>
                    ) : (
                      <>Créer mon compte <ArrowRight width={15} height={15} /></>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ───── step 3 ───── */}
          {step === 3 && (
            <div className="space-y-7 animate-prop-fade-in">
              <div>
                <span className="text-[12px] font-sans font-bold uppercase tracking-wider block" style={{ color: levelColor }}>
                  Étape 3 sur 4
                </span>
                <h2 className="font-serif mt-2 text-3xl font-bold tracking-tight text-[#1A1A1A]">
                  Activez votre adhésion
                </h2>
                <p className="mt-2 text-[14px] text-[#6B6B6B]">Sélectionnez votre pays pour afficher les options de paiement locales.</p>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-5">
                <FormField label="Pays de résidence" levelColor={levelColor}>
                  <select value={country} onChange={(e) => { setCountry(e.target.value as Country); setSelectedMethodIndex(0); }}>
                    {(Object.keys(PAYMENTS_CONFIG) as Country[]).map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </FormField>

                <div className="space-y-2.5">
                  <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#6B6B6B] block">Moyen de paiement</span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {PAYMENTS_CONFIG[country].methods.map((method, idx) => (
                      <button
                        key={method.name}
                        type="button"
                        onClick={() => setSelectedMethodIndex(idx)}
                        className="p-4 rounded-xl border text-left transition-all cursor-pointer"
                        style={{
                          borderColor: selectedMethodIndex === idx ? levelColor : "#E0DDD8",
                          backgroundColor: selectedMethodIndex === idx ? `${levelColor}08` : "transparent"
                        }}
                      >
                        <span className="font-semibold text-[13px] block text-[#1A1A1A] font-sans">{method.name}</span>
                        <span className="text-[11.5px] opacity-70 block mt-0.5 font-mono text-[#6B6B6B]">{method.number}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-[#E0DDD8] p-5 space-y-2.5 bg-[#F4F3F0]">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#6B6B6B] block">Instructions de transfert</span>
                  <p className="text-[13px] text-[#6B6B6B] leading-relaxed">
                    {PAYMENTS_CONFIG[country].methods[selectedMethodIndex].instruction}
                  </p>
                  <p className="text-[14px] font-bold text-[#1A1A1A] font-sans pt-1 border-t border-[#E0DDD8]">
                    Montant à envoyer : <span style={{ color: levelColor }}>{paymentAmount}</span>
                  </p>
                </div>

                {country === "International" && selectedMethodIndex === 0 ? (
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading || stripeSimulated}
                      className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-lg bg-[#635bff] text-white font-semibold text-[15px] font-sans transition-all hover:opacity-95 active:scale-[0.98] cursor-pointer"
                    >
                      {isLoading || stripeSimulated ? (
                        <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Traitement sécurisé...</>
                      ) : (
                        <><Card width={17} height={17} /> Payer par Carte via Stripe</>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 pt-1">
                    <FormField label="Nom ou numéro de l'expéditeur Mobile Money" levelColor={levelColor}>
                      <input type="text" required placeholder="Claudel Noubissie ou 677889900" value={paymentSender} onChange={(e) => setPaymentSender(e.target.value)} />
                    </FormField>

                    <div className="space-y-2">
                      <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#6B6B6B] block">
                        Preuve de paiement (capture d&apos;écran)
                      </span>
                      <label className="relative flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#E0DDD8] bg-[#F4F3F0] p-7 cursor-pointer hover:bg-neutral-50 transition-colors group">
                        <input type="file" accept="image/*,.pdf" onChange={handleFileChange} required className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[#E0DDD8] text-[#1A1A1A]">
                          <Card width={20} height={20} />
                        </span>
                        <p className="text-[13px] font-medium text-[#1A1A1A] text-center">
                          {paymentFileName
                            ? <span className="flex items-center gap-1.5 font-bold" style={{ color: levelColor }}><Check width={13} height={13} />{paymentFileName}</span>
                            : "Cliquez pour joindre votre capture d'écran"
                          }
                        </p>
                        <p className="text-[10px] text-[#6B6B6B]">Formats acceptés : PNG, JPG, PDF (Max 10 Mo)</p>
                      </label>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E0DDD8]">
                      <button type="button" onClick={() => { setStepError(""); setStep(2); }} className="w-full sm:w-auto h-12 rounded-lg border border-[#1A1A1A] bg-transparent text-[#1A1A1A] px-6 text-[15px] font-semibold font-sans transition-all hover:scale-[1.015] active:scale-[0.98] duration-200 cursor-pointer">
                        ← Retour
                      </button>
                      
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full sm:w-auto h-12 inline-flex items-center justify-center gap-2 rounded-lg text-white font-semibold text-[15px] font-sans transition-all hover:scale-[1.015] active:scale-[0.98] duration-200 px-6 cursor-pointer"
                        style={{ backgroundColor: levelColor }}
                      >
                        {isLoading ? (
                          <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Envoi...</>
                        ) : (
                          <>Soumettre ma preuve <ArrowRight width={15} height={15} /></>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* ───── step 4 ───── */}
          {step === 4 && (
            <div className="space-y-7 animate-prop-fade-in">
              {!isCompleted ? (
                <>
                  <div>
                    <span className="text-[12px] font-sans font-bold uppercase tracking-wider block" style={{ color: levelColor }}>
                      Étape 4 sur 4
                    </span>
                    <h2 className="font-serif mt-2 text-3xl font-bold tracking-tight text-[#1A1A1A]">Complétez votre profil</h2>
                    <p className="mt-2 text-[14px] text-[#6B6B6B]">Faites-vous connaître par les autres membres.</p>
                  </div>

                  <form onSubmit={handleProfileSubmit} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField label="Ville actuelle" levelColor={levelColor}>
                        <input type="text" required placeholder="Douala, Abidjan, Kinshasa…" value={profileData.city} onChange={(e) => setProfileData({ ...profileData, city: e.target.value })} />
                      </FormField>
                      <FormField label="Secteur d'activité" levelColor={levelColor}>
                        <input type="text" required placeholder="Technologie, Agrobusiness…" value={profileData.sector} onChange={(e) => setProfileData({ ...profileData, sector: e.target.value })} />
                      </FormField>
                    </div>
                    
                    <FormField label="Nom de votre entreprise" levelColor={levelColor}>
                      <input type="text" required placeholder="Mon Entreprise SA" value={profileData.company} onChange={(e) => setProfileData({ ...profileData, company: e.target.value })} />
                    </FormField>

                    {/* Avatar Upload field */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#6B6B6B] block">
                        Photo de profil / Avatar (Recommandé)
                      </span>
                      <label className="relative flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#E0DDD8] bg-[#F4F3F0] p-6 cursor-pointer hover:bg-neutral-50 transition-colors group">
                        <input type="file" accept="image/*" onChange={handleAvatarChange} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[#E0DDD8] text-[#1A1A1A]">
                          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                            <circle cx="12" cy="13" r="4"/>
                          </svg>
                        </span>
                        <p className="text-[13px] font-medium text-[#1A1A1A] text-center">
                          {avatarFileName
                            ? <span className="flex items-center gap-1.5 font-bold" style={{ color: levelColor }}><Check width={13} height={13} />{avatarFileName}</span>
                            : "Cliquez pour choisir une photo de profil"
                          }
                        </p>
                        <p className="text-[10px] text-[#6B6B6B]">Formats acceptés : PNG, JPG, GIF (Max 5 Mo)</p>
                      </label>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-[#6B6B6B]">
                        Description de votre activité
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Expliquez brièvement vos activités..."
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        className="w-full bg-transparent border-t-0 border-l-0 border-r-0 border-b border-[#E0DDD8] outline-none text-[15px] font-sans py-2 resize-none focus:border-brand"
                        style={{ height: "80px" }}
                      />
                    </div>

                    <div className="flex justify-end pt-4 border-t border-[#E0DDD8]">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full sm:w-auto h-12 inline-flex items-center justify-center gap-2 rounded-lg text-white font-semibold text-[15px] font-sans transition-all hover:scale-[1.015] active:scale-[0.98] duration-200 px-6 cursor-pointer"
                        style={{ backgroundColor: levelColor }}
                      >
                        {isLoading ? (
                          <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Finalisation...</>
                        ) : (
                          <>Rejoindre Propulsion <Check width={15} height={15} /></>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="text-center py-6 space-y-6 animate-prop-fade-in">
                  <div className="relative mx-auto h-16 w-16 rounded-full bg-[#1D6B45]/15 flex items-center justify-center text-[#22c55e]">
                    <Check width={28} height={28} />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-serif text-2xl font-bold text-[#1A1A1A]">Bienvenue entrepreneur !</h3>
                    <p className="text-[13.5px] text-[#6B6B6B] max-w-[36ch] mx-auto leading-relaxed">
                      Votre adhésion a été enregistrée avec succès. Redirection vers votre espace...
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right Column: Magical live card preview ── */}
        <div className="relative overflow-hidden rounded-2xl bg-[#1E1E1C] p-8 sm:p-12 text-white border border-[#E0DDD8]/10 flex flex-col justify-between">
          
          <div className="space-y-1">
            <span className="text-[11px] font-sans font-bold uppercase tracking-[0.22em] text-[#C9A84C]">
              IDENTITÉ MEMBRE
            </span>
            <p className="text-[13px] text-[#6B6B6B] font-sans">
              Votre badge évolue en temps réel.
            </p>
          </div>

          {/* Member Card Preview Wrapper */}
          <div className="flex-1 flex items-center justify-center py-8">
            <div className="w-full max-w-[340px]">
              <PreviewBadge
                firstName={formData.firstName}
                lastName={formData.lastName}
                role={selectedOffer}
                sector={profileData.sector}
                company={profileData.company}
                statusText={isCompleted ? "ACTIF" : step >= 3 ? "VALIDATION" : "ATTENTE"}
                uniqueId={memberId}
                avatarUrl={avatarPreviewUrl}
              />
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-[12px] text-[#8A8880] leading-relaxed font-sans">
            {step < 3
              ? "Saisissez vos informations pour initialiser votre carte de membre numérique."
              : step === 3
                ? "Votre preuve de paiement sera validée par un administrateur Propulsion."
                : "Profil complet ! Vos accès sont prêts."}
          </div>

        </div>

      </div>
    </div>
  );
}
