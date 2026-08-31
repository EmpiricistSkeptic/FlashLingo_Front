import { useMemo } from "react";

import { useTheme } from "../contexts/ThemeContext";
import { spacing } from "../constants/spacing";
import { radius } from "../constants/radius";
import { typography } from "../constants/typography";

export function useSharedStyles() {
  const { colors } = useTheme();

  return useMemo(
    () => ({
      container: {
        flex: 1,
        padding: spacing.xl,
        gap: spacing.lg,
        backgroundColor: colors.background,
      },
      center: {
        flex: 1,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        padding: spacing.xl,
        gap: spacing.lg,
        backgroundColor: colors.background,
      },
      card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.lg,
      },
      input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        padding: spacing.md,
        fontSize: typography.body.fontSize,
        color: colors.text,
        backgroundColor: colors.background,
      },
      button: {
        backgroundColor: colors.primary,
        borderRadius: radius.md,
        padding: spacing.md + 2,
        alignItems: "center" as const,
      },
      secondaryButton: { backgroundColor: colors.textMuted },
      buttonDisabled: { opacity: 0.5 },
      buttonText: { color: "#fff", ...typography.button },
      error: { color: colors.danger, textAlign: "center" as const },
      title: { ...typography.title, textAlign: "center" as const, color: colors.text },
      subtitle: { ...typography.subtitle, color: colors.textMuted },
      empty: {
        textAlign: "center" as const,
        color: colors.textMuted,
        marginTop: spacing.xl,
      },
      row: {
        padding: spacing.lg,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        marginBottom: spacing.sm,
        flexDirection: "row" as const,
        justifyContent: "space-between" as const,
        alignItems: "center" as const,
      },
      rowActive: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.primary,
      },
      rowText: { fontSize: typography.body.fontSize, color: colors.text },
      hint: { fontSize: typography.caption.fontSize, color: colors.textMuted },
    }),
    [colors]
  );
}