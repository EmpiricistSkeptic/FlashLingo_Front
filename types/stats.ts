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

// ============================================================================
// Challenge statistics
// ============================================================================

export type ChallengeGameType =
  | "typing"
  | "sentence"
  | "translation";

export interface ChallengeStatsOverview {
  total_attempts: number;
  answered_attempts: number;
  successful_attempts: number;

  success_rate: number;

  give_up_attempts: number;
  give_up_rate: number;

  /**
   * Average score for Sentence + Translation challenges.
   * Typing is excluded because it does not use AI scoring.
   *
   * Returned as a percentage:
   * 0 - 100
   *
   * null when there are no scored AI attempts.
   */
  average_ai_score: number | null;
}

// Same six numbers as ChallengeStatsOverview, scoped to one language
// pair instead of the whole user — mirrors LanguageStat on the
// Learning side.
export interface ChallengeLanguageStat
  extends ChallengeStatsOverview {
  language_pair_id: number;
  native: string;
  learning: string;
}

export interface ChallengeModeStat {
  game_type: ChallengeGameType;

  attempts: number;
  answered_attempts: number;
  successful_attempts: number;

  /**
   * Percentage of answered attempts that were correct.
   *
   * Give-ups are excluded from the denominator.
   */
  success_rate: number;

  /**
   * Average AI score for Sentence / Translation.
   *
   * null for Typing or when there are no scored attempts.
   */
  average_ai_score: number | null;
}

export type ChallengeSkill =
  | "recall"
  | "sentence_usage"
  | "translation";

export interface ChallengeSkillStat {
  skill: ChallengeSkill;

  label: string;

  game_type: ChallengeGameType;

  /**
   * Normalized performance in percentage form.
   *
   * Typing:
   *   success rate
   *
   * Sentence / Translation:
   *   average AI score
   */
  performance: number | null;
}

export interface ChallengeTrendPoint {
  /**
   * ISO date:
   * YYYY-MM-DD
   */
  date: string;

  /**
   * Number of challenge attempts on this day.
   * Give-ups are included here.
   */
  attempts: number;

  /**
   * Daily normalized challenge performance.
   *
   * Typing:
   *   correct = 1.0
   *   incorrect = 0.0
   *
   * AI games:
   *   score = 0.0 - 1.0
   *
   * Returned as percentage:
   * 0 - 100
   *
   * null when there were no answered/scored attempts.
   */
  performance: number | null;
}

export interface ChallengeActivityEntry {
  id: number;

  game_type: ChallengeGameType;

  is_correct: boolean;

  gave_up: boolean;

  /**
   * AI score in percentage form.
   *
   * null for Typing and Give Up attempts.
   */
  score: number | null;

  feedback: string;

  /**
   * The flashcard's target-language word/phrase this attempt was on.
   */
  flashcard_text: string;

  /**
   * ISO datetime.
   */
  created_at: string;
}