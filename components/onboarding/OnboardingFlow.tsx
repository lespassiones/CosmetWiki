"use client";

/**
 * Enveloppe client de l'onboarding : affiche d'abord le modal de consentement
 * si l'utilisateur n'a pas encore accepté les CGU (cas des inscriptions
 * Google), puis laisse place au questionnaire de profil. Les inscrits par
 * email ont déjà consenti au formulaire → `needsConsent` est faux et on va
 * directement aux questions.
 */

import { useState } from "react";
import type { SkinProfile } from "@/lib/skin/profile";
import { OnboardingWizard } from "./OnboardingWizard";
import { ConsentModal } from "./ConsentModal";

export function OnboardingFlow({
  initial,
  finalNext,
  firstName,
  needsConsent,
  needsNewsletterStep,
}: {
  initial: SkinProfile;
  finalNext: string;
  firstName?: string | null;
  needsConsent: boolean;
  /** Ajouter l'étape finale « newsletter » (inscrits Google qui n'ont pas eu la
   *  case sur le formulaire email). Calculé au chargement de la page. */
  needsNewsletterStep: boolean;
}) {
  const [consentGiven, setConsentGiven] = useState(!needsConsent);

  if (!consentGiven) {
    return (
      <ConsentModal firstName={firstName} onAccepted={() => setConsentGiven(true)} />
    );
  }

  return (
    <OnboardingWizard
      initial={initial}
      finalNext={finalNext}
      firstName={firstName}
      needsNewsletterStep={needsNewsletterStep}
    />
  );
}
