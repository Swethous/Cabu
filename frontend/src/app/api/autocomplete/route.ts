// src/app/api/autocomplete/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { proxyToRails } from "@/lib/bff";

// GET /api/autocomplete?q=aa
// GET /api/autocomplete?q=aa&provider=NASDAQ_LISTED
// GET /api/autocomplete?q=7203&provider=JPX
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const provider = (url.searchParams.get("provider") ?? "").trim(); // optional

  if (!q) {
    return NextResponse.json({ items: [] }, { status: 200 });
  }

  const qs = new URLSearchParams();
  qs.set("q", q);
  if (provider) qs.set("provider", provider);

  return proxyToRails(req, `/api/v1/autocomplete?${qs.toString()}`, {
    method: "GET",
    requireAuth: false,
    cache: "no-store",
  });
}