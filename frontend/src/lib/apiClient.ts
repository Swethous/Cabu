type ApiError = { error?: string } | { error?: { message?: string } };

export async function apiFetch<T>(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      (json as any)?.error?.message ||
      (json as any)?.error ||
      `Request failed (HTTP ${res.status})`;
    throw new Error(msg);
  }

  return json as T;
}

