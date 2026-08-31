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
            renderItem={({ item }) => {
              const disabled = item.code === excludeCode;
              const isSelected = item.code === selected;
              return (
                <TouchableOpacity
                  disabled={disabled}
                  style={[
                    shared.row,
                    { marginHorizontal: 16, borderRadius: 12, opacity: disabled ? 0.3 : 1 },
                    isSelected && shared.rowActive,
                  ]}
                  onPress={() => onSelect(item.code)}
                >
                  <Text style={[shared.rowText, isSelected && { color: colors.primary, fontWeight: "600" }]}>
                    {item.label}
                  </Text>
                  {isSelected && <Feather name="check" size={20} color={colors.primary} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}