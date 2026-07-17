import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile, getUser } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase";
import { loadIngredientFamilies } from "@/lib/restrictions/families";
import { readUserRestrictions } from "@/lib/restrictions/types";
import { RestrictionsExplorer } from "@/components/profile/restrictions/RestrictionsExplorer";

export const metadata = { title: "Mes restrictions · Cosme Check" };

export const dynamic = "force-dynamic";

type InferredItem = { label: string; reason?: string | null };

/** Récap LECTURE SEULE des « sensibilités probables » déduites du profil par le
 *  worker IA back-end (profile-restriction-inference). Rien n'est activé. */
async function loadInferred(userId: string): Promise<InferredItem[]> {
  try {
    const { data } = await supabaseService()
      .schema("cosme_check")
      .from("profile_restriction_inference")
      .select("items")
      .eq("user_id", userId)
      .maybeSingle();
    const raw = (data as { items?: unknown } | null)?.items;
    if (!Array.isArray(raw)) return [];
    return (raw as Record<string, unknown>[])
      .filter((i) => typeof i?.label === "string" && (i.label as string).trim())
      .map((i) => ({ label: i.label as string, reason: (i.reason as string) ?? null }))
      .slice(0, 8);
  } catch {
    return [];
  }
}

export default async function RestrictionsPage() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in?next=/profile/restrictions");

  const profile = await getProfile();
  const restrictions = readUserRestrictions(profile?.preferences ?? null);
  const families = await loadIngredientFamilies();
  const inferred = await loadInferred(user.id);

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

      {/* Récap lecture seule (worker IA back-end) : null si rien de calculé. */}
      {inferred.length > 0 ? (
        <section className="card-white mb-6 p-4">
          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="#8B5CF6" className="h-3.5 w-3.5" aria-hidden>
              <path d="M12 2c.5 4.5 2.5 7.5 8 8-5.5 1.5-7.5 4.5-8 10-.5-5.5-2.5-8.5-8-10 5.5-.5 7.5-3.5 8-8z" />
            </svg>
            <h2 className="text-[14px] font-semibold text-[#111111]">Suggérées selon ton profil</h2>
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-[#6B7280]">
            Déduites automatiquement de ton profil (peau, préoccupations, objectifs).
            Simple récapitulatif : rien n&apos;est activé, tes restrictions restent
            celles que tu coches ci-dessous.
          </p>
          <ul className="mt-3 space-y-1.5">
            {inferred.map((it) => (
              <li key={it.label} className="flex items-center gap-2 text-[12.5px]">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#8B5CF6]" aria-hidden />
                <span className="min-w-0 text-[#6B7280]">
                  <span className="font-semibold text-[#111111]">{it.label}</span>
                  {it.reason ? <> : {it.reason}</> : null}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
