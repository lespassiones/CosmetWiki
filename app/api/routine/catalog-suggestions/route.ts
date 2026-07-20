import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * POST /api/routine/catalog-suggestions — PROXY vers l'Edge Function
 * `routine-smart-suggest` (moteur UNIQUE partagé avec le mobile).
 *
 * Le client envoie TOUS les produits de la routine
 * ({ analysisId, name, ean, category, counts, cappedScore, restrictedCount }).
 * L'Edge Function décide qui reçoit une suggestion, choisit l'alternative par IA
 * (profil + restrictions), débite 1 crédit PAR produit généré et met en cache
 * (0 crédit ensuite / incrémental). On se contente de transférer le token de
 * session de l'utilisateur (pour l'auth + le débit du bon compte) et de renvoyer
 * la réponse telle quelle (y compris le 429 « crédits épuisés »).
 */
export async function POST(req: NextRequest) {
  let body: { items?: unknown };
  try {
    body = (await req.json()) as { items?: unknown };
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  // Décision d'auth sur getUser() (JWT vérifié), token via getSession() ensuite.
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !anon) {
    return NextResponse.json({ error: "Configuration serveur manquante." }, { status: 500 });
  }

  try {
    const r = await fetch(`${base}/functions/v1/routine-smart-suggest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: anon,
      },
      body: JSON.stringify({ items: Array.isArray(body.items) ? body.items : [] }),
    });
    const text = await r.text();
    return new NextResponse(text, {
      status: r.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json({ error: "Suggestions indisponibles." }, { status: 502 });
  }
}
