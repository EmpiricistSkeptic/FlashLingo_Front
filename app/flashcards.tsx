import { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "expo-router/react-navigation";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "../contexts/ThemeContext";
import { useSharedStyles } from "../hooks/useSharedStyles";
import * as categoryService from "../services/categories";
import * as flashcardService from "../services/flashcards";
import { ApiClientError } from "../services/api";
import FlashcardFormModal from "../components/FlashcardFormModal";
import type { Flashcard } from "../types/flashcard";

export default function FlashcardsScreen() {
  const { categoryId, categoryName, languagePairId } =
    useLocalSearchParams<{
      categoryId: string;
      categoryName?: string;
      languagePairId: string;
    }>();

  const { colors } = useTheme();
  const shared = useSharedStyles();

  const catId = Number(categoryId);
  const pairId = Number(languagePairId);

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);

  // Delete modal
  const [deleteCard, setDeleteCard] = useState<Flashcard | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!catId) return;

    setIsLoading(true);
    setError(null);

    try {
      const list = await categoryService.listCategoryFlashcards(catId);
      setCards(list);
    } catch (e) {
      setError(
        e instanceof ApiClientError
          ? e.detail
          : "Failed to load flashcards."
      );
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

      return exists
        ? prev.map((c) => (c.id === saved.id ? saved : c))
        : [saved, ...prev];
    });
  };

  const openDeleteModal = (card: Flashcard) => {
    setDeleteError(null);
    setDeleteCard(card);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;

    setDeleteError(null);
    setDeleteCard(null);
  };

  const handleDelete = async () => {
    if (!deleteCard) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await flashcardService.deleteFlashcard(deleteCard.id);

      setCards((prev) =>
        prev.filter((c) => c.id !== deleteCard.id)
      );

      setDeleteCard(null);
    } catch (e) {
      setDeleteError(
        e instanceof ApiClientError
          ? e.detail
          : "Failed to delete flashcard."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={shared.container}>
      {categoryName ? (
        <Text
          style={[
            shared.title,
            {
              textAlign: "left",
              fontSize: 24,
              marginBottom: 8,
            },
          ]}
        >
          {categoryName}
        </Text>
      ) : null}

      {error && <Text style={shared.error}>{error}</Text>}

      <FlatList
        data={cards}
        keyExtractor={(item) => String(item.id)}
        refreshing={isLoading}
        onRefresh={load}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={shared.empty}>
              No flashcards yet — add one below.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              shared.row,
              {
                borderRadius: 12,
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 6,
              },
            ]}
            onPress={() => openEdit(item)}
            onLongPress={() => openDeleteModal(item)}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: colors.text,
              }}
            >
              {item.text}
            </Text>

            {item.translations.length > 0 && (
              <Text
                style={[
                  shared.hint,
                  {
                    fontSize: 14,
                  },
                ]}
              >
                {item.translations.join(", ")}
              </Text>
            )}
          </TouchableOpacity>
        )}
      />

      {cards.length > 0 && (
        <Text
          style={[
            shared.hint,
            {
              textAlign: "center",
              marginBottom: 16,
            },
          ]}
        >
          Tap to edit · long-press to delete
        </Text>
      )}

      {/* FAB */}
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
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
          alignItems: "center",
          justifyContent: "center",
        }}
        onPress={openCreate}
      >
        <Feather name="plus" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Flashcard form */}
      <FlashcardFormModal
        visible={formVisible}
        languagePairId={pairId}
        categoryId={catId}
        editingCard={editingCard}
        onClose={() => setFormVisible(false)}
        onSaved={handleSaved}
      />

      {/* Delete flashcard modal */}
      <Modal
        visible={deleteCard !== null}
        animationType="fade"
        transparent
        onRequestClose={closeDeleteModal}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.overlay,
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 24,
              width: "100%",
              padding: 24,
              gap: 16,
            }}
          >
            {/* Icon + title */}
            <View
              style={{
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: colors.danger + "1A",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Feather
                  name="trash-2"
                  size={30}
                  color={colors.danger}
                />
              </View>

              <Text
                style={[
                  shared.title,
                  {
                    fontSize: 22,
                    textAlign: "center",
                  },
                ]}
              >
                Delete flashcard?
              </Text>
            </View>

            {/* Description */}
            <Text
              style={[
                shared.subtitle,
                {
                  textAlign: "center",
                  lineHeight: 22,
                },
              ]}
            >
              Are you sure you want to delete{" "}
              <Text
                style={{
                  color: colors.text,
                  fontWeight: "700",
                }}
              >
                "{deleteCard?.text}"
              </Text>
              ?
            </Text>

            {deleteError && (
              <Text
                style={[
                  shared.error,
                  {
                    textAlign: "center",
                  },
                ]}
              >
                {deleteError}
              </Text>
            )}

            {/* Buttons */}
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
                  {
                    flex: 1,
                  },
                ]}
                onPress={closeDeleteModal}
                disabled={isDeleting}
              >
                <Text style={shared.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  shared.button,
                  {
                    flex: 1,
                    backgroundColor: colors.danger,
                  },
                  isDeleting && shared.buttonDisabled,
                ]}
                onPress={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator
                    size="small"
                    color="#fff"
                  />
                ) : (
                  <Text
                    style={[
                      shared.buttonText,
                      {
                        color: "#fff",
                      },
                    ]}
                  >
                    Delete
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}