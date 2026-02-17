export async function loginApi(payload: { email: string; password: string }) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data?.error || res.statusText), { status: res.status });
  return data; // { user }
}

export async function registerApi(payload: {
  email: string;
  password: string;
  password_confirmation?: string;
  name?: string;
}) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(res.statusText), { status: res.status, data });
  return data; // { user }
}

export async function meApi() {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data?.error || res.statusText), { status: res.status });
  return data; // Rails가 { user: ... } 반환하는 형태
}

export async function logoutApi() {
  const res = await fetch("/api/auth/logout", { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error(res.statusText);
}