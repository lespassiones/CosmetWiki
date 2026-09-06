import Link from "next/link";
import { StoreBadges } from "@/components/download/StoreBadges";

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
              Check tes cosmétiques, ingrédient par ingrédient.
            </p>
            <StoreBadges align="left" campaign="footer" size="compact" className="mt-5" />
          </div>

          {/* Colonne 2 : Application */}
          <FooterColumn title="Application">
            <FooterLink href="/fonctionnalites">Fonctionnalités</FooterLink>
            <FooterLink href="/comment-ca-marche">Comment ça marche</FooterLink>
            <FooterLink href="/#tarifs">Tarifs</FooterLink>
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
