import { api } from "./api";

import type {
  StatsOverview,
  LanguageStat,
  CategoryStat,
  DifficultCard,
  TrendPoint,
  ProgressEntry,
  ChallengeStatsOverview,
  ChallengeLanguageStat,
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
//
// All five accept an optional languagePairId, same convention as the
// Learning functions above: omit it to aggregate across every
// language pair the user has (e.g. when no pair is active yet).
// ============================================================================

export function getGameStatsOverview(
  languagePairId?: number
): Promise<ChallengeStatsOverview> {
  return api.get<ChallengeStatsOverview>(
    "/stats/games/overview/",
    {
      language_pair: languagePairId,
    }
  );
}

// Mirrors getLanguageStats() on the Learning side — always returns
// every pair the user has, regardless of which one is active.
export function getGameStatsLanguages(): Promise<
  ChallengeLanguageStat[]
> {
  return api.get<ChallengeLanguageStat[]>(
    "/stats/games/languages/"
  );
}

export function getGameStatsModes(
  languagePairId?: number
): Promise<ChallengeModeStat[]> {
  return api.get<ChallengeModeStat[]>(
    "/stats/games/modes/",
    {
      language_pair: languagePairId,
    }
  );
}

export function getGameStatsSkills(
  languagePairId?: number
): Promise<ChallengeSkillStat[]> {
  return api.get<ChallengeSkillStat[]>(
    "/stats/games/skills/",
    {
      language_pair: languagePairId,
    }
  );
}

export function getGameStatsTrend(
  languagePairId?: number
): Promise<ChallengeTrendPoint[]> {
  return api.get<ChallengeTrendPoint[]>(
    "/stats/games/trend/",
    {
      language_pair: languagePairId,
    }
  );
}

export function getRecentGameActivity(
  limit = 8,
  languagePairId?: number
): Promise<ChallengeActivityEntry[]> {
  return api.get<ChallengeActivityEntry[]>(
    "/stats/games/recent/",
    {
      limit,
      language_pair: languagePairId,
    }
  );
}