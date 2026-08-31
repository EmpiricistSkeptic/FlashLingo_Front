import { useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity } from "react-native";

import { useTheme } from "../contexts/ThemeContext";
import { useSharedStyles } from "../hooks/useSharedStyles";
import { ApiClientError } from "../services/api";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

export default function CategoryFormModal({ visible, onClose, onSubmit }: Props) {
  const { colors } = useTheme();
  const shared = useSharedStyles();
  
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(name.trim());
      setName("");
      onClose();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.detail : "Failed to create category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName("");
    setError(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: colors.overlay }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            gap: 16,
          }}
        >
          <Text style={[shared.subtitle, { color: colors.text, fontSize: 20 }]}>New category</Text>
          
          <TextInput
            style={[shared.input, { backgroundColor: colors.background }]}
            placeholder="Category name"
            placeholderTextColor={colors.placeholder}
            value={name}
            onChangeText={setName}
            autoFocus
          />
          
          {error && <Text style={shared.error}>{error}</Text>}
          
          <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
            <TouchableOpacity
              style={[shared.button, shared.secondaryButton, { flex: 1 }]}
              onPress={handleClose}
            >
              <Text style={shared.buttonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[shared.button, { flex: 1 }, (!name.trim() || isSubmitting) && shared.buttonDisabled]}
              onPress={handleSubmit}
              disabled={!name.trim() || isSubmitting}
            >
              <Text style={shared.buttonText}>{isSubmitting ? "Creating…" : "Create"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}