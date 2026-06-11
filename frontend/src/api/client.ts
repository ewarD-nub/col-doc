import { HttpClient } from "./http-client";
/**
 * Base HTTP client.
 *
 * All API calls go through here so auth headers, base URL, and error handling
 * are in one place.
 *
 * TODO: read VITE_API_URL from import.meta.env instead of hard-coding. (done)
 * TODO: attach Authorization: Bearer <token> header once auth is implemented.
 * TODO: add a global error handler that shows a toast on 401 / 5xx.
 */

export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
export const WS_BASE  = API_BASE.replace(/^http/, 'ws');

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = JSON.parse(localStorage.getItem('__api_key') ?? '[]')?.[1];
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'api-key': apiKey ?? '',
      'Content-Type': 'application/json',
      // TODO: inject `Authorization: Bearer ${getToken()}` here once auth exists.
      ...init?.headers,
    },
  });

  if (!res.ok) {
    // TODO: parse JSON error body from the server response
    throw new ApiError(res.status, `${res.status} ${res.statusText}`);
  }

  // 204 No Content has no body
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const http = {
  get:    <T>(path: string)                 => request<T>(path),
  post:   <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST',   body: body ? JSON.stringify(body) : undefined }),
  patch:  <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: <T>(path: string)                 => request<T>(path, { method: 'DELETE' }),
};

/**
 * Axios-backed client (work in progress). Inherits typed get/post/patch/delete
 * and streaming support from {@link HttpClient}. Used by feature API modules
 * that need interceptors and cancel tokens.
 */
export class ApiClient extends HttpClient {}
