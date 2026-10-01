import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "../contexts/AuthContext";
import { LanguagePairProvider } from "../contexts/LanguagePairContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import RootNavigator from "../components/RootNavigator";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <LanguagePairProvider>
            <RootNavigator />
          </LanguagePairProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
