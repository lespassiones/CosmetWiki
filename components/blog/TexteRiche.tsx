import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Rend un texte d'article en y activant le balisage décrit en tête de
 * `contenu/articles.ts` : `[libellé](cible)`, `**gras**`, `*italique*`,
 * `==surligné==`, `++souligné++`.
 *
 * ⚠️ **On construit des éléments React, jamais du HTML.** Il aurait été plus
 * court de poser le texte avec `dangerouslySetInnerHTML` : ce jour-là, le
 * contenu d'un article devient du code exécutable, et le robot éditorial
 * publie sans relecture humaine. Ici, le pire qu'un texte mal écrit puisse
 * produire est un crochet qui s'affiche.
 *
 * Les marques s'emboîtent (un lien dans du gras, du gras dans un surlignage) :
 * le contenu de chacune est rendu à son tour. Un lien interne passe par
 * `next/link` ; un lien externe s'ouvre dans un onglet avec `rel="noopener"`.
 */
const MOTIF =
  /\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|==(.+?)==|\+\+(.+?)\+\+|\*([^*\s][^*]*?)\*/g;

export function TexteRiche({ texte }: { texte: string }) {
  return <>{rendre(texte, "t")}</>;
}

function rendre(texte: string, cle: string): ReactNode[] {
  const morceaux: ReactNode[] = [];
  const motif = new RegExp(MOTIF.source, "g");
  let curseur = 0;
  let m: RegExpExecArray | null;
  while ((m = motif.exec(texte)) !== null) {
    if (m.index > curseur) morceaux.push(texte.slice(curseur, m.index));
    const k = `${cle}-${m.index}`;
    const [tout, libelle, cible, gras, surligne, souligne, italique] = m;
    if (libelle !== undefined) {
      morceaux.push(
        cible.startsWith("/") ? (
          <Link key={k} href={cible} className="font-medium text-rose-600 underline decoration-rose-200 underline-offset-2 hover:text-rose-700 hover:decoration-rose-400">
            {rendre(libelle, k)}
          </Link>
        ) : (
          <a key={k} href={cible} target="_blank" rel="noopener noreferrer" className="font-medium text-rose-600 underline decoration-rose-200 underline-offset-2 hover:text-rose-700 hover:decoration-rose-400">
            {rendre(libelle, k)}
          </a>
        ),
      );
    } else if (gras !== undefined) {
      morceaux.push(
        <strong key={k} className="font-semibold text-ink">
          {rendre(gras, k)}
        </strong>,
      );
    } else if (surligne !== undefined) {
      morceaux.push(
        <mark key={k} className="rounded-sm bg-amber-100/80 px-1 font-medium text-ink">
          {rendre(surligne, k)}
        </mark>,
      );
    } else if (souligne !== undefined) {
      morceaux.push(
        <u key={k} className="decoration-rose-400 decoration-2 underline-offset-4">
          {rendre(souligne, k)}
        </u>,
      );
    } else {
      morceaux.push(<em key={k}>{rendre(italique, k)}</em>);
    }
    curseur = m.index + tout.length;
  }
  if (curseur < texte.length) morceaux.push(texte.slice(curseur));
  return morceaux;
}
