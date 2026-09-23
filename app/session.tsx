import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import { Feather } from "@expo/vector-icons";

import { useTheme } from "../contexts/ThemeContext";
import { useSharedStyles } from "../hooks/useSharedStyles";

import * as flashcardService from "../services/flashcards";

import { ApiClientError } from "../services/api";

import StudyCard from "../components/StudyCard";

import TypingGame from "../components/TypingGame";
import SentenceGame from "../components/SentenceGame";
import TranslationGame from "../components/TranslationGame";

import type {
  Flashcard,
  ReviewResult,
} from "../types/flashcard";

import type { GameType } from "../services/games";

type SessionMode =
  | "due"
  | "new"
  | "difficult";

const VALID_GAME_TYPES: GameType[] = [
  "classic",
  "typing",
  "sentence",
  "translation",
];

function getGameType(
  value: string | undefined
): GameType {
  if (
    value &&
    VALID_GAME_TYPES.includes(
      value as GameType
    )
  ) {
    return value as GameType;
  }

  return "classic";
}

function getGameLabel(
  gameType: GameType
): string | null {
  switch (gameType) {
    case "typing":
      return "Typing Challenge";

    case "sentence":
      return "Sentence Challenge";

    case "translation":
      return "Translation Challenge";

    case "classic":
    default:
      return null;
  }
}

export default function SessionScreen() {
  const {
    categoryId,
    languagePairId,
    mode,
    categoryName,
    gameType: rawGameType,
  } =
    useLocalSearchParams<{
      categoryId?: string;
      languagePairId?: string;
      mode: SessionMode;
      categoryName?: string;
      gameType?: GameType;
    }>();

  const { colors } = useTheme();
  const shared = useSharedStyles();
  const router = useRouter();

  const catId = categoryId
    ? Number(categoryId)
    : null;

  const pairId = languagePairId
    ? Number(languagePairId)
    : null;

  const gameType = getGameType(
    rawGameType
  );

  const [queue, setQueue] =
    useState<Flashcard[] | null>(null);

  const [index, setIndex] =
    useState(0);

  const [error, setError] =
    useState<string | null>(null);

  const [reviewedCount, setReviewedCount] =
    useState(0);

  const [isReviewing, setIsReviewing] =
    useState(false);

  const isDifficultMode =
    mode === "difficult";

  const gameLabel =
    getGameLabel(gameType);

  const load = useCallback(
    async () => {
      setError(null);
      setQueue(null);
      setIndex(0);
      setReviewedCount(0);
      setIsReviewing(false);

      try {
        let studyQueue: Flashcard[];

        if (isDifficultMode) {
          if (
            !pairId ||
            Number.isNaN(pairId)
          ) {
            throw new Error(
              "Language pair is required for a difficult study session."
            );
          }

          studyQueue =
            await flashcardService
              .getDifficultStudyQueue(
                pairId,
                20
              );
        } else {
          if (
            !catId ||
            Number.isNaN(catId)
          ) {
            throw new Error(
              "Category is required for this study session."
            );
          }

          studyQueue =
            await flashcardService
              .getStudyQueue(
                catId,
                mode
              );
        }

        setQueue(studyQueue);
      } catch (e) {
        setError(
          e instanceof ApiClientError
            ? e.detail
            : e instanceof Error
              ? e.message
              : "Failed to load the session."
        );
      }
    },
    [
      catId,
      pairId,
      mode,
      isDifficultMode,
    ]
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleReview = async (
    result: ReviewResult
  ) => {
    const current =
      queue?.[index];

    if (
      !current ||
      isReviewing
    ) {
      return;
    }

    setIsReviewing(true);
    setError(null);

    try {
      await flashcardService
        .reviewFlashcard(
          current.id,
          result
        );

      setReviewedCount(
        (count) => count + 1
      );

      setIndex(
        (currentIndex) =>
          currentIndex + 1
      );
    } catch (e) {
      setError(
        e instanceof ApiClientError
          ? e.detail
          : "Failed to submit review."
      );
    } finally {
      setIsReviewing(false);
    }
  };

  const sessionTitle =
    isDifficultMode
      ? "Tricky words"
      : categoryName;

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <SafeAreaView
        style={shared.center}
      >
        <Feather
          name="alert-triangle"
          size={48}
          color={colors.danger}
          style={{
            marginBottom: 16,
          }}
        />

        <Text
          style={[
            shared.error,
            {
              marginBottom: 24,
              textAlign: "center",
            },
          ]}
        >
          {error}
        </Text>

        <TouchableOpacity
          style={[
            shared.button,
            {
              width: "100%",
              marginBottom: 12,
            },
          ]}
          onPress={load}
        >
          <Text
            style={shared.buttonText}
          >
            Retry
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.back()
          }
          style={{
            padding: 12,
          }}
        >
          <Text
            style={{
              color:
                colors.primary,
              fontWeight: "600",
            }}
          >
            Go back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (queue === null) {
    return (
      <SafeAreaView
        style={shared.center}
      >
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />
      </SafeAreaView>
    );
  }

  // ============================================================
  // COMPLETE
  // ============================================================

  if (
    queue.length === 0 ||
    index >= queue.length
  ) {
    return (
      <SafeAreaView
        style={shared.center}
      >
        <Feather
          name="check-circle"
          size={64}
          color={colors.success}
          style={{
            marginBottom: 24,
          }}
        />

        <Text
          style={shared.title}
        >
          Session complete 🎉
        </Text>

        <Text
          style={[
            shared.hint,
            {
              fontSize: 16,
              marginTop: 8,
              marginBottom: 32,
            },
          ]}
        >
          {reviewedCount} card
          {reviewedCount === 1
            ? ""
            : "s"} reviewed
        </Text>

        <TouchableOpacity
          style={[
            shared.button,
            {
              width: "100%",
              paddingVertical: 16,
              borderRadius: 16,
            },
          ]}
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={shared.buttonText}
          >
            Done
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentCard =
    queue[index];

  // ============================================================
  // CURRENT CARD
  // ============================================================

  return (
    <SafeAreaView
      style={[
        shared.container,
        {
          paddingBottom: 16,
        },
      ]}
    >
      {/* HEADER */}

      <View
        style={{
          flexDirection: "row",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginTop: 8,
          marginBottom: 16,
        }}
      >
        <TouchableOpacity
          onPress={() =>
            router.back()
          }
          hitSlop={{
            top: 12,
            bottom: 12,
            left: 12,
            right: 12,
          }}
        >
          <Feather
            name="x"
            size={28}
            color={colors.text}
          />
        </TouchableOpacity>

        <View
          style={{
            alignItems: "center",
            flex: 1,
            marginHorizontal: 12,
          }}
        >
          {gameLabel && (
            <Text
              style={{
                fontSize: 12,
                fontWeight: "800",
                color:
                  colors.primary,
                textTransform:
                  "uppercase",
                letterSpacing: 0.5,
                marginBottom: 2,
              }}
              numberOfLines={1}
            >
              {gameLabel}
            </Text>
          )}

          {sessionTitle && (
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color:
                  colors.textMuted,
                textTransform:
                  "uppercase",
                letterSpacing: 0.5,
                marginBottom: 2,
              }}
              numberOfLines={1}
            >
              {sessionTitle}
            </Text>
          )}

          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color:
                colors.text,
            }}
          >
            {index + 1}{" "}
            <Text
              style={{
                color:
                  colors.textMuted,
              }}
            >
              / {queue.length}
            </Text>
          </Text>
        </View>

        <View
          style={{ width: 28 }}
        />
      </View>

      {/* CONTENT */}

      {gameType === "classic" && (
        <StudyCard
          key={currentCard.id}
          card={currentCard}
          onReview={handleReview}
        />
      )}

      {gameType === "typing" && (
        <TypingGame
          key={currentCard.id}
          card={currentCard}
          onReview={handleReview}
          isReviewing={isReviewing}
        />
      )}

      {gameType === "sentence" && (
        <SentenceGame
          key={currentCard.id}
          card={currentCard}
          onReview={handleReview}
          isReviewing={isReviewing}
        />
      )}

      {gameType === "translation" && (
        <TranslationGame
          key={currentCard.id}
          card={currentCard}
          onReview={handleReview}
          isReviewing={isReviewing}
        />
      )}
    </SafeAreaView>
  );
}
