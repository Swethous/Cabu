import { NextResponse, type NextRequest } from "next/server";
import { proxyToRails } from "@/lib/bff";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const payload = await req.json().catch(() => null);
  const body = typeof payload?.body === "string" ? payload.body : "";

  if (!body.trim()) {
    return NextResponse.json({ error: "Comment body cannot be empty" }, { status: 400 });
  }

  return proxyToRails(req, `/api/v1/comments/${encodeURIComponent(id)}`, {
    method: "PATCH",
    requireAuth: true,
    body: {
      comment: {
        body,
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

  return proxyToRails(req, `/api/v1/comments/${encodeURIComponent(id)}`, {
    method: "DELETE",
    requireAuth: true,
    cache: "no-store",
  });
}