import { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import * as categoryService from "../services/categories";
import * as flashcardService from "../services/flashcards";
import { ApiClientError } from "../services/api";
import { shared } from "../constants/styles";
import FlashcardFormModal from "../components/FlashcardFormModal";
import type { Flashcard } from "../types/flashcard";

export default function FlashcardsScreen() {
  const { categoryId, categoryName, languagePairId } = useLocalSearchParams<{
    categoryId: string;
    categoryName?: string;
    languagePairId: string;
  }>();
  const catId = Number(categoryId);
  const pairId = Number(languagePairId);

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);

  const load = useCallback(async () => {
    if (!catId) return;
    setIsLoading(true);
    try {
      const list = await categoryService.listCategoryFlashcards(catId);
      setCards(list);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.detail : "Failed to load flashcards.");
    } finally {
      setIsLoading(false);
    }
  }, [catId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openCreate = () => {
    setEditingCard(null);
    setFormVisible(true);
  };

  const openEdit = (card: Flashcard) => {
    setEditingCard(card);
    setFormVisible(true);
  };

  const handleSaved = (saved: Flashcard) => {
    setCards((prev) => {
      const exists = prev.some((c) => c.id === saved.id);
      return exists ? prev.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...prev];
    });
  };

  const handleDelete = (card: Flashcard) => {
    Alert.alert("Delete flashcard", `Delete "${card.text}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await flashcardService.deleteFlashcard(card.id);
            setCards((prev) => prev.filter((c) => c.id !== card.id));
          } catch (e) {
            setError(e instanceof ApiClientError ? e.detail : "Failed to delete flashcard.");
          }
        },
      },
    ]);
  };

  return (
    <View style={shared.container}>
      {categoryName ? <Text style={shared.subtitle}>{categoryName}</Text> : null}
      {error && <Text style={shared.error}>{error}</Text>}

      <FlatList
        data={cards}
        keyExtractor={(item) => String(item.id)}
        refreshing={isLoading}
        onRefresh={load}
        ListEmptyComponent={
          !isLoading ? <Text style={shared.empty}>No flashcards yet — add one below.</Text> : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{ backgroundColor: "#f3f4f6", borderRadius: 8, padding: 16, marginBottom: 8 }}
            onPress={() => openEdit(item)}
            onLongPress={() => handleDelete(item)}
          >
            <Text style={{ fontSize: 16, fontWeight: "600" }}>{item.text}</Text>
            {item.translations.length > 0 && (
              <Text style={shared.hint}>{item.translations.join(", ")}</Text>
            )}
          </TouchableOpacity>
        )}
      />
      {cards.length > 0 && <Text style={shared.hint}>Tap to edit · long-press to delete</Text>}

      <TouchableOpacity
        style={{
          position: "absolute",
          right: 24,
          bottom: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#2563eb",
          alignItems: "center",
          justifyContent: "center",
        }}
        onPress={openCreate}
      >
        <Text style={{ color: "#fff", fontSize: 28, lineHeight: 28 }}>+</Text>
      </TouchableOpacity>

      <FlashcardFormModal
        visible={formVisible}
        languagePairId={pairId}
        categoryId={catId}
        editingCard={editingCard}
        onClose={() => setFormVisible(false)}
        onSaved={handleSaved}
      />
    </View>
  );
}