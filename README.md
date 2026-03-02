<div align="center">

<img src="./public/favicon.svg" width="80" height="80" alt="Exordium logo" />

# Exordium

**개인 엔지니어링 블로그 플랫폼**

[![TanStack Start](https://img.shields.io/badge/TanStack_Start-React_19-blue?style=flat-square)](https://tanstack.com/start)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=flat-square)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06b6d4?style=flat-square)](https://tailwindcss.com)
[![Bun](https://img.shields.io/badge/Bun-package_manager-fbf0df?style=flat-square)](https://bun.sh)

[English](./README.en.md) · [日本語](./README.ja.md)

</div>

---

### 소개

Exordium은 GitHub OAuth 기반 인증을 사용하는 개인 엔지니어링 블로그 플랫폼입니다. Lexical 기반 리치 텍스트 에디터로 게시글을 작성하고, 방문자는 댓글과 이모지 리액션으로 소통할 수 있습니다. Owner(운영자) 1인 체제로 설계되어 있으며 한국어·영어·일본어 UI를 지원합니다.

### 주요 기능

- **게시글** — Lexical 기반 리치 텍스트 에디터, 이미지 업로드, 태그, 무한 스크롤, 30초 자동 임시저장
- **댓글 & 리액션** — GitHub 계정으로 로그인한 누구나 참여 가능, 1-depth 답글, 이모지 리액션
- **오픈소스 프로젝트** — 드래그 앤 드롭으로 순서 변경 가능한 프로젝트 목록
- **테마** — 라이트/다크 모드 + 5가지 컬러 팔레트 (localStorage 유지)
- **i18n** — 한국어 / 영어 / 일본어 UI 전환
- **SSR** — TanStack Start 기반 서버사이드 렌더링, hydration mismatch 없음

### 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | TanStack Start (React 19) |
| 라우팅 | TanStack Router |
| 서버 상태 | TanStack Query v5 |
| 에디터 | @jikjo/core (Lexical 기반) |
| 스타일 | Tailwind CSS v4 + tailwind-variants |
| UI 컴포넌트 | Base UI + basecn 레지스트리 |
| 백엔드 | Supabase (PostgreSQL + Auth + Storage) |
| 폼 검증 | TanStack Form + Valibot |
| 패키지 매니저 | Bun |

### 시작하기

#### 1. 저장소 클론

```bash
git clone https://github.com/your-username/exordium.git
cd exordium
bun install
```

#### 2. 환경 변수 설정

`.env.example`을 참고해 `.env.local`을 생성합니다.

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OWNER_ID=your-supabase-user-id
```

> `VITE_OWNER_ID`는 Supabase Authentication에서 GitHub 로그인 후 발급되는 UUID입니다.

#### 3. Supabase 마이그레이션

Supabase 대시보드 → SQL Editor에서 아래 파일을 순서대로 실행합니다.

```
supabase/migrations/001-init-tables.sql
supabase/migrations/002-rls-policies.sql
supabase/migrations/003-open-source.sql
```

#### 4. GitHub OAuth 설정

Supabase 대시보드 → Authentication → URL Configuration:

- **Site URL**: `https://your-domain.com`
- **Redirect URLs**에 아래 두 URL 추가:
  - `https://your-domain.com/auth/callback`
  - `http://localhost:3000/auth/callback`

#### 5. 개발 서버 실행

```bash
bun run dev
```

#### 6. 프로덕션 빌드 & 실행

```bash
bun run build
bun run start
```

#### 7. Docker로 실행 (선택)

```bash
docker build -t exordium .
docker run -p 3000:3000 --env-file .env.local exordium
```

### 프로젝트 구조

Feature-Sliced Design(FSD) 아키텍처를 따릅니다.

```
src/
├── entities/      # 도메인 엔티티 (post, comment, user, owner, open-source, reaction)
├── features/      # 사용자 인터랙션 단위 (create-post, toggle-reaction, manage-open-source, ...)
├── widgets/       # 복합 UI 블록 (header, footer, post-list, comment-section, ...)
├── shared/        # 공용 유틸, 훅, UI 컴포넌트, i18n, 설정
└── routes/        # 라우트 파일 (라우팅 로직만, UI 구현 없음)

supabase/
└── migrations/    # SQL 마이그레이션 파일
```

### 스크립트

```bash
bun run dev        # 개발 서버 실행
bun run build      # 프로덕션 빌드
bun run start      # 프로덕션 서버 실행
bun run lint       # oxlint 정적 분석
bun run fmt        # oxfmt 코드 포맷
bun run test       # vitest 테스트 실행
```

---

<div align="center">
  <sub>Built with <a href="https://tanstack.com/start">TanStack Start</a></sub>
</div>
