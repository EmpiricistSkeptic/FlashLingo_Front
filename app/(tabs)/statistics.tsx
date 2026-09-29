import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
  ChallengeLanguageStat,
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

  const [isLearningLoading, setIsLearningLoading] =
    useState(true);

  const [learningError, setLearningError] =
    useState<string | null>(null);

  // ===========================================================================
  // CHALLENGE STATS
  // ===========================================================================

  const [challengeOverview, setChallengeOverview] =
    useState<ChallengeStatsOverview | null>(null);

  const [challengeLanguages, setChallengeLanguages] =
    useState<ChallengeLanguageStat[]>([]);

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

  const [isChallengesLoading, setIsChallengesLoading] =
    useState(false);

  // True only after a *successful* Challenges load. A failed load
  // deliberately leaves this false, so the next time the user opens
  // the tab it retries automatically instead of silently caching a
  // failure as if it were good data — a manual pull-to-refresh still
  // works as an explicit retry in the meantime.
  const [challengesLoaded, setChallengesLoaded] =
    useState(false);

  const [challengesError, setChallengesError] =
    useState<string | null>(null);

  // ===========================================================================
  // LOAD — LEARNING
  // ===========================================================================

  const loadLearning = useCallback(async () => {
    setIsLearningLoading(true);
    setLearningError(null);

    try {
      const requests: Promise<unknown>[] = [
        statsService
          .getOverview()
          .then(setOverview),

        statsService
          .getLanguageStats()
          .then(setLanguages),

        statsService
          .getRecentProgress(8)
          .then(setRecentActivity),
      ];

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
      setLearningError(
        e instanceof ApiClientError
          ? e.detail
          : e instanceof Error
            ? e.message
            : "Failed to load statistics."
      );
    } finally {
      setIsLearningLoading(false);
    }
  }, [activePair]);

  // ===========================================================================
  // LOAD — CHALLENGES
  //
  // Always performs a real fetch when called — it does not check
  // challengesLoaded itself. Callers (tab switch, pair-change effect,
  // pull-to-refresh) decide whether calling it is warranted.
  // ===========================================================================

  const loadChallenges = useCallback(async () => {
    setIsChallengesLoading(true);
    setChallengesError(null);

    try {
      await Promise.all([
        statsService
          .getGameStatsOverview(activePair?.id)
          .then(setChallengeOverview),

        statsService
          .getGameStatsLanguages()
          .then(setChallengeLanguages),

        statsService
          .getGameStatsModes(activePair?.id)
          .then(setChallengeModes),

        statsService
          .getGameStatsSkills(activePair?.id)
          .then(setChallengeSkills),

        statsService
          .getGameStatsTrend(activePair?.id)
          .then(setChallengeTrend),

        statsService
          .getRecentGameActivity(8, activePair?.id)
          .then(setRecentChallengeActivity),
      ]);

      setChallengesLoaded(true);
    } catch (e: unknown) {
      setChallengesError(
        e instanceof ApiClientError
          ? e.detail
          : e instanceof Error
            ? e.message
            : "Failed to load challenge statistics."
      );
    } finally {
      setIsChallengesLoading(false);
    }
  }, [activePair]);

  // ===========================================================================
  // LEARNING REFRESHES ON EVERY FOCUS — CHALLENGES DOES NOT
  // ===========================================================================

  useFocusEffect(
    useCallback(() => {
      loadLearning();
    }, [loadLearning])
  );

  // ===========================================================================
  // INVALIDATE CHALLENGES WHEN THE ACTIVE PAIR CHANGES
  //
  // Games stats are scoped by language pair. If the user already had
  // Challenges loaded for pair A and switches their active pair to B,
  // the cached numbers would silently be A's — stale and wrong for
  // the pair now showing. Reset the cache flag, and if the user is
  // already looking at the Challenges tab, reload immediately rather
  // than waiting for another tab switch.
  //
  // Deliberately scoped to activePair?.id only: this effect reacts to
  // the pair changing, not to tab switches (handleTabChange handles
  // that) or to challenges-loading state.
  // ===========================================================================

  useEffect(() => {
    setChallengesLoaded(false);

    if (activeTab === "challenges") {
      loadChallenges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePair?.id]);

  // ===========================================================================
  // TAB SWITCH — LOADS CHALLENGES ONLY THE FIRST TIME IT'S OPENED
  // ===========================================================================

  const handleTabChange = (tab: StatsTab) => {
    setActiveTab(tab);

    if (
      tab === "challenges" &&
      !challengesLoaded &&
      !isChallengesLoading
    ) {
      loadChallenges();
    }
  };

  // ===========================================================================
  // PULL TO REFRESH — REFRESHES WHICHEVER TAB IS CURRENTLY OPEN
  // ===========================================================================

  const handleRefresh = () => {
    if (activeTab === "learning") {
      loadLearning();
    } else {
      // Explicit user intent — bypasses the challengesLoaded cache.
      loadChallenges();
    }
  };

  // The native RefreshControl spinner should only appear for a
  // background refresh of data that's already on screen (a real
  // pull-to-refresh, or Learning's per-focus refresh). During
  // Challenges' very first load there's nothing on screen yet —
  // renderChallengesTab already shows its own centered spinner for
  // that case, so tying RefreshControl to isChallengesLoading too
  // produced two spinners at once. Gating on challengesLoaded here
  // means the native spinner only shows once there's already a
  // Challenges view underneath it being refreshed.
  const isActiveTabRefreshing =
    activeTab === "learning"
      ? isLearningLoading
      : isChallengesLoading && challengesLoaded;

  // ===========================================================================
  // INITIAL LOADING — ONLY EVER GATED ON LEARNING'S FIRST LOAD
  // ===========================================================================

  if (isLearningLoading && !overview) {
    return (
      <SafeAreaView
      style={shared.center}
      edges={["left", "right", "bottom"]}
    >
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
  // CHALLENGES TAB
  //
  // Only ever shows its own inline spinner on the very first load
  // (isChallengesLoading && !challengesLoaded). A background refresh
  // of already-loaded data (e.g. via pull-to-refresh) keeps showing
  // the existing view instead of flashing a full loading state — and
  // in that case the native RefreshControl spinner above is the only
  // one visible (see isActiveTabRefreshing).
  // ===========================================================================

  const renderChallengesTab = () => {
    if (isChallengesLoading && !challengesLoaded) {
      return (
        <View
          style={{
            paddingVertical: 50,
            alignItems: "center",
          }}
        >
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />
        </View>
      );
    }

    return (
      <ChallengesStatsView
        overview={challengeOverview}
        languages={challengeLanguages}
        modes={challengeModes}
        skills={challengeSkills}
        trend={challengeTrend}
        recentActivity={
          recentChallengeActivity
        }
      />
    );
  };

  // ===========================================================================
  // SCREEN
  // ===========================================================================

  const activeError =
    activeTab === "learning"
      ? learningError
      : challengesError;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor:
          colors.background,
      }}
      edges={["left", "right", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          gap: 24,
        }}
        refreshControl={
          <RefreshControl
            refreshing={
              isActiveTabRefreshing
            }
            onRefresh={handleRefresh}
            tintColor={
              colors.primary
            }
          />
        }
      >
        {/* ------------------------------------------------------------------ */}
        {/* ERROR                                                              */}
        {/* ------------------------------------------------------------------ */}

        {activeError && (
          <Text
            style={[
              shared.error,
              {
                marginBottom: 4,
              },
            ]}
          >
            {activeError}
          </Text>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TABS                                                               */}
        {/* ------------------------------------------------------------------ */}

        <StatsTabs
          value={activeTab}
          onChange={handleTabChange}
        />

        {/* ------------------------------------------------------------------ */}
        {/* CONTENT                                                            */}
        {/* ------------------------------------------------------------------ */}

        {activeTab === "learning"
          ? renderLearningTab()
          : renderChallengesTab()}
      </ScrollView>
    </SafeAreaView>
  );
}