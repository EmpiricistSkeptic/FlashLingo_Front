import { View, Text } from "react-native";

import { useTheme } from "../../contexts/ThemeContext";
import { formatRelativeTime } from "../../utils/relativeTime";
import type { ProgressEntry } from "../../types/stats";

const RESULT_ICON: Record<string, string> = {
  again: "✗",
  hard: "✗",
  good: "✓",
  easy: "✓",
};

const RESULT_COLOR: Record<string, string> = {
  again: "#dc2626",
  hard: "#f59e0b",
  good: "#16a34a",
  easy: "#16a34a",
};

interface Props {
  entries: ProgressEntry[];
}

export default function RecentActivityList({ entries }: Props) {
  const { colors } = useTheme();

  if (entries.length === 0) {
    return (
      <Text style={{ color: colors.textMuted }}>
        No activity yet — study something!
      </Text>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      {entries.map((entry) => (
        <View
          key={entry.id}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Text
            style={{
              color: RESULT_COLOR[entry.result],
              fontWeight: "700",
              width: 16,
            }}
          >
            {RESULT_ICON[entry.result]}
          </Text>

          <Text
            style={{
              flex: 1,
              color: colors.text,
            }}
          >
            {entry.flashcard_text}
          </Text>

          <Text
            style={{
              fontSize: 12,
              color: colors.textMuted,
            }}
          >
            {formatRelativeTime(entry.reviewed_at)}
          </Text>
        </View>
      ))}
    </View>
  );
}