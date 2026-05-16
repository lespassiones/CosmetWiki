import { AnalysisRunner } from "@/components/AnalysisRunner";

export const metadata = { title: "Analyse · Cosme Check" };
// Belt-and-braces: prevent Next.js from caching a prefetched `/analyse` shell
// where `searchParams.inci` is undefined. The real handoff goes through
// sessionStorage now, but disabling the static cache here closes the loop
// in case the URL searchParam is the only thing present.
export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ inci?: string }>;
};

export default async function AnalysePage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : undefined;
  const initialInci = (params?.inci ?? "").slice(0, 6000);
  return <AnalysisRunner initialInci={initialInci} />;
}
