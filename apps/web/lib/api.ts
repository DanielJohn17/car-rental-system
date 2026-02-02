import { getResponseErrorMessage } from "@/lib/errors";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, ...rest } = init;

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: {
        ...(json ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: json ? JSON.stringify(json) : rest.body,
      cache: "no-store",
    });

    if (!res.ok) {
      const message = await getResponseErrorMessage(
        res,
        `Request failed: ${res.status} ${res.statusText}`,
      );
      throw new Error(message);
    }

    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch failed")) {
      throw new Error(
        "Unable to connect to the server. Please ensure the backend service is running.",
      );
    }
    throw error;
  }
}
