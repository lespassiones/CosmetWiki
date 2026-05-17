import Image from "next/image";
import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";

/**
 * Public landing hero — full-bleed image with the headline + CTA layered
 * over its empty zone. Two source images switch at the lg breakpoint:
 *
 *   - landing.png         : 16:9, the empty zone is on the LEFT third
 *                           → desktop layout
 *   - landingportrait.png : 9:16, the empty zone is at the BOTTOM third
 *                           → mobile layout
 *
 * The text content is positioned absolutely over each image, anchored to
 * the matching empty zone (left on desktop, bottom on mobile). The image
 * is the actual background — no <BackgroundGlow>, no <header>, no <Footer>
 * here. It's a single-section landing as the user asked.
 */
export function LandingHero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#FAFAFA]">
      {/* Two background images, one per viewport. We can't conditionally
          render based on viewport in SSR, so both ship in the DOM with CSS
          visibility toggled at `lg`. Only the MOBILE variant has `priority`
          because mobile traffic dominates and Google LCP weighs mobile heavier.
          The desktop image still loads eagerly (Next default for images
          above the fold), just without the <link rel="preload"> hint, so we
          don't waste ~1.7 MB on mobile users who never see it. */}
      <Image
        src="/image/landing/landing.png"
        alt=""
        fill
        sizes="100vw"
        className="hidden lg:block object-cover object-center"
      />
      <Image
        src="/image/landing/landingportrait.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="lg:hidden object-cover object-center"
      />

      <PublicHeader />

      {/*
        Content layer.
        Desktop : sits in the LEFT half (the empty zone of landing.png),
                  vertically centred.
        Mobile  : sits at the BOTTOM (the empty zone of landingportrait.png),
                  horizontally centred.
      */}
      <div className="relative z-10 flex h-screen flex-col pt-20">
        <div className="hidden lg:flex flex-1 items-center">
          <div className="px-10 xl:px-16 max-w-[44%]">
            <Headline />
          </div>
        </div>

        <div className="lg:hidden mt-auto px-5 pb-8 pt-4 text-center">
          <Headline mobile />
        </div>
      </div>

      {/* Mini footer légal — visible depuis la home (requis par Google OAuth). */}
      <nav
        aria-label="Liens légaux"
        className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-5 pb-3 text-[11px] text-ink-subtle"
      >
        <Link href="/confidentialite" className="hover:text-ink transition-colors">
          Confidentialité
        </Link>
        <span aria-hidden>·</span>
        <Link href="/cgu" className="hover:text-ink transition-colors">
          CGU
        </Link>
        <span aria-hidden>·</span>
        <Link href="/mentions-legales" className="hover:text-ink transition-colors">
          Mentions légales
        </Link>
      </nav>
    </section>
  );
}

/**
 * Headline block — H1 with squiggle underline on "montre", subtitle, CTA.
 * `mobile` prop centers everything and tightens the type sizes.
 */
function Headline({ mobile = false }: { mobile?: boolean }) {
  const align = mobile ? "text-center" : "text-left";
  return (
    <div className={align}>
      <h1
        className={`font-bold leading-[1.05] tracking-tight text-ink ${
          mobile ? "text-[28px] sm:text-[32px]" : "text-[48px] xl:text-[58px]"
        }`}
      >
        Ce que tu ne lis pas
        <br />
        sur l&apos;étiquette,
        <br />
        on te le{" "}
        <span className="relative inline-block whitespace-nowrap">
          montre.
          {/* Hand-drawn squiggle under "montre" — same SVG family as the
              tagline on the dashboard, kept in brand rose. */}
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
            : "mt-6 text-[18px] xl:text-[19px] max-w-[30rem]"
        }`}
      >
        <span className="font-semibold text-ink">
          Au-delà des notes, la vérité de tes cosmétiques.
        </span>
        <br />
        Décode la composition, vérifie les promesses marketing, identifie ce
        qui agit vraiment sur ta peau.
      </p>

      <Link
        href="/auth/sign-in"
        className={`group inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#F43F5E] to-[#E11D48] text-white font-semibold shadow-[0_12px_28px_-8px_rgba(244,63,94,0.55),inset_0_1px_0_rgba(255,255,255,0.30)] transition hover:brightness-110 active:scale-[0.98] ${
          mobile
            ? "mt-6 px-6 py-3 text-[14px]"
            : "mt-8 px-8 py-4 text-[17px]"
        }`}
      >
        Analyse mon premier produit
        <span aria-hidden className="transition group-hover:translate-x-0.5">
          →
        </span>
      </Link>
    </div>
  );
}
