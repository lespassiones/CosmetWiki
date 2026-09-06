import { Suspense } from "react";
import { LandingHero } from "@/components/LandingHero";
import { LandingSteps } from "@/components/LandingSteps";
import { LandingValues } from "@/components/LandingValues";
import { LandingPricing } from "@/components/LandingPricing";
import { LandingArticles } from "@/components/LandingArticles";
import { DownloadAutoOpen } from "@/components/download/DownloadAutoOpen";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * Page d'accueil de cosme-check.com : vitrine publique, et rien d'autre.
 *
 * Il n'y a plus de connexion ni d'espace connecté sur le site. L'analyse, la
 * routine, l'historique et l'abonnement vivent dans l'application mobile. Cette
 * page ne lit donc AUCUNE session et ne fait AUCUN appel à Supabase : elle est
 * entièrement statique, servie depuis le CDN, et ne consomme ni bande passante
 * Supabase ni invocation de fonction serveur.
 *
 * C'était l'inverse avant : la home résolvait la session, chargeait le profil,
 * puis lançait deux requêtes (dernière analyse + routine) pour un tableau de
 * bord. Tout ça a été retiré avec la web app.
 *
 * `DownloadAutoOpen` gère les visiteurs qui reviennent par un ancien lien de la
 * web app : la middleware les renvoie ici avec `?app=<raison>` et la modale de
 * téléchargement s'ouvre avec le message correspondant.
 */

/** Balisage structuré de la racine du site (Organization, WebSite, App). */
function buildHomeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Cosme Check",
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/pwa/icon.png`,
          width: 512,
          height: 512,
        },
        description:
          "Cosme Check est l'application qui te dit si un produit cosmétique est fait pour toi : score de compatibilité avec ton profil, analyse des promesses marketing face à la formule réelle, comparaison de produits et couverture de tes objectifs beauté. 100 % indépendante.",
        inLanguage: "fr",
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Cosme Check",
        description:
          "L'application qui te dit si un produit cosmétique est fait pour toi : score de compatibilité, promesses vs formule, comparaison et objectifs de ta routine.",
        inLanguage: "fr",
        publisher: { "@id": `${SITE_URL}/#organization` },
        // La recherche interne d'ingrédients (/search) reste publique, donc
        // la sitelink searchbox garde du sens.
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        // SoftwareApplication sur la home : c'est le noeud que les moteurs IA
        // lisent pour savoir SUR QUOI citer Cosme Check. On mène par les 4
        // différenciateurs (compatibilité, promesses, comparaison, objectifs),
        // pas par l'analyse INCI générique.
        //
        // `operatingSystem` ne liste plus « Web » : le produit n'est plus
        // utilisable dans un navigateur, l'annoncer serait faux et abîmerait la
        // confiance des moteurs sur le reste du noeud.
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#app`,
        name: "Cosme Check",
        url: SITE_URL,
        applicationCategory: "LifestyleApplication",
        operatingSystem: "iOS, Android",
        inLanguage: "fr",
        publisher: { "@id": `${SITE_URL}/#organization` },
        description:
          "Cosme Check calcule un score de compatibilité entre ton profil (peau, cheveux, objectifs, sensibilités, ingrédients évités) et la formule réelle d'un produit, vérifie si les promesses marketing sont tenues, compare deux produits et mesure si ta routine couvre tes objectifs beauté.",
        featureList: [
          "Score de compatibilité entre un produit et ton profil",
          "Analyse des promesses marketing face à la formule réelle",
          "Comparaison de deux produits côte à côte",
          "Couverture de tes objectifs beauté sur toute ta routine",
          "Recommandations personnalisées d'alternatives mieux notées",
          "Analyse INCI par scan, liste collée ou recherche par nom",
          "Coach IA cosmétique (Beauty Advisor)",
        ],
        // Trois offres nommées : l'app est gratuite, Premium existe en
        // mensuel et en annuel. Ces montants doivent rester ceux de
        // `lib/pricingPlans.ts`, qui alimente la section tarifs affichée sur
        // cette même page : le balisage et le visible ne peuvent pas annoncer
        // deux prix différents.
        offers: [
          {
            "@type": "Offer",
            name: "Gratuit",
            price: "0",
            priceCurrency: "EUR",
          },
          {
            "@type": "Offer",
            name: "Premium mensuel",
            price: "7.99",
            priceCurrency: "EUR",
          },
          {
            "@type": "Offer",
            name: "Premium annuel",
            price: "49.99",
            priceCurrency: "EUR",
          },
        ],
      },
    ],
  };
}

function HomeJsonLdScript() {
  const jsonLd = buildHomeJsonLd();
  return (
    <script
      type="application/ld+json"
      // Escape `<` and `>` so brand or description content with HTML-like
      // characters can't break out of the script tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd)
          .replace(/</g, "\\u003c")
          .replace(/>/g, "\\u003e"),
      }}
    />
  );
}

export default function Home() {
  return (
    <>
      <HomeJsonLdScript />
      {/* `useSearchParams` impose une frontière Suspense pour que le reste de
          la page reste rendu statiquement. */}
      <Suspense fallback={null}>
        <DownloadAutoOpen />
      </Suspense>
      <LandingHero />
      <LandingSteps />
      <LandingValues />
      <LandingPricing />
      <LandingArticles />
    </>
  );
}
