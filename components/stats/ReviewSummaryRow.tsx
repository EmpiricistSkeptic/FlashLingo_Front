import { View, Text } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface Props {
  today: number;
  week: number;
  month: number;
}

export default function ReviewSummaryRow({ today, week, month }: Props) {
  const { colors } = useTheme();

  const items = [
    { label: "Today", value: today },
    { label: "This week", value: week },
    { label: "This month", value: month },
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
          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: 4 }}>
            {item.value}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted, textTransform: "uppercase", fontWeight: "700", textAlign: "center" }}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}