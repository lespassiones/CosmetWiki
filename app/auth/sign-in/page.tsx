import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata = { title: "Se connecter · Cosme Check" };

type Props = {
  searchParams?: Promise<{ next?: string }>;
};

function safeNext(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default async function SignInPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : undefined;
  const next = safeNext(params?.next);

  const user = await getUser();
  if (user) redirect(next);

  const signUpHref = next === "/" ? "/auth/sign-up" : `/auth/sign-up?next=${encodeURIComponent(next)}`;

  return (
    <main className="min-h-svh flex items-center justify-center px-5 py-10 bg-[#FAFAFA]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-[28px] leading-[36px] font-bold tracking-tight">
            Bon <span className="relative inline-block">retour
              <span aria-hidden className="absolute left-0 right-0 -bottom-1 h-[3px] bg-[#F43F5E] rounded-full" />
            </span> 👋
          </h1>
        </div>

        <SignInForm next={next} />

        <p className="mt-6 text-center text-sm text-[#6B7280]">
          Pas encore de compte ?{" "}
          <Link href={signUpHref} className="text-[#F43F5E] font-medium hover:underline">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </main>
  );
}
