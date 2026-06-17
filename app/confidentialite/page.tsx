import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { LEGAL } from "@/lib/legal";

const TITLE = "Politique de confidentialité";
const DESCRIPTION =
  "Quelles données Cosme Check collecte, comment elles sont utilisées, stockées et protégées, et quels sont tes droits (accès, rectification, suppression) dans le respect du RGPD.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/confidentialite" },
  openGraph: {
    title: `${TITLE} · Cosme Check`,
    description: DESCRIPTION,
    url: "/confidentialite",
    type: "website",
  },
  robots: { index: true, follow: false },
};

export default function ConfidentialitePage() {
  return (
    <LegalLayout title={TITLE} current="confidentialite">
      <p>
        Chez {LEGAL.siteName}, nous prenons la confidentialité de tes données très
        au sérieux. Cette page explique de manière transparente ce que nous
        collectons, pourquoi, où c&apos;est stocké et quels sont tes droits, dans le
        respect du Règlement Général sur la Protection des Données (RGPD).
      </p>

      <h2>1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement des données est{" "}
        <strong>{LEGAL.publisher.name}</strong>, éditeur de {LEGAL.siteName}.
        Pour toute question relative à tes données personnelles, tu peux nous
        contacter à&nbsp;:{" "}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
      </p>

      <h2>2. Données collectées</h2>
      <h3>2.1 Données fournies directement par toi</h3>
      <ul>
        <li>
          <strong>Création de compte</strong>&nbsp;: prénom, adresse email et mot de
          passe (chiffré, jamais stocké en clair).
        </li>
        <li>
          <strong>Connexion via Google</strong>&nbsp;: prénom, adresse email et photo
          de profil transmis par Google. Aucun autre accès à ton compte Google
          n&apos;est demandé.
        </li>
        <li>
          <strong>Photos et listes INCI analysées</strong>&nbsp;: les images que tu
          envoies via le scanner ainsi que les listes d&apos;ingrédients que tu
          colles dans l&apos;analyseur sont traitées pour produire ton analyse.
        </li>
        <li>
          <strong>Historique d&apos;analyses</strong>&nbsp;: si tu es connecté, tes
          analyses sont sauvegardées pour que tu puisses les retrouver plus tard.
        </li>
      </ul>

      <h3>2.2 Données collectées automatiquement</h3>
      <ul>
        <li>
          <strong>Données techniques</strong>&nbsp;: type d&apos;appareil, navigateur,
          adresse IP (anonymisée), pages visitées. Utilisées uniquement pour
          mesurer l&apos;audience et améliorer le site (via Vercel Analytics, sans
          cookie de suivi).
        </li>
        <li>
          <strong>Cookies strictement nécessaires</strong>&nbsp;: un cookie de session
          chiffré pour te garder connecté. Aucun cookie publicitaire ou de
          pistage tiers.
        </li>
      </ul>

      <h2>3. Finalités du traitement</h2>
      <ul>
        <li>Te permettre de créer un compte et te connecter.</li>
        <li>Analyser les listes INCI et photos que tu nous soumets.</li>
        <li>Sauvegarder ton historique d&apos;analyses et ta routine.</li>
        <li>Améliorer le site (mesure d&apos;audience anonyme).</li>
        <li>Répondre à tes demandes par email.</li>
      </ul>

      <h2>4. Base légale</h2>
      <ul>
        <li>
          <strong>Exécution du contrat</strong>&nbsp;: création de compte, sauvegarde
          de l&apos;historique, analyses (art. 6.1.b du RGPD).
        </li>
        <li>
          <strong>Intérêt légitime</strong>&nbsp;: mesure d&apos;audience anonyme et
          sécurité du site (art. 6.1.f).
        </li>
        <li>
          <strong>Consentement</strong>&nbsp;: lorsque tu choisis explicitement de te
          connecter avec Google (art. 6.1.a).
        </li>
      </ul>

      <h2>5. Sous-traitants et destinataires</h2>
      <p>
        Tes données ne sont jamais vendues ni cédées à des tiers à des fins
        commerciales. Elles sont uniquement traitées par les sous-traitants
        techniques suivants, choisis pour leur conformité RGPD&nbsp;:
      </p>
      <ul>
        {LEGAL.dataProcessors.map((p) => (
          <li key={p.name}>
            <strong>{p.name}</strong> - {p.role}. Localisation&nbsp;: {p.location}.{" "}
            <a href={p.website} target="_blank" rel="noopener noreferrer">
              Politique de confidentialité
            </a>
            .
          </li>
        ))}
      </ul>
      <p>
        Certains de ces sous-traitants sont situés hors de l&apos;Union européenne
        (notamment aux États-Unis). Dans ces cas, des garanties appropriées
        (clauses contractuelles types de la Commission européenne) sont mises en
        place.
      </p>

      <h2>6. Durée de conservation</h2>
      <ul>
        <li>
          <strong>Compte utilisateur</strong>&nbsp;: tant que ton compte est actif,
          puis supprimé sur demande ou après 3 ans d&apos;inactivité.
        </li>
        <li>
          <strong>Photos analysées</strong>&nbsp;: les images envoyées à l&apos;OCR ne
          sont pas conservées sur nos serveurs après le traitement. Seul le
          texte extrait (liste INCI) est conservé avec ton analyse.
        </li>
        <li>
          <strong>Logs techniques</strong>&nbsp;: 30 jours maximum.
        </li>
      </ul>

      <h2>7. Tes droits</h2>
      <p>Conformément au RGPD, tu disposes des droits suivants&nbsp;:</p>
      <ul>
        <li>
          <strong>Droit d&apos;accès</strong>&nbsp;: obtenir une copie de tes données.
        </li>
        <li>
          <strong>Droit de rectification</strong>&nbsp;: corriger des données
          inexactes.
        </li>
        <li>
          <strong>Droit à l&apos;effacement</strong>&nbsp;: demander la suppression de
          ton compte et de toutes tes données.
        </li>
        <li>
          <strong>Droit à la portabilité</strong>&nbsp;: récupérer tes analyses dans
          un format réutilisable.
        </li>
        <li>
          <strong>Droit d&apos;opposition</strong>&nbsp;: t&apos;opposer au traitement
          pour motifs légitimes.
        </li>
        <li>
          <strong>Droit de retirer ton consentement</strong> à tout moment, sans
          effet rétroactif.
        </li>
      </ul>
      <p>
        Pour exercer ces droits, écris-nous à{" "}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>. Tu
        peux également déposer une réclamation auprès de la CNIL
        (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">cnil.fr</a>).
      </p>

      <h2>8. Sécurité</h2>
      <p>
        Les mots de passe sont chiffrés (hash bcrypt côté Supabase Auth), les
        échanges entre ton navigateur et nos serveurs sont chiffrés via HTTPS
        (TLS 1.2 minimum), et l&apos;accès aux bases de données est restreint via
        des politiques de sécurité au niveau des lignes (Row Level Security).
      </p>

      <h2>9. Cookies</h2>
      <p>
        Cosme Check utilise uniquement des cookies strictement nécessaires au
        fonctionnement du site (session de connexion). Aucun cookie publicitaire
        ni de pistage tiers n&apos;est déposé sur ton appareil. Aucune bannière de
        consentement n&apos;est requise dans cette configuration.
      </p>

      <h2>10. Mineurs</h2>
      <p>
        Cosme Check n&apos;est pas destiné aux enfants de moins de 15 ans. Si tu es
        mineur, demande l&apos;accord de tes parents avant de créer un compte.
      </p>

      <h2>11. Modifications</h2>
      <p>
        Cette politique peut être mise à jour pour refléter des évolutions
        techniques ou légales. La date de dernière mise à jour est indiquée en
        haut de la page. En cas de changement significatif, nous t&apos;informerons
        par email si tu disposes d&apos;un compte.
      </p>
    </LegalLayout>
  );
}
