// src/app/api/mypage/profile/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { proxyToRails } from "@/lib/bff";

export async function GET(req: NextRequest) {
  return proxyToRails(req, "/api/v1/mypage/profile", {
    method: "GET",
    requireAuth: true,
    cache: "no-store",
  });
}

export async function PATCH(req: NextRequest) {
  const payload = await req.json().catch(() => null);

  const name = typeof payload?.name === "string" ? payload.name : null;
  const hasAvatarKey = payload && Object.prototype.hasOwnProperty.call(payload, "avatarUrl");
  const avatarUrl = typeof payload?.avatarUrl === "string" ? payload.avatarUrl : null;

  return proxyToRails(req, "/api/v1/mypage/profile", {
    method: "PATCH",
    requireAuth: true,
    body: {
      user: {
        ...(name !== null ? { name } : {}),
        ...(hasAvatarKey ? { avatar_url: avatarUrl } : {}),
      },
    },
    cache: "no-store",
  });
}