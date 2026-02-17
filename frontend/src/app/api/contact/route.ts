import { NextResponse } from "next/server";
import { proxyToRails } from "@/lib/bff";

const ALLOWED_CATEGORIES = ["bug_report", "feature_request", "account", "other"] as const;

export async function POST(req: Request) {
  const payload = await req.json().catch(() => null);

  const category = typeof payload?.category === "string" ? payload.category : "";
  const subject = typeof payload?.subject === "string" ? payload.subject : "";
  const body = typeof payload?.body === "string" ? payload.body : "";

  if (!ALLOWED_CATEGORIES.includes(category as (typeof ALLOWED_CATEGORIES)[number])) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if (!subject.trim()) {
    return NextResponse.json({ error: "Subject is required" }, { status: 400 });
  }
  if (!body.trim()) {
    return NextResponse.json({ error: "Body is required" }, { status: 400 });
  }

  return proxyToRails(req, "/api/v1/contact", {
    method: "POST",
    requireAuth: true,
    body: {
      contact: {
        category,
        subject: subject.trim(),
        body: body.trim(),
      },
    },
  });
}
