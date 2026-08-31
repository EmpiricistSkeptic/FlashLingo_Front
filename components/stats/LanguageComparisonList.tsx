import { View, Text } from "react-native";

import { languageLabel } from "../../constants/languages";
import { useTheme } from "../../contexts/ThemeContext";
import type { LanguageStat } from "../../types/stats";

interface Props {
  languages: LanguageStat[];
}

export default function LanguageComparisonList({ languages }: Props) {
  const { colors } = useTheme();

  const withAccuracy = languages.filter(
    (l): l is LanguageStat & { accuracy: number } => l.accuracy !== null
  );

  const sorted = [...languages].sort(
    (a, b) => (b.accuracy ?? -1) - (a.accuracy ?? -1)
  );

  const weakest =
    withAccuracy.length > 0
      ? withAccuracy.reduce((min, l) =>
          l.accuracy < min.accuracy ? l : min
        )
      : null;

  if (sorted.length === 0) {
    return (
      <Text style={{ color: colors.textMuted }}>
        No language pairs yet.
      </Text>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      {sorted.map((lang) => {
        const pct =
          lang.accuracy !== null ? Math.round(lang.accuracy * 100) : null;

        return (
          <View key={lang.language_pair_id} style={{ gap: 4 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  fontWeight: "600",
                  color: colors.text,
                }}
              >
                {languageLabel(lang.native)} →{" "}
                {languageLabel(lang.learning)}
              </Text>

              <Text style={{ color: colors.textMuted }}>
                {pct !== null ? `${pct}%` : "—"}
              </Text>
            </View>

            <View
              style={{
                height: 6,
                backgroundColor: colors.border,
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${pct ?? 0}%`,
                  height: 6,
                  backgroundColor: colors.primary,
                }}
              />
            </View>

            <Text
              style={{
                fontSize: 12,
                color: colors.textMuted,
              }}
            >
              {lang.cards} cards · {lang.reviews} reviews
            </Text>
          </View>
        );
      })}

      {weakest && languages.length > 1 && (
        <Text
          style={{
            fontSize: 13,
            color: colors.primary,
            marginTop: 4,
          }}
        >
          Your weakest language right now:{" "}
          {languageLabel(weakest.native)} →{" "}
          {languageLabel(weakest.learning)}
        </Text>
      )}
    </View>
  );
}