import { Modal, View, Text, TouchableOpacity, FlatList } from "react-native";
import { Feather } from "@expo/vector-icons";

import { LANGUAGE_OPTIONS } from "../constants/languages";
import type { LanguageCode } from "../constants/languages";
import { useTheme } from "../contexts/ThemeContext";
import { useSharedStyles } from "../hooks/useSharedStyles";

interface Props {
  visible: boolean;
  title: string;
  selected?: LanguageCode;
  excludeCode?: LanguageCode;
  onSelect: (code: LanguageCode) => void;
  onClose: () => void;
}

export default function LanguagePicker({
  visible, title, selected, excludeCode, onSelect, onClose
}: Props) {
  const { colors } = useTheme();
  const shared = useSharedStyles();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: colors.overlay }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "75%",
            paddingBottom: 24,
          }}
        >
          <View style={{ padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={[shared.subtitle, { color: colors.text, fontSize: 18 }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={LANGUAGE_OPTIONS}
            keyExtractor={(item) => item.code}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 4,
              paddingBottom: 8,
            }}
            renderItem={({ item }) => {
              const disabled = item.code === excludeCode;
              const isSelected = item.code === selected;

              return (
                <TouchableOpacity
                  disabled={disabled}
                  activeOpacity={0.7}
                  onPress={() => onSelect(item.code)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 8,
                    padding: 12,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: isSelected
                      ? colors.primary
                      : colors.border,
                    backgroundColor: isSelected
                      ? colors.primary + "12"
                      : colors.surface,
                    opacity: disabled ? 0.35 : 1,
                  }}
                >
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 11,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isSelected
                        ? colors.primary + "22"
                        : colors.background,
                    }}
                  >
                    <Text style={{ fontSize: 19 }}>
                      {item.flag}
                    </Text>
                  </View>

                  <Text
                    style={{
                      flex: 1,
                      fontSize: 16,
                      fontWeight: isSelected ? "700" : "500",
                      color: isSelected
                        ? colors.primary
                        : colors.text,
                    }}
                  >
                    {item.label}
                  </Text>

                  {isSelected && (
                    <Feather
                      name="check-circle"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}