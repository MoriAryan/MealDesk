import { appEnv } from "../config/env";
import type { AuthResponse } from "./types";

type JsonRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  token?: string | null;
  body?: unknown;
};

async function requestJson<T>(path: string, options: JsonRequestOptions = {}): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${appEnv.apiBaseUrl}${path}`, {
    method: options.method || "GET",
    headers,
    credentials: "include",
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) {
        message = payload.message;
      }
    } catch {
      // No-op: keep fallback message.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function signup(name: string, email: string, password: string) {
  return requestJson<AuthResponse>("/auth/signup", {
    method: "POST",
    body: { name, email, password },
  });
}

export async function login(email: string, password: string) {
  return requestJson<AuthResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function refreshSession() {
  return requestJson<AuthResponse>("/auth/refresh", {
    method: "POST",
  });
}

export async function logout() {
  return requestJson<void>("/auth/logout", {
    method: "POST",
  });
}

export async function getProfile(token: string) {
  return requestJson<{ user: AuthResponse["user"] }>("/auth/me", {
    method: "GET",
    token,
  });
}
