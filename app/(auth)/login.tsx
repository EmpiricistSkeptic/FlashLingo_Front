import { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { Link } from "expo-router";

import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useSharedStyles } from "../../hooks/useSharedStyles";
import { ApiClientError } from "../../services/api";
import Logo from "../../components/Logo";

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors } = useTheme();
  const shared = useSharedStyles();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ username: username.trim(), password });
      // No manual navigation needed — RootNavigator redirects to (tabs)
      // as soon as isAuthenticated flips to true.
    } catch (e) {
      setError(e instanceof ApiClientError ? e.detail : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = username.trim().length > 0 && password.length > 0 && !isSubmitting;

  return (
    <View style={[shared.container, { justifyContent: "center" }]}>
      <View style={{ marginBottom: 16, alignItems: "center" }}>
        <Logo size={64} />
      </View>

      <TextInput
        style={shared.input}
        placeholder="Username"
        placeholderTextColor={colors.placeholder}
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={shared.input}
        placeholder="Password"
        placeholderTextColor={colors.placeholder}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text style={shared.error}>{error}</Text>}

      <TouchableOpacity
        style={[shared.button, !canSubmit && shared.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!canSubmit}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={shared.buttonText}>Log in</Text>
        )}
      </TouchableOpacity>

      <Link href="/register" style={{ alignSelf: "center", marginTop: 8 }}>
        <Text style={{ color: colors.primary }}>Don't have an account? Register</Text>
      </Link>
    </View>
  );
}