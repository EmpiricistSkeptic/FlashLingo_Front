import { View, Text } from "react-native";

import { useTheme } from "../../contexts/ThemeContext";
import type { DifficultCard } from "../../types/stats";

interface Props {
  cards: DifficultCard[];
}

export default function DifficultCardsList({ cards }: Props) {
  const { colors } = useTheme();

  if (cards.length === 0) {
    return (
      <Text style={{ color: colors.textMuted }}>
        Not enough review history yet.
      </Text>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      {cards.map((card, i) => (
        <View
          key={card.flashcard_id}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surface,
            borderRadius: 8,
            padding: 12,
            gap: 12,
          }}
        >
          <Text
            style={{
              color: colors.textMuted,
              width: 18,
            }}
          >
            {i + 1}
          </Text>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontWeight: "600",
                color: colors.text,
              }}
            >
              {card.text}
            </Text>

            <Text
              style={{
                fontSize: 12,
                color: colors.textMuted,
              }}
            >
              {card.reviews} reviews
            </Text>
          </View>

          <Text
            style={{
              color: "#dc2626",
              fontWeight: "700",
            }}
          >
            {Math.round(card.again_rate * 100)}%
          </Text>
        </View>
      ))}
    </View>
  );
}