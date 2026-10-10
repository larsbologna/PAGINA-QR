export const RATING_LABELS: Record<number, string> = {
  1: "Muy mala",
  2: "Mala",
  3: "Regular",
  4: "Buena",
  5: "Excelente",
};

export type Sentiment = "positive" | "neutral" | "negative";

export interface Thresholds {
  positiveMin: number;
  negativeMax: number;
}

export const DEFAULT_THRESHOLDS: Thresholds = { positiveMin: 4, negativeMax: 2 };

export function classifyRating(rating: number, t: Thresholds = DEFAULT_THRESHOLDS): Sentiment {
  if (rating >= t.positiveMin) return "positive";
  if (rating <= t.negativeMax) return "negative";
  return "neutral";
}

export const SENTIMENT_LABELS: Record<Sentiment, string> = {
  positive: "Positivas",
  neutral: "Neutrales",
  negative: "Negativas",
};

export function isValidThresholds(t: Thresholds): boolean {
  return (
    Number.isInteger(t.positiveMin) &&
    Number.isInteger(t.negativeMax) &&
    t.negativeMax >= 1 &&
    t.positiveMin <= 5 &&
    t.negativeMax < t.positiveMin
  );
}
