import { View, Text } from "react-native";
import Svg, { Rect, Path } from "react-native-svg";

import { useTheme } from "../contexts/ThemeContext";

interface Props {
  variant?: "icon" | "full";
  size?: number; // icon size in px — wordmark scales relative to it
}

export default function Logo({ variant = "full", size = 56 }: Props) {
  const { colors } = useTheme();

  const icon = (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* back card — rotated behind, gives the "stack of flashcards" motif */}
      <Rect
        x={10}
        y={12}
        width={40}
        height={48}
        rx={9}
        fill={colors.surface}
        stroke={colors.border}
        strokeWidth={2}
        transform="rotate(-12 32 32)"
      />
      {/* front card */}
      <Rect
        x={12}
        y={8}
        width={40}
        height={48}
        rx={9}
        fill={colors.background}
        stroke={colors.primary}
        strokeWidth={2.5}
      />
      {/* "flash" bolt — the wordplay on the app name */}
      <Path d="M35 16 L23 35 L30 35 L28 50 L41 29 L33 29 Z" fill={colors.primary} />
    </Svg>
  );

  if (variant === "icon") {
    return icon;
  }

  return (
    <View style={{ alignItems: "center", gap: 8 }}>
      {icon}
      <Text
        style={{
          fontSize: size * 0.36,
          fontWeight: "800",
          letterSpacing: 0.5,
          color: colors.text,
        }}
      >
        Flash<Text style={{ color: colors.primary }}>Lingo</Text>
      </Text>
    </View>
  );
}