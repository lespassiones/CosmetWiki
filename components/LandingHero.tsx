import Image from "next/image";
import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";

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
              <StoreBadges align="left" />
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
          <h1 className="reveal-on-mount font-bold leading-[1.05] tracking-tight text-ink text-[34px] sm:text-[40px]">
            <span className="text-[#111111]">Le scan qui te dit si ce produit est vraiment </span>
            <span className="relative inline-block whitespace-nowrap">
              <span className="text-[#F43F5E]">fait pour toi</span>
              <svg
                aria-hidden
                viewBox="0 0 200 14"
                preserveAspectRatio="none"
                className="pointer-events-none absolute left-0 right-0 -bottom-1.5 h-2 text-rose-500"
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
          </h1>

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
            On analyse chaque produit pour te dire s'il est vraiment adapté à
            toi, et on vérifie ses promesses pour valider son efficacité.
          </p>

          <div className="reveal-on-mount reveal-delay-220">
            <KpiRow />
          </div>

          <div className="reveal-on-mount reveal-delay-270">
            <StoreBadges />
          </div>

          <Link
            href="/auth/sign-in"
            className="group reveal-on-mount reveal-delay-320 mt-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#F43F5E] to-[#E11D48] px-7 py-3 text-[15px] font-semibold text-white shadow-[0_12px_28px_-8px_rgba(244,63,94,0.55),inset_0_1px_0_rgba(255,255,255,0.30)] transition hover:brightness-110 active:scale-[0.98]"
          >
            Analyse ton premier produit
            <span aria-hidden className="transition group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>
      </div>

      <PublicHeader />
    </section>
  );
}

/**
 * Headline block - H1 with squiggle underline on "fait pour toi", subtitle, CTA.
 * `mobile` prop centers everything and tightens the type sizes.
 */
function Headline({ mobile = false }: { mobile?: boolean }) {
  const align = mobile ? "text-center" : "text-left";
  return (
    <div className={align}>
      <h1
        className={`font-bold leading-[1.05] tracking-tight text-ink ${
          mobile
            ? "text-[28px] sm:text-[32px]"
            : "text-[clamp(30px,3.2vw,46px)]"
        }`}
      >
        <span className="text-[#111111]">Le scan qui te dit si ce produit est vraiment </span>
        <span className="relative inline-block whitespace-nowrap">
          <span className="text-[#F43F5E]">fait pour toi</span>
          <svg
            aria-hidden
            viewBox="0 0 200 14"
            preserveAspectRatio="none"
            className={`pointer-events-none absolute left-0 right-0 text-rose-500 ${
              mobile ? "-bottom-1.5 h-2" : "-bottom-2 h-2.5 lg:h-3"
            }`}
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
      </h1>

      <p
        className={`text-ink-muted leading-relaxed ${
          mobile
            ? "mt-4 text-[14px] sm:text-[15px] mx-auto max-w-[28rem]"
            : "mt-6 text-[clamp(15px,1.25vw,19px)] max-w-[30rem]"
        }`}
      >
        On analyse chaque produit pour te dire s'il est vraiment adapté à toi,
        et on vérifie ses promesses pour valider son efficacité.
      </p>

      <Link
        href="/auth/sign-in"
        className={`group inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#F43F5E] to-[#E11D48] text-white font-semibold shadow-[0_12px_28px_-8px_rgba(244,63,94,0.55),inset_0_1px_0_rgba(255,255,255,0.30)] transition hover:brightness-110 active:scale-[0.98] ${
          mobile
            ? "mt-6 px-6 py-3 text-[14px]"
            : "mt-8 px-8 py-4 text-[17px]"
        }`}
      >
        Analyse ton premier produit
        <span aria-hidden className="transition group-hover:translate-x-0.5">
          →
        </span>
      </Link>
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

/** Badges App Store + Google Play (visuels, non cliquables pour l'instant). */
function StoreBadges({ align = "center" }: { align?: "center" | "left" }) {
  const justify = align === "left" ? "justify-start" : "justify-center";
  return (
    <div className={`flex flex-wrap items-center gap-3 ${justify}`}>
      <AppleStoreBadge />
      <GooglePlayBadge />
    </div>
  );
}

function AppleStoreBadge() {
  return (
    <div
      role="img"
      aria-label="Bientôt sur l'App Store"
      className="flex h-[44px] w-[140px] items-center gap-2 rounded-lg bg-black px-3 text-white"
    >
      <svg viewBox="0 0 24 24" aria-hidden className="h-7 w-7 fill-current">
        <path d="M17.05 12.04c-.02-2.3 1.88-3.4 1.96-3.45-1.07-1.56-2.74-1.78-3.33-1.8-1.42-.15-2.77.84-3.5.84-.73 0-1.84-.82-3.03-.79-1.56.02-3 .91-3.8 2.31-1.62 2.82-.41 6.97 1.17 9.25.77 1.12 1.69 2.37 2.89 2.33 1.16-.05 1.6-.75 3-.75s1.8.75 3.03.72c1.25-.02 2.04-1.14 2.8-2.27.88-1.3 1.25-2.56 1.27-2.62-.03-.02-2.44-.94-2.46-3.77zM14.84 5.27c.64-.78 1.07-1.86.95-2.93-.92.04-2.04.61-2.7 1.39-.6.69-1.12 1.8-.98 2.85 1.03.08 2.08-.52 2.73-1.31z" />
      </svg>
      <div className="flex flex-col text-left leading-none">
        <span className="text-[9px] tracking-wide">Télécharger sur</span>
        <span className="text-[15px] font-semibold tracking-tight">App Store</span>
      </div>
    </div>
  );
}

function GooglePlayBadge() {
  return (
    <div
      role="img"
      aria-label="Bientôt sur Google Play"
      className="flex h-[44px] w-[150px] items-center gap-2 rounded-lg bg-black px-3 text-white"
    >
      <svg viewBox="0 0 60 64" aria-hidden className="h-7 w-7">
        <path d="M0 5.4v53.2c0 1.7 1.4 3 3 3l30-30L3 1.5C1.4 1.8 0 3.2 0 5.4z" fill="#4285F4" />
        <path d="M48.6 22.4 39 17 33 23l9 9 6.6-5.4c2-1.5 2-4.7 0-6.2z" fill="#FBBC04" />
        <path d="m3 1.5 39 30.5L51.5 41 3 62.6c-1.6-.3-3-1.7-3-3.4V5.4c0-1.7 1.4-3 3-3z" fill="transparent" />
        <path d="M3 1.5c.4 0 .7.1 1.1.3L42 22 36 28 0 4.5C0 3 1.3 1.5 3 1.5z" fill="#34A853" />
        <path d="m3 62.5 33-30 6 6L4.1 62.2c-.4.2-.7.3-1.1.3z" fill="#EA4335" />
      </svg>
      <div className="flex flex-col text-left leading-none">
        <span className="text-[9px] tracking-wide">Disponible sur</span>
        <span className="text-[15px] font-semibold tracking-tight">Google Play</span>
      </div>
    </div>
  );
}
