import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/goals-coverage — PROXY vers l'Edge Function `goals-coverage`
 * (« Couverture de tes objectifs », moteur UNIQUE partagé avec le mobile).
 *
 * POURQUOI un proxy : un navigateur ne peut PAS appeler l'Edge Function
 * directement (`supabase.functions.invoke`) car le preflight CORS `OPTIONS`
 * n'embarque pas l'`apikey` que le relai Supabase exige pour router → 401/500
 * sans header CORS. Comme le reste du web (advisor-chat, routine-smart-suggest),
 * on passe donc par une route Next serveur→edge (aucun CORS), en transférant le
 * token de session de l'utilisateur (auth + débit du bon compte). On renvoie la
 * réponse telle quelle, y compris le 429 « crédits épuisés » et le 503 transient.
 */
export async function POST(req: NextRequest) {
  let body: { force?: boolean };
  try {
    body = (await req.json()) as { force?: boolean };
  } catch {
    body = {};
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
    const r = await fetch(`${base}/functions/v1/goals-coverage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: anon,
      },
      body: JSON.stringify(body?.force === true ? { force: true } : {}),
    });
    const text = await r.text();
    return new NextResponse(text, {
      status: r.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json(
      { error: "Génération momentanément indisponible.", code: "transient" },
      { status: 502 },
    );
  }
}
