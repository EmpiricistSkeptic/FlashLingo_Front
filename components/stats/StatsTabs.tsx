import {
  Pressable,
  Text,
  View,
} from "react-native";

import { useTheme } from "../../contexts/ThemeContext";

export type StatsTab =
  | "learning"
  | "challenges";

interface Props {
  value: StatsTab;
  onChange: (value: StatsTab) => void;
}

export default function StatsTabs({
  value,
  onChange,
}: Props) {
  const { colors } = useTheme();

  const tabs: {
    key: StatsTab;
    label: string;
  }[] = [
    {
      key: "learning",
      label: "Learning",
    },
    {
      key: "challenges",
      label: "Challenges",
    },
  ];

  return (
    <View
      style={{
        flexDirection: "row",
        borderWidth: 1,
        borderColor: colors.textMuted,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {tabs.map((tab) => {
        const isActive =
          value === tab.key;

        return (
          <Pressable
            key={tab.key}
            onPress={() =>
              onChange(tab.key)
            }
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 12,
              backgroundColor: isActive
                ? colors.primary
                : colors.background,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: isActive
                  ? colors.background
                  : colors.textMuted,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
