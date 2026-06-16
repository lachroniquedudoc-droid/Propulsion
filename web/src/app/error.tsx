"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Erreur applicative interceptée :", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F4F3F0] px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ff1e58]/10 text-[#ff1e58]">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A2 2 0 0 0 3.82 21h16.36a2 2 0 0 0 1.71-2.96L13.71 3.86a2 2 0 0 0-3.42 0z" />
        </svg>
      </div>
      <h1 className="font-serif text-xl font-bold text-ink">Un problème est survenu</h1>
      <p className="max-w-sm text-[13.5px] text-muted leading-relaxed">
        Cette page n&apos;a pas pu se charger correctement. Réessayez — si le problème persiste, revenez au tableau de bord.
      </p>
      <div className="mt-2 flex gap-3">
        <button
          onClick={() => reset()}
          className="rounded-full bg-brand px-5 py-2.5 text-[13px] font-bold text-white hover:bg-brand/90 transition-colors"
        >
          Réessayer
        </button>
        <a
          href="/dashboard"
          className="rounded-full border border-[#E0DDD8] bg-white px-5 py-2.5 text-[13px] font-bold text-ink hover:bg-[#F4F3F0] transition-colors"
        >
          Retour au tableau de bord
        </a>
      </div>
    </div>
  );
}
