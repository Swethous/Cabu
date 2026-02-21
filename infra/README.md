# Infra README

`cabu` のインフラ運用メモ

`main` へのマージで Backend（Fly）/ Frontend（Vercel）が自動デプロイ

## 構成
- Docker Compose: `infra/docker/compose.yml`
- Backend: `backend`（Rails / Fly.io）
- Frontend: `frontend`（Next.js / Vercel）

## ローカル起動（Docker）
リポジトリルートで実行します。

```bash
docker compose -f infra/docker/compose.yml up --build
```

停止:

```bash
docker compose -f infra/docker/compose.yml down
```

## Backend デプロイ（Fly.io）
`backend` ディレクトリで実行します。

```bash
fly deploy --remote-only
```

リリースコマンドが詰まった時:

```bash
fly ssh console -a stock-community -C "bin/rails db:migrate"
fly deploy --skip-release-command --remote-only --yes
```

## Frontend デプロイ（Vercel）
通常は Git 連携で自動デプロイ。  
事前確認用:

```bash
cd frontend && npm run build
```

## よく使う確認（Fly）
```bash
fly status -a stock-community
fly logs -a stock-community
```
