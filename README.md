# Spring Security Notebook

이 저장소는 `Spring Security Architecture and JWT Implementation Guide`를 바탕으로 Spring Security와 JWT 인증 구조를 실습하고 정리하기 위한 학습용 레포지토리입니다.

## Repository Goal

- Spring Security의 인증(Authentication)과 인가(Authorization) 흐름을 이해합니다.
- `SecurityFilterChain`, `UserDetails`, `UserDetailsService`, JWT 발급/검증 구조를 단계적으로 학습합니다.
- Access Token / Refresh Token 전략, 예외 처리, 테스트 방식까지 실습 가능한 형태로 정리합니다.

## Study Materials

- 핵심 요약 가이드: [spring-security-architecture-jwt-study-guide.md](/D:/spring-security-notebook/spring-security-architecture-jwt-study-guide.md)
- 단계별 실습 문서:
  - [01-concepts-and-architecture.md](/D:/spring-security-notebook/spring-security-notebooklm-docs/01-concepts-and-architecture.md)
  - [02-security-config.md](/D:/spring-security-notebook/spring-security-notebooklm-docs/02-security-config.md)
  - [03-user-entity-repository-test.md](/D:/spring-security-notebook/spring-security-notebooklm-docs/03-user-entity-repository-test.md)
  - [04-userdetails-and-userservice.md](/D:/spring-security-notebook/spring-security-notebooklm-docs/04-userdetails-and-userservice.md)
  - [05-success-failure-handler-and-jwt-creation.md](/D:/spring-security-notebook/spring-security-notebooklm-docs/05-success-failure-handler-and-jwt-creation.md)
  - [06-jwt-authentication-filter.md](/D:/spring-security-notebook/spring-security-notebooklm-docs/06-jwt-authentication-filter.md)
  - [07-bearer-token-testing-and-review.md](/D:/spring-security-notebook/spring-security-notebooklm-docs/07-bearer-token-testing-and-review.md)
  - [08-jwt-payload-and-error-handling.md](/D:/spring-security-notebook/spring-security-notebooklm-docs/08-jwt-payload-and-error-handling.md)
  - [09-refresh-token-controller.md](/D:/spring-security-notebook/spring-security-notebooklm-docs/09-refresh-token-controller.md)
  - [10-final-review.md](/D:/spring-security-notebook/spring-security-notebooklm-docs/10-final-review.md)

## Recommended Learning Flow

1. 먼저 [spring-security-architecture-jwt-study-guide.md](/D:/spring-security-notebook/spring-security-architecture-jwt-study-guide.md)로 전체 구조를 훑습니다.
2. 이후 `spring-security-notebooklm-docs/` 아래 문서를 순서대로 따라가며 구현 포인트를 학습합니다.
3. 마지막에는 JWT 발급, 인증 필터, Refresh Token, 예외 처리, Bearer 토큰 테스트 흐름을 한 번에 연결해서 복습합니다.

## Guide Summary

이 레포의 학습 축은 다음과 같습니다.

- Spring Security는 필터 체인 기반으로 요청을 가로채고 인증/인가를 처리합니다.
- JWT 기반 구성에서는 보통 `SessionCreationPolicy.STATELESS`를 사용하고 서버 세션 상태를 최소화합니다.
- 사용자 정보는 `Entity`, `Repository`, `UserDetails`, `UserDetailsService`를 통해 Security 세계와 연결됩니다.
- 로그인 성공 시 JWT를 발급하고, 요청마다 필터에서 토큰을 검증해 `SecurityContextHolder`에 인증 정보를 저장합니다.
- 실무에서는 Access Token / Refresh Token 분리, 에러 핸들러 구성, 민감 정보 제외, 충분한 길이의 시크릿 키 사용이 중요합니다.

## Skill Usage

이 저장소는 스프링 시큐리티 관련 자료를 정리하거나 확장할 때 설치된 `notebooklm` 스킬을 활용하는 것을 전제로 합니다.

- `notebooklm` 스킬은 학습 자료 요약, 보충 설명, 질의응답, 실습용 아티팩트 생성에 사용합니다.
- 개인정보 또는 계정 식별에 해당하는 notebook id, 인증 정보, 로컬 계정 정보는 문서에 기록하지 않습니다.
- 스킬 호출 여부와 운영 규칙은 [AGENTS.md](/D:/spring-security-notebook/AGENTS.md)에서 관리합니다.
