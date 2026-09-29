import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "../contexts/ThemeContext";
import { useSharedStyles } from "../hooks/useSharedStyles";

import type { DuplicateFlashcard } from "../types/flashcard";

const MAX_VISIBLE_CATEGORIES = 3;

interface Props {
  duplicates: DuplicateFlashcard[];
  currentCategoryId: number;
}

export default function DuplicateWarning({
  duplicates,
  currentCategoryId,
}: Props) {
  const { colors } = useTheme();
  const shared = useSharedStyles();

  if (duplicates.length === 0) return null;

  const accent = (colors as any).warning ?? "#F59E0B";

  const inCurrentCategory = duplicates.some((d) =>
    d.categories.some((c) => c.id === currentCategoryId)
  );

  // Unique names of the OTHER categories that already contain this word.
  const otherCategories = Array.from(
    new Set(
      duplicates.flatMap((d) =>
        d.categories
          .filter((c) => c.id !== currentCategoryId)
          .map((c) => c.name)
      )
    )
  );

  const visible = otherCategories.slice(0, MAX_VISIBLE_CATEGORIES);
  const hiddenCount = otherCategories.length - visible.length;

  const title = inCurrentCategory
    ? "Already in this category"
    : "You already have this card";

  const existingTranslations = duplicates[0].translations.join(", ");

  return (
    <View
      style={{
        flexDirection: "row",
        gap: 10,
        padding: 12,
        marginTop: 4,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: accent,
        backgroundColor: colors.background,
      }}
    >
      <Feather name="alert-triangle" size={18} color={accent} />

      <View style={{ flex: 1, gap: 4 }}>
        <Text
          style={{
            color: colors.text,
            fontWeight: "600",
            fontSize: 14,
          }}
        >
          {title}
        </Text>

        {existingTranslations.length > 0 && (
          <Text style={shared.hint} numberOfLines={2}>
            {existingTranslations}
          </Text>
        )}

        {visible.length > 0 && (
          <Text style={shared.hint}>
            {inCurrentCategory ? "Also in: " : "In: "}
            {visible.join(", ")}
            {hiddenCount > 0 ? ` +${hiddenCount}` : ""}
          </Text>
        )}

        <Text style={[shared.hint, { fontStyle: "italic" }]}>
          You can still save it.
        </Text>
      </View>
    </View>
  );
}