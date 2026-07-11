import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { LEGAL } from "@/lib/legal";

const TITLE = "Mentions légales";
const DESCRIPTION =
  "Identité de l'éditeur, hébergeur et informations légales du site Cosme Check.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/mentions-legales" },
  openGraph: {
    title: `${TITLE} · Cosme Check`,
    description: DESCRIPTION,
    url: "/mentions-legales",
    type: "website",
  },
  robots: { index: true, follow: false },
};

export default function MentionsLegalesPage() {
  return (
    <LegalLayout title={TITLE} current="mentions-legales">
      <p>
        Conformément aux articles 6-III et 19 de la loi n° 2004-575 du 21 juin
        2004 pour la confiance dans l&apos;économie numérique (LCEN), il est
        précisé l&apos;identité des différents intervenants dans le cadre de la
        réalisation et du suivi du site {LEGAL.siteName}.
      </p>

      <h2>1. Éditeur du site</h2>
      <ul>
        <li>
          <strong>Nom du site</strong>&nbsp;: {LEGAL.siteName}
        </li>
        <li>
          <strong>URL</strong>&nbsp;: <a href={LEGAL.siteUrl}>{LEGAL.siteUrl}</a>
        </li>
        <li>
          <strong>Éditeur</strong>&nbsp;: {LEGAL.publisher.name} ({LEGAL.publisher.status})
        </li>
        <li>
          <strong>Adresse</strong>&nbsp;: {LEGAL.publisher.address}
        </li>
        {LEGAL.publisher.siret && (
          <li>
            <strong>SIRET</strong>&nbsp;: {LEGAL.publisher.siret}
          </li>
        )}
        <li>
          <strong>SIREN</strong>&nbsp;: {LEGAL.publisher.siren}
        </li>
        <li>
          <strong>RCS</strong>&nbsp;: {LEGAL.publisher.rcs}
        </li>
        <li>
          <strong>TVA intracommunautaire</strong>&nbsp;: {LEGAL.publisher.tva}
        </li>
        <li>
          <strong>Code APE / NAF</strong>&nbsp;: {LEGAL.publisher.ape}
        </li>
        <li>
          <strong>Directeur de la publication</strong>&nbsp;: {LEGAL.publisher.director}
        </li>
        <li>
          <strong>Contact</strong>&nbsp;:{" "}
          <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>
        </li>
      </ul>

      <h2>2. Hébergeurs</h2>
      <p>Hébergeur du site web&nbsp;:</p>
      <ul>
        <li>
          <strong>Société</strong>&nbsp;: {LEGAL.host.name}
        </li>
        <li>
          <strong>Adresse</strong>&nbsp;: {LEGAL.host.address}
        </li>
        <li>
          <strong>Site web</strong>&nbsp;:{" "}
          <a href={LEGAL.host.website} target="_blank" rel="noopener noreferrer">
            {LEGAL.host.website}
          </a>
        </li>
      </ul>
      <p>Hébergeur de la base de données et de l&apos;authentification&nbsp;:</p>
      <ul>
        <li>
          <strong>Société</strong>&nbsp;: {LEGAL.dbHost.name}
        </li>
        <li>
          <strong>Localisation</strong>&nbsp;: {LEGAL.dbHost.address}
        </li>
        <li>
          <strong>Site web</strong>&nbsp;:{" "}
          <a href={LEGAL.dbHost.website} target="_blank" rel="noopener noreferrer">
            {LEGAL.dbHost.website}
          </a>
        </li>
      </ul>

      <h2>3. Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble du contenu du site {LEGAL.siteName} (textes éditoriaux,
        graphismes, logo, code source, interface) est la propriété de
        l&apos;éditeur, sauf mention contraire explicite. Toute reproduction,
        représentation, modification, publication, transmission ou exploitation
        de tout ou partie du site, par quelque procédé que ce soit, sans
        autorisation écrite préalable, est interdite.
      </p>
      <p>
        Les noms de marques et produits cosmétiques cités appartiennent à leurs
        propriétaires respectifs. Leur mention sur le site est purement
        informative et ne constitue ni un partenariat ni un endossement.
      </p>

      <h2>4. Données personnelles</h2>
      <p>
        Le site collecte certaines données personnelles dans le cadre de son
        fonctionnement. Pour plus d&apos;informations sur les données collectées,
        leur usage et tes droits, consulte notre{" "}
        <a href="/confidentialite">politique de confidentialité</a>.
      </p>

      <h2>5. Cookies</h2>
      <p>
        {LEGAL.siteName} utilise uniquement des cookies strictement nécessaires
        au fonctionnement du site (session de connexion). Aucun cookie de
        pistage publicitaire ou analytique non-anonyme n&apos;est utilisé.
      </p>

      <h2>6. Signalement de contenu</h2>
      <p>
        Si tu identifies une information erronée ou un contenu litigieux,
        contacte-nous à{" "}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>. Nous
        nous engageons à examiner toute demande dans un délai raisonnable.
      </p>

      <h2>7. Loi applicable</h2>
      <p>
        Le présent site est soumis au droit français. Tout litige relatif à son
        utilisation relève de la compétence exclusive des tribunaux français,
        sous réserve des dispositions impératives applicables aux consommateurs.
      </p>
    </LegalLayout>
  );
}
