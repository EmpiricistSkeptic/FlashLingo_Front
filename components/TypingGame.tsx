import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "../contexts/ThemeContext";
import { useLanguagePair } from "../contexts/LanguagePairContext";
import { useSharedStyles } from "../hooks/useSharedStyles";
import { ApiClientError } from "../services/api";

import * as gameService from "../services/games";

import type {
  Flashcard,
  ReviewResult,
} from "../types/flashcard";

interface Props {
  card: Flashcard;
  onReview: (result: ReviewResult) => void;
  isReviewing?: boolean;
}

const REVIEW_BUTTONS: {
  result: ReviewResult;
  label: string;
  colorKey: "danger" | "warning" | "primary" | "success";
}[] = [
  {
    result: "again",
    label: "Again",
    colorKey: "danger",
  },
  {
    result: "hard",
    label: "Hard",
    colorKey: "warning",
  },
  {
    result: "good",
    label: "Good",
    colorKey: "primary",
  },
  {
    result: "easy",
    label: "Easy",
    colorKey: "success",
  },
];

export default function TypingGame({
  card,
  onReview,
  isReviewing = false,
}: Props) {
  const { colors } = useTheme();
  const { activePair } = useLanguagePair();
  const shared = useSharedStyles();

  const sourceTranslation = card.translations[0] ?? "";

  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [result, setResult] = useState<
    boolean | null
  >(null);
  const [error, setError] = useState<string | null>(
    null
  );

  const learningLanguage =
    activePair?.learning_language?.toUpperCase() ??
    "TARGET LANGUAGE";

  const submit = async () => {
    const trimmed = answer.trim();

    if (!trimmed || isSubmitting || result !== null) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response =
        await gameService.evaluateTyping(
          card.id,
          trimmed
        );

      setResult(response.is_correct);
    } catch (e) {
      setError(
        e instanceof ApiClientError
          ? e.detail
          : "Failed to check your answer."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resultColor =
    result === true
      ? colors.success
      : colors.danger;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 8,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flex: 1,
            gap: 20,
          }}
        >
          {/* GAME HEADER */}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginTop: 4,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor:
                  colors.primary + "1A",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather
                name="edit-3"
                size={22}
                color={colors.primary}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: "800",
                }}
              >
                Typing Challenge
              </Text>

              <Text
                style={[
                  shared.hint,
                  {
                    marginTop: 2,
                  },
                ]}
              >
                Type the translation in{" "}
                {learningLanguage}
              </Text>
            </View>
          </View>

          {/* SOURCE */}

          <View
            style={{
              flex: 1,
              minHeight: 220,
              backgroundColor: colors.surface,
              borderRadius: 24,
              padding: 24,
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 12,
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginBottom: 16,
              }}
            >
              Translate
            </Text>

            {sourceTranslation ? (
              <Text
                style={{
                  color: colors.text,
                  fontSize: 34,
                  fontWeight: "800",
                  textAlign: "center",
                }}
              >
                {sourceTranslation}
              </Text>
            ) : (
              <Text
                style={{
                  color: colors.danger,
                  textAlign: "center",
                }}
              >
                This card has no translation.
              </Text>
            )}
          </View>

          {/* INPUT */}

          {result === null && (
            <View style={{ gap: 12 }}>
              <TextInput
                value={answer}
                onChangeText={setAnswer}
                placeholder={`Type in ${learningLanguage}...`}
                placeholderTextColor={
                  colors.placeholder
                }
                editable={!isSubmitting}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={submit}
                style={{
                  backgroundColor:
                    colors.surface,
                  borderWidth: 1,
                  borderColor:
                    colors.border,
                  borderRadius: 16,
                  paddingHorizontal: 18,
                  paddingVertical: 16,
                  color: colors.text,
                  fontSize: 18,
                }}
              />

              <TouchableOpacity
                onPress={submit}
                disabled={
                  !answer.trim() ||
                  isSubmitting
                }
                style={{
                  backgroundColor:
                    !answer.trim() ||
                    isSubmitting
                      ? colors.border
                      : colors.primary,
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator
                    color="#fff"
                  />
                ) : (
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 16,
                      fontWeight: "800",
                    }}
                  >
                    Check Answer
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ERROR */}

          {error && (
            <View
              style={{
                backgroundColor:
                  colors.danger + "12",
                borderRadius: 14,
                padding: 14,
              }}
            >
              <Text
                style={{
                  color: colors.danger,
                  textAlign: "center",
                }}
              >
                {error}
              </Text>
            </View>
          )}

          {/* RESULT */}

          {result !== null && (
            <View
              style={{
                backgroundColor:
                  result
                    ? colors.success + "12"
                    : colors.danger + "12",
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor:
                  result
                    ? colors.success + "40"
                    : colors.danger + "40",
                gap: 12,
              }}
            >
              <View
                style={{
                  alignItems: "center",
                }}
              >
                <Feather
                  name={
                    result
                      ? "check-circle"
                      : "x-circle"
                  }
                  size={44}
                  color={resultColor}
                />

                <Text
                  style={{
                    color: resultColor,
                    fontSize: 24,
                    fontWeight: "800",
                    marginTop: 10,
                  }}
                >
                  {result
                    ? "Correct!"
                    : "Not quite"}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor:
                    colors.surface,
                  padding: 16,
                  borderRadius: 14,
                }}
              >
                <Text
                  style={{
                    color: colors.textMuted,
                    fontSize: 12,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Correct answer
                </Text>

                <Text
                  style={{
                    color: colors.text,
                    fontSize: 20,
                    fontWeight: "700",
                  }}
                >
                  {card.text}
                </Text>
              </View>
            </View>
          )}

          {/* REVIEW */}

          {result !== null && (
            <View style={{ gap: 10 }}>
              <Text
                style={{
                  color: colors.textMuted,
                  textAlign: "center",
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                How well did you know it?
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                }}
              >
                {REVIEW_BUTTONS.map(
                  ({
                    result: reviewResult,
                    label,
                    colorKey,
                  }) => (
                    <TouchableOpacity
                      key={reviewResult}
                      disabled={isReviewing}
                      onPress={() =>
                        onReview(reviewResult)
                      }
                      style={{
                        flex: 1,
                        backgroundColor:
                          colors[
                            colorKey
                          ],
                        opacity:
                          isReviewing
                            ? 0.5
                            : 1,
                        borderRadius: 14,
                        paddingVertical: 14,
                        alignItems:
                          "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight:
                            "800",
                          fontSize: 14,
                        }}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}