import { NextRequest, NextResponse } from "next/server";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const RAILS = process.env.RAILS_API_BASE_URL;
const CALLBACK_PATH = "/api/auth/google/callback";

function resolveClientId() {
  return process.env.GOOGLE_OIDC_CLIENT_ID;
}

function resolveClientSecret() {
  return process.env.GOOGLE_OIDC_CLIENT_SECRET;
}

function resolveRedirectUri(req: NextRequest) {
  return process.env.GOOGLE_OIDC_REDIRECT_URI ?? `${new URL(req.url).origin}${CALLBACK_PATH}`;
}

function clearOauthCookies(res: NextResponse) {
  const cookieOptions = {
    maxAge: 0,
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };

  res.cookies.set({
    name: "google_oauth_state",
    value: "",
    ...cookieOptions,
  });
  res.cookies.set({
    name: "google_oauth_nonce",
    value: "",
    ...cookieOptions,
  });
}

function loginRedirect(req: NextRequest, code: string) {
  const url = new URL("/login", req.url);
  url.searchParams.set("error", code);
  return url;
}

export async function GET(req: NextRequest) {
  if (!RAILS) {
    return NextResponse.json({ error: "RAILS_API_BASE_URL is missing" }, { status: 500 });
  }

  const clientId = resolveClientId();
  const clientSecret = resolveClientSecret();
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Google OAuth env vars are missing" },
      { status: 500 }
    );
  }

  const url = new URL(req.url);
  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    return NextResponse.redirect(loginRedirect(req, oauthError));
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.cookies.get("google_oauth_state")?.value;
  const cookieNonce = req.cookies.get("google_oauth_nonce")?.value;

  if (!code || !state || !cookieState || state !== cookieState || !cookieNonce) {
    const res = NextResponse.redirect(loginRedirect(req, "invalid_google_state"));
    clearOauthCookies(res);
    return res;
  }

  const redirectUri = resolveRedirectUri(req);
  const tokenBody = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const googleTokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenBody.toString(),
    cache: "no-store",
  });
  const googleTokenData = await googleTokenRes.json().catch(() => ({}));

  const idToken = googleTokenData?.id_token as string | undefined;
  if (!googleTokenRes.ok || !idToken) {
    const res = NextResponse.redirect(loginRedirect(req, "google_token_exchange_failed"));
    clearOauthCookies(res);
    return res;
  }

  const railsRes = await fetch(`${RAILS}/api/v1/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id_token: idToken,
      nonce: cookieNonce,
    }),
  });
  const railsData = await railsRes.json().catch(() => ({}));

  const accessToken = railsData?.accessToken as string | undefined;
  if (!railsRes.ok || !accessToken) {
    const res = NextResponse.redirect(loginRedirect(req, "google_auth_failed"));
    clearOauthCookies(res);
    return res;
  }

  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set({
    name: "access_token",
    value: accessToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  clearOauthCookies(res);
  return res;
}
