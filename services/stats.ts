import { api } from "./api";

import type {
  StatsOverview,
  LanguageStat,
  CategoryStat,
  DifficultCard,
  TrendPoint,
  ProgressEntry,
  ChallengeStatsOverview,
  ChallengeModeStat,
  ChallengeSkillStat,
  ChallengeTrendPoint,
  ChallengeActivityEntry,
} from "../types/stats";

// ============================================================================
// Learning / SRS statistics
// ============================================================================

export function getOverview(
  languagePairId?: number
): Promise<StatsOverview> {
  return api.get<StatsOverview>(
    "/stats/overview/",
    {
      language_pair: languagePairId,
    }
  );
}

export function getLanguageStats(): Promise<LanguageStat[]> {
  return api.get<LanguageStat[]>(
    "/stats/languages/"
  );
}

export function getCategoryStats(
  languagePairId: number
): Promise<CategoryStat[]> {
  return api.get<CategoryStat[]>(
    "/stats/categories/",
    {
      language_pair: languagePairId,
    }
  );
}

export function getDifficultCards(
  languagePairId?: number,
  categoryId?: number,
  limit = 10
): Promise<DifficultCard[]> {
  return api.get<DifficultCard[]>(
    "/stats/difficult-cards/",
    {
      language_pair: languagePairId,
      category: categoryId,
      limit,
    }
  );
}

export function getAccuracyTrend(
  languagePairId?: number,
  days = 7
): Promise<TrendPoint[]> {
  return api.get<TrendPoint[]>(
    "/stats/trend/",
    {
      language_pair: languagePairId,
      days,
    }
  );
}

// GET /progress/ — read-only.
// Rows are created only by FlashcardViewSet.review().
export function getRecentProgress(
  limit = 8
): Promise<ProgressEntry[]> {
  return api.get<ProgressEntry[]>(
    "/progress/",
    {
      limit,
    }
  );
}

// ============================================================================
// Challenge statistics
// ============================================================================

export function getGameStatsOverview(): Promise<ChallengeStatsOverview> {
  return api.get<ChallengeStatsOverview>(
    "/stats/games/overview/"
  );
}

export function getGameStatsModes(): Promise<ChallengeModeStat[]> {
  return api.get<ChallengeModeStat[]>(
    "/stats/games/modes/"
  );
}

export function getGameStatsSkills(): Promise<ChallengeSkillStat[]> {
  return api.get<ChallengeSkillStat[]>(
    "/stats/games/skills/"
  );
}

export function getGameStatsTrend(): Promise<ChallengeTrendPoint[]> {
  return api.get<ChallengeTrendPoint[]>(
    "/stats/games/trend/"
  );
}

export function getRecentGameActivity(
  limit = 8
): Promise<ChallengeActivityEntry[]> {
  return api.get<ChallengeActivityEntry[]>(
    "/stats/games/recent/",
    {
      limit,
    }
  );
}
