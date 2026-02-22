# Cabu

> **米国株・日本株の銘柄別コミュニティ + チャート**を1画面で提供する軽量コミュニティサービスです。  
> **情報（チャート/出来高）確認 → 意見（コメント）閲覧/投稿**を素早くつなげるUXを目指しました。

## Links
- サービス: https://cabuapp.com
- Korean README: ./README.kr.md
- Figma（画面設計）: https://www.figma.com/design/VuqGq0HjgLSpIcxZkyb3Nn/stock_community_mobile?node-id=0-1&p=f&t=dZ683DSGNzhnh5Lx-0

---

## デモ動画
[![Demo Video](assets/demo-thumbnail.png)](assets/Cabu_demo.mp4)  
- 視聴: [Cabu Demo](assets/Cabu_demo.mp4)

---

## スクリーンショット

| SEO（Metadata/OG） | Login（JWT HttpOnly + Google） |
|---|---|
| ![SEO](assets/cabu_1.png) | ![Login](assets/cabu_2.png) |

| Main（Rank/Trends） | Search（Redis Prefix Autocomplete） |
|---|---|
| ![MainPage](assets/cabu_3.png) | ![Search](assets/cabu_4.png) |

| Chart（lightweight + Yahoo） | Community（Post/Image/Like/Comment） |
|---|---|
| ![Chart](assets/cabu_5.png) | ![Community](assets/cabu_6.png) |

---

## 開発背景
韓国では軽くて使いやすい株式コミュニティをよく利用していましたが、  
日本の投資環境では **「チャートとコミュニティを1画面で素早く確認できる」** サービスが少ないと感じました。  
初心者でも迷わず使える **軽量で高速な株式コミュニティ** を目指して Cabu を開発しました。

---

## 主な機能
- 会員登録/ログイン（**JWT + HttpOnly Cookie**, Googleログイン）、パスワードリセット
- 銘柄検索 + **オートコンプリート（prefix）**
- 銘柄詳細：**チャート + 出来高 + コミュニティ（コメント）** を1画面で提供
- 投稿/コメント、いいね、ブックマーク
- 人気/急騰/急落などランキング
- お問い合わせ

---

## アーキテクチャ
![Architecture](assets/architecture.png)

Client → Next.js（UI + BFF）→ Rails API の流れでリクエストを処理します。  
認証は Rails がJWTを発行し、Next.js が HttpOnly Cookie（access_token）で管理します。  
UIは「チャート + コミュニティ」を1画面で素早く探索できるように設計しました。  
Rails API は Supabase（PostgreSQL）・Upstash Redis（autocomplete）・Supabase Storage（画像）と連携します。  
また Yahoo Finance API から市況データを取得し、GitHub Actions でバッチを定期実行します。

---

## 技術スタック

### Backend
| 技術 | バージョン / サービス | 採用理由 |
|---|---|---|
| Ruby | 3.3.10 | Rails 7.2 と相性がよく、安定した最新ランタイム |
| Ruby on Rails（API） | 7.2.3 | API中心で開発しやすく、生産性と保守性のバランスが良い |
| 認証 | JWT + HttpOnly Cookie | トークンをHttpOnly Cookieに保存し、XSSリスクを抑えつつ認証フローを単純化 |
| PostgreSQL | Supabase PostgreSQL（本番） | マネージドDBで運用負荷を下げ、安定的にデータを保持 |
| Redis | Upstash Redis（Managed） | prefixベースのオートコンプリートで高速な検索体験を実現 |
| Faraday | 2.14 | Yahoo Finance 等の外部API連携をシンプルに実装 |

### Frontend
| 技術 | バージョン / サービス | 採用理由 |
|---|---|---|
| Next.js | 16.1.1 | App Router + **BFF（Route Handlers）** でSSR/SEOとAPI連携を一体運用 |
| TypeScript | 5 | 型安全性で不具合を早期に検出し、保守性を向上 |
| TanStack Query（React Query） | 5.90.16 | サーバー状態のキャッシュ/再取得/無限スクロールを管理しやすい |
| lightweight-charts | 5.1.0 | 株価チャートを軽量かつ高速に描画可能 |
| Supabase JS | 2.93.3 | Supabase Storage（画像アップロード）連携を簡素化 |
| Sonner | 2.0.7 | 通知（Toast）UIを軽量に実装してUXを改善 |

### Infrastructure
| 技術 | バージョン / サービス | 採用理由 |
|---|---|---|
| Fly.io | Backend Hosting | Rails API をコンテナでシンプルにデプロイ・運用可能 |
| Vercel | Frontend Hosting | Next.js と相性が良く、自動デプロイ/Previewが便利 |
| Supabase PostgreSQL | Managed DB | 運用DBをマネージドで管理し、運用負荷を削減 |
| Upstash Redis | Managed Redis | 高速アクセスが必要な機能（autocomplete等）に利用 |
| Supabase Storage | Managed Storage | 投稿画像/アバター画像の保存・配信を簡素化 |
| Docker Compose | `infra/docker/compose.yml` | ローカル環境を統一し、再現性を確保 |

### Dev Environment · CI/CD
| 技術 | バージョン / サービス | 採用理由 |
|---|---|---|
| Ruby | 3.3.10 | Rails 実行環境を固定し、安定運用 |
| Node.js | 20.19.2 | Next.js 実行環境を統一 |
| GitHub Actions | CI/CD | 品質チェックとデプロイを自動化し、運用効率を向上 |
| CI（Backend） | Brakeman / RuboCop / Rails test | セキュリティ・コード品質・回帰確認を自動化 |
| CD（Backend） | Fly Deploy Workflow | `main` + `backend/**` 変更時にバックエンドを自動デプロイ |
| CD（Frontend） | Vercel Git Integration | ブランチごとPreview、`main`はProductionへ自動反映 |
| Scheduled Workflows | Rankings / Popular / Sparklines | 定期バッチを GitHub Actions で自動実行 |

---

## 課題解決 / 技術的ポイント

- **銘柄メタデータ（i18n）対応：JPX Excel + Override**
  - Yahoo Financeだけでは日本語銘柄名が不足するため、**JPX公式Excelを収集/パース**して日本株マスターを構築しました。
  - 米国株は日本語が存在しないケースが多く、**主要銘柄の日本語Override**で検索/詳細表示の品質を改善しました。

- **React → Next.js 移行（キャッシュ共有 + SEO）**
  - **revalidateベースのキャッシュ**でユーザー間のキャッシュを共有し、外部API呼び出し回数を削減しました。

- **BFF（Route Handlers）でセキュリティ/ CORS / 通信を単純化**
  - ブラウザ要求をNextに集約し、Railsはサーバー間通信で呼び出すことで **CORSなし** の構成にしました。
  - **JWT + HttpOnly Cookie** によりトークンをJSで直接扱わない設計にしました。

- **Upstash Redis Prefix Autocomplete**
  - prefix検索をRedisで処理し、検索レスポンスとUXを改善しました。

- **チャート最適化：Backend Cache + Front Revalidate**
  - Yahoo Financeデータはバックエンドでキャッシュし、フロントで再検証することで **呼び出し削減と最新性** を両立しました。

- **Sidekiq → GitHub Actions（運用/コスト最適化）**
  - 常時ワーカーが不要な処理は **Actions Cron** に移行し、運用を単純化しました。

- **React QueryでUX改善（Infinite + Optimistic）**
  - サーバー状態をキャッシュ管理し、**Infinite Query** と **Optimistic Update** で探索性/反応性を改善しました。

---

## 今後の改善
- ニュースAPI連携 + AI要約
- 投稿の投票機能
- 利用規約 / プライバシーポリシー

---

## ERD
![ERD](assets/erd.png)

---

## License
本プロジェクトは個人ポートフォリオ・学習目的で作成されました。