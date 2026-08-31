import type { ReviewResult } from "./flashcard";

export interface StatsOverview {
  cards: { total: number; new: number; learning: number; learned: number };
  reviews: { today: number; week: number; month: number; all_time: number };
  accuracy: number | null;
  streak: { current: number; longest: number };
}

export interface LanguageStat {
  language_pair_id: number;
  native: string;
  learning: string;
  cards: number;
  accuracy: number | null;
  reviews: number;
}

export interface CategoryStat {
  category_id: number;
  name: string;
  cards: number;
  accuracy: number | null;
}

export interface DifficultCard {
  flashcard_id: number;
  text: string;
  reviews: number;
  again_rate: number;
  ease_factor: number;
}

export interface TrendPoint {
  date: string; // YYYY-MM-DD
  accuracy: number | null; // null = no reviews that day, not "0% accuracy"
  reviews: number;
}

export interface ProgressEntry {
  id: number;
  flashcard: number;
  flashcard_text: string;
  result: ReviewResult;
  interval_before: number;
  ease_factor_before: number;
  status_before: string;
  reviewed_at: string;
}