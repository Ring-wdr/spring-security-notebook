# Task 6: Frontend Auth Flow

## Goal

Next.js 프론트에서 로그인, 보호 라우트, content 탐색, manager/admin 관리 화면, access token 자동 재발급 흐름을 연결한다.

## Scope

- auth storage / provider / API client 추가
- login, me, content, content detail, manager content, admin users 페이지 추가
- access token 401 시 refresh 재시도 로직 추가
- 루트 UI를 학습용 대시보드로 교체
- lint/build 및 브라우저 기반 smoke verification

## Verification

- `npm run lint`
- `npm run build`

## Libraries / Boundaries

- 직접 구현:
  - auth context
  - token persistence and retry flow
  - page composition
- 라이브러리에 맡김:
  - routing and rendering: Next.js App Router
  - styling primitives: Tailwind CSS

## Notes

- Base UI는 복잡한 overlay/menu가 필요할 때 우선 검토하고, 이번 범위는 semantic UI로 충분한 수준으로 유지한다.
