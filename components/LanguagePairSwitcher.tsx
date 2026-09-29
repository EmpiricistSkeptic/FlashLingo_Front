import { useState } from "react";
import { View, Text, TouchableOpacity, Modal, FlatList, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";

import { useLanguagePair } from "../contexts/LanguagePairContext";
import { ApiClientError } from "../services/api";
import { useTheme } from "../contexts/ThemeContext";
import { useSharedStyles } from "../hooks/useSharedStyles";
import { languageLabel, languageFlag } from "../constants/languages";
import type { LanguageCode } from "../constants/languages";
import LanguagePicker from "./LanguagePicker";

export default function LanguagePairSwitcher() {
  const { pairs, activePair, selectPair, createPair, deletePair } = useLanguagePair();
  const { colors } = useTheme();
  const shared = useSharedStyles();

  const [modalVisible, setModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [nativeCode, setNativeCode] = useState<LanguageCode | undefined>();
  const [learningCode, setLearningCode] = useState<LanguageCode | undefined>();
  const [pickerFor, setPickerFor] = useState<"native" | "learning" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setIsCreating(false);
    setNativeCode(undefined);
    setLearningCode(undefined);
    setError(null);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const handleCreate = async () => {
    if (!nativeCode || !learningCode) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await createPair({ native_language: nativeCode, learning_language: learningCode });
      resetForm();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.detail : "Failed to create pair.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (pairId: number, label: string) => {
    Alert.alert("Delete pair", `Delete ${label}? This also removes its categories.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deletePair(pairId) },
    ]);
  };

  const sameLanguage = !!nativeCode && !!learningCode && nativeCode === learningCode;
  const canCreate = !!nativeCode && !!learningCode && !sameLanguage && !isSubmitting;

  return (
    <>
      {/* Главная кнопка выбора пары */}
      <TouchableOpacity
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 16,
          padding: 16,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        onPress={() => setModalVisible(true)}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: colors.primary + "1A",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
            }}
          >
            {activePair ? (
              <>
                <Text style={{ fontSize: 15 }}>
                  {languageFlag(activePair.native_language)}
                </Text>
                <Text style={{ fontSize: 15 }}>
                  {languageFlag(activePair.learning_language)}
                </Text>
              </>
            ) : (
              <Feather name="globe" size={20} color={colors.primary} />
            )}
          </View>

          <View>
            <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 }}>
              ACTIVE PAIR
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
              {activePair
                ? `${languageLabel(activePair.native_language)} → ${languageLabel(activePair.learning_language)}`
                : "Select a pair"}
            </Text>
          </View>
        </View>

        <Feather name="chevron-down" size={24} color={colors.primary} />
      </TouchableOpacity>

      {/* Модалка со списком пар */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: colors.overlay }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: "85%",
              padding: 24,
              gap: 16,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={[shared.subtitle, { color: colors.text, fontSize: 20 }]}>Language pairs</Text>
              <TouchableOpacity onPress={closeModal}>
                <Feather name="x" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={pairs}
              keyExtractor={(item) => String(item.id)}
              ListEmptyComponent={<Text style={shared.empty}>No pairs yet — add one below.</Text>}
              renderItem={({ item }) => {
                const isActive = activePair?.id === item.id;
                return (
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      padding: 12,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: isActive ? colors.primary : colors.border,
                      backgroundColor: isActive
                        ? colors.primary + "12"
                        : colors.background,
                      marginBottom: 8,
                    }}
                    onPress={() => { selectPair(item.id); closeModal(); }}
                    onLongPress={() =>
                      handleDelete(item.id, `${languageLabel(item.native_language)} → ${languageLabel(item.learning_language)}`)
                    }
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 11,
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                        backgroundColor: isActive
                          ? colors.primary + "22"
                          : colors.surface,
                      }}
                    >
                      <Text style={{ fontSize: 15 }}>
                        {languageFlag(item.native_language)}
                      </Text>
                      <Text style={{ fontSize: 15 }}>
                        {languageFlag(item.learning_language)}
                      </Text>
                    </View>

                    <Text
                      style={{
                        flex: 1,
                        fontSize: 15,
                        fontWeight: isActive ? "700" : "500",
                        color: isActive ? colors.primary : colors.text,
                      }}
                    >
                      {languageLabel(item.native_language)} → {languageLabel(item.learning_language)}
                    </Text>

                    {isActive && (
                      <Feather name="check-circle" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />

            {!isCreating ? (
              <TouchableOpacity style={shared.button} onPress={() => setIsCreating(true)}>
                <Text style={shared.buttonText}>+ Add pair</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ gap: 12, backgroundColor: colors.background, padding: 16, borderRadius: 16 }}>
                <TouchableOpacity style={shared.input} onPress={() => setPickerFor("native")}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    {nativeCode && (
                      <Text style={{ fontSize: 17 }}>
                        {languageFlag(nativeCode)}
                      </Text>
                    )}
                    <Text style={{ color: nativeCode ? colors.text : colors.placeholder }}>
                      {nativeCode ? languageLabel(nativeCode) : "Native language"}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={shared.input} onPress={() => setPickerFor("learning")}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    {learningCode && (
                      <Text style={{ fontSize: 17 }}>
                        {languageFlag(learningCode)}
                      </Text>
                    )}
                    <Text style={{ color: learningCode ? colors.text : colors.placeholder }}>
                      {learningCode ? languageLabel(learningCode) : "Learning language"}
                    </Text>
                  </View>
                </TouchableOpacity>

                {sameLanguage && <Text style={shared.error}>Native and learning language must differ.</Text>}
                {error && <Text style={shared.error}>{error}</Text>}

                <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                  <TouchableOpacity style={[shared.button, shared.secondaryButton, { flex: 1 }]} onPress={resetForm}>
                    <Text style={shared.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[shared.button, { flex: 1 }, !canCreate && shared.buttonDisabled]} onPress={handleCreate} disabled={!canCreate}>
                    <Text style={shared.buttonText}>{isSubmitting ? "Creating…" : "Create"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <LanguagePicker visible={pickerFor === "native"} title="Native language" selected={nativeCode} excludeCode={learningCode} onSelect={(code) => { setNativeCode(code); setPickerFor(null); }} onClose={() => setPickerFor(null)} />
      <LanguagePicker visible={pickerFor === "learning"} title="Learning language" selected={learningCode} excludeCode={nativeCode} onSelect={(code) => { setLearningCode(code); setPickerFor(null); }} onClose={() => setPickerFor(null)} />
    </>
  );
}