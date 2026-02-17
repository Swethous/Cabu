import { proxyToRails } from "@/lib/bff";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: raw } = await params;
  const symbol = decodeURIComponent(raw).toUpperCase();

  return proxyToRails(req, `/api/v1/stocks/${encodeURIComponent(symbol)}/posts`, {
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: raw } = await params;
  const symbol = decodeURIComponent(raw).toUpperCase();

  const payload = await req.json().catch(() => null);
  const body = typeof payload?.body === "string" ? payload.body : "";
  const imageUrl = typeof payload?.imageUrl === "string" ? payload.imageUrl : null;

  if (!body.trim()) {
    return NextResponse.json({ error: "Post body cannot be empty" }, { status: 400 });
  }

  return proxyToRails(req, `/api/v1/stocks/${encodeURIComponent(symbol)}/posts`, {
    method: "POST",
    requireAuth: true, // 작성은 인증 필요
    body: {
      post: {
        body,
        ...(imageUrl ? { image_url: imageUrl } : {}),
      },
    },
    cache: "no-store",
  });
}