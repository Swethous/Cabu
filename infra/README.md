# Infra Runbook

이 문서는 `cabu` 모노레포의 로컬 실행/배포/운영 명령을 정리합니다.

## 1) 구조

- Docker Compose: `infra/docker/compose.yml`
- Backend: `backend` (Rails, Fly.io 배포)
- Frontend: `frontend` (Next.js, Vercel 배포 권장)
- Env 템플릿: `env/.env.*.example`


## 2) 로컬 실행 (Docker)

루트(`cabu`)에서 실행:

```bash
docker compose -f infra/docker/compose.yml up --build
```

백그라운드 실행:

```bash
docker compose -f infra/docker/compose.yml up -d --build
```

중지/정리:

```bash
docker compose -f infra/docker/compose.yml down
docker compose -f infra/docker/compose.yml down -v
```

로그/상태:

```bash
docker compose -f infra/docker/compose.yml ps
docker compose -f infra/docker/compose.yml logs -f
docker compose -f infra/docker/compose.yml logs -f backend
```

컨테이너 진입:

```bash
docker compose -f infra/docker/compose.yml exec backend bash
docker compose -f infra/docker/compose.yml exec db psql -U postgres
```

마이그레이션(수동):

```bash
docker compose -f infra/docker/compose.yml exec backend bin/rails db:migrate
```

기존 이름 충돌(`stock_community_*`)이 남은 경우:

```bash
docker rm -f stock_community_web stock_community_db_container stock_community_redis 2>/dev/null || true
```

## 4) 배포

### Backend (Fly.io)

수동 배포:

```bash
cd backend
fly deploy --remote-only
```

릴리즈 커맨드 타임아웃 시:

```bash
cd backend
fly ssh console -a stock-community -C "bin/rails db:migrate"
fly deploy --skip-release-command --remote-only --yes
```

릴리즈 타임아웃 여유를 늘려서 배포:

```bash
cd backend
fly deploy --remote-only --release-command-timeout 15m
```

CI 자동 배포:

- `.github/workflows/fly-deploy.yml`
- `main` 브랜치에 `backend/**` 변경 push 시 실행

### Frontend (Vercel 권장)

현재 레포는 프론트 자동 배포 워크플로우가 별도로 없으므로 Vercel 프로젝트 연결 후 배포:

```bash
cd frontend
npm run build
```

## 5) 운영 점검 (Fly)

```bash
cd backend
fly status -a stock-community
fly logs -a stock-community
fly machine list -a stock-community
```

앱/워커 스케일 확인/조정:

```bash
cd backend
fly scale show -a stock-community
fly scale count app=1 worker=1 -a stock-community
```

원격 콘솔:

```bash
cd backend
fly ssh console -a stock-community
```

## 6) Issue Migration (Old Repo -> New Repo)

닫힌 이슈 포함 전체 이슈를 이전하려면:

```bash
cd /Users/min/workspace/project/cabu
./infra/scripts/transfer_issues.sh --from <OLD_OWNER/OLD_REPO> --to <NEW_OWNER/NEW_REPO>
```

위 명령은 기본이 dry-run(미실행)입니다. 실제 이전 실행:

```bash
cd /Users/min/workspace/project/cabu
./infra/scripts/transfer_issues.sh --from <OLD_OWNER/OLD_REPO> --to <NEW_OWNER/NEW_REPO> --confirm
```

예시:

```bash
cd /Users/min/workspace/project/cabu
./infra/scripts/transfer_issues.sh --from Swethous/stock_community --to Swethous/Cabu --confirm
```

요구사항:
- `gh` CLI 설치 및 로그인(`gh auth login`)
- 이슈 이전 권한 보유
