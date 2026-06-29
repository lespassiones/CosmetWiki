import { PublicHeader } from "@/components/PublicHeader";
import { OffrePageClient } from "./OffrePageClient";

export const metadata = { title: "Passez Premium · Cosme Check" };

export default function OffrePage() {
  return (
    <>
      <PublicHeader />
      <OffrePageClient />
    </>
  );
}
