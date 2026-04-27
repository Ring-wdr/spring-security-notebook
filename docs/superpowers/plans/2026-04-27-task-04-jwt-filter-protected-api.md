# Task 4: JWT Filter and Protected APIs

## Goal

Bearer token 기반 JWT 인증 필터를 추가하고, 보호 API(`users/me`, `content`, `admin/users`)에 401/403 정책을 실제로 적용한다.

## Scope

- JWT 인증 필터 추가
- 인증 entry point, access denied handler, 전역 예외 처리 추가
- 보호 API용 content/user/admin controller 및 service 추가
- demo data bootstrap 추가
- 보호 API 검증 테스트 추가

## Verification

- `.\mvnw.cmd test`

## Libraries / Boundaries

- 직접 구현:
  - filter skip 규칙
  - claims -> principal 변환
  - role 기반 API 보호 구조
- 라이브러리에 맡김:
  - filter chain / method security: Spring Security
  - persistence: Spring Data JPA

## Notes

- refresh token 저장/재발급은 다음 task에서 Valkey와 함께 확장한다.
