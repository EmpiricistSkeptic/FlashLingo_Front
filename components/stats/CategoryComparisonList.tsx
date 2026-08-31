import { View, Text } from "react-native";

import { useTheme } from "../../contexts/ThemeContext";
import type { CategoryStat } from "../../types/stats";

interface Props {
  categories: CategoryStat[];
}

export default function CategoryComparisonList({ categories }: Props) {
  const { colors } = useTheme();

  // Weakest first — this is the part of the screen the user should
  // actually act on, so it goes on top rather than alphabetical order.
  const sorted = [...categories].sort(
    (a, b) => (a.accuracy ?? 1) - (b.accuracy ?? 1)
  );

  if (sorted.length === 0) {
    return (
      <Text style={{ color: colors.textMuted }}>
        No categories yet.
      </Text>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      {sorted.map((cat) => {
        const pct =
          cat.accuracy !== null ? Math.round(cat.accuracy * 100) : null;

        return (
          <View key={cat.category_id} style={{ gap: 4 }}>
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
                {cat.name}
              </Text>

              <Text style={{ color: colors.textMuted }}>
                {pct !== null ? `${pct}%` : "—"}
              </Text>
            </View>

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
                  width: `${pct ?? 0}%`,
                  height: 6,
                  backgroundColor:
                    pct !== null && pct < 60
                      ? "#dc2626"
                      : colors.primary,
                }}
              />
            </View>

            <Text
              style={{
                fontSize: 12,
                color: colors.textMuted,
              }}
            >
              {cat.cards} cards
            </Text>
          </View>
        );
      })}
    </View>
  );
}