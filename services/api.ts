import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.0.103:8000/api";

const ACCESS_TOKEN_KEY = "flashlingo_access_token";
const REFRESH_TOKEN_KEY = "flashlingo_refresh_token";

// ---- Error shape ----

export interface ApiError {
  status: number;
  detail: string;
  fieldErrors?: Record<string, string[]>;
}

export class ApiClientError extends Error implements ApiError {
  status: number;
  detail: string;
  fieldErrors?: Record<string, string[]>;

  constructor(status: number, detail: string, fieldErrors?: Record<string, string[]>) {
    super(detail);
    this.name = "ApiClientError";
    this.status = status;
    this.detail = detail;
    this.fieldErrors = fieldErrors;
  }
}

// ---- Token storage ----
// AsyncStorage is fine for now. If you want extra security later, swap
// these two get/set functions for expo-secure-store — nothing else in
// this file needs to change.

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, access],
    [REFRESH_TOKEN_KEY, refresh],
  ]);
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
}

export async function hasStoredSession(): Promise<boolean> {
  return (await getRefreshToken()) !== null;
}

// ---- Error parsing (matches the backend's mixed DRF error shapes) ----
// - {"detail": "..."}                     -> auth errors, 404s, logout errors
// - {"non_field_errors": ["..."]}          -> LoginSerializer.validate()
// - {"field_name": ["msg", ...], ...}      -> standard serializer validation

async function parseError(response: Response): Promise<ApiClientError> {
  let body: any = null;
  try {
    body = await response.json();
  } catch {
    // empty or non-JSON body
  }

  if (!body) {
    return new ApiClientError(response.status, response.statusText || "Request failed");
  }

  if (typeof body.detail === "string") {
    return new ApiClientError(response.status, body.detail);
  }

  if (Array.isArray(body.non_field_errors) && body.non_field_errors.length > 0) {
    return new ApiClientError(response.status, body.non_field_errors[0], body);
  }

  const fieldErrors: Record<string, string[]> = {};
  let firstMessage: string | null = null;
  for (const [key, value] of Object.entries(body)) {
    if (Array.isArray(value)) {
      fieldErrors[key] = value as string[];
      if (!firstMessage && value.length > 0) {
        firstMessage = `${key}: ${value[0]}`;
      }
    }
  }

  return new ApiClientError(
    response.status,
    firstMessage ?? "Request failed",
    Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined
  );
}

// ---- Refresh flow ----
// Backend has ROTATE_REFRESH_TOKENS=True + BLACKLIST_AFTER_ROTATION=True,
// so every refresh call both returns a new access token AND invalidates
// the old refresh token by issuing (and requiring us to store) a new one.

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // De-dupe: if several requests 401 at the same time, only refresh once.
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refresh = await getRefreshToken();
    if (!refresh) {
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });

      if (!response.ok) {
        await clearTokens();
        return null;
      }

      const data = await response.json();
      const newAccess: string = data.access;
      const newRefresh: string = data.refresh ?? refresh;

      await setTokens(newAccess, newRefresh);
      return newAccess;
    } catch {
      await clearTokens();
      return null;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

// ---- Session-expired hook ----
// AuthContext registers a handler here so it can clear its state and
// redirect to login the moment a background refresh fails — not just
// when the user happens to hit a screen that checks auth on mount.

let sessionExpiredHandler: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  sessionExpiredHandler = handler;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean; // defaults to true
  params?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const url = new URL(`${API_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function performRequest<T>(
  path: string,
  options: RequestOptions,
  isRetry = false
): Promise<T> {
  const { method = "GET", body, auth = true, params } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = await getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(buildUrl(path, params), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && auth && !isRetry) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      return performRequest<T>(path, options, true);
    }
    // Refresh failed too — notify AuthContext (if registered) so it can
    // clear state and redirect to login, then surface a clear error for
    // whichever call triggered this.
    sessionExpiredHandler?.();
    throw new ApiClientError(401, "Session expired. Please log in again.");
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

// ---- Public API ----

export const api = {
  get: <T>(path: string, params?: RequestOptions["params"], auth = true) =>
    performRequest<T>(path, { method: "GET", params, auth }),

  post: <T>(path: string, body?: unknown, auth = true) =>
    performRequest<T>(path, { method: "POST", body, auth }),

  patch: <T>(path: string, body?: unknown, auth = true) =>
    performRequest<T>(path, { method: "PATCH", body, auth }),

  put: <T>(path: string, body?: unknown, auth = true) =>
    performRequest<T>(path, { method: "PUT", body, auth }),

  delete: <T>(path: string, auth = true) =>
    performRequest<T>(path, { method: "DELETE", auth }),
};