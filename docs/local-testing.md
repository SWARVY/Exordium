# 로컬 테스트 환경

운영 `.env.local`과 별도로 로컬 Supabase를 사용한다. 준비된 도구는 Colima 0.10.3, Docker CLI 29.8.0, 프로젝트 의존성 Supabase CLI 2.117.0, Playwright Test 1.63.0이다. 패키지는 `bun.lock`으로 재현한다.

## 최초 준비

macOS에서는 Homebrew로 Colima와 Docker CLI를 설치한다. Supabase CLI는 프로젝트 의존성을 사용하므로 별도 전역 설치가 필요 없다.

```sh
brew install colima docker
bun install --frozen-lockfile
mkdir -p /tmp/colima
colima start exordium --cpu 4 --memory 8 --disk 40 --vm-type vz --runtime docker --activate=false --ssh-config=false --mount "$PWD:w" --mount /tmp/colima:w
bunx playwright install chromium --no-remove
```

명령은 저장소 루트에서 실행한다. 위 VM 설정은 현재 18 GiB 메모리의 Apple Silicon Mac에서 사용한 값이다. 다른 머신에서는 자원에 맞춰 조정한다. 기존 Docker Desktop 환경에서도 실행할 수 있지만, `exordium` Colima 소켓이 존재하면 프로젝트 스크립트는 그 소켓을 우선 사용한다.

## 실행과 종료

```sh
bun run db:start
bun run db:status
bun run e2e:serve
```

- 블로그: <http://127.0.0.1:4317>
- Supabase API: <http://127.0.0.1:54321>
- Studio: <http://127.0.0.1:54323>
- DB: `127.0.0.1:54322`

`e2e:serve`는 로컬 CLI에서 연결 정보를 받아 `.env` 자동 로딩 없이 빌드한다. `dist-e2e/client`와 `dist-e2e/server`를 만들고 `4317`에서 실행한다. 앱에는 공개 키만 전달한다. 원격 Supabase URL이나 다른 프로젝트 ID이면 중단한다. Docker 네트워크 `exordium-e2e-local`의 공개 포트는 localhost에만 바인딩한다.

서버는 Ctrl+C로 종료한다. DB를 종료할 때는 다음 명령을 사용한다.

```sh
bun run db:stop
colima stop exordium
```

`db:stop`은 데이터를 보존한다. VM을 다시 시작할 때는 `colima start exordium --activate=false`를 실행한다.

## 초기화와 테스트

```sh
bun run db:reset
bun run test
bun run test:e2e
```

`db:reset`은 **exordium-e2e 로컬 DB의 데이터**를 삭제하고 migration과 seed를 다시 적용한다. 원격 reset 옵션을 받지 않는다. 초기 스키마 파일은 CLI가 인식하도록 `001_schema.sql`로 이름을 바꿨으며 기존 SQL과 버전 `001`은 유지했다.

Playwright 설정은 매번 별도의 테스트 앱을 실행하므로 `e2e:serve`를 종료한 상태에서 `test:e2e`를 실행한다. 실패 시 trace와 screenshot은 Git에서 제외된 `test-results`에 남긴다. 핵심 여정인 인증, 공개 읽기, 외형·설정, 작성, 임시저장, 편집 충돌, 댓글·반응, 프로젝트·프로필을 별도 파일로 검증한다. 실제 저장·권한 검사는 로컬 Auth/DB/Storage를 사용하며, 실패 복구 검사에서만 요청 오류를 주입한다.

Vitest는 `src/**/*.test.{ts,tsx}`의 단위·통합 검사를 담당하고, Playwright는 `e2e`의 실제 브라우저 여정을 담당한다. 둘의 실행 범위와 결과를 구분한다. GitHub OAuth 제공자 왕복은 로컬 테스트 사용자 세션 검증과 별도로 확인한다.

현재 Playwright는 `channel: "chromium"`을 지정해 실제 Chromium의 새 headless 모드를 사용한다. 기본 headless shell과 렌더링 차이가 있어 검증할 브라우저를 명시했다. [Playwright 브라우저 모드](https://playwright.dev/docs/browsers#chromium-new-headless-mode).

로컬 앱의 GitHub 로그인 버튼을 직접 사용하려면 로컬 Supabase에 GitHub 제공자를 별도로 설정해야 한다. E2E는 매번 임시 Auth 사용자를 만들고 실제 비밀번호 세션을 준비한 뒤 테스트가 끝나면 정리한다. 앱에 테스트용 로그인 우회 경로를 추가하지 않는다.

## 확인한 초기 환경 문제

- macOS 27 / Xcode 16.4 조합에서 Homebrew Supabase formula 설치가 실패했다. 프로젝트 CLI 설치로 해결했으며 Xcode 설정은 변경하지 않았다.
- 최초 읽기 전용 Colima 마운트를 쓰기 가능으로 바꾼 뒤, 설정 파일과 현재 마운트 옵션이 달랐다. VM 안에서 해당 경로를 `mount -o remount,rw`로 재마운트해 확인했다. 새 VM은 처음부터 위의 쓰기 가능 마운트로 생성한다.

공식 문서: [Colima](https://github.com/abiosoft/colima), [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started), [Docker 포트 바인딩](https://docs.docker.com/engine/network/drivers/bridge/#default-host-binding-address), [Playwright 웹 서버](https://playwright.dev/docs/test-webserver).

## 유지보수 기준

- 새 기능은 성공·실패·경계 시나리오를 먼저 정한다. CSS 클래스명이나 구현 문자열의 존재로 동작 성공을 판단하지 않는다.
- 순수 규칙은 Vitest, 실제 폼·Jikjo·Supabase SDK 연결은 컴포넌트 통합, 저장→다시 열기는 Playwright로 검증한다. 같은 기대를 모든 층에 복제하지 않는다.
- 데이터 준비와 세션은 `e2e/fixtures.ts`에 둔다. 각 여정의 상태·조작·기대는 해당 spec에 둔다. 테스트는 자기 데이터만 정리하며, 변경하는 기본 프로필/순서는 `finally`에서 복원한다.
- `test-results`의 이미지·trace는 실패 진단용이다. 디자인 완료는 실제 화면의 읽기·포커스·모바일 조작 검토와 함께 판단한다.
- 새 DB 함수는 migration으로 남기고 로컬에서 권한·실패 시 데이터 불변까지 검증한다. 이 작업은 운영 DB에 자동 반영되지 않는다.
- 새 editor 노드나 Jikjo 버전을 도입하면 읽기 렌더러의 지원 여부와 실제 편집→저장→SSR 왕복을 함께 확인한다.
- 입력 중 가시성은 실제 타이핑과 마지막 글자의 화면 위치를 확인한다. macOS의 `End`는 문서 끝 스크롤이므로 줄 끝 이동으로 가정하지 않는다. [Apple 단축키 문서](https://support.apple.com/en-gb/102650).
- 캡처와 DOM 좌표가 다르면 테스트의 입력·스크롤 동작부터 진단한다. 기대값을 낮추거나 강제 스크롤을 넣어 통과시키지 않는다.
- 테마의 `primary`는 기존 면색, `primaryInk`는 작은 강조 글자, `primaryDisplay`는 큰 이름에 사용한다. 텍스트 보정은 원래 OKLCH의 색상·채도를 유지하고 필요한 명도만 조정한다. `e2e/theme-consistency.spec.ts`는 기존 면색의 고정 기대값과 실제 렌더링 대비를 함께 검사한다.
- 디자인 전후 캡처는 데이터·팔레트·모드·viewport를 맞춘다. 페이지 URL과 제목을 확인하고, 최종 화면 증거는 hydration과 관련 비동기 영역의 완료까지 기다린다. SSR 초기 상태를 비교했다면 그 범위를 명시한다. 캡처 파일명만으로 페이지 종류나 완료 상태를 판단하지 않는다.
- 카드 높이·두 줄 말줄임·태그 팝오버는 `e2e/post-card-layout.spec.ts`가 실제 렌더링과 키보드·클릭 동작으로 검증한다. 레이아웃을 대신하는 jsdom 너비 mock이나 클래스 문자열 검사는 추가하지 않는다. `bun run test:e2e e2e/post-card-layout.spec.ts`로 해당 범위만 실행할 수 있다.
