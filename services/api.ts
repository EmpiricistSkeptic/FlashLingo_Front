import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://flashlingo-xbdw.onrender.com/api";


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

  constructor(
    status: number,
    detail: string,
    fieldErrors?: Record<string, string[]>
  ) {
    super(detail);
    this.name = "ApiClientError";
    this.status = status;
    this.detail = detail;
    this.fieldErrors = fieldErrors;
  }
}

// ---- Token storage ----

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function setTokens(
  access: string,
  refresh: string
): Promise<void> {
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, access],
    [REFRESH_TOKEN_KEY, refresh],
  ]);
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.multiRemove([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
  ]);
}

export async function hasStoredSession(): Promise<boolean> {
  return (await getRefreshToken()) !== null;
}

// ---- Error parsing ----
//
// Backend can return:
// - {"detail": "..."}
// - {"non_field_errors": ["..."]}
// - {"field_name": ["msg", ...], ...}

async function parseError(
  response: Response
): Promise<ApiClientError> {
  let body: any = null;

  try {
    body = await response.json();
  } catch {
    // Empty or non-JSON response.
  }

  if (!body) {
    return new ApiClientError(
      response.status,
      response.statusText || "Request failed"
    );
  }

  if (typeof body.detail === "string") {
    return new ApiClientError(response.status, body.detail);
  }

  if (
    Array.isArray(body.non_field_errors) &&
    body.non_field_errors.length > 0
  ) {
    return new ApiClientError(
      response.status,
      body.non_field_errors[0],
      body
    );
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
    Object.keys(fieldErrors).length > 0
      ? fieldErrors
      : undefined
  );
}

// ============================================================
// REFRESH FLOW
// ============================================================
//
// Backend:
//   ROTATE_REFRESH_TOKENS = True
//   BLACKLIST_AFTER_ROTATION = True
//
// Therefore every successful refresh returns:
//   access = NEW
//   refresh = NEW
//
// IMPORTANT:
// If several requests receive 401 simultaneously, only ONE
// refresh request may be sent. All others wait for that same
// promise.
//
// Example:
//
//   Request A -> 401 -> refresh
//   Request B -> 401 -> wait
//   Request C -> 401 -> wait
//
//   refresh -> 200 -> new access + new refresh
//
//   A/B/C -> retry -> 200
//
// ============================================================

let refreshPromise: Promise<string | null> | null = null;

// ---- Session-expired hook ----
//
// AuthContext registers a handler here.
// It is called only when the refresh token itself cannot be used
// anymore.

let sessionExpiredHandler: (() => void) | null = null;

export function setSessionExpiredHandler(
  handler: (() => void) | null
): void {
  sessionExpiredHandler = handler;
}

// ---- Actual token refresh ----

async function performTokenRefresh(): Promise<string | null> {
  console.log("[AUTH] Starting token refresh...");

  const refresh = await getRefreshToken();

  if (!refresh) {
    console.log("[AUTH] No refresh token found in AsyncStorage");
    return null;
  }

  console.log(
    "[AUTH] Refresh token found, sending refresh request..."
  );

  try {
    const response = await fetch(
      `${API_URL}/token/refresh/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh,
        }),
      }
    );

    console.log(
      "[AUTH] Refresh HTTP status:",
      response.status
    );

    if (!response.ok) {
      console.log("[AUTH] Refresh request failed");
      return null;
    }

    const data = await response.json();

    console.log(
      "[AUTH] Refresh response:",
      "access:",
      !!data.access,
      "refresh:",
      !!data.refresh
    );

    // With refresh rotation BOTH tokens are mandatory.
    if (!data.access || !data.refresh) {
      console.log(
        "[AUTH] Invalid refresh response: access or refresh token missing"
      );

      return null;
    }

    await setTokens(data.access, data.refresh);

    console.log(
      "[AUTH] New access + refresh tokens saved"
    );

    return data.access;
  } catch (error) {
    console.error(
      "[AUTH] Refresh network/error:",
      error
    );

    return null;
  }
}

// ---- Refresh de-duplication ----

async function refreshAccessToken(): Promise<string | null> {
  // Another request is already refreshing.
  if (refreshPromise) {
    console.log(
      "[AUTH] Refresh already in progress, waiting..."
    );

    return refreshPromise;
  }

  // First request becomes the owner of the refresh.
  refreshPromise = performTokenRefresh();

  try {
    const newAccessToken = await refreshPromise;

    if (!newAccessToken) {
      console.log(
        "[AUTH] Refresh failed — session expired"
      );

      // Clear credentials only once, inside the shared refresh flow.
      await clearTokens();

      console.log(
        "[AUTH] Token storage cleared"
      );

      console.log(
        "[AUTH] Calling session expired handler"
      );

      sessionExpiredHandler?.();
    }

    return newAccessToken;
  } finally {
    refreshPromise = null;
  }
}

// ---- Request options ----

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
  params?: Record<
    string,
    string | number | boolean | undefined
  >;
}

// ---- URL builder ----

function buildUrl(
  path: string,
  params?: RequestOptions["params"]
): string {
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

// ============================================================
// REQUEST
// ============================================================

async function performRequest<T>(
  path: string,
  options: RequestOptions,
  isRetry = false
): Promise<T> {
  const {
    method = "GET",
    body,
    auth = true,
    params,
  } = options;

  console.log(
    `[API] ${method} ${path}`,
    "auth:",
    auth,
    "retry:",
    isRetry
  );

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = await getAccessToken();

    console.log(
      `[API] ${method} ${path}`,
      "hasAccessToken:",
      !!token
    );

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  let response: Response;

  try {
    response = await fetch(
      buildUrl(path, params),
      {
        method,
        headers,
        body:
          body !== undefined
            ? JSON.stringify(body)
            : undefined,
      }
    );
  } catch (error) {
    console.error(
      `[API] Network error: ${method} ${path}`,
      error
    );

    throw new Error(
      "Network error. Please check your internet connection."
    );
  }

  console.log(
    `[API] ${method} ${path} → ${response.status}`
  );

  // ========================================================
  // ACCESS TOKEN EXPIRED / INVALID
  // ========================================================

  if (response.status === 401 && auth && !isRetry) {
    console.log(
      "[AUTH] Access token rejected (401)"
    );

    console.log(
      "[AUTH] Access expired, attempting refresh..."
    );

    const newAccessToken = await refreshAccessToken();

    if (newAccessToken) {
      console.log(
        "[AUTH] Token refresh successful, retrying:",
        path
      );

      // Retry exactly once.
      // The retry reads the NEW access token from AsyncStorage.
      return performRequest<T>(
        path,
        options,
        true
      );
    }

    // refreshAccessToken() already:
    // - cleared tokens
    // - called sessionExpiredHandler
    //
    // Here we only surface the error.
    console.log(
      "[AUTH] Request cannot continue — session expired:",
      path
    );

    throw new ApiClientError(
      401,
      "Session expired. Please log in again."
    );
  }

  // ---- Other errors ----

  if (!response.ok) {
    console.log(
      `[API] Request failed: ${method} ${path} → ${response.status}`
    );

    throw await parseError(response);
  }

  // ---- No content ----

  if (response.status === 204) {
    console.log(
      `[API] ${method} ${path} → 204`
    );

    return undefined as T;
  }

  // ---- Success ----

  const data = (await response.json()) as T;

  console.log(
    `[API] ${method} ${path} → success`
  );

  return data;
}

// ============================================================
// PUBLIC API
// ============================================================

export const api = {
  get: <T>(
    path: string,
    params?: RequestOptions["params"],
    auth = true
  ) =>
    performRequest<T>(
      path,
      {
        method: "GET",
        params,
        auth,
      }
    ),

  post: <T>(
    path: string,
    body?: unknown,
    auth = true
  ) =>
    performRequest<T>(
      path,
      {
        method: "POST",
        body,
        auth,
      }
    ),

  patch: <T>(
    path: string,
    body?: unknown,
    auth = true
  ) =>
    performRequest<T>(
      path,
      {
        method: "PATCH",
        body,
        auth,
      }
    ),

  put: <T>(
    path: string,
    body?: unknown,
    auth = true
  ) =>
    performRequest<T>(
      path,
      {
        method: "PUT",
        body,
        auth,
      }
    ),

  delete: <T>(
    path: string,
    auth = true
  ) =>
    performRequest<T>(
      path,
      {
        method: "DELETE",
        auth,
      }
    ),
};
