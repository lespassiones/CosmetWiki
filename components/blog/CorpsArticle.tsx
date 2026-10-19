import { Fragment, type ReactNode } from "react";

import type { Bloc, TonEncadre } from "@/contenu/articles";
import { ancres, insecables, petiteImage, placesDesAppels } from "@/lib/article";
import { TexteRiche } from "./TexteRiche";

/**
 * Le corps d'un article, bloc par bloc.
 *
 * Avant le 19/10/2026, chaque article recopiait ses propres `CheckList`,
 * `Callout` et `ArticleImage` dans sa page, et les copies avaient divergé
 * (deux tons d'encadré ici, trois là, une image recadrée en 21:9 ici et pas
 * là). Un composant, une seule façon de rendre un bloc, avec les mêmes
 * classes que les anciennes pages pour que le rendu ne bouge pas.
 *
 * Les titres portent leur ancre (`lib/article`, la même que lit le sommaire).
 * Les appels à télécharger du haut et du milieu se glissent avant les titres
 * que désigne `placesDesAppels` ; un bloc `cta` écrit dans l'article prend la
 * place du milieu. Le corps ne connaît pas le bouton : la page le dessine, par
 * `appel`.
 */
export function CorpsArticle({
  blocs,
  appel,
}: {
  blocs: readonly Bloc[];
  appel: (emplacement: "haut" | "milieu", texte?: string, bouton?: string) => ReactNode;
}) {
  const ids = ancres(blocs);
  const places = placesDesAppels(blocs);

  return (
    <>
      {blocs.map((b, i) => (
        <Fragment key={i}>
          {i === places.haut && appel("haut")}
          {i === places.milieu && appel("milieu")}
          {b.type === "cta" ? appel("milieu", b.texte, b.bouton) : <Rendu bloc={b} id={ids[i]} />}
        </Fragment>
      ))}
    </>
  );
}

const t = insecables;

const TONS: Record<TonEncadre, string> = {
  emeraude: "border-emerald-400 bg-emerald-50/60 text-emerald-700",
  rose: "border-rose-400 bg-rose-50/60 text-rose-700",
  indigo: "border-indigo-400 bg-indigo-50/60 text-indigo-700",
  ambre: "border-amber-400 bg-amber-50/60 text-amber-700",
  violet: "border-violet-400 bg-violet-50/60 text-violet-700",
};

const NIVEAUX = {
  prouve: { libelle: "Effet prouvé", classe: "bg-rose-50 text-rose-700 ring-rose-100" },
  suspecte: { libelle: "Effet suspecté", classe: "bg-orange-50 text-orange-700 ring-orange-100" },
  incertain: { libelle: "Données incertaines", classe: "bg-amber-50 text-amber-700 ring-amber-100" },
} as const;

const PASTILLES = {
  coches: {
    signe: "✓",
    classe: "bg-emerald-100 text-[12px] text-emerald-700",
  },
  alertes: {
    signe: "!",
    classe: "bg-rose-100 text-[11px] text-rose-700",
  },
} as const;

function Rendu({ bloc, id }: { bloc: Exclude<Bloc, { type: "cta" }>; id?: string }) {
  switch (bloc.type) {
    case "h2":
      return (
        <h2 id={id} className="mt-12 scroll-mt-28 text-balance text-[24px] font-bold leading-tight tracking-tight text-ink sm:text-[26px]">
          {t(bloc.texte)}
        </h2>
      );
    case "h3":
      return (
        <h3 id={id} className="mt-8 scroll-mt-28 text-[19px] font-bold leading-snug tracking-tight text-ink">
          {t(bloc.texte)}
        </h3>
      );
    case "p":
      return (
        <p className="mt-4 text-[16.5px] leading-[1.75] text-ink">
          <TexteRiche texte={t(bloc.texte)} />
        </p>
      );
    case "liste": {
      const style = bloc.style ?? "puces";
      if (style === "numeros") {
        return (
          <ol className="mt-4 list-decimal space-y-2.5 pl-6 text-[16px] leading-relaxed text-ink marker:font-semibold marker:text-rose-500">
            {bloc.items.map((item) => (
              <li key={item} className="pl-1">
                <TexteRiche texte={t(item)} />
              </li>
            ))}
          </ol>
        );
      }
      if (style === "puces") {
        return (
          <ul className="mt-4 space-y-2.5 text-[16px] leading-relaxed text-ink">
            {bloc.items.map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                <span>
                  <TexteRiche texte={t(item)} />
                </span>
              </li>
            ))}
          </ul>
        );
      }
      const p = PASTILLES[style];
      return (
        <ul className="mt-4 space-y-2.5 text-[16px] leading-relaxed text-ink">
          {bloc.items.map((item) => (
            <li key={item} className="flex gap-2.5">
              <span
                aria-hidden
                className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-bold ${p.classe}`}
              >
                {p.signe}
              </span>
              <span>
                <TexteRiche texte={t(item)} />
              </span>
            </li>
          ))}
        </ul>
      );
    }
    case "citation":
      return (
        <blockquote className="my-8 border-l-4 border-rose-300 pl-5 text-[19px] font-medium leading-relaxed text-ink">
          <TexteRiche texte={t(bloc.texte)} />
          {bloc.source && (
            <cite className="mt-2 block text-[13px] font-normal not-italic text-ink-subtle">
              <TexteRiche texte={t(bloc.source)} />
            </cite>
          )}
        </blockquote>
      );
    case "encadre":
      return (
        <aside className={`mt-5 rounded-xl border-l-4 p-4 ${TONS[bloc.ton ?? "emeraude"]}`}>
          <p className="text-[11px] font-semibold uppercase tracking-wider">{t(bloc.titre)}</p>
          <p className="mt-1 text-[15.5px] leading-relaxed text-ink">
            <TexteRiche texte={t(bloc.texte)} />
          </p>
        </aside>
      );
    case "tableau":
      return (
        <figure className="mt-5">
          {/* Le défilement horizontal reste dans le tableau : sur un téléphone,
              quatre colonnes ne doivent jamais élargir la page entière. */}
          <div className="overflow-x-auto rounded-2xl ring-1 ring-black/[0.06]">
            <table className="w-full min-w-[480px] text-[14.5px]">
              <thead className="bg-rose-50 text-left">
                <tr>
                  {bloc.entetes.map((e) => (
                    <th key={e} scope="col" className="px-4 py-3 font-semibold text-ink">
                      <TexteRiche texte={t(e)} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] bg-white">
                {bloc.lignes.map((ligne, i) => (
                  <tr key={i}>
                    {ligne.map((cellule, j) => (
                      <td key={j} className="px-4 py-3 align-top text-ink">
                        <TexteRiche texte={t(cellule)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {bloc.legende && (
            <figcaption className="mt-2 text-[13px] text-ink-subtle">
              <TexteRiche texte={t(bloc.legende)} />
            </figcaption>
          )}
        </figure>
      );
    case "fiche": {
      const n = NIVEAUX[bloc.niveau];
      return (
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-[0_4px_16px_-8px_rgba(17,17,17,0.06)] ring-1 ring-black/[0.04] sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h3 id={id} className="flex-1 scroll-mt-28 text-[18px] font-bold tracking-tight text-ink">
              {t(bloc.titre)}
            </h3>
            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ring-1 ${n.classe}`}>
              {n.libelle}
            </span>
          </div>
          <dl className="mt-3 space-y-2.5 text-[14.5px] leading-relaxed text-ink">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">Nom INCI</dt>
              <dd className="mt-0.5 font-mono text-[13.5px] text-ink">{bloc.inci}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">Effet documenté</dt>
              <dd className="mt-0.5">
                <TexteRiche texte={t(bloc.effet)} />
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">Statut UE</dt>
              <dd className="mt-0.5 font-medium text-ink">
                <TexteRiche texte={t(bloc.statut)} />
              </dd>
            </div>
          </dl>
        </div>
      );
    }
    case "image":
      return (
        <figure className="my-10">
          {/* Deux définitions : la colonne de lecture fait 720 points au plus,
              et 350 sur un téléphone. Servir le grand fichier aux deux
              doublerait le poids de l'article sur le réseau le plus lent. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bloc.src}
            srcSet={`${petiteImage(bloc.src)} 700w, ${bloc.src} ${bloc.largeur}w`}
            sizes="(max-width: 800px) 92vw, 720px"
            alt={bloc.alt}
            width={bloc.largeur}
            height={bloc.hauteur}
            loading="lazy"
            decoding="async"
            className="h-auto w-full rounded-2xl bg-black/[0.04] ring-1 ring-black/[0.04]"
          />
          <figcaption className="mt-3 text-center text-[13px] text-ink-subtle">
            {bloc.legende && (
              <span className="italic">
                <TexteRiche texte={t(bloc.legende)} />{" "}
              </span>
            )}
            <Credit credit={bloc.credit} licence={bloc.licence} source={bloc.source} />
          </figcaption>
        </figure>
      );
  }
}

/** Le crédit d'une image, en petit sous la légende ; un lien vers l'original quand il existe. */
export function Credit({ credit, licence, source }: { credit: string; licence: string; source?: string }) {
  const texte = `${credit}, ${licence}`;
  return (
    <span className="text-[11.5px] text-ink-subtle/90">
      {source ? (
        <a href={source} target="_blank" rel="noopener noreferrer" className="underline decoration-black/20 underline-offset-2 hover:text-ink-muted">
          {texte}
        </a>
      ) : (
        texte
      )}
    </span>
  );
}
