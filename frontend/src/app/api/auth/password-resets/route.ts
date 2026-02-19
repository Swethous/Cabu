import { NextResponse } from "next/server";
import { proxyToRails } from "@/lib/bff";

export async function POST(req: Request) {
  const payload = await req.json().catch(() => null);
  const email = typeof payload?.email === "string" ? payload.email.trim() : "";

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  return proxyToRails(req, "/api/v1/password_resets", {
    method: "POST",
    body: { email },
    requireAuth: false,
  });
}

export async function PATCH(req: Request) {
  const payload = await req.json().catch(() => null);
  const token = typeof payload?.token === "string" ? payload.token.trim() : "";
  const password = typeof payload?.password === "string" ? payload.password : "";
  const passwordConfirmation =
    typeof payload?.password_confirmation === "string" ? payload.password_confirmation : undefined;

  if (!token || !password) {
    return NextResponse.json({ error: "token and password are required" }, { status: 400 });
  }

  return proxyToRails(req, "/api/v1/password_resets", {
    method: "PATCH",
    body: {
      token,
      password,
      ...(passwordConfirmation !== undefined ? { password_confirmation: passwordConfirmation } : {}),
    },
    requireAuth: false,
  });
}
