import { useCallback, useState } from "react";

import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
} from "react-native";

import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router/react-navigation";
import { Feather } from "@expo/vector-icons";

import { useLanguagePair } from "../../contexts/LanguagePairContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useSharedStyles } from "../../hooks/useSharedStyles";

import * as categoryService from "../../services/categories";
import * as flashcardService from "../../services/flashcards";

import { ApiClientError } from "../../services/api";

import LanguagePairSwitcher from "../../components/LanguagePairSwitcher";
import CategoryFormModal from "../../components/CategoryFormModal";

import type { Category } from "../../types/category";
import type { GameType } from "../../services/games";

type CardSelection = "new" | "due";

type StudyOptions = {
  visible: boolean;
  category: Category | null;
  newCount: number;
  dueCount: number;
  allCaughtUp: boolean;

  selectedCardSelection: CardSelection | null;
  selectedGameType: GameType;
};

const STUDY_MODE_OPTIONS: {
  type: GameType;
  title: string;
  description: string;
  icon:
    | "layers"
    | "edit-3"
    | "message-square"
    | "globe";
}[] = [
  {
    type: "classic",
    title: "Classic",
    description: "Standard flashcards with SRS review.",
    icon: "layers",
  },
  {
    type: "typing",
    title: "Typing Challenge",
    description: "Recall the target word yourself.",
    icon: "edit-3",
  },
  {
    type: "sentence",
    title: "Sentence Challenge",
    description: "Use the target word in your own sentence.",
    icon: "message-square",
  },
  {
    type: "translation",
    title: "Translation Challenge",
    description: "Translate a contextual sentence.",
    icon: "globe",
  },
];

export default function HomeScreen() {
  const {
    activePair,
    isLoading: pairsLoading,
  } = useLanguagePair();

  const { colors } = useTheme();
  const shared = useSharedStyles();
  const router = useRouter();

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [formVisible, setFormVisible] =
    useState(false);

  const [studyingCategoryId, setStudyingCategoryId] =
    useState<number | null>(null);

  const [studyOptions, setStudyOptions] =
    useState<StudyOptions>({
      visible: false,
      category: null,
      newCount: 0,
      dueCount: 0,
      allCaughtUp: false,

      selectedCardSelection: null,
      selectedGameType: "classic",
    });

  // ============================================================
  // LOAD CATEGORIES
  // ============================================================

  const load = useCallback(async () => {
    if (!activePair) {
      setCategories([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const list =
        await categoryService.listCategories(
          activePair.id
        );

      setCategories(list);
    } catch (e) {
      setError(
        e instanceof ApiClientError
          ? e.detail
          : "Failed to load categories."
      );
    } finally {
      setIsLoading(false);
    }
  }, [activePair]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // ============================================================
  // OPEN CATEGORY
  // ============================================================

  const openCategory = (
    category: Category
  ) => {
    if (!activePair) return;

    router.push({
      pathname: "/flashcards",
      params: {
        categoryId: String(category.id),
        categoryName: category.name,
        languagePairId: String(
          activePair.id
        ),
      },
    });
  };

  // ============================================================
  // START STUDY
  // ============================================================

  const startStudy = async (
    category: Category
  ) => {
    setStudyingCategoryId(
      category.id
    );

    try {
      const [
        newCards,
        dueCards,
      ] = await Promise.all([
        flashcardService.getStudyQueue(
          category.id,
          "new"
        ),

        flashcardService.getStudyQueue(
          category.id,
          "due"
        ),
      ]);

      const newCount =
        newCards.length;

      const dueCount =
        dueCards.length;

      if (
        newCount === 0 &&
        dueCount === 0
      ) {
        setStudyOptions({
          visible: true,
          category,
          newCount: 0,
          dueCount: 0,
          allCaughtUp: true,

          selectedCardSelection: null,
          selectedGameType: "classic",
        });

        return;
      }

      setStudyOptions({
        visible: true,
        category,
        newCount,
        dueCount,
        allCaughtUp: false,

        // First screen: user chooses New or Due.
        selectedCardSelection: null,

        // Default study mode.
        selectedGameType: "classic",
      });
    } catch (e) {
      setError(
        e instanceof ApiClientError
          ? e.detail
          : "Failed to check cards."
      );
    } finally {
      setStudyingCategoryId(null);
    }
  };

  // ============================================================
  // CLOSE STUDY MODAL
  // ============================================================

  const closeStudyModal = () => {
    setStudyOptions((prev) => ({
      ...prev,
      visible: false,
      selectedCardSelection: null,
      selectedGameType: "classic",
    }));
  };

  // ============================================================
  // SELECT NEW / DUE
  // ============================================================

  const selectCardSelection = (
    selection: CardSelection
  ) => {
    setStudyOptions((prev) => ({
      ...prev,
      selectedCardSelection: selection,
    }));
  };

  // ============================================================
  // BACK TO NEW / DUE
  // ============================================================

  const backToCardSelection = () => {
    setStudyOptions((prev) => ({
      ...prev,
      selectedCardSelection: null,
    }));
  };

  // ============================================================
  // SELECT STUDY MODE + NAVIGATE
  // ============================================================

  const selectStudyMode = (
    gameType: GameType
  ) => {
    const category =
      studyOptions.category;

    const cardSelection =
      studyOptions.selectedCardSelection;

    if (!category || !cardSelection) {
      return;
    }

    closeStudyModal();

    router.push({
      pathname: "/session",

      params: {
        categoryId: String(
          category.id
        ),

        categoryName:
          category.name,

        mode: cardSelection,

        gameType,
      },
    });
  };

  // ============================================================
  // DELETE CATEGORY
  // ============================================================

  const [
    deleteCategory,
    setDeleteCategory,
  ] = useState<Category | null>(
    null
  );

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  const [
    deleteError,
    setDeleteError,
  ] = useState<string | null>(
    null
  );

  const openDeleteModal = (
    category: Category
  ) => {
    setDeleteError(null);
    setDeleteCategory(category);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;

    setDeleteError(null);
    setDeleteCategory(null);
  };

  const handleDeleteCategory =
    async () => {
      if (!deleteCategory) return;

      setIsDeleting(true);
      setDeleteError(null);

      try {
        await categoryService.deleteCategory(
          deleteCategory.id
        );

        setCategories((prev) =>
          prev.filter(
            (c) =>
              c.id !== deleteCategory.id
          )
        );

        setDeleteCategory(null);
      } catch (e) {
        setDeleteError(
          e instanceof ApiClientError
            ? e.detail
            : "Failed to delete category."
        );
      } finally {
        setIsDeleting(false);
      }
    };

  // ============================================================
  // HELPERS
  // ============================================================

  const selectedCardCount =
    studyOptions.selectedCardSelection ===
    "new"
      ? studyOptions.newCount
      : studyOptions.selectedCardSelection ===
        "due"
        ? studyOptions.dueCount
        : 0;

  const selectedCardLabel =
    studyOptions.selectedCardSelection ===
    "new"
      ? "new"
      : "due";

  return (
    <View
      style={shared.container}
    >
      <LanguagePairSwitcher />

      {!activePair &&
        !pairsLoading && (
          <Text
            style={shared.hint}
          >
            Create or select a language pair
            to see its categories.
          </Text>
        )}

      {error && (
        <Text
          style={shared.error}
        >
          {error}
        </Text>
      )}

      {/* ======================================================
          CATEGORY LIST
      ====================================================== */}

      <FlatList
        data={categories}
        keyExtractor={(item) =>
          String(item.id)
        }
        refreshing={isLoading}
        onRefresh={load}
        contentContainerStyle={{
          paddingBottom: 80,
        }}
        ListEmptyComponent={
          activePair &&
          !isLoading ? (
            <Text
              style={shared.empty}
            >
              No categories yet — add one below.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              shared.row,
              {
                borderRadius: 16,
              },
            ]}
            onPress={() =>
              openCategory(item)
            }
            onLongPress={() =>
              openDeleteModal(item)
            }
          >
            <View
              style={{
                flex: 1,
              }}
            >
              <Text
                style={[
                  shared.rowText,
                  {
                    fontWeight:
                      "600",
                    fontSize: 16,
                    marginBottom: 4,
                  },
                ]}
              >
                {item.name}
              </Text>

              <View
                style={{
                  flexDirection:
                    "row",
                  alignItems:
                    "center",
                  gap: 4,
                }}
              >
                <Feather
                  name="layers"
                  size={12}
                  color={
                    colors.textMuted
                  }
                />

                <Text
                  style={
                    shared.hint
                  }
                >
                  {item.card_count} word
                  {item.card_count ===
                  1
                    ? ""
                    : "s"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor:
                  colors.primary,
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 16,
                minWidth: 80,
                alignItems:
                  "center",
              }}
              onPress={() =>
                startStudy(item)
              }
              disabled={
                studyingCategoryId ===
                item.id
              }
            >
              {studyingCategoryId ===
              item.id ? (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                />
              ) : (
                <Text
                  style={{
                    color: "#fff",
                    fontWeight:
                      "700",
                  }}
                >
                  Study
                </Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      {/* ======================================================
          FAB
      ====================================================== */}

      {activePair && (
        <TouchableOpacity
          style={{
            position: "absolute",
            right: 24,
            bottom: 24,
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor:
              colors.primary,
            shadowColor:
              colors.primary,
            shadowOffset: {
              width: 0,
              height: 4,
            },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
            alignItems:
              "center",
            justifyContent:
              "center",
          }}
          onPress={() =>
            setFormVisible(true)
          }
        >
          <Feather
            name="plus"
            size={32}
            color="#fff"
          />
        </TouchableOpacity>
      )}

      {/* ======================================================
          CATEGORY FORM
      ====================================================== */}

      {activePair && (
        <CategoryFormModal
          visible={formVisible}
          onClose={() =>
            setFormVisible(false)
          }
          onSubmit={async (name) => {
            const created =
              await categoryService.createCategory(
                {
                  name,
                  language_pair:
                    activePair.id,
                }
              );

            setCategories(
              (prev) => [
                created,
                ...prev,
              ]
            );
          }}
        />
      )}

      {/* ======================================================
          STUDY MODAL
      ====================================================== */}

      <Modal
        visible={
          studyOptions.visible
        }
        animationType="fade"
        transparent
        onRequestClose={
          studyOptions.selectedCardSelection
            ? backToCardSelection
            : closeStudyModal
        }
      >
        <View
          style={{
            flex: 1,
            justifyContent:
              "center",
            alignItems:
              "center",
            backgroundColor:
              colors.overlay,
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor:
                colors.surface,
              borderRadius: 24,
              width: "100%",
              maxHeight: "90%",
              padding: 24,
            }}
          >
            {/* =================================================
                ALL CAUGHT UP
            ================================================= */}

            {studyOptions.allCaughtUp ? (
              <>
                <View
                  style={{
                    alignItems:
                      "center",
                    marginBottom:
                      4,
                  }}
                >
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor:
                        colors.primary +
                        "1A",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      marginBottom:
                        16,
                    }}
                  >
                    <Feather
                      name="check"
                      size={32}
                      color={
                        colors.primary
                      }
                    />
                  </View>

                  <Text
                    style={[
                      shared.title,
                      {
                        fontSize: 22,
                        textAlign:
                          "center",
                      },
                    ]}
                  >
                    All caught up! 🎉
                  </Text>
                </View>

                <Text
                  style={[
                    shared.subtitle,
                    {
                      textAlign:
                        "center",
                      lineHeight: 22,
                      marginBottom:
                        20,
                    },
                  ]}
                >
                  There are no words to
                  learn or review in{" "}
                  <Text
                    style={{
                      color:
                        colors.text,
                      fontWeight:
                        "700",
                    }}
                  >
                    "
                    {
                      studyOptions
                        .category?.name
                    }
                    "
                  </Text>{" "}
                  right now.
                </Text>

                <TouchableOpacity
                  style={{
                    backgroundColor:
                      colors.primary,
                    borderRadius: 16,
                    paddingVertical: 15,
                    alignItems:
                      "center",
                  }}
                  onPress={
                    closeStudyModal
                  }
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight:
                        "700",
                      fontSize: 16,
                    }}
                  >
                    Got it
                  </Text>
                </TouchableOpacity>
              </>
            ) : studyOptions.selectedCardSelection ===
              null ? (
              <>
                {/* =================================================
                    STEP 1 — CHOOSE NEW / DUE
                ================================================= */}

                <Text
                  style={[
                    shared.title,
                    {
                      fontSize: 21,
                      textAlign:
                        "center",
                    },
                  ]}
                >
                  Choose what to study
                </Text>

                <Text
                  style={[
                    shared.subtitle,
                    {
                      textAlign:
                        "center",
                      marginTop: 4,
                      marginBottom:
                        18,
                    },
                  ]}
                >
                  {
                    studyOptions
                      .category?.name
                  }
                </Text>

                {studyOptions.newCount >
                  0 && (
                  <TouchableOpacity
                    style={[
                      shared.row,
                      {
                        backgroundColor:
                          colors.background,
                        borderRadius:
                          16,
                        borderWidth:
                          1,
                        borderColor:
                          colors.border,
                        marginBottom:
                          10,
                      },
                    ]}
                    onPress={() =>
                      selectCardSelection(
                        "new"
                      )
                    }
                  >
                    <View
                      style={{
                        flexDirection:
                          "row",
                        alignItems:
                          "center",
                        gap: 12,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor:
                            "rgba(59, 130, 246, 0.1)",
                          padding:
                            10,
                          borderRadius:
                            12,
                        }}
                      >
                        <Feather
                          name="star"
                          size={24}
                          color={
                            colors.primary
                          }
                        />
                      </View>

                      <View>
                        <Text
                          style={[
                            shared.rowText,
                            {
                              fontWeight:
                                "700",
                            },
                          ]}
                        >
                          Learn New
                        </Text>

                        <Text
                          style={
                            shared.hint
                          }
                        >
                          {
                            studyOptions.newCount
                          }{" "}
                          words
                        </Text>
                      </View>
                    </View>

                    <Feather
                      name="chevron-right"
                      size={20}
                      color={
                        colors.textMuted
                      }
                    />
                  </TouchableOpacity>
                )}

                {studyOptions.dueCount >
                  0 && (
                  <TouchableOpacity
                    style={[
                      shared.row,
                      {
                        backgroundColor:
                          colors.background,
                        borderRadius:
                          16,
                        borderWidth:
                          1,
                        borderColor:
                          colors.border,
                      },
                    ]}
                    onPress={() =>
                      selectCardSelection(
                        "due"
                      )
                    }
                  >
                    <View
                      style={{
                        flexDirection:
                          "row",
                        alignItems:
                          "center",
                        gap: 12,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor:
                            "rgba(74, 222, 128, 0.1)",
                          padding:
                            10,
                          borderRadius:
                            12,
                        }}
                      >
                        <Feather
                          name="refresh-cw"
                          size={24}
                          color={
                            colors.success
                          }
                        />
                      </View>

                      <View>
                        <Text
                          style={[
                            shared.rowText,
                            {
                              fontWeight:
                                "700",
                            },
                          ]}
                        >
                          Review
                        </Text>

                        <Text
                          style={
                            shared.hint
                          }
                        >
                          {
                            studyOptions.dueCount
                          }{" "}
                          words due
                        </Text>
                      </View>
                    </View>

                    <Feather
                      name="chevron-right"
                      size={20}
                      color={
                        colors.textMuted
                      }
                    />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={{
                    padding: 14,
                    alignItems:
                      "center",
                    marginTop: 4,
                  }}
                  onPress={
                    closeStudyModal
                  }
                >
                  <Text
                    style={{
                      color:
                        colors.textMuted,
                      fontWeight:
                        "600",
                      fontSize: 16,
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* =================================================
                    STEP 2 — CHOOSE STUDY MODE
                ================================================= */}

                <View
                  style={{
                    flexDirection:
                      "row",
                    alignItems:
                      "center",
                    marginBottom:
                      14,
                  }}
                >
                  <TouchableOpacity
                    onPress={
                      backToCardSelection
                    }
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor:
                        colors.background,
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                    }}
                  >
                    <Feather
                      name="arrow-left"
                      size={21}
                      color={
                        colors.text
                      }
                    />
                  </TouchableOpacity>

                  <View
                    style={{
                      flex: 1,
                      alignItems:
                        "center",
                      paddingRight:
                        40,
                    }}
                  >
                    <Text
                      style={[
                        shared.title,
                        {
                          fontSize: 21,
                          textAlign:
                            "center",
                        },
                      ]}
                    >
                      How do you want to study?
                    </Text>

                    <Text
                      style={[
                        shared.subtitle,
                        {
                          textAlign:
                            "center",
                          marginTop: 3,
                        },
                      ]}
                    >
                      {selectedCardCount}{" "}
                      {selectedCardLabel}{" "}
                      {selectedCardCount ===
                      1
                        ? "word"
                        : "words"}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    gap: 9,
                    marginBottom:
                      12,
                  }}
                >
                  {STUDY_MODE_OPTIONS.map(
                    ({
                      type,
                      title,
                      description,
                      icon,
                    }) => {
                      const selected =
                        studyOptions.selectedGameType ===
                        type;

                      return (
                        <TouchableOpacity
                          key={type}
                          onPress={() =>
                            setStudyOptions(
                              (prev) => ({
                                ...prev,
                                selectedGameType:
                                  type,
                              })
                            )
                          }
                          style={{
                            flexDirection:
                              "row",
                            alignItems:
                              "center",
                            borderRadius:
                              15,
                            borderWidth:
                              1,
                            borderColor:
                              selected
                                ? colors.primary
                                : colors.border,
                            backgroundColor:
                              selected
                                ? colors.primary +
                                  "10"
                                : colors.background,
                            padding:
                              13,
                          }}
                        >
                          <View
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius:
                                12,
                              backgroundColor:
                                selected
                                  ? colors.primary +
                                    "1A"
                                  : colors.surface,
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              marginRight:
                                12,
                            }}
                          >
                            <Feather
                              name={
                                icon
                              }
                              size={20}
                              color={
                                selected
                                  ? colors.primary
                                  : colors.textMuted
                              }
                            />
                          </View>

                          <View
                            style={{
                              flex: 1,
                            }}
                          >
                            <Text
                              style={{
                                color:
                                  colors.text,
                                fontSize:
                                  15,
                                fontWeight:
                                  "800",
                              }}
                            >
                              {title}
                            </Text>

                            <Text
                              style={[
                                shared.hint,
                                {
                                  marginTop:
                                    2,
                                },
                              ]}
                            >
                              {
                                description
                              }
                            </Text>
                          </View>

                          <View
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius:
                                11,
                              borderWidth:
                                2,
                              borderColor:
                                selected
                                  ? colors.primary
                                  : colors.border,
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                            }}
                          >
                            {selected && (
                              <View
                                style={{
                                  width:
                                    10,
                                  height:
                                    10,
                                  borderRadius:
                                    5,
                                  backgroundColor:
                                    colors.primary,
                                }}
                              />
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </View>

                {/* =================================================
                    START BUTTON
                ================================================= */}

                <TouchableOpacity
                  style={{
                    backgroundColor:
                      colors.primary,
                    borderRadius:
                      16,
                    paddingVertical:
                      15,
                    alignItems:
                      "center",
                    marginTop: 4,
                  }}
                  onPress={() =>
                    selectStudyMode(
                      studyOptions.selectedGameType
                    )
                  }
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight:
                        "800",
                      fontSize: 16,
                    }}
                  >
                    Start
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    padding: 14,
                    alignItems:
                      "center",
                  }}
                  onPress={
                    closeStudyModal
                  }
                >
                  <Text
                    style={{
                      color:
                        colors.textMuted,
                      fontWeight:
                        "600",
                      fontSize: 16,
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ======================================================
          DELETE CATEGORY MODAL
      ====================================================== */}

      <Modal
        visible={
          deleteCategory !== null
        }
        animationType="fade"
        transparent
        onRequestClose={
          closeDeleteModal
        }
      >
        <View
          style={{
            flex: 1,
            justifyContent:
              "center",
            alignItems:
              "center",
            backgroundColor:
              colors.overlay,
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor:
                colors.surface,
              borderRadius: 24,
              width: "100%",
              padding: 24,
              gap: 16,
            }}
          >
            <View
              style={{
                alignItems:
                  "center",
                marginBottom:
                  4,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor:
                    colors.danger +
                    "1A",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  marginBottom:
                    16,
                }}
              >
                <Feather
                  name="trash-2"
                  size={30}
                  color={
                    colors.danger
                  }
                />
              </View>

              <Text
                style={[
                  shared.title,
                  {
                    fontSize: 22,
                    textAlign:
                      "center",
                  },
                ]}
              >
                Delete category?
              </Text>
            </View>

            <Text
              style={[
                shared.subtitle,
                {
                  textAlign:
                    "center",
                  lineHeight: 22,
                },
              ]}
            >
              Are you sure you want to delete{" "}
              <Text
                style={{
                  color:
                    colors.text,
                  fontWeight:
                    "700",
                }}
              >
                "
                {
                  deleteCategory?.name
                }
                "
              </Text>
              ?
            </Text>

            <Text
              style={[
                shared.hint,
                {
                  textAlign:
                    "center",
                  lineHeight: 20,
                },
              ]}
            >
              This will also remove all
              flashcards belonging to this
              category.
            </Text>

            {deleteError && (
              <Text
                style={[
                  shared.error,
                  {
                    textAlign:
                      "center",
                  },
                ]}
              >
                {deleteError}
              </Text>
            )}

            <View
              style={{
                flexDirection:
                  "row",
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
                onPress={
                  closeDeleteModal
                }
                disabled={
                  isDeleting
                }
              >
                <Text
                  style={
                    shared.buttonText
                  }
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  shared.button,
                  {
                    flex: 1,
                    backgroundColor:
                      colors.danger,
                  },
                  isDeleting &&
                    shared.buttonDisabled,
                ]}
                onPress={
                  handleDeleteCategory
                }
                disabled={
                  isDeleting
                }
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
                        color:
                          "#fff",
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