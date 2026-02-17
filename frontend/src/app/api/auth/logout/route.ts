import { NextResponse } from "next/server";

export async function DELETE() {
  const res = new NextResponse(null, { status: 204 });

  // ✅ HttpOnly 쿠키 삭제
  res.cookies.set({
    name: "access_token",
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return res;
}