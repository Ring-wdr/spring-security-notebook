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
- 프로덕션 빌드: `npm run build`

## Notes

- 이 프론트엔드는 React 기반이지만, 구조는 Next.js App Router 기준으로 진행합니다.
- 백엔드 Spring Security/JWT 흐름과 연결되는 로그인 화면, 인증 상태 관리, 보호된 페이지 흐름을 단계적으로 추가합니다.
- `next-browser` 스킬 활용을 고려해 Next.js 공식 템플릿 구조를 유지합니다.
