import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { LEGAL } from "@/lib/legal";

const TITLE = "Conditions générales d'utilisation";
const DESCRIPTION =
  "Les règles d'utilisation du service Cosme Check : compte, contenu, propriété intellectuelle, responsabilités.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/cgu" },
  openGraph: {
    title: `${TITLE} · Cosme Check`,
    description: DESCRIPTION,
    url: "/cgu",
    type: "website",
  },
  robots: { index: false, follow: false },
};

export default function CGUPage() {
  return (
    <LegalLayout title={TITLE} current="cgu">
      <p>
        Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent
        l&apos;utilisation du site {LEGAL.siteName} (<a href={LEGAL.siteUrl}>{LEGAL.siteUrl}</a>).
        En accédant au site ou en créant un compte, tu acceptes ces conditions
        dans leur intégralité.
      </p>

      <h2>1. Objet du service</h2>
      <p>
        Cosme Check est un outil d&apos;information permettant&nbsp;:
      </p>
      <ul>
        <li>
          de rechercher des ingrédients cosmétiques (INCI) et d&apos;obtenir une
          classification indicative (vert, jaune, orange, rouge)&nbsp;;
        </li>
        <li>
          d&apos;analyser une liste INCI complète (saisie au clavier ou extraite
          d&apos;une photo) pour en obtenir un résumé&nbsp;;
        </li>
        <li>
          de sauvegarder un historique d&apos;analyses et une routine cosmétique
          personnelle, après création d&apos;un compte.
        </li>
      </ul>

      <h2>2. Accès au service</h2>
      <p>
        Le service est accessible gratuitement. Certaines fonctionnalités
        (sauvegarde de l&apos;historique, routine) nécessitent la création d&apos;un
        compte. Nous nous réservons le droit d&apos;introduire à l&apos;avenir des
        fonctionnalités payantes, qui seront clairement identifiées comme telles
        avant tout paiement.
      </p>

      <h2>3. Compte utilisateur</h2>
      <p>
        La création d&apos;un compte requiert une adresse email valide et un mot
        de passe d&apos;au moins 6 caractères, ou une authentification via Google.
        Tu es seul responsable de la confidentialité de tes identifiants et de
        toute activité réalisée depuis ton compte. En cas de soupçon d&apos;accès
        non autorisé, contacte-nous immédiatement à{" "}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
      </p>
      <p>
        Tu peux supprimer ton compte à tout moment en nous écrivant à
        l&apos;adresse ci-dessus.
      </p>

      <h2>4. Utilisation acceptable</h2>
      <p>En utilisant Cosme Check, tu t&apos;engages à&nbsp;:</p>
      <ul>
        <li>
          ne pas tenter de contourner les mécanismes de sécurité ou de limitation
          du service&nbsp;;
        </li>
        <li>
          ne pas effectuer d&apos;extraction massive automatisée (scraping) des
          données du site&nbsp;;
        </li>
        <li>
          ne pas téléverser de contenu illégal, offensant, ou portant atteinte
          aux droits de tiers&nbsp;;
        </li>
        <li>
          ne pas utiliser le service à des fins commerciales sans accord écrit
          préalable.
        </li>
      </ul>
      <p>
        En cas de manquement, nous nous réservons le droit de suspendre ou de
        supprimer ton compte sans préavis.
      </p>

      <h2>5. Avertissement médical et indicatif</h2>
      <p>
        <strong>
          Les informations fournies par Cosme Check sont à titre purement
          indicatif et ne constituent en aucun cas un conseil médical,
          dermatologique ou pharmaceutique.
        </strong>{" "}
        Les classifications « vert / jaune / orange / rouge » synthétisent un
        grand nombre d&apos;informations publiques et restent une simplification.
      </p>
      <p>
        En cas de doute sur un produit, une réaction cutanée ou un ingrédient,
        consulte un professionnel de santé qualifié (dermatologue, pharmacien,
        médecin). Cosme Check ne peut être tenu responsable des décisions prises
        sur la base de ses analyses.
      </p>

      <h2>6. Qualité des données</h2>
      <p>
        Les informations sur les ingrédients et leur classification proviennent
        de notre propre base de données, construite à partir de la
        réglementation cosmétique européenne (notamment le Règlement (CE)
        n°&nbsp;1223/2009) et de sources scientifiques publiques. Malgré nos
        efforts, des erreurs peuvent subsister. Si tu identifies une donnée que
        tu juges erronée, signale-la nous et nous la corrigerons.
      </p>

      <h2>7. Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble du site (logo, interface, textes éditoriaux, code) est
        protégé par le droit d&apos;auteur et appartient à l&apos;éditeur ou à ses
        partenaires. Toute reproduction, représentation ou exploitation
        non-autorisée est interdite.
      </p>
      <p>
        Les marques de cosmétiques mentionnées (ex&nbsp;: lors de l&apos;identification
        d&apos;un produit) restent la propriété de leurs détenteurs respectifs.
        Leur citation ne signifie pas une affiliation ni un partenariat.
      </p>

      <h2>8. Contenu généré par l&apos;intelligence artificielle</h2>
      <p>
        Certaines analyses (résumés, explications d&apos;ingrédients, analyses de
        cohérence) sont générées avec l&apos;aide de modèles d&apos;intelligence
        artificielle. Ces contenus peuvent contenir des erreurs ou des
        approximations. Tu reconnais en avoir conscience et utiliser ces
        informations avec discernement.
      </p>

      <h2>9. Limitation de responsabilité</h2>
      <p>
        Le service est fourni « tel quel », sans garantie de disponibilité,
        d&apos;exactitude ou d&apos;adéquation à un usage particulier. Dans la
        limite autorisée par la loi, Cosme Check ne saurait être tenu
        responsable de dommages indirects, perte de données ou préjudices
        résultant de l&apos;utilisation du service.
      </p>

      <h2>10. Évolution du service et des CGU</h2>
      <p>
        Nous pouvons modifier le service et les présentes CGU à tout moment. Les
        modifications substantielles seront notifiées via le site ou par email.
        L&apos;usage continu du service après modification vaut acceptation des
        nouvelles conditions.
      </p>

      <h2>11. Droit applicable et juridiction</h2>
      <p>
        Les présentes CGU sont régies par le droit français. En cas de litige,
        et après tentative de résolution amiable, les tribunaux français seront
        seuls compétents, sous réserve des dispositions impératives applicables
        aux consommateurs.
      </p>

      <h2>12. Contact</h2>
      <p>
        Pour toute question relative à ces CGU&nbsp;:{" "}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
      </p>
    </LegalLayout>
  );
}
