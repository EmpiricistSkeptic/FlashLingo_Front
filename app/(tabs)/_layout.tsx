import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../contexts/ThemeContext";
import AccountMenuButton from "../../components/AccountMenuButton";

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBackground },
        headerTintColor: colors.headerTint,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: { backgroundColor: colors.tabBarBackground, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
          headerRight: () => <AccountMenuButton />,
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: "Statistics",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}