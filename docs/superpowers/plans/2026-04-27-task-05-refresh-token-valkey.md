# Task 5: Refresh Token and Valkey Session Strategy

## Goal

refresh token을 Valkey에 저장하고, `/api/auth/refresh`와 `/api/auth/logout`을 통해 재발급과 최소 무효화를 수행한다.

## Scope

- refresh token 저장 서비스 추가
- 로그인 성공 시 refresh token Valkey 저장 연결
- refresh / logout API 추가
- access 만료 허용 claims 파싱 추가
- refresh 토큰 TTL 기반 재발급 기준 추가
- refresh 관련 통합 테스트 추가

## Verification

- `.\mvnw.cmd test`

## Libraries / Boundaries

- 직접 구현:
  - refresh 저장 키 전략
  - refresh 재발급 정책
  - logout 무효화 흐름
- 라이브러리에 맡김:
  - key-value persistence: Spring Data Redis
  - token parsing/signing: `jjwt`

## Notes

- 현재는 사용자당 단일 refresh token 전략으로 간다.
