import type { NextRequest } from "next/server";
import { proxyToRails } from "@/lib/bff";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToRails(req, `/api/v1/comments/${encodeURIComponent(id)}/like`, {
    method: "POST",
    requireAuth: true,
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToRails(req, `/api/v1/comments/${encodeURIComponent(id)}/like`, {
    method: "DELETE",
    requireAuth: true,
  });
}