import { StyleSheet } from "react-native";

export const colors = {
  primary: "#2563eb",
  secondary: "#4b5563",
  danger: "#dc2626",
  background: "#ffffff",
  cardBackground: "#eef2ff",
  border: "#ccc",
  textMuted: "#666",
  rowBackground: "#f3f4f6",
};

export const shared = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 16 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  secondaryButton: { backgroundColor: colors.secondary },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  error: { color: colors.danger, textAlign: "center" },
  title: { fontSize: 28, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 16, fontWeight: "600", color: colors.textMuted },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 24 },
  row: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: colors.rowBackground,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowActive: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  rowText: { fontSize: 16 },
  hint: { fontSize: 12, color: colors.textMuted },
});