"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Check, Eye, EyeOff } from "@/components/icons";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-night flex items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const [password, setPassword]       = useState("");
  const [confirm, setConfirm]         = useState("");
  const [showPwd, setShowPwd]         = useState(false);
  const [loading, setLoading]         = useState(false);
  const [ready, setReady]             = useState(false);
  const [success, setSuccess]         = useState(false);
  const [error, setError]             = useState("");

  useEffect(() => {
    // Supabase redirige avec le token dans le hash — onAuthStateChange le capte
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Le mot de passe doit faire au moins 8 caractères."); return; }
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(`Erreur : ${updateError.message}`);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0E] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 text-center">
          <img src="/branding/logo.jpg" alt="Propulsion"
            className="mx-auto h-12 w-auto brightness-[2] mix-blend-lighten" />
        </div>

        <div className="rounded-[2rem] border border-white/8 bg-white/4 p-8 backdrop-blur-sm">

          {success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/15">
                <Check width={24} height={24} className="text-brand" />
              </div>
              <h2 className="text-[1.4rem] font-bold text-white">Mot de passe mis à jour !</h2>
              <p className="text-[13px] text-white/50">Redirection vers votre dashboard…</p>
            </div>

          ) : !ready ? (
            <div className="text-center space-y-3">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              <p className="text-[13px] text-white/50">Vérification du lien…</p>
              <p className="text-[11px] text-white/25">
                Si cette page ne répond pas, le lien a peut-être expiré.{" "}
                <a href="/connexion" className="text-brand hover:underline">Réessayer</a>
              </p>
            </div>

          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-[1.5rem] font-bold text-white">Nouveau mot de passe</h2>
                <p className="mt-1 text-[13px] text-white/40">Choisissez un mot de passe sécurisé (8 caractères minimum).</p>
              </div>

              {error && (
                <div className="rounded-xl border border-red/20 bg-red/8 px-4 py-3 text-[12.5px] text-red">
                  ⚠ {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-white/40">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required minLength={8}
                      placeholder="••••••••••"
                      className="w-full bg-transparent border-b border-[#3A3A3A] focus:border-brand outline-none text-[15px] text-white placeholder-white/25 pr-10 pb-2"
                    />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 p-1">
                      {showPwd ? <EyeOff width={16} height={16} /> : <Eye width={16} height={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-white/40">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    placeholder="••••••••••"
                    className="w-full bg-transparent border-b border-[#3A3A3A] focus:border-brand outline-none text-[15px] text-white placeholder-white/25 pb-2"
                  />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full rounded-full bg-brand py-3.5 text-[14px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 active:scale-[0.98]">
                  {loading ? "Mise à jour…" : "Enregistrer le nouveau mot de passe"}
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-[12px] text-white/25">
          <a href="/connexion" className="hover:text-white/50 transition-colors">← Retour à la connexion</a>
        </p>
      </div>
    </div>
  );
}
