import { useState } from "react";
import { View, Text, TouchableOpacity, Modal, Switch, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export default function AccountMenuButton() {
  const { colors, mode, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [visible, setVisible] = useState(false);

  const handleLogout = () => {
    setVisible(false);
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => logout() },
    ]);
  };

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} hitSlop={12} style={{ marginRight: 16 }}>
        <Ionicons name="settings-outline" size={22} color={colors.headerTint} />
      </TouchableOpacity>

      <Modal visible={visible} animationType="fade" transparent onRequestClose={() => setVisible(false)}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            alignItems: "flex-end",
          }}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View
            style={{
              marginTop: 60,
              marginRight: 16,
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              gap: 16,
              minWidth: 220,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.text, fontSize: 15 }}>Dark theme</Text>
              <Switch value={mode === "dark"} onValueChange={toggleTheme} />
            </View>

            <TouchableOpacity onPress={handleLogout}>
              <Text style={{ color: colors.danger, fontSize: 15, fontWeight: "600" }}>Log out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}