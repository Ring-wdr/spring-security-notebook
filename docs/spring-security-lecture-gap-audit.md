# Spring Security Lecture Gap Audit

이 문서는 `docs/spring-security-notebooklm-docs/01`부터 `10`까지의 강의 흐름을 현재 저장소의 구현과 연결해, 어떤 항목이 이미 구현되어 있고 어떤 항목이 이번 단계에서 학습 표면으로 보강되었는지 빠르게 확인할 수 있게 정리한 audit 문서입니다.

## Audit Legend

- `already covered`: 현재 저장소가 이미 강의의 핵심 기능을 구현하고 있음
- `partially covered`: 기능은 구현되어 있지만 학습 흐름이나 가시성이 부족했음
- `implemented by this phase`: 이번 단계에서 문서/화면/계약 보강으로 학습 가능성이 명확해짐

## 1. Concepts and architecture

- Status: `already covered`
- Backend filter chain, JWT 인증 흐름, 프론트 보호 페이지 구조가 이미 존재한다.
- 홈과 `/learn` 페이지를 함께 보면 anonymous -> login -> protected route 흐름을 한 시스템으로 따라갈 수 있다.

## 2. SecurityConfig and stateless setup

- Status: `already covered`
- `SecurityFilterChain`, CORS, CSRF disable, `SessionCreationPolicy.STATELESS`, form login URL 구성이 이미 적용되어 있다.
- 백엔드 테스트에서 공개 엔드포인트와 기본 시큐리티 동작이 검증된다.

## 3. Subscriber entity, repository, and tests

- Status: `already covered`
- `Subscriber`, `SubscriberRepository`, role collection, repository 테스트가 이미 구현되어 있다.
- seeded demo 계정이 프론트 학습 흐름에서 바로 사용된다.

## 4. UserDetails and UserDetailsService

- Status: `already covered`
- `SubscriberPrincipal`과 `SubscriberUserDetailsService`를 통해 DB 사용자 정보가 Spring Security 인증 과정에 연결되어 있다.
- `/me`와 `/learn` 페이지에서 현재 principal과 role 정보를 확인할 수 있다.

## 5. Success and failure handlers, JWT creation

- Status: `already covered`
- 로그인 성공 시 token pair가 발급되고, 실패 시 JSON 에러 응답이 반환된다.
- 프론트 로그인 액션이 발급된 access token으로 즉시 `/api/users/me`를 호출해 세션 유효성을 확인한다.

## 6. JWT authentication filter

- Status: `already covered`
- `JwtAuthenticationFilter`가 Bearer 토큰을 읽고 `SecurityContextHolder`에 인증 객체를 설정한다.
- 보호 라우트 접근은 이 필터를 전제로 동작한다.

## 7. Bearer token testing and review

- Status: `partially covered`
- 백엔드 Bearer 토큰 테스트는 이미 존재했다.
- 이번 단계 전에는 프론트에서 이 차이를 한 화면에서 학습하기 어려웠고, `/learn` 페이지가 그 관찰 포인트를 정리한다.

## 8. JWT payload safety and error handling

- Status: `implemented by this phase`
- 프론트는 raw JWT를 노출하지 않고 grant type, TTL, role 같은 메타데이터만 보여준다.
- 백엔드는 `401/403`와 refresh token 오류 응답에 일관된 `message`를 추가해 학습용 설명과 테스트 계약을 강화한다.

## 9. Refresh token controller and token rotation

- Status: `implemented by this phase`
- refresh retry, token rotation, logout 후 refresh invalidation을 프론트 학습 문구와 백엔드 테스트로 함께 고정한다.
- 새 public API는 추가하지 않고 기존 `/api/auth/refresh`와 `/api/auth/logout` 계약만 강화한다.

## 10. Final review

- Status: `implemented by this phase`
- `/learn` 페이지, 이 audit 문서, README 링크를 통해 강의 10개가 현재 코드와 어떻게 연결되는지 한 번에 복습할 수 있다.

## Suggested Walkthrough

1. [01-concepts-and-architecture.md](/D:/spring-security-notebook/docs/spring-security-notebooklm-docs/01-concepts-and-architecture.md)부터 [10-final-review.md](/D:/spring-security-notebook/docs/spring-security-notebooklm-docs/10-final-review.md)까지 문서 순서를 훑는다.
2. 브라우저에서 `/learn`를 열어 현재 auth 상태와 강의별 체크포인트를 확인한다.
3. `/login`으로 로그인한 뒤 `/me`, `/content`, `/manage/content`, `/manage/users`를 순서대로 열어 role 기반 차이를 확인한다.
4. 마지막으로 backend / frontend 테스트를 돌려 학습용 계약이 코드 수준에서도 유지되는지 검증한다.
