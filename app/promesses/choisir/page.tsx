import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export const metadata = { title: "Vérifier une promesse · Cosme Check" };

/**
 * Page intermédiaire "Promesses vs Formule" (twin web de app/promesses/choisir).
 *
 * Atteinte depuis la tuile "Promesses vs Formule" du dashboard. Demande COMMENT
 * identifier le produit dont on veut vérifier la promesse, via 4 boutons
 * verticaux :
 *   1. Rechercher le produit        → /produits (catalogue)
 *   2. Récupérer dans l'historique  → /history
 *   3. Coller moi-même la promesse   → /promesses/nouvelle (assistant manuel)
 */

type Choice = {
  href: string;
  title: string;
  subtitle: string;
  tint: string;
  tintBg: string;
  icon: React.ReactNode;
};

const CHOICES: Choice[] = [
  {
    href: "/produits?from=/promesses/choisir",
    title: "Rechercher le produit",
    subtitle: "Trouve le produit dans notre catalogue",
    tint: "#8B5CF6",
    tintBg: "#EDE9FE",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/history?from=/promesses/choisir",
    title: "Récupérer dans l’historique",
    subtitle: "Choisis un produit déjà analysé",
    tint: "#047857",
    tintBg: "#ECFDF5",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/promesses/nouvelle",
    title: "Coller moi-même la promesse",
    subtitle: "Saisis le texte marketing à vérifier",
    tint: "#1F2937",
    tintBg: "#F3F4F6",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default async function ChoisirPromessePage() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in?next=/promesses/choisir");

  // Compte neuf = aucune analyse dans l'historique -> on masque l'option
  // « Récupérer dans l'historique » (rien à récupérer). Dès qu'une analyse
  // existe, les 4 options s'affichent tel quel.
  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { count } = await sb
    .schema("cosme_check")
    .from("analyses")
    .select("id", { count: "exact", head: true });
  const hasHistory = (count ?? 0) > 0;

  const choices = hasHistory
    ? CHOICES
    : CHOICES.filter((c) => !c.href.startsWith("/history"));

  return (
    <div className="neu-page mx-auto max-w-2xl px-5 lg:px-8 py-8 lg:py-12">
      <h1 className="text-2xl lg:text-3xl font-bold">Quelle promesse veux-tu vérifier ?</h1>

      <div className="mt-3 -mx-5 h-px bg-[#c5ccd6] lg:mx-0 lg:mt-4" />

      <p className="mt-3 text-sm text-[#6B7280]">
        Choisis comment identifier le produit dont tu veux confronter la promesse à sa formule réelle.
      </p>

      <ul className="mt-6 space-y-3">
        {choices.map((c) => (
          <li key={c.href}>
            <Link href={c.href} className="neu neu-hover flex items-center gap-4 p-4 pr-5">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: c.tintBg, color: c.tint }}
              >
                {c.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-[#111111]">{c.title}</span>
                <span className="block text-[13px] text-[#6B7280] mt-0.5">{c.subtitle}</span>
              </span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[#9CA3AF]">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
