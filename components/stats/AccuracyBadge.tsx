import { View, Text } from "react-native";
import { useTheme, ThemeColors } from "../../contexts/ThemeContext";

function getAccuracyColor(accuracy: number, colors: ThemeColors): string {
  if (accuracy >= 0.85) return colors.success;
  if (accuracy >= 0.6) return colors.warning;
  return colors.danger;
}

interface Props {
  accuracy: number | null;
  label?: string;
}

export default function AccuracyBadge({ accuracy, label = "Overall accuracy" }: Props) {
  const { colors } = useTheme();

  if (accuracy === null) {
    return (
      <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 24, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
        <Text style={{ color: colors.textMuted, fontWeight: "500" }}>No reviews yet</Text>
      </View>
    );
  }

  const pct = Math.round(accuracy * 100);
  const color = getAccuracyColor(accuracy, colors);

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
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
        <Text style={{ fontSize: 48, fontWeight: "800", color: color }}>{pct}</Text>
        <Text style={{ fontSize: 24, fontWeight: "700", color: color }}>%</Text>
      </View>
      <Text style={{ fontSize: 13, color: colors.textMuted, textTransform: "uppercase", fontWeight: "700", marginTop: 4 }}>
        {label}
      </Text>
    </View>
  );
}