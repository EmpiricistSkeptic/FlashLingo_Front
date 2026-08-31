import { View, Text } from "react-native";

import type { TrendPoint } from "../../types/stats";

const CHART_HEIGHT = 100;

function weekdayLabel(dateIso: string): string {
  const date = new Date(`${dateIso}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2);
}

function barColor(accuracy: number | null): string {
  if (accuracy === null) return "#e5e7eb";
  if (accuracy >= 0.85) return "#16a34a";
  if (accuracy >= 0.6) return "#f59e0b";
  return "#dc2626";
}

interface Props {
  trend: TrendPoint[];
}

export default function TrendChart({ trend }: Props) {
  if (trend.every((p) => p.reviews === 0)) {
    return <Text style={{ color: "#666" }}>No reviews in this period yet.</Text>;
  }

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height: CHART_HEIGHT + 32, gap: 6 }}>
      {trend.map((point) => {
        const barHeight = Math.max(4, (point.accuracy ?? 0) * CHART_HEIGHT);
        return (
          <View key={point.date} style={{ flex: 1, alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 10, color: "#888" }}>
              {point.accuracy !== null ? `${Math.round(point.accuracy * 100)}%` : ""}
            </Text>
            <View
              style={{
                width: "100%",
                height: barHeight,
                borderRadius: 4,
                backgroundColor: barColor(point.accuracy),
              }}
            />
            <Text style={{ fontSize: 10, color: "#888" }}>{weekdayLabel(point.date)}</Text>
          </View>
        );
      })}
    </View>
  );
}