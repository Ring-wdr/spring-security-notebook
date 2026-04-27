프론트엔드에서 React/Next 현대화 작업을 할 때는 repo-local `modernize-next-react19` 스킬을 먼저 사용합니다.

프론트엔드 테스트 작업에서는 아래 규칙을 우선합니다.

- 새 UI 기능이나 버그 수정은 failing test부터 작성합니다.
- 순수 판단 로직은 `unit`, client 상호작용은 `component` 테스트로 분리합니다.
- `async` server component는 직접 테스트하지 말고, pure helper 또는 view seam을 먼저 만들고 그 경계를 검증합니다.
- 기본 검증 순서는 `npm run lint`, `npm run test:unit`, `npm run test:components`, `npm test`, `npm run build` 입니다.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
