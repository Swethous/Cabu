import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const RAILS = process.env.RAILS_API_BASE_URL;

export async function GET() {
  if (!RAILS) {
    return NextResponse.json({ error: "RAILS_API_BASE_URL is missing" }, { status: 500 });
  }

  const token = (await cookies()).get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const railsRes = await fetch(`${RAILS}/api/v1/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await railsRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: railsRes.status });
}