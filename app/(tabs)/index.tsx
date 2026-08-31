import { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { useLanguagePair } from "../../contexts/LanguagePairContext";
import * as categoryService from "../../services/categories";
import * as flashcardService from "../../services/flashcards";
import { ApiClientError } from "../../services/api";
import { shared } from "../../constants/styles";
import LanguagePairSwitcher from "../../components/LanguagePairSwitcher";
import CategoryFormModal from "../../components/CategoryFormModal";
import type { Category } from "../../types/category";

export default function HomeScreen() {
  const { activePair, isLoading: pairsLoading } = useLanguagePair();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [studyingCategoryId, setStudyingCategoryId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!activePair) {
      setCategories([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const list = await categoryService.listCategories(activePair.id);
      setCategories(list);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.detail : "Failed to load categories.");
    } finally {
      setIsLoading(false);
    }
  }, [activePair]);

  // Reload every time Home regains focus AND whenever the active pair
  // changes — covers both "came back from a category" and "switched pairs".
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openCategory = (category: Category) => {
    if (!activePair) return;
    router.push({
      pathname: "/flashcards",
      params: {
        categoryId: String(category.id),
        categoryName: category.name,
        languagePairId: String(activePair.id),
      },
    });
  };

  // Tapping "Study" doesn't jump straight into a session — it first checks
  // how many new vs due cards this category has (two separate queue
  // fetches, since /study/ only returns one mode at a time), then lets
  // the user pick which queue to study, so new words never get mixed
  // into a review pass.
  const startStudy = async (category: Category) => {
    setStudyingCategoryId(category.id);
    try {
      const [newCards, dueCards] = await Promise.all([
        flashcardService.getStudyQueue(category.id, "new"),
        flashcardService.getStudyQueue(category.id, "due"),
      ]);
      const newCount = newCards.length;
      const dueCount = dueCards.length;

      if (newCount === 0 && dueCount === 0) {
        Alert.alert("Nothing to study", `No new or due cards in "${category.name}" right now.`);
        return;
      }

      const buttons: { text: string; onPress?: () => void; style?: "cancel" }[] = [];

      if (newCount > 0) {
        buttons.push({
          text: `New words (${newCount})`,
          onPress: () =>
            router.push({
              pathname: "/session",
              params: {
                categoryId: String(category.id),
                categoryName: category.name,
                mode: "new",
              },
            }),
        });
      }

      if (dueCount > 0) {
        buttons.push({
          text: `Review (${dueCount})`,
          onPress: () =>
            router.push({
              pathname: "/session",
              params: {
                categoryId: String(category.id),
                categoryName: category.name,
                mode: "due",
              },
            }),
        });
      }

      buttons.push({ text: "Cancel", style: "cancel" });

      Alert.alert(category.name, "What would you like to study?", buttons);
    } catch (e) {
      Alert.alert("Error", e instanceof ApiClientError ? e.detail : "Failed to check due cards.");
    } finally {
      setStudyingCategoryId(null);
    }
  };

  const handleDeleteCategory = (category: Category) => {
    Alert.alert(
      "Delete category",
      `Delete "${category.name}"? This removes its flashcards too.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await categoryService.deleteCategory(category.id);
              setCategories((prev) => prev.filter((c) => c.id !== category.id));
            } catch (e) {
              setError(e instanceof ApiClientError ? e.detail : "Failed to delete category.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={shared.container}>
      <LanguagePairSwitcher />

      {!activePair && !pairsLoading && (
        <Text style={shared.hint}>Create or select a language pair to see its categories.</Text>
      )}

      {error && <Text style={shared.error}>{error}</Text>}

      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        refreshing={isLoading}
        onRefresh={load}
        ListEmptyComponent={
          activePair && !isLoading ? (
            <Text style={shared.empty}>No categories yet — add one below.</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={shared.row}
            onPress={() => openCategory(item)}
            onLongPress={() => handleDeleteCategory(item)}
          >
            <View style={{ flex: 1 }}>
              <Text style={shared.rowText}>{item.name}</Text>
              <Text style={shared.hint}>
                {item.card_count} card{item.card_count === 1 ? "" : "s"}
              </Text>
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: "#2563eb",
                borderRadius: 6,
                paddingVertical: 6,
                paddingHorizontal: 12,
                minWidth: 64,
                alignItems: "center",
              }}
              onPress={() => startStudy(item)}
              disabled={studyingCategoryId === item.id}
            >
              {studyingCategoryId === item.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "600" }}>Study</Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
      {categories.length > 0 && (
        <Text style={shared.hint}>Tap to open · long-press to delete</Text>
      )}

      {activePair && (
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
          onPress={() => setFormVisible(true)}
        >
          <Text style={{ color: "#fff", fontSize: 28, lineHeight: 28 }}>+</Text>
        </TouchableOpacity>
      )}

      {activePair && (
        <CategoryFormModal
          visible={formVisible}
          onClose={() => setFormVisible(false)}
          onSubmit={async (name) => {
            const created = await categoryService.createCategory({
              name,
              language_pair: activePair.id,
            });
            setCategories((prev) => [created, ...prev]);
          }}
        />
      )}
    </View>
  );
}