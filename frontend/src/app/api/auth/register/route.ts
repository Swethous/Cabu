import { NextResponse } from "next/server";

const RAILS = process.env.RAILS_API_BASE_URL;

export async function POST(req: Request) {
  if (!RAILS) {
    return NextResponse.json({ error: "RAILS_API_BASE_URL is missing" }, { status: 500 });
  }

  const body = await req.json();

  const railsRes = await fetch(`${RAILS}/api/v1/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await railsRes.json().catch(() => ({}));

  if (!railsRes.ok) {
    return NextResponse.json(data, { status: railsRes.status });
  }

  const token = data?.accessToken as string | undefined;
  if (!token) {
    return NextResponse.json({ error: "accessToken missing from Rails response" }, { status: 500 });
  }

  const res = NextResponse.json({ user: data.user }, { status: 201 });

  res.cookies.set({
    name: "access_token",
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return res;
}