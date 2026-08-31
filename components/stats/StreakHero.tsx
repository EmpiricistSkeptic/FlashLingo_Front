import { View, Text } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface Props {
  current: number;
  longest: number;
}

export default function StreakHero({ current, longest }: Props) {
  const { colors } = useTheme();
  const isActive = current > 0;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 24,
        padding: 24,
        alignItems: "center",
        borderWidth: 1,
        borderColor: isActive ? colors.warning : colors.border,
        shadowColor: isActive ? colors.warning : "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isActive && colors.background === "#ffffff" ? 0.2 : 0,
        shadowRadius: 12,
        elevation: isActive ? 4 : 0,
      }}
    >
      <Text style={{ fontSize: 48, marginBottom: 8 }}>{isActive ? "🔥" : "🧊"}</Text>
      
      <Text style={{ fontSize: 36, fontWeight: "800", color: colors.text }}>
        {current} day{current === 1 ? "" : "s"}
      </Text>
      
      <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 4, textAlign: "center" }}>
        {isActive ? "Current streak! Keep it up!" : "No active streak. Study today to start one!"}
      </Text>
      
      {longest > 0 && (
        <View style={{ marginTop: 16, backgroundColor: colors.background, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 }}>
          <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: "600" }}>
            Personal best: <Text style={{ color: colors.text }}>{longest} days</Text>
          </Text>
        </View>
      )}
    </View>
  );
}