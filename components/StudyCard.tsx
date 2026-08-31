import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Speech from "expo-speech";

import { useTheme } from "../contexts/ThemeContext";
import { useLanguagePair } from "../contexts/LanguagePairContext";
import { speechLocale } from "../constants/languages";
import type { Flashcard, ReviewResult } from "../types/flashcard";

const GUESS_DURATION_MS = 5000;

interface Props {
  card: Flashcard;
  onReview: (result: ReviewResult) => void;
}

export default function StudyCard({ card, onReview }: Props) {
  const { colors } = useTheme();
  const { activePair } = useLanguagePair();

  const [revealed, setRevealed] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  // Language used for text-to-speech.
  // The flashcard text is always in the learning language.
  const learningSpeechLocale = activePair
    ? speechLocale(activePair.learning_language)
    : "en-US";

  const REVIEW_BUTTONS: {
    result: ReviewResult;
    label: string;
    color: string;
  }[] = [
    { result: "again", label: "Again", color: colors.danger },
    { result: "hard", label: "Hard", color: colors.warning },
    { result: "good", label: "Good", color: colors.primary },
    { result: "easy", label: "Easy", color: colors.success },
  ];

  useEffect(() => {
    setRevealed(false);
    progress.setValue(0);

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: GUESS_DURATION_MS,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        setRevealed(true);
      }
    });

    return () => {
      animation.stop();
      Speech.stop();
    };
  }, [card.id, progress]);

  const reveal = () => {
    progress.stopAnimation();
    setRevealed(true);
  };

  const speak = (text: string) => {
    if (!text) return;

    Speech.stop();

    Speech.speak(text, {
      language: learningSpeechLocale,
    });
  };

  return (
    <View style={{ flex: 1, gap: 20 }}>
      {/* Progress timer */}
      <View
        style={{
          height: 6,
          backgroundColor: colors.border,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            height: "100%",
            backgroundColor: colors.primary,
            width: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
          }}
        />
      </View>

      {/* Card */}
      <TouchableOpacity
        activeOpacity={revealed ? 1 : 0.8}
        onPress={!revealed ? reveal : undefined}
        style={{
          flex: 1,
          backgroundColor: colors.surface,
          borderRadius: 24,
          padding: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity:
            colors.background === "#ffffff" ? 0.05 : 0.3,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        {!revealed ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Text
              style={{
                fontSize: 40,
                fontWeight: "800",
                color: colors.text,
                textAlign: "center",
              }}
            >
              {card.text}
            </Text>

            <Text
              style={{
                color: colors.textMuted,
                fontSize: 16,
              }}
            >
              Tap to reveal
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            {/* 1. WORD */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 36,
                  fontWeight: "800",
                  color: colors.text,
                  flex: 1,
                }}
              >
                {card.text}
              </Text>

              <TouchableOpacity
                onPress={() => speak(card.text)}
                style={{
                  backgroundColor: colors.primary + "1A",
                  padding: 12,
                  borderRadius: 16,
                  marginLeft: 16,
                }}
              >
                <Feather
                  name="volume-2"
                  size={28}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            {/* 2. TRANSLATIONS */}
            {card.translations.length > 0 && (
              <View>
                <View
                  style={{
                    height: 1,
                    backgroundColor: colors.border,
                    marginBottom: 16,
                  }}
                />

                <Text
                  style={{
                    color: colors.textMuted,
                    fontSize: 12,
                    fontWeight: "700",
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  Translations
                </Text>

                <Text
                  style={{
                    fontSize: 22,
                    color: colors.text,
                    fontWeight: "500",
                    marginBottom: 24,
                  }}
                >
                  {card.translations.join(", ")}
                </Text>
              </View>
            )}

            {/* 3. EXAMPLES */}
            {card.examples.length > 0 && (
              <View>
                <View
                  style={{
                    height: 1,
                    backgroundColor: colors.border,
                    marginBottom: 16,
                  }}
                />

                <Text
                  style={{
                    color: colors.textMuted,
                    fontSize: 12,
                    fontWeight: "700",
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  Examples
                </Text>

                <View style={{ gap: 12 }}>
                  {card.examples.map((example, i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        backgroundColor: colors.background,
                        padding: 16,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          color: colors.text,
                          flex: 1,
                          lineHeight: 24,
                        }}
                      >
                        {example}
                      </Text>

                      <TouchableOpacity
                        onPress={() => speak(example)}
                        style={{
                          paddingLeft: 12,
                          paddingTop: 2,
                        }}
                      >
                        <Feather
                          name="volume-2"
                          size={20}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </TouchableOpacity>

      {/* Review buttons */}
      {revealed && (
        <View
          style={{
            flexDirection: "row",
            gap: 12,
          }}
        >
          {REVIEW_BUTTONS.map(({ result, label, color }) => (
            <TouchableOpacity
              key={result}
              style={{
                flex: 1,
                backgroundColor: color,
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
              }}
              onPress={() => onReview(result)}
            >
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "700",
                  fontSize: 16,
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}