import type { Metadata } from "next";
import { BetaIntakeWizard } from "@/components/beta/BetaIntakeWizard";

// Page volontairement NON indexée : elle n'est pas listée sur le site, on
// diffuse son lien manuellement (QR code pharmacie, réseaux sociaux, etc.).
export const metadata: Metadata = {
  title: "Deviens bêta testeur · Cosme Check",
  robots: { index: false, follow: false },
};

type Props = { searchParams?: Promise<{ src?: string }> };

export default async function BetaPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : undefined;
  // Canal de recrutement (?src=qr-pharmacie, ?src=insta...) pour l'analytics.
  const source = (params?.src ?? "").trim().slice(0, 60) || undefined;

  // Le wizard pilote toute la mise en page : split-screen avec branding à
  // l'étape 1, colonne centrée sans branding à l'étape 2.
  return <BetaIntakeWizard source={source} />;
}
