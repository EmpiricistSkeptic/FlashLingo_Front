import { useRef } from "react";
import {
  ScrollView,
  Text,
  View,
} from "react-native";

import { useTheme, ThemeColors } from "../../contexts/ThemeContext";
import { formatRelativeTime } from "../../utils/relativeTime";
import { languageLabel } from "../../constants/languages";

import type {
  ChallengeActivityEntry,
  ChallengeLanguageStat,
  ChallengeModeStat,
  ChallengeSkillStat,
  ChallengeStatsOverview,
  ChallengeTrendPoint,
} from "../../types/stats";

interface Props {
  overview: ChallengeStatsOverview | null;
  languages: ChallengeLanguageStat[];
  modes: ChallengeModeStat[];
  skills: ChallengeSkillStat[];
  trend: ChallengeTrendPoint[];
  recentActivity: ChallengeActivityEntry[];
}

const GAME_LABELS: Record<
  "typing" | "sentence" | "translation",
  string
> = {
  typing: "Typing Challenge",
  sentence: "Sentence Challenge",
  translation: "Translation Challenge",
};

const GAME_SHORT_LABELS: Record<
  "typing" | "sentence" | "translation",
  string
> = {
  typing: "Typing",
  sentence: "Sentence",
  translation: "Translation",
};

const SKILL_SUBTITLES: Record<string, string> = {
  recall: "Remember the word without prompts",
  sentence_usage: "Use vocabulary naturally in context",
  translation: "Transfer meaning between languages",
};

// Challenge stats already arrive as 0–100 (unlike the Learning tab's
// 0.0–1.0 accuracy), so this only rounds for display — it does not
// multiply by 100 again.
function pct(value: number | null): string {
  return value === null ? "—" : `${Math.round(value)}%`;
}

// Same threshold logic as AccuracyBadge's getAccuracyColor, just
// against an already-0–100 value instead of a 0.0–1.0 fraction.
function getPerformanceColor(
  value: number | null,
  colors: ThemeColors
): string {
  if (value === null) return colors.textMuted;
  if (value >= 85) return colors.success;
  if (value >= 60) return colors.warning;
  return colors.danger;
}

function formatTrendDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

// ============================================================================
// SectionTitle — matches StatisticsScreen's local SectionTitle exactly,
// so section headers look identical across both tabs.
// ============================================================================

function SectionTitle({ title }: { title: string }) {
  const { colors } = useTheme();

  return (
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
}

// ============================================================================
// ProgressBar — same shape used everywhere in the Learning tab:
// 6px track on colors.border, filled bar in a passed-in color.
// ============================================================================

function ProgressBar({
  value,
  color,
}: {
  value: number | null;
  color: string;
}) {
  const { colors } = useTheme();
  const normalized = Math.max(0, Math.min(100, value ?? 0));

  return (
    <View
      style={{
        height: 6,
        backgroundColor: colors.border,
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: `${normalized}%`,
          height: 6,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

// ============================================================================
// SUMMARY — hero success-rate number (like AccuracyBadge) + a row of
// three stat boxes (like ReviewSummaryRow), both in the neutral
// colors.surface/colors.border card language.
// ============================================================================

function SummaryHero({
  overview,
}: {
  overview: ChallengeStatsOverview;
}) {
  const { colors } = useTheme();
  const color = getPerformanceColor(
    overview.success_rate,
    colors
  );

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          gap: 4,
        }}
      >
        <Text
          style={{
            fontSize: 48,
            fontWeight: "800",
            color,
          }}
        >
          {Math.round(overview.success_rate)}
        </Text>

        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            color,
          }}
        >
          %
        </Text>
      </View>

      <Text
        style={{
          fontSize: 13,
          color: colors.textMuted,
          textTransform: "uppercase",
          fontWeight: "700",
          marginTop: 4,
        }}
      >
        Success rate
      </Text>
    </View>
  );
}

function SummaryStatsRow({
  overview,
}: {
  overview: ChallengeStatsOverview;
}) {
  const { colors } = useTheme();

  const items = [
    {
      label: "Attempts",
      value: String(overview.total_attempts),
    },
    {
      label: "AI score",
      value: pct(overview.average_ai_score),
    },
    {
      label: "Give-up rate",
      value: pct(overview.give_up_rate),
    },
  ];

  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      {items.map((item) => (
        <View
          key={item.label}
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              color: colors.text,
              marginBottom: 4,
            }}
          >
            {item.value}
          </Text>

          <Text
            style={{
              fontSize: 11,
              color: colors.textMuted,
              textTransform: "uppercase",
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ============================================================================
// LANGUAGES — same list shape as LanguageComparisonList on the
// Learning tab: sorted strongest-first, with a called-out "weakest"
// line when there's more than one pair with attempts.
// ============================================================================

function LanguageRow({
  language,
}: {
  language: ChallengeLanguageStat;
}) {
  const { colors } = useTheme();
  const color = getPerformanceColor(
    language.success_rate,
    colors
  );

  return (
    <View style={{ gap: 4 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontWeight: "600",
            color: colors.text,
          }}
        >
          {languageLabel(language.native)} →{" "}
          {languageLabel(language.learning)}
        </Text>

        <Text style={{ color: colors.textMuted }}>
          {pct(language.success_rate)}
        </Text>
      </View>

      <ProgressBar
        value={language.success_rate}
        color={color}
      />

      <Text
        style={{
          fontSize: 12,
          color: colors.textMuted,
        }}
      >
        {language.total_attempts}{" "}
        {language.total_attempts === 1
          ? "attempt"
          : "attempts"}
      </Text>
    </View>
  );
}

function LanguagesSection({
  languages,
}: {
  languages: ChallengeLanguageStat[];
}) {
  const { colors } = useTheme();

  if (languages.length === 0) {
    return (
      <Text style={{ color: colors.textMuted }}>
        No language pairs yet.
      </Text>
    );
  }

  const withAttempts = languages.filter(
    (lang) => lang.total_attempts > 0
  );

  const sorted = [...languages].sort(
    (a, b) => b.success_rate - a.success_rate
  );

  const weakest =
    withAttempts.length > 0
      ? withAttempts.reduce((min, lang) =>
          lang.success_rate < min.success_rate
            ? lang
            : min
        )
      : null;

  return (
    <View
      style={{
        gap: 16,
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {sorted.map((language) => (
        <LanguageRow
          key={language.language_pair_id}
          language={language}
        />
      ))}

      {weakest && withAttempts.length > 1 && (
        <Text
          style={{
            fontSize: 13,
            color: colors.primary,
          }}
        >
          Your weakest language in Challenges right
          now: {languageLabel(weakest.native)} →{" "}
          {languageLabel(weakest.learning)}
        </Text>
      )}
    </View>
  );
}

// ============================================================================
// MODES — one row per game type, styled like CategoryComparisonList:
// name + percentage, thin progress bar, small caption line.
// ============================================================================

function ModeRow({ mode }: { mode: ChallengeModeStat }) {
  const { colors } = useTheme();

  const isAiMode =
    mode.game_type === "sentence" ||
    mode.game_type === "translation";

  const performance = isAiMode
    ? mode.average_ai_score
    : mode.success_rate;

  const color = getPerformanceColor(
    performance,
    colors
  );

  return (
    <View style={{ gap: 4 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontWeight: "600",
            color: colors.text,
          }}
        >
          {GAME_LABELS[mode.game_type]}
        </Text>

        <Text style={{ color: colors.textMuted }}>
          {pct(performance)}
        </Text>
      </View>

      <ProgressBar value={performance} color={color} />

      <Text
        style={{
          fontSize: 12,
          color: colors.textMuted,
        }}
      >
        {mode.attempts}{" "}
        {mode.attempts === 1 ? "attempt" : "attempts"}
        {" · "}
        Success {pct(mode.success_rate)}
        {isAiMode &&
          mode.average_ai_score !== null &&
          " · AI-scored"}
      </Text>
    </View>
  );
}

// ============================================================================
// SKILLS — same row shape as ModeRow, with a description line instead
// of the attempts caption.
// ============================================================================

function SkillRow({ skill }: { skill: ChallengeSkillStat }) {
  const { colors } = useTheme();
  const color = getPerformanceColor(
    skill.performance,
    colors
  );

  return (
    <View style={{ gap: 4 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontWeight: "600",
            color: colors.text,
          }}
        >
          {skill.label}
        </Text>

        <Text style={{ color: colors.textMuted }}>
          {pct(skill.performance)}
        </Text>
      </View>

      <ProgressBar value={skill.performance} color={color} />

      <Text
        style={{
          fontSize: 12,
          color: colors.textMuted,
        }}
      >
        {SKILL_SUBTITLES[skill.skill] ??
          "Practice this skill through challenges"}
      </Text>
    </View>
  );
}

// ============================================================================
// TREND — vertical bar chart, same visual family as TrendChart
// (bars + weekday-ish label), just theme-aware and length-agnostic.
// ============================================================================

function TrendChart({
  trend,
}: {
  trend: ChallengeTrendPoint[];
}) {
  const { colors } = useTheme();
  const CHART_HEIGHT = 90;

  // trend is ordered oldest -> newest (left -> right), so "today"
  // is the last item. A ScrollView opens at its start by default,
  // which for a 14-day window means a brand-new user lands on empty
  // pre-signup days instead of their actual activity. Scrolling to
  // the end on every content-size change (initial load and any
  // later refresh) fixes that without changing the chronological
  // order — the user can still scroll left to see older history.
  const scrollRef = useRef<ScrollView>(null);

  if (trend.every((point) => point.attempts === 0)) {
    return (
      <Text style={{ color: colors.textMuted }}>
        No challenge attempts in this period yet.
      </Text>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      onContentSizeChange={() =>
        scrollRef.current?.scrollToEnd({
          animated: false,
        })
      }
      contentContainerStyle={{
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 8,
        paddingVertical: 4,
      }}
    >
      {trend.map((point) => {
        const color = getPerformanceColor(
          point.performance,
          colors
        );

        const barHeight = Math.max(
          4,
          ((point.performance ?? 0) / 100) *
            CHART_HEIGHT
        );

        return (
          <View
            key={point.date}
            style={{
              width: 28,
              alignItems: "center",
              gap: 4,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                color: colors.textMuted,
              }}
            >
              {point.performance !== null
                ? `${Math.round(point.performance)}%`
                : ""}
            </Text>

            <View
              style={{
                width: "100%",
                height: barHeight,
                borderRadius: 4,
                backgroundColor:
                  point.performance === null
                    ? colors.border
                    : color,
              }}
            />

            <Text
              style={{
                fontSize: 10,
                color: colors.textMuted,
              }}
            >
              {formatTrendDate(point.date)}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ============================================================================
// RECENT ACTIVITY — same row shape as RecentActivityList: a result
// glyph, the word, a relative timestamp, and a trailing score.
// ============================================================================

function ActivityRow({
  entry,
}: {
  entry: ChallengeActivityEntry;
}) {
  const { colors } = useTheme();

  let icon = "✗";
  let color = colors.danger;

  if (entry.gave_up) {
    icon = "—";
    color = colors.textMuted;
  } else if (entry.is_correct) {
    icon = "✓";
    color = colors.success;
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <Text
        style={{
          color,
          fontWeight: "700",
          width: 16,
        }}
      >
        {icon}
      </Text>

      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text }}>
          {entry.flashcard_text}
        </Text>

        <Text
          style={{
            fontSize: 11,
            color: colors.textMuted,
          }}
        >
          {GAME_SHORT_LABELS[entry.game_type]}
        </Text>
      </View>

      {entry.score !== null && (
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: colors.textMuted,
          }}
        >
          {pct(entry.score)}
        </Text>
      )}

      <Text
        style={{
          fontSize: 12,
          color: colors.textMuted,
        }}
      >
        {formatRelativeTime(entry.created_at)}
      </Text>
    </View>
  );
}

// ============================================================================
// ROOT
// ============================================================================

export default function ChallengesStatsView({
  overview,
  languages,
  modes,
  skills,
  trend,
  recentActivity,
}: Props) {
  const { colors } = useTheme();

  if (overview === null) {
    return (
      <View
        style={{
          paddingVertical: 50,
          alignItems: "center",
          gap: 8,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: colors.text,
            textAlign: "center",
          }}
        >
          Challenges unavailable
        </Text>

        <Text
          style={{
            maxWidth: 300,
            fontSize: 13,
            lineHeight: 20,
            color: colors.textMuted,
            textAlign: "center",
          }}
        >
          We couldn't load your challenge statistics
          right now.
        </Text>
      </View>
    );
  }

  if (overview.total_attempts === 0) {
    return (
      <View
        style={{
          paddingVertical: 50,
          alignItems: "center",
          gap: 10,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: colors.primary + "1A",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: colors.primary,
            }}
          >
            +
          </Text>
        </View>

        <Text
          style={{
            marginTop: 4,
            fontSize: 17,
            fontWeight: "700",
            color: colors.text,
            textAlign: "center",
          }}
        >
          Ready for a challenge?
        </Text>

        <Text
          style={{
            maxWidth: 280,
            fontSize: 13,
            lineHeight: 20,
            color: colors.textMuted,
            textAlign: "center",
          }}
        >
          Practice recall, sentence usage, and
          translation to build stronger active
          vocabulary.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 12 }}>
        <SummaryHero overview={overview} />
        <SummaryStatsRow overview={overview} />
      </View>

      <View>
        <SectionTitle title="Languages" />

        <LanguagesSection languages={languages} />
      </View>

      <View>
        <SectionTitle title="Challenge performance" />

        <View
          style={{
            gap: 16,
            backgroundColor: colors.surface,
            padding: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {modes.map((mode) => (
            <ModeRow key={mode.game_type} mode={mode} />
          ))}
        </View>
      </View>

      <View>
        <SectionTitle title="Active skills" />

        <View
          style={{
            gap: 16,
            backgroundColor: colors.surface,
            padding: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {skills.map((skill) => (
            <SkillRow key={skill.skill} skill={skill} />
          ))}
        </View>
      </View>

      <View>
        <SectionTitle
          title={`Performance trend · last ${trend.length} days`}
        />

        <TrendChart trend={trend} />
      </View>

      <View>
        <SectionTitle title="Recent challenge activity" />

        {recentActivity.length > 0 ? (
          <View style={{ gap: 8 }}>
            {recentActivity.map((entry) => (
              <ActivityRow key={entry.id} entry={entry} />
            ))}
          </View>
        ) : (
          <Text style={{ color: colors.textMuted }}>
            No recent challenge activity.
          </Text>
        )}
      </View>
    </View>
  );
}