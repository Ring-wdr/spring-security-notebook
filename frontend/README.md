# Frontend Workspace

이 디렉터리는 `create-next-app` 공식 템플릿으로 생성한 Next.js 프론트엔드 실습 영역입니다.

## Current Stack

- Next.js `16.2.4`
- React `19`
- TypeScript
- App Router
- ESLint
- Tailwind CSS

## Key Structure

```text
frontend/
├─ src/app/
├─ public/
├─ package.json
├─ next.config.ts
├─ tsconfig.json
└─ eslint.config.mjs
```

## Verification

- 개발 서버: `npm run dev`
- 린트: `npm run lint`
- 유닛 테스트: `npm run test:unit`
- 컴포넌트 테스트: `npm run test:components`
- 전체 테스트: `npm test`
- 테스트 watch 모드: `npm run test:watch`
- 프로덕션 빌드: `npm run build`

## TDD Workflow

- 새 프론트 기능이나 버그 수정은 먼저 failing test부터 작성합니다.
- 순수 함수, 경로/리다이렉트 판단, 에러 매핑, 네비게이션 계산은 `unit` 테스트로 검증합니다.
- 사용자 상호작용이 있는 client component는 `MSW + RTL + Vitest(jsdom)` 기반 `component` 테스트로 검증합니다.
- `async` server component 자체를 직접 테스트하지 않고, 필요한 판단 로직을 pure helper나 작은 view seam으로 분리해 검증합니다.
- 기본 검증 순서는 `npm run lint -> npm run test:unit -> npm run test:components -> npm test -> npm run build` 입니다.

## Environment

- API base URL 예시는 `frontend/.env.example`에 둡니다.
- 기본값은 `http://localhost:8080`이며, 로컬 backend와 직접 연결됩니다.

## Notes

- 이 프론트엔드는 React 기반이지만, 구조는 Next.js App Router 기준으로 진행합니다.
- 백엔드 Spring Security/JWT 흐름과 연결되는 로그인 화면, 인증 상태 관리, 보호된 페이지 흐름을 단계적으로 추가합니다.
- `next-browser` 스킬 활용을 고려해 Next.js 공식 템플릿 구조를 유지합니다.
