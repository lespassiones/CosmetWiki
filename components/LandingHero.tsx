import Image from "next/image";
import { PublicHeader } from "@/components/PublicHeader";
import { DownloadAppButton } from "@/components/download/DownloadAppButton";
import { StoreBadges } from "@/components/download/StoreBadges";

/**
 * Public landing hero - full-bleed image with the headline + CTA layered
 * over its empty zone. Two source images switch at the lg breakpoint:
 *
 *   - landing.png         : 16:9, the empty zone is on the LEFT third
 *                           → desktop layout
 *   - landingportrait.png : 9:16, the empty zone is at the BOTTOM third
 *                           → mobile layout
 *
 * The text content is positioned absolutely over each image, anchored to
 * the matching empty zone (left on desktop, bottom on mobile). The image
 * is the actual background - no <BackgroundGlow>, no <header>, no <Footer>
 * here. It's a single-section landing as the user asked.
 */
export function LandingHero() {
  return (
    <section className="relative w-full bg-white">
      {/* Fond blanc uni : l'ancienne image de fond rose (banniere.webp) et
          l'overlay de grain ont été retirés. La hauteur suit le contenu
          (titre + image), pas le viewport. */}
      <div className="relative overflow-hidden bg-white">
        {/* Contenu desktop : le groupe texte + téléphone est centré avec un
            gap contrôlé, pour que le texte reste proche du mockup (pas de
            grand vide au milieu). */}
        <div className="relative z-10 mx-auto hidden w-full max-w-[1180px] items-center justify-center gap-10 px-6 pt-32 sm:px-8 lg:flex xl:gap-16">
          <div className="w-full max-w-[560px] pb-8 reveal-on-mount">
            <Headline />
            <div className="mt-10">
              <KpiRow />
            </div>
            <div className="mt-6">
              <StoreBadges align="left" campaign="hero" />
            </div>
          </div>
          <div className="flex shrink-0 items-end reveal-on-mount reveal-delay-150">
            <div
              className="relative w-[415px] shrink-0 xl:w-[485px]"
              style={{ aspectRatio: "997 / 1577" }}
            >
              <Image
                src="/image/landing2/landingbeta.webp"
                alt="Aperçu de l'application Cosme Check"
                fill
                priority
                sizes="485px"
                className="object-contain object-bottom"
              />
            </div>
          </div>
        </div>

        {/* Contenu mobile vertical, style OnSkin :
            titre → image (halo) → description → KPIs → badges → CTA */}
        <div className="relative z-10 flex flex-col items-center gap-6 px-5 pb-10 pt-28 text-center lg:hidden">
          <HeroHeadline doublon className="reveal-on-mount text-ink text-[34px] sm:text-[40px]" />

          {/* Image avec halo radial + dégradé concave en bas */}
          <div className="relative mx-auto w-full max-w-[340px] reveal-on-mount reveal-delay-100">
            <div
              aria-hidden
              className="absolute inset-0 -z-10"
              style={{
                background:
                  "radial-gradient(ellipse 75% 60% at 50% 42%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.15) 35%, transparent 70%)",
              }}
            />
            <div
              className="relative"
              style={{ aspectRatio: "997 / 1577" }}
            >
              <Image
                src="/image/landing2/landingbeta.webp"
                alt="Aperçu de l'application Cosme Check"
                fill
                priority
                sizes="340px"
                className="object-contain object-bottom"
              />
              {/* Dégradé concave en bas pour fondre dans le fond blanc */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
                style={{
                  background:
                    "radial-gradient(ellipse 90% 100% at 50% 100%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.3) 50%, transparent 80%)",
                }}
              />
            </div>
          </div>

          <p className="reveal-on-mount reveal-delay-160 max-w-[32rem] text-[15px] leading-relaxed text-ink-muted">
            Avis, promesses, packaging... et pourtant le doute reste. Cosme
            Check analyse chaque produit{" "}
            <SquiggleWord>selon ton profil</SquiggleWord> et vérifie ses
            promesses sur des faits scientifiques, sans aucune influence
            commerciale.
          </p>

          <div className="reveal-on-mount reveal-delay-220">
            <KpiRow />
          </div>

          <div className="reveal-on-mount reveal-delay-270">
            <StoreBadges campaign="hero" />
          </div>

          {/* L'analyse se fait dans l'app : ce CTA ouvre le bon store sur
              mobile, la modale avec les deux badges sur ordinateur. */}
          <DownloadAppButton
            campaign="hero"
            withArrow
            modalTitle="Analyse ton premier produit dans l'app"
            modalSubtitle="Scan du code-barres, photo de la composition, lien produit ou liste INCI collée. Télécharge Cosme Check gratuitement pour lancer ta première analyse."
            className="group reveal-on-mount reveal-delay-320 mt-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#F43F5E] to-[#E11D48] px-7 py-3 text-[15px] font-semibold text-white shadow-[0_12px_28px_-8px_rgba(244,63,94,0.55),inset_0_1px_0_rgba(255,255,255,0.30)] transition hover:brightness-110 active:scale-[0.98]"
          >
            Analyse ton premier produit
          </DownloadAppButton>
        </div>
      </div>

      <PublicHeader />
    </section>
  );
}

/**
 * Highlight rose incliné (DA façon CinetPay) : un bloc arrondi, dégradé rose,
 * texte blanc, légèrement tourné, posé derrière son contenu. Réutilisé pour
 * l'accroche du titre (grand) et pour « selon ton profil » dans le sous-titre
 * (petit). `textClassName` gère padding/taille ; `blockClassName` gère
 * arrondi/ombre du bloc.
 */
function HighlightBlock({
  children,
  textClassName,
  blockClassName = "rounded-2xl shadow-[0_14px_30px_-12px_rgba(225,29,72,0.55)]",
}: {
  children: string;
  textClassName: string;
  blockClassName?: string;
}) {
  return (
    <span className="relative inline-block">
      <span
        aria-hidden
        className={`absolute inset-0 -rotate-2 bg-gradient-to-br from-[#F43F5E] to-[#E11D48] ${blockClassName}`}
      />
      <span className={`relative inline-block whitespace-nowrap ${textClassName}`}>
        {children}
      </span>
    </span>
  );
}

/**
 * Mot souligné d'un trait ondulé « fantaisiste » (SVG rose). Utilisé pour
 * accentuer « selon ton profil » dans le sous-titre, sans l'alourdir d'un
 * bloc plein.
 */
function SquiggleWord({ children }: { children: string }) {
  return (
    <span className="relative inline-block whitespace-nowrap font-semibold text-[#F43F5E]">
      {children}
      <svg
        aria-hidden
        viewBox="0 0 200 14"
        preserveAspectRatio="none"
        className="pointer-events-none absolute -bottom-1 left-0 right-0 h-1.5 text-[#F43F5E]"
      >
        <path
          d="M3,10 Q60,1 100,5 T197,10"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </span>
  );
}

/**
 * Titre héro partagé (desktop + mobile) : l'accroche « Arrête de douter »
 * pose le PROBLÈME (le doute) sur un bloc rose incliné (DA façon highlight,
 * remplace l'ancien soulignement ondulé). La promesse suit en dessous.
 * `className` porte la taille de police et hérite de l'alignement du
 * conteneur (gauche desktop, centré mobile).
 */
function HeroHeadline({
  className = "",
  doublon = false,
}: {
  className?: string;
  /** Vrai pour la copie mobile : la page rend le titre deux fois (l'une est
   *  masquée en CSS selon l'écran) et Google ne doit voir qu'un seul h1. */
  doublon?: boolean;
}) {
  const Balise = doublon ? "div" : "h1";
  return (
    <Balise
      {...(doublon ? { role: "heading", "aria-level": 1 } : {})}
      className={`font-bold leading-[1.12] tracking-tight ${className}`}
    >
      <HighlightBlock textClassName="px-3 py-1 text-white">
        Arrête de douter
      </HighlightBlock>
      <span className="mt-3 block text-[#111111]">
        découvre si un produit est vraiment{" "}
        <span className="whitespace-nowrap text-[#F43F5E]">fait pour toi</span>.
      </span>
    </Balise>
  );
}

/**
 * Headline block - titre héro + sous-titre (problème → solution → indépendance) + CTA.
 * `mobile` prop centers everything and tightens the type sizes.
 */
function Headline({ mobile = false }: { mobile?: boolean }) {
  const align = mobile ? "text-center" : "text-left";
  return (
    <div className={align}>
      <HeroHeadline
        className={`text-ink ${
          mobile
            ? "text-[28px] sm:text-[32px]"
            : "text-[clamp(30px,3.2vw,46px)]"
        }`}
      />

      <p
        className={`text-ink-muted leading-relaxed ${
          mobile
            ? "mt-4 text-[14px] sm:text-[15px] mx-auto max-w-[28rem]"
            : "mt-6 text-[clamp(15px,1.25vw,19px)] max-w-[30rem]"
        }`}
      >
        Avis, promesses, packaging... et pourtant le doute reste. Cosme Check
        analyse chaque produit{" "}
        <SquiggleWord>selon ton profil</SquiggleWord> et vérifie ses promesses
        sur des faits scientifiques, sans aucune influence commerciale.
      </p>

      <DownloadAppButton
        campaign="hero"
        withArrow
        modalTitle="Analyse ton premier produit dans l'app"
        modalSubtitle="Scan du code-barres, photo de la composition, lien produit ou liste INCI collée. Télécharge Cosme Check gratuitement pour lancer ta première analyse."
        className={`group inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#F43F5E] to-[#E11D48] text-white font-semibold shadow-[0_12px_28px_-8px_rgba(244,63,94,0.55),inset_0_1px_0_rgba(255,255,255,0.30)] transition hover:brightness-110 active:scale-[0.98] ${
          mobile
            ? "mt-6 px-6 py-3 text-[14px]"
            : "mt-8 px-8 py-4 text-[17px]"
        }`}
      >
        Analyse ton premier produit
      </DownloadAppButton>
    </div>
  );
}

/** Ligne de 3 KPIs sur mobile (chiffre + label, séparés par un fin trait). */
function KpiRow() {
  const items = [
    { value: "400K+", label: "Produits" },
    { value: "15K+", label: "Ingrédients" },
    { value: "+10K", label: "Marques" },
  ];
  return (
    <div className="my-1 flex w-full max-w-[380px] items-stretch justify-between border-y border-black/[0.10] py-4">
      {items.map((it, i) => (
        <div key={it.label} className="flex flex-1 items-center">
          {i > 0 ? <div aria-hidden className="mr-3 h-8 w-px bg-black/[0.10]" /> : null}
          <div className="flex flex-1 flex-col items-center text-center">
            <span className="text-[22px] font-bold leading-none text-ink">
              {it.value}
            </span>
            <span className="mt-1 text-[11px] uppercase tracking-wide text-ink-muted">
              {it.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
