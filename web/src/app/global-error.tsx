"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Erreur globale interceptée :", error);
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <div style={{
          display: "flex", minHeight: "100vh", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "16px",
          background: "#F4F3F0", padding: "24px", textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1A1A1A" }}>Un problème est survenu</h1>
          <p style={{ maxWidth: "360px", fontSize: "13.5px", color: "#6B6B6B", lineHeight: 1.6 }}>
            L&apos;application n&apos;a pas pu démarrer correctement. Réessayez ou revenez à l&apos;accueil.
          </p>
          <div style={{ marginTop: "8px", display: "flex", gap: "12px" }}>
            <button
              onClick={() => reset()}
              style={{
                borderRadius: "999px", background: "#2E6FD4", color: "#fff",
                padding: "10px 20px", fontSize: "13px", fontWeight: 700, border: "none", cursor: "pointer",
              }}
            >
              Réessayer
            </button>
            <a
              href="/"
              style={{
                borderRadius: "999px", background: "#fff", color: "#1A1A1A",
                padding: "10px 20px", fontSize: "13px", fontWeight: 700,
                border: "1px solid #E0DDD8", textDecoration: "none",
              }}
            >
              Accueil
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
