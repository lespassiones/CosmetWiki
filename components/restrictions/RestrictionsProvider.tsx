"use client";

import { createContext, useContext, useMemo } from "react";
import type { IngredientFamily, UserRestrictions } from "@/lib/restrictions/types";
import { EMPTY_RESTRICTIONS } from "@/lib/restrictions/types";

type Ctx = {
  restrictions: UserRestrictions;
  families: IngredientFamily[];
  /** Quick lookup: ingredient tag slug → display family name. */
  familyNameByTag: Map<string, string>;
  /** Free-form allergy text from the user's skin profile (used for substring filtering). */
  allergiesFreeform?: string;
};

const DEFAULT: Ctx = {
  restrictions: EMPTY_RESTRICTIONS,
  families: [],
  familyNameByTag: new Map(),
  allergiesFreeform: undefined,
};

const RestrictionsContext = createContext<Ctx>(DEFAULT);

/**
 * Server-rendered restrictions snapshot, exposed to every signed-in client
 * tree via React Context. Loaded once in the root layout so the
 * AnalyseResultPanel, advisor chat input, and any other consumer can read it
 * without an extra fetch per page.
 *
 * Anonymous users get the empty defaults (no restrictions, no families) —
 * the panel happily renders nothing in that case.
 */
export function RestrictionsProvider({
  restrictions,
  families,
  allergiesFreeform,
  children,
}: {
  restrictions: UserRestrictions;
  families: IngredientFamily[];
  allergiesFreeform?: string;
  children: React.ReactNode;
}) {
  const value = useMemo<Ctx>(() => {
    const map = new Map<string, string>();
    for (const f of families) {
      if (f.tagSlug) map.set(f.tagSlug, f.name);
    }
    return { restrictions, families, familyNameByTag: map, allergiesFreeform };
  }, [restrictions, families, allergiesFreeform]);

  return (
    <RestrictionsContext.Provider value={value}>
      {children}
    </RestrictionsContext.Provider>
  );
}

export function useRestrictions(): Ctx {
  return useContext(RestrictionsContext);
}
