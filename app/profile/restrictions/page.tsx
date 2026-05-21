import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile, getUser } from "@/lib/auth";
import { loadIngredientFamilies } from "@/lib/restrictions/families";
import { readUserRestrictions } from "@/lib/restrictions/types";
import { RestrictionsExplorer } from "@/components/profile/restrictions/RestrictionsExplorer";

export const metadata = { title: "Mes restrictions · Cosme Check" };

export const dynamic = "force-dynamic";

export default async function RestrictionsPage() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in?next=/profile/restrictions");

  const profile = await getProfile();
  const restrictions = readUserRestrictions(profile?.preferences ?? null);
  const families = await loadIngredientFamilies();

  return (
    <div className="mx-auto max-w-3xl px-5 lg:px-8 py-8 lg:py-12">
      <Link
        href="/routine"
        className="inline-flex items-center gap-1.5 mb-4 rounded-full bg-white/80 ring-1 ring-black/[0.06] px-3 py-1.5 text-[12.5px] font-medium text-ink hover:bg-white hover:ring-black/[0.12] transition"
        aria-label="Retour à la routine"
      >
        <ChevronLeftIcon className="h-3.5 w-3.5" />
        Retour
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold">Mes restrictions</h1>
        <p className="mt-2 text-[13px] text-[#6B7280] leading-relaxed">
          Choisis les familles d&apos;ingrédients et les ingrédients précis
          que tu souhaites éviter. Cosme Check te préviendra à chaque analyse
          si un produit en contient.
        </p>
      </header>

      <RestrictionsExplorer
        initialFamilies={restrictions.families}
        initialIngredients={restrictions.ingredients}
        familiesCatalogue={families}
      />
    </div>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
