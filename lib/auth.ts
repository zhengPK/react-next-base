/**
 * 与 rag-backend JWT 约定：localStorage 存 token，请求头 Authorization: Bearer <token>
 */

export const AUTH_TOKEN_KEY = "textrag_token";
export const AUTH_USER_KEY = "textrag_user";

export type TextragUser = { id?: string; username: string } | null;

export type LoginSuccessPayload = {
  token: string;
  user: { id: string; username: string };
};

export function getApiBaseUrl(): string {
  const raw =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_API_BASE_URL
      : undefined;
  const base = (raw && raw.trim()) || "http://localhost:5000";
  return base.replace(/\/$/, "");
}

export function resolveApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function readStoredUser(): TextragUser {
  if (typeof window === "undefined") return null;
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return null;

    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return { username: "用户" };

    const parsed = JSON.parse(raw) as { id?: string; username?: string };
    return { id: parsed.id, username: parsed.username || "用户" };
  } catch {
    return null;
  }
}

export function setAuthSession(payload: LoginSuccessPayload): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, payload.token);
  localStorage.setItem(
    AUTH_USER_KEY,
    JSON.stringify({
      id: payload.user.id,
      username: payload.user.username,
    }),
  );
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function notifyAuthChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("textrag-auth"));
}

export type ApiFetchOptions = RequestInit & {
  /** 登录/注册等无需带 token 的请求 */
  skipAuth?: boolean;
};

/**
 * 封装 fetch：默认合并 Authorization Bearer；401 时清除本地会话并广播
 */
export async function apiFetch(
  path: string,
  init: ApiFetchOptions = {},
): Promise<Response> {
  const { skipAuth = false, headers: initHeaders, ...rest } = init;
  
  const headers = new Headers(initHeaders);

  if (!skipAuth) {
    const token = getStoredToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  if (
    rest.body != null &&
    !(rest.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const url = resolveApiUrl(path);
  
  const res = await fetch(url, { ...rest, headers });

  if (res.status === 401 && !skipAuth) {
    const had = getStoredToken();
    if (had) {
      clearAuthSession();
      notifyAuthChange();
    }
  }

  return res;
}

/** 调用后端 /logout 后清除本地状态（后端为 JWT，以客户端删 token 为准） */
export async function logoutAndClear(): Promise<void> {
  try {
    if (getStoredToken()) {
      await apiFetch("/logout", { method: "GET" });
    }
  } catch {
    /* 网络失败仍清理本地 */
  } finally {
    clearAuthSession();
    notifyAuthChange();
  }
}
