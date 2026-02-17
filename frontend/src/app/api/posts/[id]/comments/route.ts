// src/app/api/posts/[id]/comments/route.ts
import type { NextRequest } from "next/server";
import { proxyToRails } from "@/lib/bff";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return proxyToRails(req, `/api/v1/posts/${encodeURIComponent(id)}/comments`, {
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const payload = await req.json().catch(() => null);
  const body = typeof payload?.body === "string" ? payload.body : "";

  if (!body.trim()) {
    return Response.json({ error: "Comment body cannot be empty" }, { status: 400 });
  }

  return proxyToRails(req, `/api/v1/posts/${encodeURIComponent(id)}/comments`, {
    method: "POST",
    requireAuth: true,
    body: { comment: { body } },
    cache: "no-store",
  });
}