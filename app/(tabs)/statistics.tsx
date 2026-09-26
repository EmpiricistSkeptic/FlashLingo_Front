import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useFocusEffect } from "expo-router/react-navigation";
import { useRouter } from "expo-router";

import { useLanguagePair } from "../../contexts/LanguagePairContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useSharedStyles } from "../../hooks/useSharedStyles";
import * as statsService from "../../services/stats";
import { ApiClientError } from "../../services/api";
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

import StatsTabs, {
  type StatsTab,
} from "../../components/stats/StatsTabs";

import ChallengesStatsView from "../../components/stats/ChallengesStatsView";

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
} from "../../types/stats";


export default function StatisticsScreen() {
  const { activePair } = useLanguagePair();
  const { colors } = useTheme();
  const shared = useSharedStyles();
  const router = useRouter();

  // ===========================================================================
  // TAB
  // ===========================================================================

  const [activeTab, setActiveTab] =
    useState<StatsTab>("learning");

  // ===========================================================================
  // LEARNING / SRS STATS
  // ===========================================================================

  const [overview, setOverview] =
    useState<StatsOverview | null>(null);

  const [languages, setLanguages] =
    useState<LanguageStat[]>([]);

  const [categories, setCategories] =
    useState<CategoryStat[]>([]);

  const [difficultCards, setDifficultCards] =
    useState<DifficultCard[]>([]);

  const [trend, setTrend] =
    useState<TrendPoint[]>([]);

  const [recentActivity, setRecentActivity] =
    useState<ProgressEntry[]>([]);

  // ===========================================================================
  // CHALLENGE STATS
  // ===========================================================================

  const [challengeOverview, setChallengeOverview] =
    useState<ChallengeStatsOverview | null>(null);

  const [challengeModes, setChallengeModes] =
    useState<ChallengeModeStat[]>([]);

  const [challengeSkills, setChallengeSkills] =
    useState<ChallengeSkillStat[]>([]);

  const [challengeTrend, setChallengeTrend] =
    useState<ChallengeTrendPoint[]>([]);

  const [
    recentChallengeActivity,
    setRecentChallengeActivity,
  ] = useState<ChallengeActivityEntry[]>([]);

  // ===========================================================================
  // COMMON STATE
  // ===========================================================================

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  // ===========================================================================
  // LOAD
  // ===========================================================================

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const requests: Promise<unknown>[] = [
        // ---------------------------------------------------------------------
        // Learning / SRS
        // ---------------------------------------------------------------------

        statsService
          .getOverview()
          .then(setOverview),

        statsService
          .getLanguageStats()
          .then(setLanguages),

        statsService
          .getRecentProgress(8)
          .then(setRecentActivity),

        // ---------------------------------------------------------------------
        // Challenges
        // ---------------------------------------------------------------------

        statsService
          .getGameStatsOverview()
          .then(setChallengeOverview),

        statsService
          .getGameStatsModes()
          .then(setChallengeModes),

        statsService
          .getGameStatsSkills()
          .then(setChallengeSkills),

        statsService
          .getGameStatsTrend()
          .then(setChallengeTrend),

        statsService
          .getRecentGameActivity(8)
          .then(setRecentChallengeActivity),
      ];

      // -----------------------------------------------------------------------
      // Pair-dependent Learning statistics
      // -----------------------------------------------------------------------

      if (activePair) {
        requests.push(
          statsService
            .getCategoryStats(activePair.id)
            .then(setCategories),

          statsService
            .getDifficultCards(activePair.id)
            .then(setDifficultCards),

          statsService
            .getAccuracyTrend(activePair.id)
            .then(setTrend)
        );
      } else {
        setCategories([]);
        setDifficultCards([]);
        setTrend([]);
      }

      await Promise.all(requests);
    } catch (e: unknown) {
      setError(
        e instanceof ApiClientError
          ? e.detail
          : e instanceof Error
            ? e.message
            : "Failed to load statistics."
      );
    } finally {
      setIsLoading(false);
    }
  }, [activePair]);

  // ===========================================================================
  // RELOAD WHEN SCREEN GETS FOCUS
  // ===========================================================================

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // ===========================================================================
  // INITIAL LOADING
  // ===========================================================================

  if (
    isLoading &&
    !overview &&
    !challengeOverview
  ) {
    return (
      <SafeAreaView style={shared.center}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />
      </SafeAreaView>
    );
  }

  // ===========================================================================
  // LANGUAGE PAIR LABEL
  // ===========================================================================

  const pairLabel = activePair
    ? `${languageLabel(
        activePair.native_language
      )} → ${languageLabel(
        activePair.learning_language
      )}`
    : null;

  // ===========================================================================
  // SECTION TITLE
  // ===========================================================================

  const SectionTitle = ({
    title,
  }: {
    title: string;
  }) => (
    <Text
      style={{
        fontSize: 13,
        fontWeight: "700",
        color: colors.textMuted,
        textTransform: "uppercase",
        letterSpacing: 1.2,
        marginBottom: 8,
        marginLeft: 4,
      }}
    >
      {title}
    </Text>
  );

  // ===========================================================================
  // DIFFICULT CARDS
  // ===========================================================================

  const studyDifficultCards = () => {
    if (!activePair) {
      return;
    }

    router.push({
      pathname: "/session",
      params: {
        languagePairId: String(
          activePair.id
        ),
        mode: "difficult",
      },
    });
  };

  // ===========================================================================
  // LEARNING TAB
  // ===========================================================================

  const renderLearningTab = () => {
    return (
      <View style={{ gap: 32 }}>
        {overview && (
          <View style={{ gap: 24 }}>
            <StreakHero
              current={
                overview.streak.current
              }
              longest={
                overview.streak.longest
              }
            />

            <ReviewSummaryRow
              today={
                overview.reviews.today
              }
              week={
                overview.reviews.week
              }
              month={
                overview.reviews.month
              }
            />

            <View>
              <SectionTitle
                title="Your deck"
              />

              <CardsCompositionBar
                total={
                  overview.cards.total
                }
                learned={
                  overview.cards.learned
                }
                learning={
                  overview.cards.learning
                }
                newCount={
                  overview.cards.new
                }
              />
            </View>

            <AccuracyBadge
              accuracy={
                overview.accuracy
              }
            />
          </View>
        )}

        {activePair &&
          trend.length > 0 && (
            <View>
              <SectionTitle
                title={`Accuracy trend · ${pairLabel}`}
              />

              <TrendChart
                trend={trend}
              />
            </View>
          )}

        <View>
          <SectionTitle
            title="Languages"
          />

          <LanguageComparisonList
            languages={languages}
          />
        </View>

        {activePair &&
          categories.length > 0 && (
            <View>
              <SectionTitle
                title={`Categories · ${pairLabel}`}
              />

              <CategoryComparisonList
                categories={
                  categories
                }
              />
            </View>
          )}

        {activePair &&
          difficultCards.length > 0 && (
            <View>
              <SectionTitle
                title="Tricky words"
              />

              <DifficultCardsList
                cards={
                  difficultCards
                }
                onStudy={
                  studyDifficultCards
                }
              />
            </View>
          )}

        <View>
          <SectionTitle
            title="Recent activity"
          />

          <RecentActivityList
            entries={
              recentActivity
            }
          />
        </View>
      </View>
    );
  };

  // ===========================================================================
  // SCREEN
  // ===========================================================================

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor:
          colors.background,
      }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          gap: 24,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={load}
            tintColor={
              colors.primary
            }
          />
        }
      >
        {/* ------------------------------------------------------------------ */}
        {/* ERROR                                                              */}
        {/* ------------------------------------------------------------------ */}

        {error && (
          <Text
            style={[
              shared.error,
              {
                marginBottom: 4,
              },
            ]}
          >
            {error}
          </Text>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TABS                                                               */}
        {/* ------------------------------------------------------------------ */}

        <StatsTabs
          value={activeTab}
          onChange={setActiveTab}
        />

        {/* ------------------------------------------------------------------ */}
        {/* CONTENT                                                            */}
        {/* ------------------------------------------------------------------ */}

        {activeTab === "learning" ? (
          renderLearningTab()
        ) : (
          <ChallengesStatsView
            overview={
              challengeOverview
            }
            modes={
              challengeModes
            }
            skills={
              challengeSkills
            }
            trend={
              challengeTrend
            }
            recentActivity={
              recentChallengeActivity
            }
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

