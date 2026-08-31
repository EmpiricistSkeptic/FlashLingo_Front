import { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import * as flashcardService from "../services/flashcards";
import { ApiClientError } from "../services/api";
import { shared } from "../constants/styles";
import StudyCard from "../components/StudyCard";
import type { Flashcard, ReviewResult } from "../types/flashcard";

export default function SessionScreen() {
  const { categoryId, mode, categoryName } = useLocalSearchParams<{
    categoryId: string;
    mode: "due" | "new";
    categoryName?: string;
  }>();
  const catId = Number(categoryId);
  const router = useRouter();

  const [queue, setQueue] = useState<Flashcard[] | null>(null);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [reviewedCount, setReviewedCount] = useState(0);

  // /flashcards/study/ now returns full Flashcard objects (text +
  // translations + examples) directly for this exact category+mode — no
  // second request needed to stitch details back on.
  const load = useCallback(async () => {
    setError(null);
    setQueue(null);
    try {
      const studyQueue = await flashcardService.getStudyQueue(catId, mode);
      setQueue(studyQueue);
      setIndex(0);
      setReviewedCount(0);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.detail : "Failed to load the session.");
    }
  }, [catId, mode]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReview = async (result: ReviewResult) => {
    const current = queue?.[index];
    if (!current) return;
    try {
      await flashcardService.reviewFlashcard(current.id, result);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.detail : "Failed to submit review.");
      return; // stay on the same card — don't silently drop the review
    }
    setReviewedCount((n) => n + 1);
    setIndex((i) => i + 1);
  };

  if (error) {
    return (
      <SafeAreaView style={shared.center}>
        <Text style={shared.error}>{error}</Text>
        <TouchableOpacity style={shared.button} onPress={load}>
          <Text style={shared.buttonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#2563eb" }}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (queue === null) {
    return (
      <SafeAreaView style={shared.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (queue.length === 0 || index >= queue.length) {
    return (
      <SafeAreaView style={shared.center}>
        <Text style={shared.title}>Session complete 🎉</Text>
        <Text style={shared.hint}>
          {reviewedCount} card{reviewedCount === 1 ? "" : "s"} reviewed
        </Text>
        <TouchableOpacity style={shared.button} onPress={() => router.back()}>
          <Text style={shared.buttonText}>Done</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[shared.container, { paddingBottom: 32 }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={{ fontSize: 20 }}>✕</Text>
        </TouchableOpacity>
        <Text style={shared.hint}>
          {categoryName ? `${categoryName} · ` : ""}
          {index + 1}/{queue.length}
        </Text>
        <View style={{ width: 20 }} />
      </View>

      <StudyCard key={queue[index].id} card={queue[index]} onReview={handleReview} />
    </SafeAreaView>
  );
}