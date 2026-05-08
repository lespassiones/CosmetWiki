/**
 * Shared types for the INCI analyser feature.
 */

import type { ColorRating } from "./supabase";

export type MatchKind = "exact" | "alias" | "fuzzy" | null;

export type AnalyseItem = {
  position: number;
  input: string;
  slug: string | null;
  name: string | null;
  colorRating: ColorRating | null;
  casNumber: string | null;
  translationFr: string | null;
  primaryFunction: string | null;
  tags: string[] | null;
  matchKind: MatchKind;
};

export type Observation = {
  tag: string;
  label: string;
  status: "present" | "absent";
  count: number;
  items: { name: string; slug: string | null; colorRating: ColorRating | null }[];
};

export type AnalyseResponse = {
  counts: {
    total: number;
    matched: number;
    vert: number;
    jaune: number;
    orange: number;
    rouge: number;
    unknown: number;
  };
  score: number;
  scoreLabel: string;
  scoreTone: "green" | "amber" | "orange" | "rose";
  items: AnalyseItem[];
  observations: Observation[];
  aliasesUsed: { from: string; to: string | null }[];
  synthesis: string | null;
};
