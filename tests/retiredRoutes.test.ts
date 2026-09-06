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

import { retiredReason } from "@/lib/retiredRoutes";

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
      "/search",
      "/ingredients",
      "/ingredients/a",
      "/i/glycerin",
      "/a/1234",
      "/dl",
      "/beta",
      "/beta/go",
      "/maintenance",
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
