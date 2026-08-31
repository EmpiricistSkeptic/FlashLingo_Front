import { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Speech from "expo-speech";

import { useTheme } from "../contexts/ThemeContext";
import { useSharedStyles } from "../hooks/useSharedStyles";
import { useDebouncedValue } from "../utils/useDebouncedValue";
import { useLanguagePair } from "../contexts/LanguagePairContext";

import { speechLocale } from "../constants/languages";

import { previewTranslation } from "../services/translation";
import * as categoryService from "../services/categories";
import * as flashcardService from "../services/flashcards";
import { ApiClientError } from "../services/api";

import type { Flashcard } from "../types/flashcard";

const AUTO_TRANSLATE_DELAY_MS = 800;

interface Props {
  visible: boolean;
  languagePairId: number;
  categoryId: number;
  editingCard?: Flashcard | null;
  onClose: () => void;
  onSaved: (card: Flashcard) => void;
}

export default function FlashcardFormModal({
  visible,
  languagePairId,
  categoryId,
  editingCard,
  onClose,
  onSaved,
}: Props) {
  const { colors } = useTheme();
  const shared = useSharedStyles();

  const { pairs } = useLanguagePair();

  const [text, setText] = useState("");
  const [translationsInput, setTranslationsInput] = useState("");
  const [examplesInput, setExamplesInput] = useState("");
  const [correction, setCorrection] = useState<string | null>(null);

  const [translationsTouched, setTranslationsTouched] = useState(false);
  const [examplesTouched, setExamplesTouched] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const debouncedText = useDebouncedValue(
    text,
    AUTO_TRANSLATE_DELAY_MS
  );

  /*
   * Находим именно ту языковую пару, к которой относится карточка.
   *
   * В карточке:
   * - text -> learning_language
   * - examples -> learning_language
   * - translations -> native_language
   */
  const languagePair = pairs.find(
    (pair) => pair.id === languagePairId
  );

  /*
   * Получаем locale для Expo Speech из constants/languages.ts.
   *
   * Например:
   * en -> en-US
   * es -> es-ES
   * fr -> fr-FR
   */
  const learningSpeechLocale = languagePair
    ? speechLocale(languagePair.learning_language)
    : undefined;

  useEffect(() => {
    if (!visible) return;

    setText(editingCard?.text ?? "");
    setTranslationsInput(
      editingCard?.translations.join(", ") ?? ""
    );
    setExamplesInput(
      editingCard?.examples.join("\n") ?? ""
    );
    setCorrection(null);
    setTranslationsTouched(!!editingCard);
    setExamplesTouched(!!editingCard);
    setError(null);
  }, [visible, editingCard]);

  useEffect(() => {
    if (!visible || editingCard) return;

    const word = debouncedText.trim();

    if (
      !word ||
      (translationsTouched && examplesTouched)
    ) {
      return;
    }

    let cancelled = false;

    setIsTranslating(true);

    previewTranslation({
      text: word,
      language_pair_id: languagePairId,
    })
      .then((result: any) => {
        if (cancelled) return;

        if (!translationsTouched) {
          setTranslationsInput(
            result.translations?.join(", ") || ""
          );
        }

        if (!examplesTouched) {
          setExamplesInput(
            result.examples?.join("\n") || ""
          );
        }

        if (
          result.corrected_text &&
          result.corrected_text.toLowerCase() !==
            word.toLowerCase()
        ) {
          setCorrection(result.corrected_text);
        } else {
          setCorrection(null);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setIsTranslating(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    debouncedText,
    visible,
    editingCard,
    translationsTouched,
    examplesTouched,
    languagePairId,
  ]);

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);

    try {
      const translations = translationsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const examples = examplesInput
        .split("\n")
        .map((e) => e.trim())
        .filter(Boolean);

      const saved = editingCard
        ? await flashcardService.updateFlashcard(
            editingCard.id,
            {
              text: text.trim(),
              translations,
              examples,
            }
          )
        : await categoryService.createFlashcardInCategory(
            categoryId,
            {
              text: text.trim(),
              translations,
              examples,
            }
          );

      onSaved(saved);
      onClose();
    } catch (e) {
      setError(
        e instanceof ApiClientError
          ? e.detail
          : "Failed to save flashcard."
      );
    } finally {
      setIsSaving(false);
    }
  };

  /*
   * Озвучка слова/фразы.
   *
   * Теперь язык берётся из активной LanguagePair:
   * learning_language -> speechLocale()
   */
  const handleSpeak = (textToSpeak: string) => {
    const value = textToSpeak.trim();

    if (!value) return;

    Speech.stop();

    Speech.speak(value, {
      language: learningSpeechLocale,
      rate: 0.9,
      pitch: 1.0,
    });
  };

  const applyCorrection = () => {
    if (!correction) return;

    setText(correction);
    setCorrection(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: colors.overlay,
        }}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "90%",
          }}
          contentContainerStyle={{
            padding: 24,
            gap: 16,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            style={[
              shared.subtitle,
              {
                color: colors.text,
                fontSize: 20,
              },
            ]}
          >
            {editingCard
              ? "Edit flashcard"
              : "New flashcard"}
          </Text>

          {/* WORD + SPEECH */}
          <View style={{ gap: 4 }}>
            <View
              style={[
                shared.input,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 0,
                  paddingRight: 12,
                  backgroundColor: colors.background,
                },
              ]}
            >
              <TextInput
                style={{
                  flex: 1,
                  padding: 16,
                  color: colors.text,
                  fontSize: 16,
                }}
                placeholder="Word or phrase"
                placeholderTextColor={colors.placeholder}
                value={text}
                onChangeText={(val) => {
                  setText(val);
                  setCorrection(null);
                }}
                autoFocus
              />

              <TouchableOpacity
                onPress={() => handleSpeak(text)}
                style={{ padding: 8 }}
              >
                <Feather
                  name="volume-2"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            {/* AI CORRECTION */}
            {correction && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingLeft: 4,
                  marginTop: 4,
                }}
              >
                <Text style={shared.hint}>
                  💡 Did you mean:{" "}
                </Text>

                <TouchableOpacity
                  onPress={applyCorrection}
                >
                  <Text
                    style={{
                      color: colors.primary,
                      fontWeight: "600",
                      textDecorationLine: "underline",
                    }}
                  >
                    {correction}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* TRANSLATIONS */}
          <View style={{ gap: 8 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={shared.hint}>
                Translations (comma-separated)
              </Text>

              {isTranslating && (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                />
              )}
            </View>

            <TextInput
              style={[
                shared.input,
                {
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Auto-filled as you type…"
              placeholderTextColor={colors.placeholder}
              value={translationsInput}
              onChangeText={(v) => {
                setTranslationsInput(v);
                setTranslationsTouched(true);
              }}
            />
          </View>

          {/* EXAMPLES */}
          <View style={{ gap: 8 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={shared.hint}>
                Examples (one per line)
              </Text>

              <TouchableOpacity
                onPress={() =>
                  handleSpeak(examplesInput)
                }
              >
                <Feather
                  name="volume-2"
                  size={16}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                shared.input,
                {
                  minHeight: 100,
                  textAlignVertical: "top",
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Auto-filled as you type…"
              placeholderTextColor={colors.placeholder}
              value={examplesInput}
              onChangeText={(v) => {
                setExamplesInput(v);
                setExamplesTouched(true);
              }}
              multiline
            />
          </View>

          {error && (
            <Text style={shared.error}>
              {error}
            </Text>
          )}

          {/* BUTTONS */}
          <View
            style={{
              flexDirection: "row",
              gap: 12,
              marginTop: 8,
            }}
          >
            <TouchableOpacity
              style={[
                shared.button,
                shared.secondaryButton,
                { flex: 1 },
              ]}
              onPress={onClose}
            >
              <Text style={shared.buttonText}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                shared.button,
                { flex: 1 },
                (!text.trim() || isSaving) &&
                  shared.buttonDisabled,
              ]}
              onPress={handleSave}
              disabled={!text.trim() || isSaving}
            >
              <Text style={shared.buttonText}>
                {isSaving ? "Saving…" : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

