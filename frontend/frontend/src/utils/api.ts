import { API_BASE_URL } from "../config";

type ApiOptions = RequestInit & {
  auth?: boolean; // true => attach Bearer token
};

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(status: number, message: string, body?: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

function handleAuthExpiry(status: number) {
  // If token is invalid/expired, wipe it and bounce to login
  if (status === 401 || status === 403) {
    localStorage.removeItem("token");

    
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  }
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = localStorage.getItem("token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (options.auth) {
    if (!token) {
      handleAuthExpiry(401);
      throw new ApiError(401, "Missing auth token");
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    handleAuthExpiry(res.status);

    const msg =
      (data && (data.error || data.message)) || res.statusText || "Request failed";
    throw new ApiError(res.status, msg, data);
  }

  return data as T;
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
