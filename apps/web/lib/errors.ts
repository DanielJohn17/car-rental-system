export function extractMessage(payload: unknown): string | null {
  if (payload == null) return null;

  if (typeof payload === "string") {
    const trimmed = payload.trim();
    if (!trimmed) return null;

    // Try JSON parse for cases where servers send JSON as text
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        return extractMessage(parsed) ?? trimmed;
      } catch {
        return trimmed;
      }
    }

    return trimmed;
  }

  if (typeof payload === "object") {
    const anyPayload = payload as Record<string, unknown>;

    // NestJS common error format: { message: string | string[] }
    const msg = anyPayload.message;
    if (typeof msg === "string") return msg.trim() || null;
    if (Array.isArray(msg)) {
      const parts = msg
        .filter((x) => typeof x === "string")
        .map((x) => x.trim())
        .filter(Boolean);
      if (parts.length) return parts.join(" ");
    }

    const error = anyPayload.error;
    if (typeof error === "string" && error.trim()) return error.trim();
  }

  return null;
}

export function truncateMessage(message: string, maxLen = 180) {
  const cleaned = message.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLen) return cleaned;
  return `${cleaned.slice(0, maxLen - 1)}…`;
}

export async function getResponseErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  const contentType = res.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const data = (await res.clone().json()) as unknown;
      const msg = extractMessage(data);
      if (msg) return truncateMessage(msg);
    }
  } catch {
    // ignore
  }

  try {
    const text = await res.clone().text();
    const msg = extractMessage(text);
    if (msg) return truncateMessage(msg);
  } catch {
    // ignore
  }

  return fallback;
}

export function toUserErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) {
    const msg = extractMessage(err.message);
    if (msg) return truncateMessage(msg);
  }

  const msg = extractMessage(err);
  if (msg) return truncateMessage(msg);

  return fallback;
}
