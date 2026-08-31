import { api } from "./api";
import type {
  StatsOverview,
  LanguageStat,
  CategoryStat,
  DifficultCard,
  TrendPoint,
  ProgressEntry,
} from "../types/stats";

export function getOverview(languagePairId?: number): Promise<StatsOverview> {
  return api.get<StatsOverview>("/stats/overview/", { language_pair: languagePairId });
}

export function getLanguageStats(): Promise<LanguageStat[]> {
  return api.get<LanguageStat[]>("/stats/languages/");
}

export function getCategoryStats(languagePairId: number): Promise<CategoryStat[]> {
  return api.get<CategoryStat[]>("/stats/categories/", { language_pair: languagePairId });
}

export function getDifficultCards(
  languagePairId?: number,
  categoryId?: number,
  limit = 10
): Promise<DifficultCard[]> {
  return api.get<DifficultCard[]>("/stats/difficult-cards/", {
    language_pair: languagePairId,
    category: categoryId,
    limit,
  });
}

export function getAccuracyTrend(languagePairId?: number, days = 7): Promise<TrendPoint[]> {
  return api.get<TrendPoint[]>("/stats/trend/", { language_pair: languagePairId, days });
}

// GET /progress/ — read-only, rows are created only by
// FlashcardViewSet.review(), never by the user directly.
export function getRecentProgress(limit = 8): Promise<ProgressEntry[]> {
  return api.get<ProgressEntry[]>("/progress/", { limit });
}