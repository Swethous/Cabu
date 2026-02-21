# Cabu

> **미국주/일본주 종목별 커뮤니티 + 차트**를 한 화면에서 제공하는 경량 주식 커뮤니티 서비스  
> 빠르게 **정보(차트/거래량) 확인 → 의견(댓글) 확인/작성**까지 이어지는 UX를 목표로 했습니다.

---

## Links
- 서비스 URL: https://cabuapp.com
- Figma(화면 흐름): https://www.figma.com/design/VuqGq0HjgLSpIcxZkyb3Nn/stock_community_mobile?node-id=0-1&p=f&t=dZ683DSGNzhnh5Lx-0

> (선택) GitHub Repo / 소개 영상 / 데모 계정 링크가 있으면 여기에 추가

---

## 스크린샷 / 데모
> (TODO) 메인 / 종목 상세 / 검색(오토컴플리트) / 로그인 / 마이페이지 등 3~6장 첨부

---

## 개발 배경
한국에서는 가볍고 사용하기 쉬운 주식 커뮤니티(예: 토스증권 커뮤니티)를 자주 이용했습니다.  
하지만 일본 주식 투자 환경에서는 **차트와 커뮤니티를 한 화면에서 빠르게 확인**할 수 있는 서비스가 드물고, 기존 서비스는 UI가 복잡하거나 커뮤니티 기능이 부가적인 경우가 많았습니다.  
그래서 **초보자도 부담 없이 사용할 수 있는 ‘가볍고 빠른’ 주식 커뮤니티**를 직접 만들었습니다.

---

## 핵심 기능
- 회원가입 / 로그인 (**JWT + HttpOnly Cookie**, Google 로그인)
- 비밀번호 재설정
- 종목 검색 + **오토컴플리트(prefix 기반)**
- 종목 상세: **실시간 차트 + 거래량 + 커뮤니티(댓글)**를 한 화면에서 제공
- 댓글 작성/조회, 댓글 좋아요
- 북마크(관심 종목 저장)
- 인기/급상승/급락 등 랭킹 리스트
- 문의하기

---

## 아키텍처
- **Next.js(App Router) Route Handlers를 BFF로 사용**
  - 브라우저는 Next.js에만 요청
  - Next.js가 Rails API로 서버-서버 요청을 수행하여 인증/통신 흐름 단순화
- 데이터 저장소
  - 운영 DB: Supabase PostgreSQL
  - 자동완성/캐시: Upstash Redis
  - 이미지 저장: Supabase Storage
- 배치
  - 랭킹/인기/스파크라인 갱신 작업을 **GitHub Actions Scheduled Workflows(Cron)**로 정기 실행

> (TODO) 아키텍처 다이어그램 이미지 1장 넣으면 완성도 급상승

---

## ERD
> (TODO) PNG 파일 추가  
> 예시: `docs/erd.png` 로 저장 후 아래처럼 삽입

![ERD](docs/erd.png)

---

## 기술 스택

### 백엔드

| 기술 | 버전 / 서비스 | 채택 이유 |
|---|---|---|
| Ruby | 3.3.10 | Rails 7.2와 호환성이 좋고 안정적인 최신 런타임 |
| Ruby on Rails (API) | 7.2.3 | API 중심 개발에 생산성과 유지보수성의 균형이 좋음 |
| 인증 | JWT + HttpOnly Cookie | 토큰을 HttpOnly 쿠키에 저장해 XSS 리스크를 낮추고 인증 흐름을 단순화 |
| PostgreSQL | Supabase PostgreSQL (운영) | 매니지드 PostgreSQL로 운영 부담을 줄이면서 안정적으로 데이터 저장 |
| Redis | Upstash Redis (매니지드) | prefix 기반 자동완성(autocomplete) 구현을 위해 빠른 조회 성능을 활용 |
| Faraday | 2.14 | Yahoo Finance 등 외부 API 연동을 단순하고 유연하게 구현 |

### 프론트엔드

| 기술 | 버전 / 서비스 | 채택 이유 |
|---|---|---|
| Next.js | 16.1.1 | App Router 기반으로 SSR/SEO와 **BFF(Route Handlers)** 구성이 가능해 통신 구조를 단순화 |
| TypeScript | 5 | 타입 안정성으로 런타임 버그를 줄이고 유지보수성을 향상 |
| TanStack Query (React Query) | 5.90.16 | 서버 상태 캐싱/재요청/무한스크롤 등 데이터 패칭 관리에 최적 |
| lightweight-charts | 5.1.0 | 주가 차트를 가볍고 빠르게 렌더링 가능 |
| Supabase JS | 2.93.3 | Supabase Storage(이미지 업로드) 연동을 간단하게 구현 |
| Sonner | 2.0.7 | 토스트/알림 UI를 가볍게 구성해 UX 개선 |

### 인프라

| 기술 | 버전 / 서비스 | 채택 이유 |
|---|---|---|
| Fly.io | Backend Hosting | Rails API를 컨테이너로 배포/운영하기 간단하고 안정적 |
| Vercel | Frontend Hosting | Next.js와 궁합이 좋고 Git 연동 기반 자동 배포/프리뷰가 편리 |
| Supabase PostgreSQL | Managed DB | 운영 DB를 매니지드로 관리해 운영 부담 감소 |
| Upstash Redis | Managed Redis | prefix 기반 자동완성 등 빠른 조회가 필요한 기능에 활용 |
| Supabase Storage | Managed Storage | 게시글 이미지/아바타 이미지 업로드 및 제공을 단순화 |
| Docker Compose | `infra/docker/compose.yml` | 로컬 개발 환경을 통일해 재현성과 온보딩을 개선 |

### 개발환경 · CI/CD

| 기술 | 버전 / 서비스 | 채택 이유 |
|---|---|---|
| Ruby | 3.3.10 | Rails 실행 환경을 안정적으로 고정 |
| Node.js | 20.19.2 | Next.js 실행 환경을 통일 |
| GitHub Actions | CI/CD | 품질 체크와 배포를 자동화해 운영 효율을 높임 |
| CI (Backend) | Brakeman / RuboCop / Rails test | 보안 점검·코드 품질·회귀 테스트를 자동 수행 |
| CD (Backend) | Fly Deploy Workflow | `main` + `backend/**` 변경 시 백엔드 자동 배포 |
| CD (Frontend) | Vercel Git Integration | 브랜치별 Preview 제공, `main`은 Production 자동 반영 |
| Scheduled Workflows | Rankings / Popular / Sparklines | 정기 배치(랭킹/인기/스파크라인 갱신)를 GitHub Actions 크론으로 실행 |

---

## 과제 해결 / 기술적 포인트
> 아래 항목은 “문제 → 선택 → 이유 → 결과” 흐름으로 짧게 정리하면 임팩트가 큽니다.

- **JWT + HttpOnly Cookie 인증**
  - (TODO) 토큰 저장 전략, 보안 고려사항, 만료/갱신 전략(있다면)
- **BFF(Route Handlers) 구조**
  - (TODO) 브라우저 요청을 Next로 통일, 서버-서버 호출로 인증/통신 단순화
- **Upstash Redis prefix 오토컴플리트**
  - (TODO) 키 설계/조회 방식/성능 개선 포인트
- **GitHub Actions 배치 운영**
  - (TODO) 워커 상시 운영 대신 Cron 채택(비용/운영 단순화) + 실행 흐름

---

## 향후 개선
- 뉴스 API 연동 + AI 요약(투자 정보 탐색 효율 개선)
- 게시글 작성 시 **투표 기능**(의견 수집/집계)
- 이용약관
- 개인정보처리방침

---

## 라이선스
본 프로젝트는 개인 포트폴리오 및 학습 목적으로 제작되었습니다.