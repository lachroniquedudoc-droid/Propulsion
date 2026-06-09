"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase/client";
import { ArrowRight, Check, Eye, EyeOff } from "@/components/icons";

export default function ConnexionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-night flex items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      }
    >
      <ConnexionContent />
    </Suspense>
  );
}

function ConnexionContent() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function checkActiveSession() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) router.push("/dashboard");
      } catch {}
    }
    checkActiveSession();
  }, [router]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Veuillez remplir tous les champs.");
      return;
    }
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(
          "Identifiants incorrects. Veuillez vérifier votre adresse e-mail et votre mot de passe."
        );
        setIsLoading(false);
      } else if (data?.user) {
        setSuccessMessage("Connexion réussie ! Chargement de votre espace...");
        setTimeout(() => router.push("/dashboard"), 1500);
      }
    } catch {
      setErrorMessage("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-[#0F0F0E] overflow-hidden relative select-none"
      style={{
        backgroundImage: "var(--texture-url)",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "100% 100%",
        backgroundAttachment: "fixed"
      }}
    >

      {/* Grain texture */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05]"
      >
        <filter id="noise-connexion">
          <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise-connexion)" />
      </svg>

      {/* Orbes ambiants */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #3871c2 0%, transparent 70%)", filter: "blur(80px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, #ffac42 0%, transparent 70%)", filter: "blur(80px)" }}
      />
      <div aria-hidden className="absolute inset-0 bg-halftone-light opacity-20 pointer-events-none" />

      {/* Header distraction-free */}
      <header className="relative z-10 border-b border-white/5 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/branding/logo.jpg"
              alt="Propulsion"
              className="h-11 w-auto object-contain rounded brightness-[2] mix-blend-lighten transition-opacity group-hover:opacity-80"
            />
            <span className="hidden text-[11px] font-bold uppercase tracking-[0.18em] text-white/30 sm:block">
              Espace Membre
            </span>
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[12px] font-medium text-white/50 transition-all hover:border-white/20 hover:text-white/80 backdrop-blur-sm"
          >
            ← Retour au site
          </Link>
        </div>
      </header>

      {/* Zone centrale */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">

          {/* Colonne éditoriale gauche */}
          <div
            className="hidden lg:flex flex-col gap-8 pr-8"
            style={{ animation: "prop-slide-right-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) both" }}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">
                  Espace Membre Propulsion
                </p>
                <div className="h-[3px] w-40 brand-stripe rounded-full" />
              </div>
              <h1 className="serif text-[3.2rem] font-bold leading-[1.05] tracking-tight text-white xl:text-[3.8rem]">
                Bienvenue,<br />
                <em className="text-brand not-italic">entrepreneur.</em>
              </h1>
            </div>

            <p className="text-[15px] leading-[1.8] text-white/40 max-w-[38ch]">
              Masterclasses, networking, paiements, challenges — votre plateforme vous attend. Connectez-vous pour reprendre là où vous vous êtes arrêté.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#2A2A2A]">
              {[
                { val: "18", label: "Modules" },
                { val: "7+", label: "Pays actifs" },
                { val: "3", label: "Niveaux" },
              ].map((stat) => (
                <div key={stat.label} className="space-y-1.5">
                  <p className="serif text-[28px] font-bold text-white leading-none">{stat.val}</p>
                  <p className="text-[12px] font-sans uppercase tracking-widest text-[#6B6B6B]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Formulaire droite */}
          <div
            className="relative overflow-hidden rounded-[2rem] bg-white/[0.02] p-8 sm:p-10 backdrop-blur-xl"
            style={{ borderWidth: "0.5px", borderColor: "#2A2A2A", animation: "prop-zoom-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both" }}
          >

            <svg
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]"
            >
              <filter id="noise-form">
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
                <feColorMatrix type="saturate" values="0" />
              </filter>
              <rect width="100%" height="100%" filter="url(#noise-form)" />
            </svg>

            <div className="relative z-10 space-y-7">

              {/* En-tête du formulaire */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-3 lg:hidden mb-4">
                  <img
                    src="/branding/logo.jpg"
                    alt="Propulsion"
                    className="h-9 w-auto brightness-[2] mix-blend-lighten"
                  />
                </div>
                <h2 className="serif text-[1.8rem] font-bold text-white leading-tight">
                  Connexion
                </h2>
                <p className="text-[13px] text-white/40 leading-relaxed">
                  Accédez à vos masterclasses, votre réseau et vos adhésions.
                </p>
              </div>

              {/* Messages */}
              {errorMessage && (
                <div className="rounded-xl border border-red/20 bg-red/8 px-4 py-3 text-[12.5px] font-medium text-red leading-relaxed">
                  ⚠ {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/10 px-4 py-3 text-[12.5px] font-medium text-brand">
                  <Check width={13} height={13} />
                  {successMessage}
                </div>
              )}

              {/* Formulaire */}
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-[#6B6B6B] mb-2">
                    Adresse e-mail
                  </label>
                  <input
                    type="email"
                    placeholder="prenom.nom@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                    className="w-full bg-transparent border-t-0 border-l-0 border-r-0 border-b border-[#3A3A3A] focus:border-[#2E6FD4] outline-none text-[15px] font-sans transition-colors duration-200 text-white placeholder-white/30"
                    style={{ height: "48px", borderBottomWidth: "0.5px" }}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-[#6B6B6B] mb-2">
                      Mot de passe
                    </label>
                    <Link
                      href="/rejoindre"
                      className="text-[11px] text-brand/60 hover:text-brand transition-colors font-sans"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                      className="w-full bg-transparent border-t-0 border-l-0 border-r-0 border-b border-[#3A3A3A] focus:border-[#2E6FD4] outline-none text-[15px] font-sans transition-colors duration-200 text-white placeholder-white/30 pr-10"
                      style={{ height: "48px", borderBottomWidth: "0.5px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff width={16} height={16} /> : <Eye width={16} height={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#2E6FD4] text-[14px] font-semibold text-white transition-all hover:bg-brand-dark active:scale-[0.98] disabled:opacity-60 mt-4 cursor-pointer shadow-none"
                  style={{ height: "48px" }}
                >
                  {isLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Vérification en cours...
                    </>
                  ) : (
                    <>
                      Se connecter
                      <ArrowRight
                        width={15}
                        height={15}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </button>
              </form>

              {/* Séparateur */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/8" />
                <span className="text-[11px] text-white/25">ou</span>
                <div className="h-px flex-1 bg-white/8" />
              </div>

              {/* Lien inscription */}
              <p className="text-center text-[13px] text-white/35 font-sans">
                Nouveau membre ?{" "}
                <Link
                  href="/rejoindre"
                  className="font-semibold text-brand hover:text-brand-dark transition-colors"
                >
                  Créer un compte →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Bande 5 couleurs en bas */}
      <div className="h-[3px] w-full brand-stripe" />
    </div>
  );
}
