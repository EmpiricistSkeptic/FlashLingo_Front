import AsyncStorage from "@react-native-async-storage/async-storage";

const GAMES_ENABLED_KEY = "@flashlingo/games_enabled";

export async function getGamesEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(
    GAMES_ENABLED_KEY
  );

  if (value === null) {
    // Games are available by default,
    // but Classic remains the default study method.
    return true;
  }

  return value === "true";
}

export async function setGamesEnabled(
  enabled: boolean
): Promise<void> {
  await AsyncStorage.setItem(
    GAMES_ENABLED_KEY,
    String(enabled)
  );
}