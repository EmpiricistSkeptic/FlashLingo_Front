import { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "../contexts/ThemeContext";
import { useSharedStyles } from "../hooks/useSharedStyles";
import * as flashcardService from "../services/flashcards";
import { ApiClientError } from "../services/api";
import StudyCard from "../components/StudyCard";
import type { Flashcard, ReviewResult } from "../types/flashcard";

export default function SessionScreen() {
  const { categoryId, mode, categoryName } = useLocalSearchParams<{
    categoryId: string;
    mode: "due" | "new";
    categoryName?: string;
  }>();
  
  const { colors } = useTheme();
  const shared = useSharedStyles();
  const catId = Number(categoryId);
  const router = useRouter();

  const [queue, setQueue] = useState<Flashcard[] | null>(null);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [reviewedCount, setReviewedCount] = useState(0);

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

  useEffect(() => { load(); }, [load]);

  const handleReview = async (result: ReviewResult) => {
    const current = queue?.[index];
    if (!current) return;
    try {
      await flashcardService.reviewFlashcard(current.id, result);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.detail : "Failed to submit review.");
      return;
    }
    setReviewedCount((n) => n + 1);
    setIndex((i) => i + 1);
  };

  // 1. ОШИБКА
  if (error) {
    return (
      <SafeAreaView style={shared.center}>
        <Feather name="alert-triangle" size={48} color={colors.danger} style={{ marginBottom: 16 }} />
        <Text style={[shared.error, { marginBottom: 24 }]}>{error}</Text>
        <TouchableOpacity style={[shared.button, { width: "100%", marginBottom: 12 }]} onPress={load}>
          <Text style={shared.buttonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 12 }}>
          <Text style={{ color: colors.primary, fontWeight: "600" }}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // 2. ЗАГРУЗКА
  if (queue === null) {
    return (
      <SafeAreaView style={shared.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // 3. УСПЕШНО ЗАВЕРШЕНО
  if (queue.length === 0 || index >= queue.length) {
    return (
      <SafeAreaView style={shared.center}>
        <Feather name="check-circle" size={64} color={colors.success} style={{ marginBottom: 24 }} />
        <Text style={shared.title}>Session complete 🎉</Text>
        <Text style={[shared.hint, { fontSize: 16, marginTop: 8, marginBottom: 32 }]}>
          {reviewedCount} card{reviewedCount === 1 ? "" : "s"} reviewed
        </Text>
        <TouchableOpacity style={[shared.button, { width: "100%", paddingVertical: 16, borderRadius: 16 }]} onPress={() => router.back()}>
          <Text style={shared.buttonText}>Done</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // 4. КАРТОЧКА
  return (
    <SafeAreaView style={[shared.container, { paddingBottom: 16 }]}>
      {/* Шапка с прогрессом */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Feather name="x" size={28} color={colors.text} />
        </TouchableOpacity>
        
        <View style={{ alignItems: "center" }}>
          {categoryName && (
            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {categoryName}
            </Text>
          )}
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
            {index + 1} <Text style={{ color: colors.textMuted }}>/ {queue.length}</Text>
          </Text>
        </View>
        
        <View style={{ width: 28 }} />
      </View>

      <StudyCard key={queue[index].id} card={queue[index]} onReview={handleReview} />
    </SafeAreaView>
  );
}