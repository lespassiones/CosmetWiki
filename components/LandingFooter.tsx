import Link from "next/link";

/**
 * Footer style Yuka pour la landing publique :
 *  - Illustration colline + plantes en BACKGROUND étiré sur tout le footer.
 *  - Contenu (logo, colonnes, copyright) posé par-dessus le gazon.
 *  - Copyright en toute dernière ligne du site.
 */
export function LandingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative w-full">
      {/* Vague de séparation — remonte de 56px pour chevaucher la section précédente */}
      <div aria-hidden className="-mb-px -mt-14 w-full overflow-hidden leading-none">
        <svg
          viewBox="0 0 1440 56"
          xmlns="http://www.w3.org/2000/svg"
          className="block w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0,20 C240,56 480,0 720,32 C960,56 1200,6 1440,28 L1440,56 L0,56 Z"
            fill="#fcfcfc"
          />
        </svg>
      </div>

      <div className="relative w-full bg-[#fcfcfc] bg-[url('/image/section3/footer.webp')] bg-[length:100%_100%] bg-no-repeat">
      <div className="relative mx-auto w-full max-w-[1280px] px-6 pb-8 pt-12 sm:px-8 lg:pt-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:gap-x-10">
          {/* Colonne 1 : logo + badges */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link
              href="/"
              className="inline-block text-[26px] font-bold tracking-tight"
            >
              <span className="text-[#111111]">Cosme </span>
              <span className="text-[#F43F5E]">Check</span>
            </Link>
            <p className="mt-3 max-w-[20rem] text-[13px] font-medium leading-relaxed text-[#111111]">
              Décode tes cosmétiques, ingrédient par ingrédient.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <AppleStoreBadge />
              <GooglePlayBadge />
            </div>
          </div>

          {/* Colonne 2 : Application */}
          <FooterColumn title="Application">
            <FooterLink href="/fonctionnalites">Fonctionnalités</FooterLink>
            <FooterLink href="/comment-ca-marche">Comment ça marche</FooterLink>
            <FooterLink href="/offre">Nos offres</FooterLink>
          </FooterColumn>

          {/* Colonne 3 : Ressources */}
          <FooterColumn title="Ressources">
            <FooterLink href="/blog">Blog</FooterLink>
            <FooterLink href="/faq">FAQ</FooterLink>
            <FooterLink href="/contact">Contact</FooterLink>
          </FooterColumn>
        </div>

        {/* Dernière ligne du site : copyright + droits + tous les liens légaux
            (Mentions légales, Confidentialité, CGU) regroupés sur la même ligne,
            comme c'est la convention. Rien en dessous. */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 border-t border-black/20 pt-6 text-[12px] font-semibold text-[#111111]">
          <span>© {year} Cosme Check</span>
          <span aria-hidden>·</span>
          <span>Tous droits réservés</span>
          <span aria-hidden>·</span>
          <Link href="/mentions-legales" className="transition-colors hover:text-[#F43F5E]">
            Mentions légales
          </Link>
          <span aria-hidden>·</span>
          <Link href="/confidentialite" className="transition-colors hover:text-[#F43F5E]">
            Confidentialité
          </Link>
          <span aria-hidden>·</span>
          <Link href="/cgu" className="transition-colors hover:text-[#F43F5E]">
            CGU
          </Link>
        </div>
      </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-[14px] font-bold tracking-tight text-[#F43F5E]">
        {title}
      </h3>
      <ul className="mt-4 flex flex-col gap-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-[14px] font-semibold text-[#111111] transition-colors hover:text-[#F43F5E]"
      >
        {children}
      </Link>
    </li>
  );
}

function AppleStoreBadge() {
  return (
    <div
      role="img"
      aria-label="Bientôt sur l'App Store"
      className="flex h-[42px] w-[132px] items-center gap-2 rounded-lg bg-black px-3 text-white"
    >
      <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6 fill-current">
        <path d="M17.05 12.04c-.02-2.3 1.88-3.4 1.96-3.45-1.07-1.56-2.74-1.78-3.33-1.8-1.42-.15-2.77.84-3.5.84-.73 0-1.84-.82-3.03-.79-1.56.02-3 .91-3.8 2.31-1.62 2.82-.41 6.97 1.17 9.25.77 1.12 1.69 2.37 2.89 2.33 1.16-.05 1.6-.75 3-.75s1.8.75 3.03.72c1.25-.02 2.04-1.14 2.8-2.27.88-1.3 1.25-2.56 1.27-2.62-.03-.02-2.44-.94-2.46-3.77zM14.84 5.27c.64-.78 1.07-1.86.95-2.93-.92.04-2.04.61-2.7 1.39-.6.69-1.12 1.8-.98 2.85 1.03.08 2.08-.52 2.73-1.31z" />
      </svg>
      <div className="flex flex-col text-left leading-none">
        <span className="text-[8px] tracking-wide">Télécharger sur</span>
        <span className="text-[14px] font-semibold tracking-tight">App Store</span>
      </div>
    </div>
  );
}

function GooglePlayBadge() {
  return (
    <div
      role="img"
      aria-label="Bientôt sur Google Play"
      className="flex h-[42px] w-[140px] items-center gap-2 rounded-lg bg-black px-3 text-white"
    >
      <svg viewBox="0 0 60 64" aria-hidden className="h-6 w-6">
        <path d="M0 5.4v53.2c0 1.7 1.4 3 3 3l30-30L3 1.5C1.4 1.8 0 3.2 0 5.4z" fill="#4285F4" />
        <path d="M48.6 22.4 39 17 33 23l9 9 6.6-5.4c2-1.5 2-4.7 0-6.2z" fill="#FBBC04" />
        <path d="M3 1.5c.4 0 .7.1 1.1.3L42 22 36 28 0 4.5C0 3 1.3 1.5 3 1.5z" fill="#34A853" />
        <path d="m3 62.5 33-30 6 6L4.1 62.2c-.4.2-.7.3-1.1.3z" fill="#EA4335" />
      </svg>
      <div className="flex flex-col text-left leading-none">
        <span className="text-[8px] tracking-wide">Disponible sur</span>
        <span className="text-[14px] font-semibold tracking-tight">Google Play</span>
      </div>
    </div>
  );
}
