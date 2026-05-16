/**
 * Types for the "Promesses vs Formule" feature.
 *
 * Pipeline (anti-hallucination by construction):
 *   1. LLM extracts marketing promises from the description (constrained JSON).
 *   2. LLM proposes documented active ingredients for each promise (constrained
 *      to known categories from `claims.ts`).
 *   3. Engine matches proposed actives against the parent INCI analysis items
 *      by slug/name — purely mechanical, the LLM never decides.
 *   4. Engine reads each match's `thresholdContext` to decide if it's well
 *      dosed (above the 1% line) or in trace (after fragrance/preservative).
 *   5. Engine derives the verdict per promise from the match results.
 *   6. LLM writes a one-sentence conclusion based on the engine's verdicts.
 *
 * Steps 3-5 are deterministic. The LLM only proposes candidates and rephrases
 * — it cannot invent ingredients that aren't in the formula.
 */

/** Verdict for a single promise. */
export type CoherenceVerdict =
  | "tenue" // green — actives present and well dosed
  | "partielle" // amber — actives present but in trace (≤1%) or only some present
  | "marketing" // orange — only cosmetic/visual support, no biological actives
  | "non_demontree"; // rose — no documented active found

export type CoherencePromise = {
  /** Standardised slug from the catalogue (anti_chute, hydratation, ...). */
  slug: string;
  /** Human label in French ("Anti-chute"). */
  label: string;
  /** Verbatim phrase from the description that triggered this promise. */
  excerpt: string;
  /** Engine-decided verdict. */
  verdict: CoherenceVerdict;
  /**
   * Documented actives the LLM proposed (canonical names from claims catalogue,
   * before matching against the formula).
   */
  expectedActives: string[];
  /**
   * Actives that were both proposed AND found in the formula. Each entry
   * carries the position so the UI can show "Glycérine (pos. 3)".
   */
  foundActives: {
    name: string;
    slug: string | null;
    position: number;
    /** True if the ingredient is past the fragrance/preservative threshold. */
    inTrace: boolean;
  }[];
  /**
   * Cosmetic-only actives proposed by the LLM (e.g. polysaccharides for
   * "densifies hair") — present in the formula but only provide visual /
   * sensory effect, not biological. Used for the "marketing" verdict.
   */
  cosmeticActives: {
    name: string;
    slug: string | null;
    position: number;
    note: string;
  }[];
  /**
   * Actives that would have been needed but aren't in the formula. The UI
   * shows these in the "Manque" column of the table.
   */
  missingActives: string[];
  /**
   * Score 0-100. Ratio of expected actives that are present AND well dosed.
   * Drives the per-promise progress bar in the UI.
   */
  score: number;
};

/**
 * A description fragment the LLM saw but couldn't map to a verifiable
 * promise (composition claims, sensory claims, certifications, etc.).
 */
export type UnverifiableClaim = {
  excerpt: string;
  /** Why it's unverifiable: "composition" | "certification" | "sensoriel" | "autre" */
  reason: string;
};

export type CoherenceResult = {
  /** ISO timestamp at the moment the result was computed. */
  computedAt: string;
  /** The original description text the user pasted. */
  description: string;
  /** All extracted promises with their verdicts. */
  promises: CoherencePromise[];
  /** Description fragments that aren't verifiable against the formula. */
  unverifiable: UnverifiableClaim[];
  /** Aggregate metrics. */
  metrics: {
    /** % of promises with verdict === "tenue". */
    tenuePct: number;
    /** Count of promises kept (tenue). */
    tenueCount: number;
    /** Count of promises with partial coherence (verdict === "partielle"). */
    partielleCount: number;
    /** Count of promises with marketing-only support (verdict === "marketing"). */
    marketingCount: number;
    /** Count of promises with no documented active (verdict === "non_demontree"). */
    nonDemontreeCount: number;
    /** Total promises analysed. */
    totalPromises: number;
    /**
     * Marketing index: % of promises without any documented active
     * (verdict in [marketing, non_demontree]). 0–100.
     */
    marketingIndex: number;
  };
  /** One-sentence conclusion written by the LLM after all verdicts are known. */
  conclusion: string;
  /**
   * Snapshot of "key" ingredients positions used by the position chart.
   * Computed from the parent analysis's items + the actives found above.
   */
  positionSnapshot: {
    /** First fragrance position (or null if no fragrance in formula). */
    firstFragrancePos: number | null;
    /** First preservative position (or null). */
    firstPreservativePos: number | null;
    /** The smaller of the two — the actual "1% threshold" position. */
    thresholdPos: number | null;
    /** Total number of ingredients in the formula. */
    totalPositions: number;
    /** Key ingredients (the foundActives flattened, deduped, sorted by position). */
    keyIngredients: {
      name: string;
      position: number;
      inTrace: boolean;
      /** Vert / Jaune / Orange / Rouge of the parent analysis, or null if unknown. */
      colorRating: "Vert" | "Jaune" | "Orange" | "Rouge" | null;
    }[];
  };
};

export type CoherenceRow = {
  id: string;
  user_id: string;
  analysis_id: string;
  description: string;
  result_json: CoherenceResult;
  created_at: string;
};
