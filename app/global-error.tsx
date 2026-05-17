"use client";

import { useEffect } from "react";

/**
 * Root error boundary. Triggers when the RootLayout itself throws (rare —
 * font fetch failure, header crash…). Replaces <html> entirely, so we don't
 * have the AppShell available here — keep it minimal but still on-brand.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error] caught:", error.message, error.digest);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          backgroundColor: "#FAFAFA",
          color: "#111111",
        }}
      >
        <main
          style={{
            maxWidth: "420px",
            width: "100%",
            padding: "32px",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #E5E7EB",
            boxShadow: "0 8px 24px -12px rgba(17,17,17,0.08)",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 12px" }}>
            Erreur critique
          </h1>
          <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 24px" }}>
            L&apos;application n&apos;a pas pu démarrer. Recharge la page ou réessaie dans un instant.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: "11px",
                fontFamily: "monospace",
                color: "#9CA3AF",
                margin: "0 0 24px",
              }}
            >
              Réf : {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "12px",
              backgroundColor: "#111111",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Recharger
          </button>
        </main>
      </body>
    </html>
  );
}
