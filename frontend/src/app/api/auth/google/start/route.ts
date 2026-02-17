import { NextRequest, NextResponse } from "next/server";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"; // 구글 로그인(인가) 화면 URL
const CALLBACK_PATH = "/api/auth/google/callback"; // 구글 로그인 후 되돌아올 우리 사이트의 콜백 경로

// 환경변수에서 Google Client ID 읽기 (Google Console에서 발급받은 값)
function resolveClientId() {
  return process.env.GOOGLE_OIDC_CLIENT_ID;
}

/**
 * redirect_uri(콜백 URL)를 결정
 * - 운영에서는 보통 GOOGLE_OIDC_REDIRECT_URI를 환경변수로 고정하는 게 안전
 * - 없으면, 현재 요청의 origin(도메인)을 기준으로 callback 경로를 붙여서 만든다.
 *   예: http://localhost:3000 + /api/auth/google/callback
 */
function resolveRedirectUri(req: NextRequest) {
  return (
    process.env.GOOGLE_OIDC_REDIRECT_URI ??
    `${new URL(req.url).origin}${CALLBACK_PATH}`
  );
}

/**
 * state/nonce로 사용할 랜덤 토큰 생성 함수
 * - state: CSRF 방지용 (내가 시작한 로그인 요청이 맞는지 확인)
 * - nonce: id_token 재사용 방지용 (이번 요청에 대해 발급된 id_token인지 확인)
 */
function randomToken() {
  // UUID에서 '-' 제거하고 2개 이어붙여 길게 만듦 (충분히 랜덤)
  return crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
}

/**
 * GET /api/auth/google/start  (예시)
 * - 브라우저가 이 엔드포인트로 오면
 * - 구글 로그인 페이지로 리다이렉트한다.
 */
export async function GET(req: NextRequest) {
  // 1) Google Client ID 확인(없으면 서버 설정이 잘못된 것)
  const clientId = resolveClientId();
  if (!clientId) {
    return NextResponse.json(
      { error: "GOOGLE_OIDC_CLIENT_ID is missing" },
      { status: 500 }
    );
  }

  // 2) state/nonce 생성 (보안용)
  const state = randomToken(); // CSRF 방지
  const nonce = randomToken(); // id_token 재사용 방지

  // 3) redirect_uri 결정 (구글이 로그인 후 여기로 되돌려 보냄)
  const redirectUri = resolveRedirectUri(req);

  // 4) 구글 인증 URL을 만들고 필요한 쿼리 파라미터를 세팅
  const authUrl = new URL(GOOGLE_AUTH_URL);

  authUrl.searchParams.set("response_type", "code");
  // "code"를 받는 방식(Authorization Code Flow): 보안상 정석

  authUrl.searchParams.set("client_id", clientId);
  // 어떤 앱이 요청하는지(구글 콘솔에서 만든 OAuth Client의 ID)

  authUrl.searchParams.set("redirect_uri", redirectUri);
  // 로그인 후 구글이 돌아올 URL (Google 콘솔에도 동일하게 등록되어 있어야 함)

  authUrl.searchParams.set("scope", "openid email profile");
  // openid: OIDC 로그인(= id_token 발급) 요청
  // email/profile: email, name, picture 같은 프로필 정보를 받기 위함(상황에 따라 포함)

  authUrl.searchParams.set("state", state);
  // CSRF 방지용 값: 콜백에서 이 값이 일치하는지 확인해야 함

  authUrl.searchParams.set("nonce", nonce);
  // OIDC 권장 값: 구글이 발급하는 id_token payload에 nonce를 넣어줌 → 서버에서 비교 검증

  authUrl.searchParams.set("prompt", "select_account");
  // 계정 선택 화면을 매번 띄우게 함(원하면 제거 가능)

  // 5) 브라우저를 구글 로그인 페이지로 리다이렉트하는 응답 생성
  const res = NextResponse.redirect(authUrl);

  // 6) state/nonce를 서버(HttpOnly) 쿠키로 저장
  //    - 나중에 callback에서 query의 state와 쿠키의 state가 같은지 검증
  //    - id_token 검증 시 nonce도 비교(보통 Rails로 nonce를 전달)
  const cookieOptions = {
    httpOnly: true, // JS에서 접근 불가 (XSS로부터 보호)
    sameSite: "lax" as const, // 일반적인 OAuth 리다이렉트 흐름에 잘 맞음
    secure: process.env.NODE_ENV === "production", // 운영(https)에서만 쿠키 전송
    path: "/", // 사이트 전체 경로에서 쿠키 사용
    maxAge: 60 * 10, // 10분 유효(로그인 시도용이므로 짧게)
  };

  res.cookies.set({ name: "google_oauth_state", value: state, ...cookieOptions });
  res.cookies.set({ name: "google_oauth_nonce", value: nonce, ...cookieOptions });

  // 7) 최종적으로 리다이렉트 응답 반환 → 브라우저가 구글로 이동
  return res;
}