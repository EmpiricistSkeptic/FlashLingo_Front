import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, setTokens, clearTokens, getRefreshToken, hasStoredSession } from "./api";
import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
} from "../types/auth";

const AUTH_USER_KEY = "flashlingo_auth_user";

// What we actually have on hand differs by entry point: login() only
// returns user_id (LoginResponse has no username/email — /profile/
// doesn't expose them either, at least not yet), while register()
// returns the full User. This type reflects that reality rather than
// pretending we always have a full profile.
export interface AuthUser {
  id: number;
  username?: string;
  email?: string;
}

async function cacheUser(user: AuthUser): Promise<void> {
  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export async function getCachedUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(AUTH_USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

async function clearCachedUser(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_USER_KEY);
}

export async function login(payload: LoginPayload): Promise<AuthUser> {
  const data = await api.post<LoginResponse>("/login/", payload, false);
  await setTokens(data.access, data.refresh);
  const user: AuthUser = { id: data.user_id };
  await cacheUser(user);
  return user;
}

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  const data = await api.post<RegisterResponse>("/register/", payload, false);
  await setTokens(data.access, data.refresh);
  const user: AuthUser = {
    id: data.user.id,
    username: data.user.username,
    email: data.user.email,
  };
  await cacheUser(user);
  return user;
}

export async function logout(): Promise<void> {
  // Backend expects the field name "refresh_token" here (not "refresh",
  // unlike login/register/token-refresh — a naming inconsistency on the
  // backend, not a typo on this side).
  const refresh = await getRefreshToken();

  try {
    if (refresh) {
      await api.post<{ detail: string }>("/logout/", { refresh_token: refresh });
    }
  } catch {
    // Even if the blacklist call fails (token already invalid, network
    // issue, etc.), we still want to clear local state below so the user
    // isn't stuck "logged in" on the device.
  } finally {
    await clearTokens();
    await clearCachedUser();
  }
}

// Whether a refresh token is stored locally — useful for deciding whether
// to show the login screen or attempt a silent session restore on app start.
export const isLoggedIn = hasStoredSession;