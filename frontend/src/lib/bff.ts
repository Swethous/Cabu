// src/lib/bff.ts
import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type ProxyOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  forwardQuery?: boolean;
  body?: unknown;
  headers?: Record<string, string>;
  requireAuth?: boolean;
  cache?: RequestCache;
  next?: { revalidate?: number; tags?: string[] };
  log?: boolean;
};

function resolveRailsBaseUrl() {
  const configured = process.env.RAILS_API_BASE_URL?.trim();
  return configured && configured.length > 0 ? configured : "http://localhost:3000";
}

async function getAccessToken() {
  const store = await cookies();
  return store.get("access_token")?.value;
}

function sanitizeResponseHeaders(h: Headers) {
  // ✅ 스트리밍/디코딩에서 문제되는 헤더들 제거
  h.delete("content-encoding");     // gzip/zstd 등
  h.delete("content-length");       // 길이 불일치 방지
  h.delete("transfer-encoding");    // hop-by-hop
  h.delete("connection");           // hop-by-hop
  h.delete("keep-alive");
  h.delete("upgrade");
  h.delete("proxy-authenticate");
  h.delete("proxy-authorization");
  h.delete("te");
  h.delete("trailer");
  return h;
}

export async function proxyToRails(req: Request, upstreamPath: string, options: ProxyOptions = {}) {
  const base = resolveRailsBaseUrl();
  const requireAuth = options.requireAuth ?? false;
  const forwardQuery = options.forwardQuery ?? true;
  const log = options.log ?? true;

  const token = await getAccessToken();
  if (requireAuth && !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const qs = forwardQuery ? new URL(req.url).search : "";
  const url = `${base.replace(/\/+$/, "")}${upstreamPath}${qs}`;

  // Prevent accidental recursive proxying (e.g. base URL points to Next itself).
  const incoming = new URL(req.url);
  const upstream = new URL(base);
  if (incoming.origin === upstream.origin && incoming.pathname.startsWith("/api/v1")) {
    return NextResponse.json(
      { error: "RAILS_API_BASE_URL points to frontend origin; set it to Rails backend URL" },
      { status: 500 },
    );
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers ?? {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const hasBody = options.body !== undefined && options.body !== null;
  if (hasBody) headers["Content-Type"] = "application/json";

  const requestId = crypto.randomUUID();
  headers["x-request-id"] = requestId;

  const start = Date.now();
  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: hasBody ? JSON.stringify(options.body) : undefined,
    cache: options.cache ?? "no-store",
    next: options.next,
  });
  const ms = Date.now() - start;

  if (log) {
    console.log("[BFF->Rails]", {
      requestId,
      method: options.method ?? "GET",
      upstreamPath,
      status: res.status,
      ms,
    });
  }

  // 204/205는 바디 없는 응답
  if (res.status === 204 || res.status === 205) {
    return new NextResponse(null, { status: res.status });
  }

  const outHeaders = sanitizeResponseHeaders(new Headers(res.headers));

  // content-type 없으면 기본 json
  if (!outHeaders.get("content-type")) {
    outHeaders.set("content-type", "application/json; charset=utf-8");
  }

  // ✅ res.body 그대로 패스스루
  return new NextResponse(res.body, {
    status: res.status,
    headers: outHeaders,
  });
}
