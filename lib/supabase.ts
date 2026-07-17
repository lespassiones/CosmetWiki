import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient, createServerClient, type CookieOptions } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env",
  );
}

let _anon: SupabaseClient | undefined;
let _service: SupabaseClient | undefined;

/** Anonymous client - used for SELECT through RPCs in `public` schema. */
export function supabaseAnon(): SupabaseClient {
  if (!_anon) {
    _anon = createClient(url!, anonKey!, {
      auth: { persistSession: false },
      global: { headers: { "x-application": "cosme-check" } },
    });
  }
  return _anon;
}

/** Service-role client - server-side only, full access. */
export function supabaseService(): SupabaseClient {
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY missing - server only.");
  }
  if (!_service) {
    _service = createClient(url!, serviceKey, {
      auth: { persistSession: false },
    });
  }
  return _service;
}

/**
 * Browser client - SINGLETON. Une seule instance GoTrueClient par contexte
 * navigateur : sinon plusieurs clients se disputent le même token de session
 * (warning « Multiple GoTrueClient instances ») et des appels partent en `anon`
 * avant l'hydratation de la session -> `permission denied for function ...`
 * (ex. cosme_check_get_credits, réservée à `authenticated`). Réutilisé partout,
 * y compris par le hook useCredits. Reste un no-op côté serveur (jamais appelé).
 */
function newBrowserClient() {
  return createBrowserClient(url!, anonKey!);
}
let _browser: ReturnType<typeof newBrowserClient> | null = null;
export function supabaseBrowser() {
  return (_browser ??= newBrowserClient());
}

/** Server client - reads/writes the auth cookie via the Next 15 cookie API. */
export function supabaseServer(cookieStore: {
  get(name: string): { value: string } | undefined;
  set?(name: string, value: string, options: CookieOptions): void;
}) {
  return createServerClient(url!, anonKey!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set?.(name, value, options);
        } catch {
          // ignored: called from a Server Component where cookies are immutable
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set?.(name, "", { ...options, maxAge: 0 });
        } catch {
          // ignored
        }
      },
    },
  });
}

export type ColorRating = "Vert" | "Jaune" | "Orange" | "Rouge";

export type SearchHit = {
  id: number;
  slug: string;
  name: string;
  color_rating: ColorRating;
  cas_number: string | null;
  translation_fr: string | null;
  rank: number;
};

export type IngredientFunction = {
  name: string;
  description?: string;
};

export type Ingredient = {
  id: number;
  inci_id: number;
  slug: string;
  name: string;
  cas_number: string | null;
  einecs_number: string | null;
  classification: string[] | null;
  color_rating: ColorRating;
  origin: string | null;
  description: string | null;
  functions: IngredientFunction[] | null;
  prevalence_pct: number | null;
  category_breakdown: Record<string, number> | null;
  regulated_zones: string[] | null;
  translations: Record<string, string> | null;
  source_url: string;
  details_scraped: boolean;
};

export type ProductHit = {
  product_id: number;
  brand: string;
  name: string;
  volume: string | null;
  score: number | null;
  image_url: string | null;
  source_url: string | null;
  ingredient_position: number | null;
};

export type PopularSuggestion = {
  slug: string;
  name: string;
  color_rating: ColorRating;
};
