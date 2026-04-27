# Task 3: Login and JWT Issuance

## Goal

`UserDetailsService`와 로그인 성공/실패 핸들러를 연결해 `/api/auth/login` 호출 시 access token / refresh token이 JSON으로 발급되도록 만든다.

## Scope

- JWT 라이브러리 의존성 추가
- `SubscriberPrincipal`과 `SubscriberUserDetailsService` 추가
- JWT 생성/검증 서비스 추가
- 로그인 성공/실패 핸들러 추가
- `SecurityConfig`에 login processing URL과 handler 연결
- 로그인 성공/실패 통합 테스트 추가

## Verification

- `.\mvnw.cmd test`

## Libraries / Boundaries

- 직접 구현:
  - principal claims 구조
  - login response shape
  - success/failure handler 응답
- 라이브러리에 맡김:
  - token signing/parsing: `jjwt`
  - user auth pipeline: Spring Security

## Notes

- refresh token 저장과 재발급 API는 다음 task에서 확장한다.
- 현재 로그인 요청은 Spring Security login filter 기반으로 처리한다.
