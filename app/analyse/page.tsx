import { AnalysisRunner } from "@/components/AnalysisRunner";

export const metadata = { title: "Analyse · Cosme Check" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ inci?: string }>;
};

export default async function AnalysePage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : undefined;
  const initialInci = (params?.inci ?? "").slice(0, 6000);
  return <AnalysisRunner initialInci={initialInci} />;
}
