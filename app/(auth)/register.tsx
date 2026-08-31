import { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { Link } from "expo-router";

import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useSharedStyles } from "../../hooks/useSharedStyles";
import { ApiClientError } from "../../services/api";
import Logo from "../../components/Logo";

export default function RegisterScreen() {
  const { register } = useAuth();
  const { colors } = useTheme();
  const shared = useSharedStyles();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await register({ username: username.trim(), email: email.trim(), password });
      // RootNavigator redirects to (tabs) automatically.
    } catch (e) {
      setError(e instanceof ApiClientError ? e.detail : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Backend's MinimumLengthValidator etc. still run server-side — this is
  // just a cheap client-side gate, not full validation.
  const canSubmit =
    username.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    !isSubmitting;

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
        placeholder="Email"
        placeholderTextColor={colors.placeholder}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={shared.input}
        placeholder="Password (min 6 characters)"
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
          <Text style={shared.buttonText}>Register</Text>
        )}
      </TouchableOpacity>

      <Link href="/login" style={{ alignSelf: "center", marginTop: 8 }}>
        <Text style={{ color: colors.primary }}>Already have an account? Log in</Text>
      </Link>
    </View>
  );
}