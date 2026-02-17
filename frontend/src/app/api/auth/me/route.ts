import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { proxyToRails } from "@/lib/bff";

const RAILS = process.env.RAILS_API_BASE_URL;

export async function GET(req: Request) {
  return proxyToRails(req, "/api/v1/me", { requireAuth: true });
}