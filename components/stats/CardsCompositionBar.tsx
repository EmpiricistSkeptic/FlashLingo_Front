import { View, Text } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface Props {
  total: number;
  learned: number;
  learning: number;
  newCount: number;
}

export default function CardsCompositionBar({ total, learned, learning, newCount }: Props) {
  const { colors } = useTheme();

  if (total === 0) {
    return <Text style={{ color: colors.textMuted }}>No flashcards yet.</Text>;
  }

  // Привязываем цвета сегментов к нашей палитре
  const SEGMENTS = [
    { key: "learned", color: colors.success, label: "Learned" },
    { key: "learning", color: colors.warning, label: "Learning" },
    { key: "new", color: colors.placeholder, label: "New" },
  ] as const;

  const counts: Record<(typeof SEGMENTS)[number]["key"], number> = {
    learned,
    learning,
    new: newCount,
  };

  return (
    <View style={{ gap: 12, backgroundColor: colors.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
      
      {/* Полоска прогресса */}
      <View style={{ flexDirection: "row", height: 12, borderRadius: 6, overflow: "hidden", backgroundColor: colors.background }}>
        {SEGMENTS.map((seg) => {
          const pct = counts[seg.key] / total;
          if (pct <= 0) return null;
          return <View key={seg.key} style={{ flex: pct, backgroundColor: seg.color }} />;
        })}
      </View>
      
      {/* Легенда */}
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {SEGMENTS.map((seg) => (
          <View key={seg.key} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: seg.color }} />
            <Text style={{ fontSize: 13, color: colors.text, fontWeight: "500" }}>
              {seg.label} <Text style={{ color: colors.textMuted }}>{counts[seg.key]}</Text>
            </Text>
          </View>
        ))}
      </View>
      
    </View>
  );
}