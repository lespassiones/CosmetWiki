"use client";

import { useEffect, useState, type ReactNode } from "react";

import { suivre } from "@/lib/mesure";

/**
 * Les morceaux vivants d'une page d'article, portés de MemoryPilot.
 *
 * Tout le reste de la page est rendu au build : ces composants n'ajoutent que
 * ce qui dépend du défilement, et la page reste lisible et navigable sans
 * eux. Sans JavaScript, le sommaire est une liste de liens qui marche, et la
 * barre du bas n'apparaît pas, ce qui est le bon repli.
 */

/**
 * La ligne de lecture : un titre qui la passe ouvre sa section. Un gros tiers
 * de l'écran, jamais moins que l'en-tête collant et un peu d'air.
 */
const ligneDeLecture = () => Math.max(140, window.innerHeight * 0.35);

/**
 * Le sommaire de la colonne de gauche, qui suit la lecture : la section en
 * cours est celle dont le titre a passé la ligne de lecture en dernier. Un
 * seul calcul par image (`requestAnimationFrame`), quel que soit le nombre
 * d'événements de défilement.
 */
export function SommaireActif({
  entrees,
}: {
  entrees: readonly { id: string; texte: string }[];
}) {
  const [actif, setActif] = useState(entrees[0]?.id ?? "");

  useEffect(() => {
    let image = 0;
    const calculer = () => {
      image = 0;
      let courant = entrees[0]?.id ?? "";
      const ligne = ligneDeLecture();
      for (const e of entrees) {
        const el = document.getElementById(e.id);
        if (el && el.getBoundingClientRect().top < ligne) courant = e.id;
      }
      setActif(courant);
    };
    const surDefilement = () => {
      if (!image) image = requestAnimationFrame(calculer);
    };
    calculer();
    window.addEventListener("scroll", surDefilement, { passive: true });
    window.addEventListener("resize", surDefilement, { passive: true });
    return () => {
      cancelAnimationFrame(image);
      window.removeEventListener("scroll", surDefilement);
      window.removeEventListener("resize", surDefilement);
    };
  }, [entrees]);

  return (
    <ol className="mt-4 flex flex-col gap-1 text-[13.5px]">
      {entrees.map((e, idx) => {
        const estActif = actif === e.id;
        return (
          <li key={e.id}>
            <a
              href={`#${e.id}`}
              aria-current={estActif ? "location" : undefined}
              className={`group flex items-start gap-2 rounded-lg px-2 py-1.5 transition hover:bg-rose-50 hover:text-rose-700 ${
                estActif ? "bg-rose-50 font-semibold text-rose-700" : "text-ink-muted"
              }`}
            >
              <span
                className={`mt-px shrink-0 text-[11px] font-semibold ${
                  estActif ? "text-rose-500" : "text-ink-subtle group-hover:text-rose-500"
                }`}
              >
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span className="leading-snug">{e.texte}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * La barre de téléchargement collée en bas de l'écran, sur téléphone et
 * tablette seulement (cachée à partir de `xl`, où la colonne de droite porte
 * l'appel).
 *
 * Elle apparaît une fois l'introduction dépassée, quand le lecteur a montré
 * qu'il lit, et disparaît dès que le bloc de fin d'article (`#cta-fin`) arrive
 * à l'écran : deux fois le même bouton l'un au-dessus de l'autre, c'est un de
 * trop.
 */
export function BarreTelechargement({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let image = 0;
    const calculer = () => {
      image = 0;
      const fin = document.getElementById("cta-fin");
      const finVisible = fin ? fin.getBoundingClientRect().top < window.innerHeight : false;
      setVisible(window.scrollY > 600 && !finVisible);
    };
    const surDefilement = () => {
      if (!image) image = requestAnimationFrame(calculer);
    };
    calculer();
    window.addEventListener("scroll", surDefilement, { passive: true });
    window.addEventListener("resize", surDefilement, { passive: true });
    return () => {
      cancelAnimationFrame(image);
      window.removeEventListener("scroll", surDefilement);
      window.removeEventListener("resize", surDefilement);
    };
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_-12px_rgba(17,17,17,0.18)] backdrop-blur transition-transform duration-300 xl:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      // `inert` en plus d'`aria-hidden` : cachée, la barre ne doit pas non plus
      // recevoir le focus clavier de son bouton.
      aria-hidden={!visible}
      inert={!visible}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">{children}</div>
    </div>
  );
}

/**
 * Jusqu'où un article est lu, section par section.
 *
 * La profondeur de défilement de PostHog dit « 60 % de la page ». Ce qui sert
 * au robot, c'est « la moitié des lecteurs ne dépasse pas la section 3 » :
 * c'est la section à réécrire, ou l'endroit où remonter l'appel. Chaque titre
 * de niveau 2 du corps (`[data-corps] h2[id]`) envoie donc
 * `section_atteinte` la première fois qu'il entre à l'écran : un événement par
 * section et par visite, une dizaine au plus.
 */
export function SuiviLecture({ slug }: { slug: string }) {
  useEffect(() => {
    const titres = Array.from(document.querySelectorAll<HTMLElement>("[data-corps] h2[id]"));
    if (titres.length === 0 || !("IntersectionObserver" in window)) return;
    const vus = new Set<string>();
    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const entree of entrees) {
          const id = (entree.target as HTMLElement).id;
          if (!entree.isIntersecting || vus.has(id)) continue;
          vus.add(id);
          suivre("section_atteinte", {
            slug,
            section: id,
            index: titres.findIndex((t) => t.id === id) + 1,
            total: titres.length,
          });
          observateur.unobserve(entree.target);
        }
      },
      // Un titre compte quand il passe le haut des trois cinquièmes de
      // l'écran : effleuré en bas de page, il n'a pas encore été lu.
      { rootMargin: "0px 0px -40% 0px" },
    );
    titres.forEach((t) => observateur.observe(t));
    return () => observateur.disconnect();
  }, [slug]);
  return null;
}
