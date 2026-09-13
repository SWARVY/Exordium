<div align="center">

<img src="./public/favicon.svg" width="80" height="80" alt="Exordium logo" />

# Exordium

**個人エンジニアリングブログプラットフォーム**

[![TanStack Start](https://img.shields.io/badge/TanStack_Start-React_19-blue?style=flat-square)](https://tanstack.com/start)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=flat-square)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06b6d4?style=flat-square)](https://tailwindcss.com)
[![Bun](https://img.shields.io/badge/Bun-package_manager-fbf0df?style=flat-square)](https://bun.sh)

[한국어](./README.md) · [English](./README.en.md)

</div>

---

### 概要

Exordium は GitHub OAuth 認証を使用する個人エンジニアリングブログプラットフォームです。Lexical ベースのリッチテキストエディタで記事を作成し、訪問者はコメントと絵文字リアクションで交流できます。オーナー（運営者）1人制で設計されており、韓国語・英語・日本語の UI をサポートします。

### 主な機能

- **記事** — Lexical リッチテキストエディタ、画像アップロード、タグ、無限スクロール、30秒自動下書き保存
- **コメント & リアクション** — GitHub 認証済み訪問者なら誰でも参加可能、1段階返信、絵文字リアクション
- **オープンソースプロジェクト** — ドラッグ＆ドロップで並び替え可能なプロジェクト一覧
- **テーマ** — ライト/ダークモード + 6種類のカラーパレット（localStorage 保持）
- **i18n** — 韓国語 / 英語 / 日本語 UI 切り替え
- **SSR** — TanStack Start によるサーバーサイドレンダリング（公開記事の本文を含む）

### 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | TanStack Start (React 19) |
| ルーティング | TanStack Router |
| サーバー状態 | TanStack Query v5 |
| エディタ | @jikjo/core (Lexical ベース) |
| スタイリング | Tailwind CSS v4 + tailwind-variants |
| UI コンポーネント | Base UI + basecn レジストリ |
| バックエンド | Supabase (PostgreSQL + Auth + Storage) |
| フォームバリデーション | TanStack Form + Valibot |
| パッケージマネージャー | Bun |

### はじめ方

#### 1. リポジトリのクローン

```bash
git clone https://github.com/your-username/exordium.git
cd exordium
bun install
```

#### 2. 環境変数の設定

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
VITE_SITE_URL=http://localhost:3000
```

> `VITE_SUPABASE_PUBLISHABLE_KEY` に Publishable key を設定します。既存環境向けに `VITE_SUPABASE_ANON_KEY` もフォールバックとして対応し、両方を設定した場合は新しい変数を優先します。管理者権限は Supabase ユーザーの `app_metadata.role = "owner"` で判定します。本番ビルドでは `VITE_SITE_URL` を公開ドメインに設定してください。

> 以下の SQL は新規プロジェクトの初期化専用です。`seed.sql` のプロフィールを編集してから適用し、既存のデータベースには再適用しないでください。

#### 3. Supabase マイグレーションの実行

Supabase ダッシュボード → SQL Editor で以下を順番に実行します。

```
supabase/migrations/001_schema.sql
supabase/seed.sql
```

既存の運用 DB には `supabase/migrations/20260911084300_atomic_open_source_ordering.sql` を追加適用してください。プロジェクトの並び順を単一トランザクションで保存します。新規環境でも初期スキーマの後に適用が必要です。PR のマージでは DB migration は自動実行されません。

#### 4. GitHub OAuth の設定

Supabase ダッシュボード → Authentication → URL Configuration:

- **Site URL**: `https://your-domain.com`
- **Redirect URLs** に以下の 2 つを追加:
  - `https://your-domain.com/auth/callback`
  - `http://localhost:3000/auth/callback`

#### 5. 開発サーバーの起動

```bash
bun run dev
```

#### 6. 本番ビルド & 起動

```bash
bun run build
bun run start
```

#### 7. Docker で実行（任意）

```bash
docker build -t exordium .
docker run -p 3000:3000 --env-file .env.local exordium
```

### プロジェクト構成

Feature-Sliced Design (FSD) アーキテクチャに従います。

```
src/
├── entities/      # ドメインエンティティ (post, comment, user, owner, open-source, reaction)
├── features/      # ユーザーインタラクション単位 (create-post, toggle-reaction, manage-open-source, ...)
├── widgets/       # 複合 UI ブロック (header, footer, post-list, comment-section, ...)
├── shared/        # 共通ユーティリティ、フック、UI コンポーネント、i18n、設定
└── routes/        # ルートファイル（ルーティングロジックのみ、UI 実装なし）

supabase/
└── migrations/    # SQL マイグレーションファイル
```

### スクリプト

```bash
bun run dev        # 開発サーバー起動
bun run build      # 本番ビルド
bun run start      # 本番サーバー起動
bun run lint       # oxlint 静的解析
bun run fmt        # oxfmt コードフォーマット
bun run test       # vitest テスト実行
```

---

<div align="center">
  <sub>Built with <a href="https://tanstack.com/start">TanStack Start</a></sub>
</div>

ローカル専用 Supabase とテストの実行方法は [ローカルテスト環境](docs/local-testing.md) を参照してください（韓国語）。
