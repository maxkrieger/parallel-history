export interface ScoredLeftItem {
  url: string;
  score: number;
  sign: number;
}

export type message =
  | { kind: "CLEAR_DB" }
  | { kind: "GET_HISTORY" }
  | { kind: "RANK"; scoredItems: ScoredLeftItem[] };

export interface Entry {
  id: number;
  title: string;
  url: string;
  canonicalizedUrl: string;
  referrerUrl: string;
  visitId: string;
  time: number;
  referringVisitId: string;
  transition: string;
  score?: number;
  sign?: number;
}
