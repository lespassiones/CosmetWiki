import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata = { title: "Créer un compte · Cosme Check" };

type Props = {
  searchParams?: Promise<{ next?: string }>;
};

function safeNext(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default async function SignUpPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : undefined;
  const next = safeNext(params?.next);

  const user = await getUser();
  if (user) redirect(next);

  const signInHref = next === "/" ? "/auth/sign-in" : `/auth/sign-in?next=${encodeURIComponent(next)}`;

  return (
    <main className="min-h-svh flex items-center justify-center px-5 py-10 bg-[#FAFAFA]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-[28px] leading-[36px] font-bold tracking-tight">
            Crée <span className="relative inline-block">ton compte
              <span aria-hidden className="absolute left-0 right-0 -bottom-1 h-[3px] bg-[#F43F5E] rounded-full" />
            </span>
          </h1>
          <p className="mt-3 text-sm text-[#6B7280]">
            Sauvegarde tes analyses, ta routine, et reprends où tu en étais.
          </p>
        </div>

        <SignUpForm next={next} />

        <p className="mt-6 text-center text-sm text-[#6B7280]">
          Déjà un compte ?{" "}
          <Link href={signInHref} className="text-[#F43F5E] font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
