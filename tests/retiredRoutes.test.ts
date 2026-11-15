/**
 * Garde des anciennes URLs de la web app (`lib/retiredRoutes`).
 *
 * Le test le plus important de ce fichier est celui sur
 * `/auth/reset-password` : cette page est la SEULE destination du lien « mot
 * de passe oublié » envoyé par l'application mobile. Si elle se met à
 * rediriger, la réinitialisation de mot de passe casse sur mobile, en silence,
 * sans erreur visible dans l'app.
 */
import { describe, expect, it } from "vitest";
import { pathToRegexp } from "next/dist/compiled/path-to-regexp";

import { retiredReason, retiredRedirects } from "@/lib/retiredRoutes";

describe("retiredReason", () => {
  it("PRÉSERVE /auth/reset-password, cible du lien de reset envoyé par l'app mobile", () => {
    expect(retiredReason("/auth/reset-password")).toBeNull();
  });

  it("redirige les autres pages d'authentification avec la raison auth", () => {
    for (const p of [
      "/auth",
      "/auth/sign-in",
      "/auth/sign-up",
      "/auth/forgot-password",
      "/auth/callback",
      "/onboarding",
    ]) {
      expect(retiredReason(p)).toBe("auth");
    }
  });

  it("redirige la page d'abonnement avec la raison premium", () => {
    expect(retiredReason("/offre")).toBe("premium");
  });

  it("redirige l'espace personnel avec la raison par défaut", () => {
    for (const p of [
      "/advisor",
      "/analyse",
      "/compare",
      "/history",
      "/history/abc-123",
      "/produits",
      "/profile",
      "/profile/restrictions",
      "/promesses/nouvelle",
      "/routine/favoris",
      // Retirés le 15 nov 2026 avec les fiches ingrédient.
      "/i",
      "/i/glycerin",
      "/ingredients",
      "/ingredients/a",
      "/search",
      "/maintenance",
    ]) {
      expect(retiredReason(p)).toBe("default");
    }
  });

  it("laisse passer les pages publiques conservées", () => {
    for (const p of [
      "/",
      "/blog",
      "/blog/spf-50-visage-7-erreurs",
      "/faq",
      "/fonctionnalites",
      "/en-savoir-plus",
      "/equipe",
      "/comment-ca-marche",
      "/contact",
      "/cgu",
      "/confidentialite",
      "/mentions-legales",
      "/suppression-compte",
      "/a/1234",
      "/dl",
      "/beta",
      "/beta/go",
      "/api/health",
      "/api/beta/invite",
    ]) {
      expect(retiredReason(p)).toBeNull();
    }
  });

  it("compare par segment : un chemin qui commence par un préfixe retiré sans être dedans passe", () => {
    // Sans la comparaison par segment, une future page `/produits-bio` ou
    // `/analyseur-inci` serait redirigée vers l'accueil sans raison visible.
    for (const p of ["/produits-bio", "/analyseur-inci", "/historique", "/comparateur"]) {
      expect(retiredReason(p)).toBeNull();
    }
  });
});

/**
 * Les redirections réellement appliquées par Vercel (`next.config.ts`).
 *
 * On compile chaque `source` exactement comme Next.js le fait au build
 * (`buildCustomRoute` : path-to-regexp, strict, insensible à la casse), puis on
 * vérifie que le résultat dit la même chose que `retiredReason`. C'est ce test
 * qui protège le reset de mot de passe mobile depuis que la middleware a été
 * retirée (15 nov 2026).
 */
describe("retiredRedirects", () => {
  const compiled = retiredRedirects().map((r) => ({
    re: pathToRegexp(r.source, [], { strict: true, sensitive: false, delimiter: "/" }),
    destination: r.destination,
    permanent: r.permanent,
  }));

  /** Destination de la première règle qui attrape ce chemin, ou null. */
  function redirectOf(pathname: string): string | null {
    return compiled.find((c) => c.re.test(pathname))?.destination ?? null;
  }

  const SAMPLE = [
    "/",
    "/auth",
    "/auth/",
    "/auth/sign-in",
    "/auth/callback",
    "/auth/reset-password",
    "/auth/reset-password/",
    "/auth/reset-passwordx",
    "/onboarding",
    "/onboarding/step-2",
    "/offre",
    "/offre/annuel",
    "/history/abc-123",
    "/produits",
    "/produits-bio",
    "/i",
    "/i/glycerin",
    "/ingredients",
    "/ingredients/a",
    "/search",
    "/maintenance",
    "/blog",
    "/blog/spf-50-visage-7-erreurs",
    "/a/1234",
    "/dl",
    "/beta/go",
    "/api/health",
  ];

  it("NE redirige JAMAIS /auth/reset-password, cible du lien de reset de l'app mobile", () => {
    expect(redirectOf("/auth/reset-password")).toBeNull();
  });

  it("dit exactement la même chose que retiredReason", () => {
    for (const p of SAMPLE) {
      // `/auth/` est servi comme `/auth` par Next (barre finale retirée avant
      // les redirections) : seul compte le chemin sans barre finale.
      if (p.endsWith("/") && p !== "/") continue;
      const reason = retiredReason(p);
      expect(redirectOf(p), p).toBe(reason ? `/?app=${reason}` : null);
    }
  });

  it("toutes les redirections sont permanentes (308)", () => {
    for (const c of compiled) expect(c.permanent).toBe(true);
  });
});
