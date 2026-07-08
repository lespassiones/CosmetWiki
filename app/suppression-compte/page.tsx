import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { LEGAL } from "@/lib/legal";

const TITLE = "Suppression de compte et de données";
const DESCRIPTION =
  "Comment demander la suppression de ton compte Cosme Check et des données associées, ou la suppression d'une partie de tes données sans supprimer ton compte.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/suppression-compte" },
  openGraph: {
    title: `${TITLE} · Cosme Check`,
    description: DESCRIPTION,
    url: "/suppression-compte",
    type: "website",
  },
  robots: { index: true, follow: false },
};

export default function SuppressionComptePage() {
  return (
    <LegalLayout title={TITLE} current="privacy">
      <p>
        Cette page explique comment demander la suppression de ton compte{" "}
        <strong>{LEGAL.siteName}</strong> et des données associées, ou la
        suppression d&apos;une partie de tes données sans supprimer ton compte.
        Application et service édités par{" "}
        <strong>{LEGAL.publisher.name}</strong>. Pour toute question&nbsp;:{" "}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
      </p>

      <h2>1. Supprimer ton compte et toutes tes données</h2>

      <h3>Depuis l&apos;application (recommandé)</h3>
      <ul>
        <li>Ouvre l&apos;application {LEGAL.siteName}.</li>
        <li>
          Va dans l&apos;onglet <strong>Profil</strong>.
        </li>
        <li>
          En bas, appuie sur <strong>«&nbsp;Supprimer mon compte&nbsp;»</strong>,
          puis confirme avec <strong>«&nbsp;Supprimer définitivement&nbsp;»</strong>.
        </li>
      </ul>
      <p>
        La suppression est <strong>définitive et immédiate</strong>&nbsp;: ton
        compte et toutes tes données (profil, analyses, routine, promesses)
        sont purgés de nos serveurs et ne peuvent pas être récupérés.
      </p>

      <h3>Par email</h3>
      <p>
        Tu peux aussi écrire à{" "}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a> depuis
        l&apos;adresse email de ton compte, avec pour objet
        «&nbsp;Suppression de compte&nbsp;». Nous traitons ta demande sous
        30&nbsp;jours maximum.
      </p>

      <h2>2. Supprimer une partie de tes données (sans supprimer ton compte)</h2>
      <p>
        Directement dans l&apos;application, tu peux à tout moment&nbsp;:
      </p>
      <ul>
        <li>
          supprimer une <strong>analyse</strong> de ton historique (appui long
          sur l&apos;analyse, puis Supprimer)&nbsp;;
        </li>
        <li>
          retirer un produit de ta <strong>routine</strong>&nbsp;;
        </li>
        <li>
          supprimer une <strong>promesse</strong> analysée.
        </li>
      </ul>
      <p>
        Pour toute autre demande de suppression partielle, écris-nous à{" "}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
      </p>

      <h2>3. Données supprimées et données conservées</h2>
      <ul>
        <li>
          <strong>Supprimées</strong>&nbsp;: ton profil (prénom, adresse email),
          tes analyses, ta routine, tes promesses et tes préférences.
        </li>
        <li>
          <strong>Photos</strong>&nbsp;: les images envoyées au scanner ne sont
          pas conservées après le traitement. Seul le texte INCI extrait est
          enregistré avec ton analyse, puis supprimé avec elle.
        </li>
        <li>
          <strong>Journaux techniques</strong>&nbsp;: conservés 30&nbsp;jours
          maximum, puis supprimés automatiquement.
        </li>
        <li>
          <strong>Obligations légales</strong>&nbsp;: certaines données de
          facturation liées aux abonnements peuvent être conservées le temps
          imposé par la loi (comptabilité), puis supprimées.
        </li>
      </ul>
      <p>
        Après la suppression de ton compte, les données sont retirées de nos
        systèmes actifs immédiatement et purgées des sauvegardes sous
        30&nbsp;jours.
      </p>
    </LegalLayout>
  );
}
