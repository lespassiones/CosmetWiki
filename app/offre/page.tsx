import { PublicHeader } from "@/components/PublicHeader";
import { OffrePageClient } from "./OffrePageClient";
import { getUser } from "@/lib/auth";

export const metadata = { title: "Passez Premium · Cosme Check" };

export default async function OffrePage() {
  const user = await getUser();
  const signedIn = Boolean(user);

  return (
    <>
      {!signedIn && <PublicHeader />}
      <OffrePageClient />
    </>
  );
}
