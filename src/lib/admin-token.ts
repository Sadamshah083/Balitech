const TOKEN_KEY = "balitech_admin_jwt";

export function setAdminToken(token: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearAdminToken() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TOKEN_KEY);
}

export function adminAuthHeaders(
  extra: HeadersInit = {}
): Record<string, string> {
  const headers: Record<string, string> = {};

  if (extra instanceof Headers) {
    extra.forEach((value, key) => {
      headers[key] = value;
    });
  } else if (Array.isArray(extra)) {
    for (const [key, value] of extra) {
      headers[key] = value;
    }
  } else {
    Object.assign(headers, extra);
  }

  const token = getAdminToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export async function adminFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
) {
  return fetch(input, {
    ...init,
    credentials: "include",
    headers: adminAuthHeaders(init.headers ?? {}),
  });
}
