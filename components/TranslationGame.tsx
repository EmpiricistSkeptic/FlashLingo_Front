import { useEffect, useState } from "react";

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
  colorKey:
    | "danger"
    | "warning"
    | "primary"
    | "success";
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

export default function TranslationGame({
  card,
  onReview,
  isReviewing = false,
}: Props) {
  const { colors } = useTheme();
  const { activePair } = useLanguagePair();
  const shared = useSharedStyles();

  const [sourceSentence, setSourceSentence] =
    useState("");

  const [instruction, setInstruction] =
    useState("");

  const [answer, setAnswer] =
    useState("");

  const [isGenerating, setIsGenerating] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [result, setResult] =
    useState<gameService.GameEvaluationResponse | null>(
      null
    );

  const [error, setError] =
    useState<string | null>(null);

  const [gaveUp, setGaveUp] =
    useState(false);

  const learningLanguage =
    activePair?.learning_language?.toUpperCase() ??
    "TARGET LANGUAGE";

  // ============================================================
  // GENERATE CHALLENGE
  // ============================================================

  const generateChallenge = async () => {
    setError(null);
    setResult(null);
    setAnswer("");
    setSourceSentence("");
    setInstruction("");
    setGaveUp(false);
    setIsGenerating(true);

    try {
      const response =
        await gameService.generateTranslation(
          card.id
        );

      setSourceSentence(
        response.source_sentence
      );

      setInstruction(
        response.instruction
      );
    } catch (e) {
      setError(
        e instanceof ApiClientError
          ? e.detail
          : e instanceof Error
            ? e.message
            : "Failed to generate the challenge."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generateChallenge();
  }, [card.id]);

  // ============================================================
  // SUBMIT ANSWER
  // ============================================================

  const submit = async () => {
    const trimmed =
      answer.trim();

    if (
      !trimmed ||
      isSubmitting ||
      result !== null ||
      !sourceSentence
    ) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response =
        await gameService.evaluateTranslation(
          card.id,
          sourceSentence,
          trimmed
        );

      setResult(response);
    } catch (e) {
      setError(
        e instanceof ApiClientError
          ? e.detail
          : e instanceof Error
            ? e.message
            : "Failed to evaluate your translation."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // REVEAL EXAMPLE
  // ============================================================

  const revealAnswer = async () => {
    if (
      isSubmitting ||
      result !== null ||
      !sourceSentence
    ) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // Logs a real failed GameAttempt and asks the AI
      // for an example translation.
      const response =
        await gameService.giveUpTranslation(
          card.id,
          sourceSentence
        );

      setGaveUp(true);
      setResult(response);
    } catch (e) {
      setError(
        e instanceof ApiClientError
          ? e.detail
          : e instanceof Error
            ? e.message
            : "Failed to get an example."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // GENERATION LOADING
  // ============================================================

  if (isGenerating) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
          paddingHorizontal: 24,
        }}
      >
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text
          style={{
            color: colors.text,
            fontSize: 18,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          Creating a translation challenge...
        </Text>

        <Text
          style={[
            shared.hint,
            {
              textAlign: "center",
            },
          ]}
        >
          The AI is creating a sentence
          around this word.
        </Text>
      </View>
    );
  }

  // ============================================================
  // GENERATION ERROR
  // ============================================================

  if (
    error &&
    !sourceSentence
  ) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
          gap: 16,
        }}
      >
        <Feather
          name="alert-circle"
          size={48}
          color={colors.danger}
        />

        <Text
          style={{
            color: colors.text,
            fontSize: 18,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          Could not create the challenge
        </Text>

        <Text
          style={{
            color: colors.textMuted,
            textAlign: "center",
            lineHeight: 22,
          }}
        >
          {error}
        </Text>

        <TouchableOpacity
          onPress={generateChallenge}
          style={{
            backgroundColor:
              colors.primary,
            borderRadius: 16,
            paddingVertical: 14,
            paddingHorizontal: 28,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontWeight: "800",
            }}
          >
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
      }}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : "height"
      }
      keyboardVerticalOffset={
        Platform.OS === "ios" ? 90 : 0
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
            gap: 18,
          }}
        >
          {/* ====================================================
              HEADER
          ==================================================== */}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
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
                name="globe"
                size={22}
                color={colors.primary}
              />
            </View>

            <View
              style={{
                flex: 1,
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: "800",
                }}
              >
                Translation Challenge
              </Text>

              <Text
                style={[
                  shared.hint,
                  {
                    marginTop: 2,
                  },
                ]}
              >
                Translate into{" "}
                {learningLanguage}
              </Text>
            </View>
          </View>

          {/* ====================================================
              SOURCE SENTENCE
          ==================================================== */}

          <View
            style={{
              backgroundColor:
                colors.surface,
              borderRadius: 22,
              padding: 22,
              borderWidth: 1,
              borderColor:
                colors.border,
            }}
          >
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 11,
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginBottom: 14,
              }}
            >
              Translate this
            </Text>

            <Text
              style={{
                color: colors.text,
                fontSize: 22,
                lineHeight: 32,
                fontWeight: "700",
              }}
            >
              {sourceSentence}
            </Text>
          </View>

          {/* ====================================================
              INSTRUCTION
          ==================================================== */}

          <View
            style={{
              flexDirection: "row",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <Feather
              name="info"
              size={18}
              color={colors.primary}
              style={{
                marginTop: 2,
              }}
            />

            <Text
              style={{
                color: colors.textMuted,
                flex: 1,
                lineHeight: 22,
              }}
            >
              {instruction}
            </Text>
          </View>

          {/* ====================================================
              INPUT
          ==================================================== */}

          {result === null && (
            <View
              style={{
                gap: 10,
              }}
            >
              <TextInput
                value={answer}
                onChangeText={setAnswer}
                placeholder={`Translate into ${learningLanguage}...`}
                placeholderTextColor={
                  colors.placeholder
                }
                editable={!isSubmitting}
                multiline
                textAlignVertical="top"
                autoCorrect
                style={{
                  minHeight: 130,
                  backgroundColor:
                    colors.surface,
                  borderWidth: 1,
                  borderColor:
                    colors.border,
                  borderRadius: 18,
                  padding: 18,
                  color: colors.text,
                  fontSize: 17,
                  lineHeight: 26,
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
                      fontWeight: "800",
                      fontSize: 16,
                    }}
                  >
                    Check Translation
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={revealAnswer}
                disabled={
                  isSubmitting
                }
                style={{
                  paddingVertical: 8,
                  alignItems: "center",
                  opacity:
                    isSubmitting
                      ? 0.5
                      : 1,
                }}
              >
                <Text
                  style={{
                    color:
                      colors.textMuted,
                    fontSize: 13,
                    fontWeight: "600",
                    textDecorationLine:
                      "underline",
                  }}
                >
                  Don't know? Show an example
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ====================================================
              REQUEST ERROR
          ==================================================== */}

          {error &&
            sourceSentence && (
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
                    color:
                      colors.danger,
                    textAlign:
                      "center",
                  }}
                >
                  {error}
                </Text>
              </View>
            )}

          {/* ====================================================
              RESULT
          ==================================================== */}

          {result && (
            <View
              style={{
                backgroundColor:
                  result.is_correct
                    ? colors.success + "12"
                    : colors.danger + "12",
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor:
                  result.is_correct
                    ? colors.success + "40"
                    : colors.danger + "40",
                gap: 14,
              }}
            >
              {/* RESULT HEADER */}

              <View
                style={{
                  alignItems:
                    "center",
                }}
              >
                <Feather
                  name={
                    result.is_correct
                      ? "check-circle"
                      : gaveUp
                        ? "eye"
                        : "x-circle"
                  }
                  size={44}
                  color={
                    result.is_correct
                      ? colors.success
                      : colors.danger
                  }
                />

                <Text
                  style={{
                    marginTop: 8,
                    fontSize: 23,
                    fontWeight: "900",
                    color:
                      result.is_correct
                        ? colors.success
                        : colors.danger,
                  }}
                >
                  {result.is_correct
                    ? "Correct!"
                    : gaveUp
                      ? "Here's an example"
                      : "Not quite"}
                </Text>
              </View>

              {/* SCORE */}

              {!gaveUp && (
                <View
                  style={{
                    alignItems:
                      "center",
                  }}
                >
                  <Text
                    style={[
                      shared.hint,
                      {
                        marginBottom: 4,
                      },
                    ]}
                  >
                    AI score
                  </Text>

                  <Text
                    style={{
                      color:
                        colors.primary,
                      fontSize: 32,
                      fontWeight: "900",
                    }}
                  >
                    {Math.round(
                      result.score * 100
                    )}
                    %
                  </Text>
                </View>
              )}

              {/* FEEDBACK */}

              <View
                style={{
                  backgroundColor:
                    colors.surface,
                  borderRadius: 14,
                  padding: 15,
                }}
              >
                <Text
                  style={{
                    color:
                      colors.textMuted,
                    fontSize: 12,
                    fontWeight: "700",
                    textTransform:
                      "uppercase",
                    marginBottom: 6,
                  }}
                >
                  AI feedback
                </Text>

                <Text
                  style={{
                    color:
                      colors.text,
                    fontSize: 16,
                    lineHeight: 24,
                  }}
                >
                  {result.feedback}
                </Text>
              </View>

              {/* =================================================
                  TEACHER EXPLANATION
              ================================================= */}

              <View
                style={{
                  backgroundColor:
                    colors.background,
                  borderRadius: 14,
                  padding: 15,
                }}
              >
                <Text
                  style={{
                    color:
                      colors.textMuted,
                    fontSize: 12,
                    fontWeight: "700",
                    textTransform:
                      "uppercase",
                    marginBottom: 6,
                  }}
                >
                  {gaveUp
                    ? "Why this works"
                    : "Why this score?"}
                </Text>

                <Text
                  style={{
                    color:
                      colors.text,
                    fontSize: 14,
                    lineHeight: 21,
                  }}
                >
                  {result.explanation}
                </Text>
              </View>

              {/* =================================================
                  CORRECTION / EXAMPLE
              ================================================= */}

              {result.correction && (
                <View
                  style={{
                    backgroundColor:
                      colors.background,
                    borderRadius: 14,
                    padding: 15,
                  }}
                >
                  <Text
                    style={{
                      color:
                        colors.textMuted,
                      fontSize: 12,
                      fontWeight: "700",
                      textTransform:
                        "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    {gaveUp
                      ? "Example translation"
                      : "Suggested correction"}
                  </Text>

                  <Text
                    style={{
                      color:
                        colors.text,
                      fontSize: 16,
                      lineHeight: 24,
                    }}
                  >
                    {result.correction}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ====================================================
              REVIEW
          ==================================================== */}

          {result && (
            <View
              style={{
                gap: 10,
              }}
            >
              <Text
                style={{
                  color:
                    colors.textMuted,
                  textAlign:
                    "center",
                  fontSize: 13,
                  fontWeight:
                    "600",
                }}
              >
                How well did you know this word?
              </Text>

              <View
                style={{
                  flexDirection:
                    "row",
                  gap: 10,
                }}
              >
                {REVIEW_BUTTONS.map(
                  ({
                    result:
                      reviewResult,
                    label,
                    colorKey,
                  }) => (
                    <TouchableOpacity
                      key={
                        reviewResult
                      }
                      disabled={
                        isReviewing
                      }
                      onPress={() =>
                        onReview(
                          reviewResult
                        )
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
                        borderRadius:
                          14,
                        paddingVertical:
                          14,
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
