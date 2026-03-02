<div align="center">

<img src="./public/favicon.svg" width="80" height="80" alt="Exordium logo" />

# Exordium

**A personal engineering blog platform**

[![TanStack Start](https://img.shields.io/badge/TanStack_Start-React_19-blue?style=flat-square)](https://tanstack.com/start)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=flat-square)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06b6d4?style=flat-square)](https://tailwindcss.com)
[![Bun](https://img.shields.io/badge/Bun-package_manager-fbf0df?style=flat-square)](https://bun.sh)

[한국어](./README.md) · [日本語](./README.ja.md)

</div>

---

### Overview

Exordium is a personal engineering blog platform with GitHub OAuth authentication. Write posts with a Lexical-powered rich text editor, and let visitors interact through comments and emoji reactions. Built for a single owner/operator with Korean, English, and Japanese UI support.

### Features

- **Posts** — Lexical rich text editor, image upload, tags, infinite scroll, 30-second draft auto-save
- **Comments & Reactions** — Any GitHub-authenticated visitor can comment, 1-depth replies, emoji reactions
- **Open Source Projects** — Drag-and-drop reorderable project showcase
- **Theming** — Light/dark mode + 5 color palettes (persisted in localStorage)
- **i18n** — Korean / English / Japanese UI switching
- **SSR** — TanStack Start server-side rendering with no hydration mismatches

### Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | TanStack Start (React 19) |
| Routing | TanStack Router |
| Server State | TanStack Query v5 |
| Editor | @jikjo/core (Lexical-based) |
| Styling | Tailwind CSS v4 + tailwind-variants |
| UI Components | Base UI + basecn registry |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Form Validation | TanStack Form + Valibot |
| Package Manager | Bun |

### Getting Started

#### 1. Clone the repository

```bash
git clone https://github.com/your-username/exordium.git
cd exordium
bun install
```

#### 2. Configure environment variables

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OWNER_ID=your-supabase-user-id
```

> `VITE_OWNER_ID` is the UUID assigned after your first GitHub login via Supabase Authentication.

#### 3. Run Supabase migrations

In Supabase Dashboard → SQL Editor, run in order:

```
supabase/migrations/001-init-tables.sql
supabase/migrations/002-rls-policies.sql
supabase/migrations/003-open-source.sql
```

#### 4. Configure GitHub OAuth

Supabase Dashboard → Authentication → URL Configuration:

- **Site URL**: `https://your-domain.com`
- **Redirect URLs** — add both:
  - `https://your-domain.com/auth/callback`
  - `http://localhost:3000/auth/callback`

#### 5. Start development server

```bash
bun run dev
```

#### 6. Production build & start

```bash
bun run build
bun run start
```

#### 7. Run with Docker (optional)

```bash
docker build -t exordium .
docker run -p 3000:3000 --env-file .env.local exordium
```

### Project Structure

Follows Feature-Sliced Design (FSD) architecture.

```
src/
├── entities/      # Domain entities (post, comment, user, owner, open-source, reaction)
├── features/      # User interaction units (create-post, toggle-reaction, manage-open-source, ...)
├── widgets/       # Composite UI blocks (header, footer, post-list, comment-section, ...)
├── shared/        # Common utils, hooks, UI components, i18n, config
└── routes/        # Route files (routing logic only, no UI implementation)

supabase/
└── migrations/    # SQL migration files
```

### Scripts

```bash
bun run dev        # Start dev server
bun run build      # Production build
bun run start      # Start production server
bun run lint       # oxlint static analysis
bun run fmt        # oxfmt code formatting
bun run test       # vitest test runner
```

---

<div align="center">
  <sub>Built with <a href="https://tanstack.com/start">TanStack Start</a></sub>
</div>
