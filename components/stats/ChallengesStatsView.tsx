import {
  ScrollView,
  Text,
  View,
} from "react-native";

import { useTheme } from "../../contexts/ThemeContext";

import type {
  ChallengeActivityEntry,
  ChallengeModeStat,
  ChallengeSkillStat,
  ChallengeStatsOverview,
  ChallengeTrendPoint,
} from "../../types/stats";

interface Props {
  overview: ChallengeStatsOverview | null;
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

const ACCENT = "#8B5CF6";
const CORAL = "#F97316";
const PINK = "#EC4899";

function formatRelativeTime(
  value: string
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diff = Math.max(
    0,
    Date.now() - date.getTime()
  );

  const seconds = Math.floor(
    diff / 1000
  );

  if (seconds < 60) {
    return "Just now";
  }

  const minutes = Math.floor(
    seconds / 60
  );

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(
    hours / 24
  );

  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString();
}

function formatTrendDate(
  value: string
): string {
  const date = new Date(
    `${value}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
    }
  );
}

function SectionHeader({
  eyebrow,
  title,
  mutedColor,
  accentColor,
}: {
  eyebrow: string;
  title: string;
  mutedColor: string;
  accentColor: string;
}) {
  return (
    <View
      style={{
        gap: 3,
        marginBottom: 12,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: "800",
          color: accentColor,
          textTransform: "uppercase",
          letterSpacing: 1.4,
        }}
      >
        {eyebrow}
      </Text>

      <Text
        style={{
          fontSize: 20,
          lineHeight: 24,
          fontWeight: "800",
          color: mutedColor,
        }}
      >
        {title}
      </Text>
    </View>
  );
}

function ProgressBar({
  value,
  color,
  trackColor,
}: {
  value: number | null;
  color: string;
  trackColor: string;
}) {
  const normalized = Math.max(
    0,
    Math.min(100, value ?? 0)
  );

  return (
    <View
      style={{
        height: 7,
        width: "100%",
        borderRadius: 999,
        backgroundColor: trackColor,
        overflow: "hidden",
      }}
    >
      {value !== null && (
        <View
          style={{
            width: `${normalized}%`,
            height: "100%",
            borderRadius: 999,
            backgroundColor: color,
          }}
        />
      )}
    </View>
  );
}

function SummaryCard({
  overview,
  backgroundColor,
  textColor,
  mutedColor,
}: {
  overview: ChallengeStatsOverview;
  backgroundColor: string;
  textColor: string;
  mutedColor: string;
}) {
  return (
    <View
      style={{
        borderRadius: 24,
        padding: 20,
        gap: 18,
        backgroundColor: ACCENT,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent:
            "space-between",
          alignItems: "flex-start",
          gap: 16,
        }}
      >
        <View
          style={{
            flex: 1,
            gap: 5,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "800",
              color: textColor,
              opacity: 0.72,
              textTransform: "uppercase",
              letterSpacing: 1.4,
            }}
          >
            Challenges
          </Text>

          <Text
            style={{
              fontSize: 28,
              lineHeight: 32,
              fontWeight: "900",
              color: textColor,
            }}
          >
            Practice
          </Text>

          <Text
            style={{
              fontSize: 13,
              lineHeight: 19,
              color: textColor,
              opacity: 0.78,
            }}
          >
            Your active vocabulary
            performance
          </Text>
        </View>

        <View
          style={{
            alignItems: "flex-end",
          }}
        >
          <Text
            style={{
              fontSize: 34,
              lineHeight: 38,
              fontWeight: "900",
              color: textColor,
            }}
          >
            {overview.success_rate}%
          </Text>

          <Text
            style={{
              fontSize: 12,
              color: textColor,
              opacity: 0.72,
            }}
          >
            success rate
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: 10,
        }}
      >
        <View
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 16,
            backgroundColor:
              "rgba(255,255,255,0.92)",
          }}
        >
          <Text
            style={{
              fontSize: 11,
              color: mutedColor,
              marginBottom: 3,
            }}
          >
            Attempts
          </Text>

          <Text
            style={{
              fontSize: 21,
              fontWeight: "800",
              color: ACCENT,
            }}
          >
            {overview.total_attempts}
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 16,
            backgroundColor:
              "rgba(255,255,255,0.92)",
          }}
        >
          <Text
            style={{
              fontSize: 11,
              color: mutedColor,
              marginBottom: 3,
            }}
          >
            AI score
          </Text>

          <Text
            style={{
              fontSize: 21,
              fontWeight: "800",
              color: CORAL,
            }}
          >
            {overview.average_ai_score ===
            null
              ? "—"
              : `${overview.average_ai_score}%`}
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 16,
            backgroundColor:
              "rgba(255,255,255,0.92)",
          }}
        >
          <Text
            style={{
              fontSize: 11,
              color: mutedColor,
              marginBottom: 3,
            }}
          >
            Skipped
          </Text>

          <Text
            style={{
              fontSize: 21,
              fontWeight: "800",
              color: PINK,
            }}
          >
            {overview.give_up_rate}%
          </Text>
        </View>
      </View>
    </View>
  );
}

function ModeCard({
  mode,
  mutedColor,
  borderColor,
  trackColor,
}: {
  mode: ChallengeModeStat;
  mutedColor: string;
  borderColor: string;
  trackColor: string;
}) {
  const isAiMode =
    mode.game_type === "sentence" ||
    mode.game_type === "translation";

  const performance = isAiMode
    ? mode.average_ai_score
    : mode.success_rate;

  const accentColor =
    mode.game_type === "typing"
      ? ACCENT
      : mode.game_type ===
          "sentence"
        ? CORAL
        : PINK;

  return (
    <View
      style={{
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: borderColor,
        gap: 10,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor:
              `${accentColor}16`,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "900",
              color: accentColor,
            }}
          >
            {GAME_SHORT_LABELS[
              mode.game_type
            ]
              .slice(0, 2)
              .toUpperCase()}
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            gap: 3,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "800",
              color: accentColor,
            }}
          >
            {GAME_LABELS[mode.game_type]}
          </Text>

          <Text
            style={{
              fontSize: 12,
              color: mutedColor,
            }}
          >
            {mode.attempts}{" "}
            {mode.attempts === 1
              ? "attempt"
              : "attempts"}
            {" · "}
            {mode.answered_attempts}{" "}
            answered
          </Text>
        </View>

        <View
          style={{
            alignItems: "flex-end",
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "900",
              color: accentColor,
            }}
          >
            {performance === null
              ? "—"
              : `${performance}%`}
          </Text>

          <Text
            style={{
              fontSize: 10,
              color: mutedColor,
            }}
          >
            {isAiMode
              ? "AI score"
              : "performance"}
          </Text>
        </View>
      </View>

      <ProgressBar
        value={performance}
        color={accentColor}
        trackColor={`${accentColor}18`}
      />

      <View
        style={{
          flexDirection: "row",
          justifyContent:
            "space-between",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 11,
            color: mutedColor,
          }}
        >
          Success {mode.success_rate}%
        </Text>

        {isAiMode &&
          mode.average_ai_score !==
            null && (
            <Text
              style={{
                fontSize: 11,
                color: mutedColor,
              }}
            >
              AI evaluation
            </Text>
          )}
      </View>
    </View>
  );
}

function SkillCard({
  skill,
  mutedColor,
}: {
  skill: ChallengeSkillStat;
  mutedColor: string;
}) {
  const accentColor =
    skill.skill === "recall"
      ? ACCENT
      : skill.skill ===
          "sentence_usage"
        ? CORAL
        : PINK;

  return (
    <View
      style={{
        padding: 15,
        borderRadius: 18,
        backgroundColor:
          `${accentColor}10`,
        gap: 11,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 13,
            backgroundColor:
              accentColor,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "900",
              color: "#FFFFFF",
            }}
          >
            {skill.label
              .slice(0, 1)
              .toUpperCase()}
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            gap: 3,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Text
              style={{
                flex: 1,
                fontSize: 15,
                fontWeight: "800",
                color: accentColor,
              }}
            >
              {skill.label}
            </Text>

            <Text
              style={{
                fontSize: 15,
                fontWeight: "900",
                color: accentColor,
              }}
            >
              {skill.performance ===
              null
                ? "—"
                : `${skill.performance}%`}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 12,
              lineHeight: 18,
              color: mutedColor,
            }}
          >
            {SKILL_SUBTITLES[
              skill.skill
            ] ??
              "Practice this skill through challenges"}
          </Text>
        </View>
      </View>

      <ProgressBar
        value={skill.performance}
        color={accentColor}
        trackColor={`${accentColor}18`}
      />
    </View>
  );
}

function TrendCard({
  trend,
  primaryColor,
  mutedColor,
}: {
  trend: ChallengeTrendPoint[];
  primaryColor: string;
  mutedColor: string;
}) {
  const validValues = trend
    .map(
      (point) => point.performance
    )
    .filter(
      (
        value
      ): value is number =>
        value !== null
    );

  const maxValue =
    validValues.length > 0
      ? Math.max(...validValues, 100)
      : 100;

  const latestValue =
    [...trend]
      .reverse()
      .find(
        (point) =>
          point.performance !== null
      )?.performance ?? null;

  return (
    <View
      style={{
        borderRadius: 20,
        padding: 16,
        gap: 14,
        backgroundColor:
          `${ACCENT}0D`,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent:
            "space-between",
          alignItems: "flex-end",
        }}
      >
        <View style={{ gap: 3 }}>
          <Text
            style={{
              fontSize: 12,
              color: mutedColor,
            }}
          >
            Last 14 days
          </Text>

          <Text
            style={{
              fontSize: 25,
              fontWeight: "900",
              color: primaryColor,
            }}
          >
            {latestValue === null
              ? "—"
              : `${latestValue}%`}
          </Text>
        </View>

        <Text
          style={{
            fontSize: 11,
            color: mutedColor,
          }}
        >
          daily performance
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={
          false
        }
        contentContainerStyle={{
          gap: 9,
          paddingVertical: 4,
        }}
      >
        {trend.map((point) => {
          const value =
            point.performance;

          const height =
            value === null
              ? 5
              : Math.max(
                  8,
                  (value /
                    maxValue) *
                    100
                );

          return (
            <View
              key={point.date}
              style={{
                width: 30,
                alignItems: "center",
                gap: 5,
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: "700",
                  color: mutedColor,
                }}
              >
                {value === null
                  ? "—"
                  : Math.round(value)}
              </Text>

              <View
                style={{
                  height: 100,
                  width: 8,
                  borderRadius: 999,
                  backgroundColor:
                    `${ACCENT}18`,
                  justifyContent:
                    "flex-end",
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height,
                    width: 8,
                    borderRadius: 999,
                    backgroundColor:
                      value === null
                        ? mutedColor
                        : ACCENT,
                    opacity:
                      value === null
                        ? 0.3
                        : 1,
                  }}
                />
              </View>

              <Text
                style={{
                  fontSize: 9,
                  color: mutedColor,
                  textAlign: "center",
                }}
              >
                {formatTrendDate(
                  point.date
                )}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function ActivityRow({
  entry,
  mutedColor,
  borderColor,
}: {
  entry: ChallengeActivityEntry;
  mutedColor: string;
  borderColor: string;
}) {
  let resultLabel = "Incorrect";

  if (entry.gave_up) {
    resultLabel = "Skipped";
  } else if (entry.is_correct) {
    resultLabel = "Correct";
  }

  const accentColor =
    entry.game_type === "typing"
      ? ACCENT
      : entry.game_type ===
          "sentence"
        ? CORAL
        : PINK;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor:
          borderColor,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 13,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor:
            `${accentColor}14`,
        }}
      >
        <Text
          style={{
            fontSize: 10,
            fontWeight: "900",
            color: accentColor,
          }}
        >
          {GAME_SHORT_LABELS[
            entry.game_type
          ]
            .slice(0, 2)
            .toUpperCase()}
        </Text>
      </View>

      <View
        style={{
          flex: 1,
          gap: 3,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "800",
            color: accentColor,
          }}
        >
          {GAME_SHORT_LABELS[
            entry.game_type
          ]}
        </Text>

        <Text
          style={{
            fontSize: 11,
            color: mutedColor,
          }}
        >
          {resultLabel}
          {" · "}
          {formatRelativeTime(
            entry.created_at
          )}
        </Text>
      </View>

      {entry.score !== null && (
        <Text
          style={{
            fontSize: 14,
            fontWeight: "900",
            color: accentColor,
          }}
        >
          {entry.score}%
        </Text>
      )}
    </View>
  );
}

export default function ChallengesStatsView({
  overview,
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
            fontSize: 18,
            fontWeight: "800",
            color: ACCENT,
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
          We couldn't load your challenge
          statistics right now.
        </Text>
      </View>
    );
  }

  if (overview.total_attempts === 0) {
    return (
      <View
        style={{
          paddingVertical: 60,
          alignItems: "center",
          gap: 10,
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 22,
            backgroundColor:
              `${ACCENT}16`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "900",
              color: ACCENT,
            }}
          >
            +
          </Text>
        </View>

        <Text
          style={{
            marginTop: 4,
            fontSize: 20,
            fontWeight: "900",
            color: colors.text,
            textAlign: "center",
          }}
        >
          Ready for a challenge?
        </Text>

        <Text
          style={{
            maxWidth: 290,
            fontSize: 14,
            lineHeight: 21,
            color: colors.textMuted,
            textAlign: "center",
          }}
        >
          Practice recall, sentence usage,
          and translation to build stronger
          active vocabulary.
        </Text>
      </View>
    );
  }

  const borderColor =
    `${colors.textMuted}20`;

  return (
    <View
      style={{
        gap: 30,
      }}
    >
      {/* ================================================================== */}
      {/* SUMMARY                                                            */}
      {/* ================================================================== */}

      <SummaryCard
        overview={overview}
        backgroundColor={
          colors.background
        }
        textColor={colors.background}
        mutedColor={colors.textMuted}
      />

      {/* ================================================================== */}
      {/* MODES                                                              */}
      {/* ================================================================== */}

      <View>
        <SectionHeader
          eyebrow="Modes"
          title="Challenge performance"
          mutedColor={colors.text}
          accentColor={ACCENT}
        />

        <View
          style={{
            paddingHorizontal: 4,
          }}
        >
          {modes.map((mode) => (
            <ModeCard
              key={mode.game_type}
              mode={mode}
              mutedColor={
                colors.textMuted
              }
              borderColor={
                borderColor
              }
              trackColor={
                colors.textMuted
              }
            />
          ))}
        </View>
      </View>

      {/* ================================================================== */}
      {/* SKILLS                                                             */}
      {/* ================================================================== */}

      <View>
        <SectionHeader
          eyebrow="Skills"
          title="What you're practicing"
          mutedColor={colors.text}
          accentColor={CORAL}
        />

        <View style={{ gap: 10 }}>
          {skills.map((skill) => (
            <SkillCard
              key={skill.skill}
              skill={skill}
              mutedColor={
                colors.textMuted
              }
            />
          ))}
        </View>
      </View>

      {/* ================================================================== */}
      {/* TREND                                                              */}
      {/* ================================================================== */}

      <View>
        <SectionHeader
          eyebrow="Progress"
          title="Performance trend"
          mutedColor={colors.text}
          accentColor={PINK}
        />

        {trend.length > 0 ? (
          <TrendCard
            trend={trend}
            primaryColor={ACCENT}
            mutedColor={
              colors.textMuted
            }
          />
        ) : (
          <View
            style={{
              padding: 18,
              borderRadius: 18,
              backgroundColor:
                `${ACCENT}0D`,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                color: colors.textMuted,
              }}
            >
              No trend data available yet.
            </Text>
          </View>
        )}
      </View>

      {/* ================================================================== */}
      {/* ACTIVITY                                                           */}
      {/* ================================================================== */}

      <View>
        <SectionHeader
          eyebrow="History"
          title="Recent activity"
          mutedColor={colors.text}
          accentColor={CORAL}
        />

        <View
          style={{
            paddingHorizontal: 4,
          }}
        >
          {recentActivity.length >
          0 ? (
            recentActivity.map(
              (entry) => (
                <ActivityRow
                  key={entry.id}
                  entry={entry}
                  mutedColor={
                    colors.textMuted
                  }
                  borderColor={
                    borderColor
                  }
                />
              )
            )
          ) : (
            <Text
              style={{
                paddingVertical: 16,
                fontSize: 13,
                color:
                  colors.textMuted,
              }}
            >
              No recent challenge
              activity.
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

