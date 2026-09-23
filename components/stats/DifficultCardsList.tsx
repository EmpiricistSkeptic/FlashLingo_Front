import { View, Text, TouchableOpacity } from "react-native";

import { useTheme } from "../../contexts/ThemeContext";
import type { DifficultCard } from "../../types/stats";

interface Props {
  cards: DifficultCard[];
  onStudy: () => void;
}

export default function DifficultCardsList({
  cards,
  onStudy,
}: Props) {
  const { colors } = useTheme();

  if (cards.length === 0) {
    return (
      <Text style={{ color: colors.textMuted }}>
        Not enough review history yet.
      </Text>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      {/* Top difficult cards */}
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
            {/* Rank */}
            <Text
              style={{
                color: colors.textMuted,
                width: 18,
              }}
            >
              {i + 1}
            </Text>

            {/* Card information */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontWeight: "600",
                  color: colors.text,
                }}
                numberOfLines={2}
              >
                {card.text}
              </Text>

              <Text
                style={{
                  fontSize: 12,
                  color: colors.textMuted,
                  marginTop: 2,
                }}
              >
                {card.reviews} reviews
              </Text>
            </View>

            {/* Again rate */}
            <Text
              style={{
                color: "#dc2626",
                fontWeight: "700",
              }}
            >
              {Math.round(card.again_rate * 100)}% Again
            </Text>
          </View>
        ))}
      </View>

      {/* Study button */}
      <TouchableOpacity
        onPress={onStudy}
        activeOpacity={0.8}
        style={{
          backgroundColor: colors.primary,
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 16,
            fontWeight: "700",
          }}
        >
          Study tricky words
        </Text>
      </TouchableOpacity>
    </View>
  );
}

