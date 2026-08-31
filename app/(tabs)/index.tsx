import { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, Alert, ActivityIndicator, Modal } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons"; // <-- Важно!

import { useLanguagePair } from "../../contexts/LanguagePairContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useSharedStyles } from "../../hooks/useSharedStyles";
import * as categoryService from "../../services/categories";
import * as flashcardService from "../../services/flashcards";
import { ApiClientError } from "../../services/api";

import LanguagePairSwitcher from "../../components/LanguagePairSwitcher";
import CategoryFormModal from "../../components/CategoryFormModal";
import type { Category } from "../../types/category";

export default function HomeScreen() {
  const { activePair, isLoading: pairsLoading } = useLanguagePair();
  const { colors } = useTheme();
  const shared = useSharedStyles();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [studyingCategoryId, setStudyingCategoryId] = useState<number | null>(null);

  // Стэйт для новой красивой модалки выбора сессии
  const [studyOptions, setStudyOptions] = useState<{
    visible: boolean;
    category: Category | null;
    newCount: number;
    dueCount: number;
  }>({ visible: false, category: null, newCount: 0, dueCount: 0 });

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

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openCategory = (category: Category) => {
    if (!activePair) return;
    router.push({
      pathname: "/flashcards",
      params: { categoryId: String(category.id), categoryName: category.name, languagePairId: String(activePair.id) },
    });
  };

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
        Alert.alert("All caught up! 🎉", `There are no words to learn or review in "${category.name}" right now.`);
        return;
      }

      // Открываем красивую модалку
      setStudyOptions({ visible: true, category, newCount, dueCount });
    } catch (e) {
      Alert.alert("Error", e instanceof ApiClientError ? e.detail : "Failed to check cards.");
    } finally {
      setStudyingCategoryId(null);
    }
  };

  const handleDeleteCategory = (category: Category) => {
    Alert.alert("Delete category", `Delete "${category.name}"? This removes its flashcards too.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await categoryService.deleteCategory(category.id);
            setCategories((prev) => prev.filter((c) => c.id !== category.id));
          } catch (e) { setError(e instanceof ApiClientError ? e.detail : "Failed to delete category."); }
        },
      },
    ]);
  };

  const navigateToSession = (mode: "new" | "due") => {
    const category = studyOptions.category;
    setStudyOptions({ ...studyOptions, visible: false }); // Закрываем модалку
    if (!category) return;
    
    router.push({
      pathname: "/session",
      params: { categoryId: String(category.id), categoryName: category.name, mode },
    });
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
        contentContainerStyle={{ paddingBottom: 80 }} // Место для FAB
        ListEmptyComponent={
          activePair && !isLoading ? <Text style={shared.empty}>No categories yet — add one below.</Text> : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[shared.row, { borderRadius: 16 }]}
            onPress={() => openCategory(item)}
            onLongPress={() => handleDeleteCategory(item)}
          >
            <View style={{ flex: 1 }}>
              <Text style={[shared.rowText, { fontWeight: "600", fontSize: 16, marginBottom: 4 }]}>
                {item.name}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Feather name="layers" size={12} color={colors.textMuted} />
                <Text style={shared.hint}>
                  {item.card_count} word{item.card_count === 1 ? "" : "s"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 16,
                minWidth: 80,
                alignItems: "center",
              }}
              onPress={() => startStudy(item)}
              disabled={studyingCategoryId === item.id}
            >
              {studyingCategoryId === item.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700" }}>Study</Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      {/* Кнопка FAB (Плюсик) */}
      {activePair && (
        <TouchableOpacity
          style={{
            position: "absolute",
            right: 24,
            bottom: 24,
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() => setFormVisible(true)}
        >
          <Feather name="plus" size={32} color="#fff" />
        </TouchableOpacity>
      )}

      {activePair && (
        <CategoryFormModal
          visible={formVisible}
          onClose={() => setFormVisible(false)}
          onSubmit={async (name) => {
            const created = await categoryService.createCategory({ name, language_pair: activePair.id });
            setCategories((prev) => [created, ...prev]);
          }}
        />
      )}

      {/* Красивая модалка выбора режима обучения */}
      <Modal
        visible={studyOptions.visible}
        animationType="fade"
        transparent
        onRequestClose={() => setStudyOptions({ ...studyOptions, visible: false })}
      >
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.overlay, padding: 24 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 24, width: "100%", padding: 24, gap: 16 }}>
            <Text style={[shared.title, { fontSize: 20 }]}>Choose a mode</Text>
            <Text style={[shared.subtitle, { textAlign: "center", marginBottom: 8 }]}>
              {studyOptions.category?.name}
            </Text>

            {studyOptions.newCount > 0 && (
              <TouchableOpacity
                style={[shared.row, { backgroundColor: colors.background, borderRadius: 16, borderWidth: 1, borderColor: colors.border }]}
                onPress={() => navigateToSession("new")}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", padding: 10, borderRadius: 12 }}>
                    <Feather name="star" size={24} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[shared.rowText, { fontWeight: "700" }]}>Learn New</Text>
                    <Text style={shared.hint}>{studyOptions.newCount} words</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}

            {studyOptions.dueCount > 0 && (
              <TouchableOpacity
                style={[shared.row, { backgroundColor: colors.background, borderRadius: 16, borderWidth: 1, borderColor: colors.border }]}
                onPress={() => navigateToSession("due")}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ backgroundColor: "rgba(74, 222, 128, 0.1)", padding: 10, borderRadius: 12 }}>
                    <Feather name="refresh-cw" size={24} color={colors.success} />
                  </View>
                  <View>
                    <Text style={[shared.rowText, { fontWeight: "700" }]}>Review</Text>
                    <Text style={shared.hint}>{studyOptions.dueCount} words due</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={{ padding: 16, alignItems: "center", marginTop: 8 }}
              onPress={() => setStudyOptions({ ...studyOptions, visible: false })}
            >
              <Text style={{ color: colors.textMuted, fontWeight: "600", fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}