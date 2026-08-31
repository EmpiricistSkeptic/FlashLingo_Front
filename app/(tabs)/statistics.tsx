import { useCallback, useState } from "react";
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { useLanguagePair } from "../../contexts/LanguagePairContext";
import * as statsService from "../../services/stats";
import { ApiClientError } from "../../services/api";
import { shared } from "../../constants/styles";
import { languageLabel } from "../../constants/languages";

import StreakHero from "../../components/stats/StreakHero";
import ReviewSummaryRow from "../../components/stats/ReviewSummaryRow";
import CardsCompositionBar from "../../components/stats/CardsCompositionBar";
import AccuracyBadge from "../../components/stats/AccuracyBadge";
import TrendChart from "../../components/stats/TrendChart";
import LanguageComparisonList from "../../components/stats/LanguageComparisonList";
import CategoryComparisonList from "../../components/stats/CategoryComparisonList";
import DifficultCardsList from "../../components/stats/DifficultCardsList";
import RecentActivityList from "../../components/stats/RecentActivityList";

import type {
  StatsOverview,
  LanguageStat,
  CategoryStat,
  DifficultCard,
  TrendPoint,
  ProgressEntry,
} from "../../types/stats";

export default function StatisticsScreen() {
  const { activePair } = useLanguagePair();

  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [languages, setLanguages] = useState<LanguageStat[]>([]);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [difficultCards, setDifficultCards] = useState<DifficultCard[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [recentActivity, setRecentActivity] = useState<ProgressEntry[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Overview/languages/recent-activity are global (across all pairs).
  // Trend/categories/difficult-cards are scoped to whichever pair is
  // currently active — reuses the same activePair the rest of the app
  // already relies on, instead of giving Statistics its own pair switcher.
  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const requests: Promise<unknown>[] = [
        statsService.getOverview().then(setOverview),
        statsService.getLanguageStats().then(setLanguages),
        statsService.getRecentProgress(8).then(setRecentActivity),
      ];

      if (activePair) {
        requests.push(
          statsService.getCategoryStats(activePair.id).then(setCategories),
          statsService.getDifficultCards(activePair.id).then(setDifficultCards),
          statsService.getAccuracyTrend(activePair.id).then(setTrend)
        );
      } else {
        setCategories([]);
        setDifficultCards([]);
        setTrend([]);
      }

      await Promise.all(requests);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.detail : "Failed to load statistics.");
    } finally {
      setIsLoading(false);
    }
  }, [activePair]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (isLoading && !overview) {
    return (
      <View style={shared.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const pairLabel = activePair
    ? `${languageLabel(activePair.native_language)} → ${languageLabel(activePair.learning_language)}`
    : null;

  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, gap: 24 }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} />}
    >
      {error && <Text style={shared.error}>{error}</Text>}

      {overview && (
        <>
          <StreakHero current={overview.streak.current} longest={overview.streak.longest} />

          <ReviewSummaryRow
            today={overview.reviews.today}
            week={overview.reviews.week}
            month={overview.reviews.month}
          />

          <View style={{ gap: 8 }}>
            <Text style={shared.subtitle}>Your deck</Text>
            <CardsCompositionBar
              total={overview.cards.total}
              learned={overview.cards.learned}
              learning={overview.cards.learning}
              newCount={overview.cards.new}
            />
          </View>

          <AccuracyBadge accuracy={overview.accuracy} />
        </>
      )}

      {activePair && trend.length > 0 && (
        <View style={{ gap: 8 }}>
          <Text style={shared.subtitle}>Accuracy trend · {pairLabel}</Text>
          <TrendChart trend={trend} />
        </View>
      )}

      <View style={{ gap: 8 }}>
        <Text style={shared.subtitle}>Languages</Text>
        <LanguageComparisonList languages={languages} />
      </View>

      {activePair && (
        <View style={{ gap: 8 }}>
          <Text style={shared.subtitle}>Categories · {pairLabel}</Text>
          <CategoryComparisonList categories={categories} />
        </View>
      )}

      {activePair && (
        <View style={{ gap: 8 }}>
          <Text style={shared.subtitle}>Tricky words</Text>
          <DifficultCardsList cards={difficultCards} />
        </View>
      )}

      <View style={{ gap: 8 }}>
        <Text style={shared.subtitle}>Recent activity</Text>
        <RecentActivityList entries={recentActivity} />
      </View>
    </ScrollView>
  );
}