// src/app/api/posts/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { proxyToRails } from "@/lib/bff";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const payload = await req.json().catch(() => null);
  const body = typeof payload?.body === "string" ? payload.body : "";

  const hasImageKey = payload && Object.prototype.hasOwnProperty.call(payload, "imageUrl");

  const imageUrl = typeof payload?.imageUrl === "string" ? payload.imageUrl : null;
  if (!body.trim()) {
    return NextResponse.json({ error: "Post body cannot be empty" }, { status: 400 });
  }

  return proxyToRails(req, `/api/v1/posts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    requireAuth: true,
    body: {
      post: {
        body,
        ...(hasImageKey ? { image_url: imageUrl } : {}),
      },
    },
    cache: "no-store",
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return proxyToRails(req, `/api/v1/posts/${encodeURIComponent(id)}`, {
    method: "DELETE",
    requireAuth: true,
    cache: "no-store",
  });
}