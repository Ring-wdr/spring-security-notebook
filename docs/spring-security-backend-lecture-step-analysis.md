# Spring Security 강의 기반 백엔드 Step-by-Step 분석

이 문서는 NotebookLM에 연결된 Spring Security 10개 강의 소스와 현재 `backend/` 구현을 대조해서, 각 강의 포인트가 현재 프로젝트에 어떻게 반영되었는지와 강의 원형 대비 어떤 차이가 있는지를 백엔드 관점에서 정리한 문서입니다.

빠른 현황만 보고 싶다면 [spring-security-lecture-gap-audit.md](spring-security-lecture-gap-audit.md)를 먼저 읽고, 실제 백엔드 클래스 레벨까지 따라가고 싶다면 이 문서를 이어서 보면 됩니다.

## 읽는 법

- `강의 문서`: NotebookLM 기반으로 정리된 강의별 학습 문서
- `현재 백엔드 반영`: 현재 `backend/`에 이미 구현된 대응 지점
- `현재 프로젝트와의 차이`: 강의 예제보다 확장되었거나 설계가 달라진 부분

## 1. 개념 이해와 전체 아키텍처

강의 문서: [01-concepts-and-architecture.md](spring-security-notebooklm-docs/01-concepts-and-architecture.md)

현재 백엔드 반영:
1. [SecurityConfig](../backend/src/main/java/com/example/springsecuritynotebook/auth/config/SecurityConfig.java)에서 stateless `SecurityFilterChain`을 구성하고, 인증/인가가 컨트롤러 전에 필터 체인에서 일어나도록 고정했습니다.
2. [JwtAuthenticationFilter](../backend/src/main/java/com/example/springsecuritynotebook/auth/security/JwtAuthenticationFilter.java)가 Bearer 토큰을 읽고, 유효하면 `SecurityContextHolder`에 인증 객체를 넣습니다.
3. [SubscriberUserDetailsService](../backend/src/main/java/com/example/springsecuritynotebook/auth/application/SubscriberUserDetailsService.java)와 [SubscriberPrincipal](../backend/src/main/java/com/example/springsecuritynotebook/auth/application/SubscriberPrincipal.java)이 도메인 사용자를 Spring Security의 `UserDetails` 세계로 연결합니다.

현재 프로젝트와의 차이:
1. 강의 1단계는 개념 설명 비중이 크지만, 현재 프로젝트는 이미 `/api/users/me`, `/api/content`, `/api/admin/users` 같은 보호 API까지 갖춘 상태입니다.
2. 강의에서는 주로 role 흐름을 설명하지만, 현재 프로젝트는 [SubscriberRole](../backend/src/main/java/com/example/springsecuritynotebook/subscriber/domain/SubscriberRole.java)에서 permission 집합까지 함께 다뤄 이후 인가 단계를 더 세밀하게 가져갑니다.

## 2. SecurityConfig와 무상태 보안 설정

강의 문서: [02-security-config.md](spring-security-notebooklm-docs/02-security-config.md)

현재 백엔드 반영:
1. [SecurityConfig](../backend/src/main/java/com/example/springsecuritynotebook/auth/config/SecurityConfig.java)에서 `csrf.disable()`, `cors()`, `SessionCreationPolicy.STATELESS`, `httpBasic.disable()`을 한 번에 구성합니다.
2. 로그인 엔드포인트는 `/api/auth/login`, 계정 식별 파라미터는 `email`, 비밀번호 파라미터는 `password`로 강의 흐름에 맞게 커스터마이즈되어 있습니다.
3. 로그인 성공/실패 시 각각 [LoginSuccessHandler](../backend/src/main/java/com/example/springsecuritynotebook/auth/handler/LoginSuccessHandler.java), [LoginFailureHandler](../backend/src/main/java/com/example/springsecuritynotebook/auth/handler/LoginFailureHandler.java)가 연결됩니다.
4. `JwtAuthenticationFilter`는 `UsernamePasswordAuthenticationFilter` 앞에 삽입되어 로그인 이후 요청을 먼저 검사합니다.

현재 프로젝트와의 차이:
1. 강의의 기본 설정보다 현재 프로젝트는 `@EnableMethodSecurity`, Swagger, Actuator, `OPTIONS` 프리플라이트, refresh 엔드포인트까지 허용 경로를 더 명시적으로 관리합니다.
2. CORS 허용 origin도 하드코딩 대신 [ClientProperties](../backend/src/main/java/com/example/springsecuritynotebook/auth/config/ClientProperties.java) 기반으로 읽습니다.
3. 401과 403 처리도 기본 화면 리다이렉트가 아니라 JSON 응답으로 고정하기 위해 [ApiAuthenticationEntryPoint](../backend/src/main/java/com/example/springsecuritynotebook/auth/handler/ApiAuthenticationEntryPoint.java)와 [ApiAccessDeniedHandler](../backend/src/main/java/com/example/springsecuritynotebook/auth/handler/ApiAccessDeniedHandler.java)를 따로 붙였습니다.

## 3. 사용자 Entity, Repository, Repository Test

강의 문서: [03-user-entity-repository-test.md](spring-security-notebooklm-docs/03-user-entity-repository-test.md)

현재 백엔드 반영:
1. [Subscriber](../backend/src/main/java/com/example/springsecuritynotebook/subscriber/domain/Subscriber.java)는 `email`을 PK로 사용하고 `password`, `nickname`, `social`, `roleList`를 가집니다.
2. role은 `@ElementCollection`으로 분리 저장되며, [SubscriberRepository](../backend/src/main/java/com/example/springsecuritynotebook/subscriber/persistence/SubscriberRepository.java)의 `findByEmail()`은 `@EntityGraph(attributePaths = "roleList")`로 role을 함께 로딩합니다.
3. [SubscriberRepositoryTests](../backend/src/test/java/com/example/springsecuritynotebook/subscriber/persistence/SubscriberRepositoryTests.java)에서 저장 후 조회 시 role collection이 실제로 로딩되는지까지 검증합니다.

현재 프로젝트와의 차이:
1. 강의는 사용자와 role 저장 준비가 중심이지만, 현재 프로젝트는 role enum이 단순 라벨이 아니라 permission 집합을 품고 있습니다.
2. 즉 현재 구조는 “로그인용 사용자 저장”을 넘어서 이후 `@PreAuthorize` 인가 규칙까지 바로 이어지는 도메인 모델입니다.

## 4. UserDetails와 UserDetailsService 연결

강의 문서: [04-userdetails-and-userservice.md](spring-security-notebooklm-docs/04-userdetails-and-userservice.md)

현재 백엔드 반영:
1. [SubscriberUserDetailsService](../backend/src/main/java/com/example/springsecuritynotebook/auth/application/SubscriberUserDetailsService.java)가 `loadUserByUsername()`에서 이메일로 사용자를 찾고, 없으면 `UsernameNotFoundException`을 던집니다.
2. 조회된 도메인 객체는 [SubscriberPrincipal](../backend/src/main/java/com/example/springsecuritynotebook/auth/application/SubscriberPrincipal.java)로 변환됩니다.
3. `SubscriberPrincipal`은 Spring Security `User`를 상속하면서 email, nickname, social, roleNames를 별도 필드로 유지합니다.

현재 프로젝트와의 차이:
1. 강의에서는 `UserDetailsService`가 repository를 바로 사용할 수 있지만, 현재 프로젝트는 [SubscriberUserLookup](../backend/src/main/java/com/example/springsecuritynotebook/subscriber/application/SubscriberUserLookup.java) 포트를 두어 auth 계층이 persistence에 직접 묶이지 않게 했습니다.
2. `SubscriberPrincipal`은 role만 담지 않고 permission까지 authority로 펼쳐 넣기 때문에, 이후 컨트롤러에서 `ROLE_ADMIN` 대신 `USER_ROLE_UPDATE` 같은 세부 권한 체크가 가능합니다.

## 5. 로그인 성공/실패 처리와 JWT 발급

강의 문서: [05-success-failure-handler-and-jwt-creation.md](spring-security-notebooklm-docs/05-success-failure-handler-and-jwt-creation.md)

현재 백엔드 반영:
1. [LoginSuccessHandler](../backend/src/main/java/com/example/springsecuritynotebook/auth/handler/LoginSuccessHandler.java)는 인증 성공 시 principal을 꺼내 [AuthService](../backend/src/main/java/com/example/springsecuritynotebook/auth/application/AuthService.java)에 토큰 발급을 위임합니다.
2. [JwtService](../backend/src/main/java/com/example/springsecuritynotebook/auth/application/JwtService.java)는 access/refresh 토큰을 생성하고, 응답은 [TokenPairResponse](../backend/src/main/java/com/example/springsecuritynotebook/auth/application/TokenPairResponse.java)로 고정합니다.
3. 로그인 실패 시 [LoginFailureHandler](../backend/src/main/java/com/example/springsecuritynotebook/auth/handler/LoginFailureHandler.java)가 `ERROR_LOGIN` JSON을 반환합니다.
4. [LoginFlowTests](../backend/src/test/java/com/example/springsecuritynotebook/auth/application/LoginFlowTests.java)에서 실제 로그인 결과가 Bearer grant type, access token, refresh token, 만료 시간을 모두 포함하는지 검증합니다.

현재 프로젝트와의 차이:
1. 강의는 success handler 안에서 곧바로 JWT 유틸을 써서 응답을 만드는 흐름에 가깝지만, 현재 프로젝트는 handler -> service -> JWT service로 책임을 더 분리했습니다.
2. refresh token은 발급만 하고 끝나지 않고 [RefreshTokenStore](../backend/src/main/java/com/example/springsecuritynotebook/auth/application/RefreshTokenStore.java)에 저장됩니다.
3. 토큰에는 `jti`가 들어가고, access payload는 [AccessTokenClaims](../backend/src/main/java/com/example/springsecuritynotebook/auth/application/AccessTokenClaims.java)로 타입화되어 password 같은 민감 정보가 설계상 들어갈 수 없게 만들었습니다.

## 6. JWTAuthenticationFilter로 요청 인증 처리

강의 문서: [06-jwt-authentication-filter.md](spring-security-notebooklm-docs/06-jwt-authentication-filter.md)

현재 백엔드 반영:
1. [JwtAuthenticationFilter](../backend/src/main/java/com/example/springsecuritynotebook/auth/security/JwtAuthenticationFilter.java)는 `OncePerRequestFilter` 기반입니다.
2. `shouldNotFilter()`에서 로그인, refresh, Actuator, Swagger, `OPTIONS` 요청을 필터 대상에서 제외합니다.
3. `Authorization` 헤더가 `Bearer `로 시작하면 토큰을 분리하고, `JwtService.validateAccessToken()`으로 검증한 뒤 `SecurityContextHolder`에 인증을 저장합니다.
4. 잘못된 토큰이나 잘못된 스킴은 `ERROR_ACCESS_TOKEN` JSON으로 즉시 응답합니다.

현재 프로젝트와의 차이:
1. 강의에서는 주로 “토큰을 읽고 principal을 세팅한다”에 집중하지만, 현재 프로젝트는 여기에 폐기된 access token 차단까지 추가했습니다.
2. [AccessTokenBlocklist](../backend/src/main/java/com/example/springsecuritynotebook/auth/application/AccessTokenBlocklist.java)가 logout 이후 동일 access token 재사용을 막습니다.
3. Swagger/OpenAPI 같은 학습/운영 보조 표면까지 skip 목록에 포함한 점도 강의 예제보다 실무적입니다.

## 7. Bearer 토큰 테스트와 중간 점검

강의 문서: [07-bearer-token-testing-and-review.md](spring-security-notebooklm-docs/07-bearer-token-testing-and-review.md)

현재 백엔드 반영:
1. [JwtProtectedApiTests](../backend/src/test/java/com/example/springsecuritynotebook/auth/security/JwtProtectedApiTests.java)에서 토큰 없는 요청의 401, 권한 부족의 403, 유효 토큰의 정상 접근을 모두 자동 검증합니다.
2. 같은 테스트에서 user, manager, admin 세 role을 나눠 `/api/users/me`, `/api/content`, `/api/admin/users` 동작 차이를 확인합니다.
3. [SecurityConfigTests](../backend/src/test/java/com/example/springsecuritynotebook/auth/config/SecurityConfigTests.java)는 Swagger 문서 접근과 JWT filter skip 동작까지 점검합니다.

현재 프로젝트와의 차이:
1. 강의는 HTTP Client나 Postman 같은 수동 확인 흐름 비중이 크지만, 현재 프로젝트는 주요 인증/인가 시나리오를 통합 테스트로 고정했습니다.
2. 강의의 “Bearer 토큰으로 보호 API 확인”이 현재 프로젝트에서는 “role과 permission에 따라 서로 다른 API가 어떻게 차등 허용되는지 검증”하는 수준으로 확장됐습니다.

## 8. JWT payload 정리와 예외 응답 표준화

강의 문서: [08-jwt-payload-and-error-handling.md](spring-security-notebooklm-docs/08-jwt-payload-and-error-handling.md)

현재 백엔드 반영:
1. [AccessTokenClaims](../backend/src/main/java/com/example/springsecuritynotebook/auth/application/AccessTokenClaims.java)는 email, nickname, social, roleNames만 payload로 다룹니다.
2. [GlobalExceptionHandler](../backend/src/main/java/com/example/springsecuritynotebook/auth/handler/GlobalExceptionHandler.java), [ApiAuthenticationEntryPoint](../backend/src/main/java/com/example/springsecuritynotebook/auth/handler/ApiAuthenticationEntryPoint.java), [ApiAccessDeniedHandler](../backend/src/main/java/com/example/springsecuritynotebook/auth/handler/ApiAccessDeniedHandler.java)가 각각 400/401/403 흐름을 나눠 처리합니다.
3. 응답 포맷은 모두 [ErrorResponse](../backend/src/main/java/com/example/springsecuritynotebook/auth/handler/ErrorResponse.java)로 통일됩니다.
4. [UserController](../backend/src/main/java/com/example/springsecuritynotebook/subscriber/api/UserController.java), [ContentController](../backend/src/main/java/com/example/springsecuritynotebook/content/api/ContentController.java), [AdminSubscriberController](../backend/src/main/java/com/example/springsecuritynotebook/subscriber/api/AdminSubscriberController.java)에는 `@PreAuthorize`가 붙어 있어 permission 기반 인가가 컨트롤러 레벨에서도 드러납니다.

현재 프로젝트와의 차이:
1. 강의는 raw `Map`과 예외 핸들러 설명이 중심이지만, 현재 프로젝트는 claims와 error contract를 record/typed response로 굳혔습니다.
2. `ERROR_UNAUTHORIZED`, `ERROR_ACCESS_DENIED`, `ERROR_ACCESS_TOKEN`, `ERROR_BAD_REQUEST`, `ERROR_REFRESH_TOKEN`처럼 실패 종류를 구분한 점도 강의보다 더 명시적입니다.
3. role 기반 설명을 permission 기반 API 보호까지 확장한 것이 가장 큰 차이입니다.

## 9. Refresh Token 재발급과 logout 이후 무효화

강의 문서: [09-refresh-token-controller.md](spring-security-notebooklm-docs/09-refresh-token-controller.md)

현재 백엔드 반영:
1. [AuthController](../backend/src/main/java/com/example/springsecuritynotebook/auth/api/AuthController.java)의 `/api/auth/refresh`가 refresh 진입점입니다.
2. [AuthService](../backend/src/main/java/com/example/springsecuritynotebook/auth/application/AuthService.java)는 access token에서 email을 읽고, refresh token의 email과 대조하고, 저장소에 저장된 refresh token과도 일치하는지 검증합니다.
3. [RefreshTokenStore](../backend/src/main/java/com/example/springsecuritynotebook/auth/application/RefreshTokenStore.java)는 Valkey에 refresh token을 저장하고 TTL을 기준으로 재발급 시점을 판단합니다.
4. refresh token 만료가 임박하면 새 refresh token으로 회전시키고, 아니면 기존 refresh token을 유지합니다.
5. logout 시에는 refresh token을 invalidate하고, access token은 blocklist에 등록합니다.
6. [RefreshTokenFlowTests](../backend/src/test/java/com/example/springsecuritynotebook/auth/application/RefreshTokenFlowTests.java)에서 재발급, role 변경 반영, logout 후 refresh 차단, near-expiry rotation까지 검증합니다.

현재 프로젝트와의 차이:
1. 강의는 refresh endpoint 자체와 만료 계산 로직을 중심으로 설명하지만, 현재 프로젝트는 “서버 저장소와의 일치 여부”까지 검증합니다.
2. 강의 문서에도 적혀 있듯 Redis/DB 저장 로직은 원본 범위 밖인데, 현재 프로젝트는 바로 그 저장소 계층을 실제로 추가한 상태입니다.
3. logout 이후 access token 재사용 차단까지 포함하므로, 현재 구조는 단순 refresh 예제를 넘어 토큰 수명주기 전체를 관리합니다.

## 10. 전체 복습과 현재 프로젝트의 최종 상태

강의 문서: [10-final-review.md](spring-security-notebooklm-docs/10-final-review.md)

현재 백엔드 반영:
1. 강의 1~9의 핵심 흐름인 `SecurityConfig -> UserDetailsService -> login handlers -> JWT filter -> protected API -> refresh`가 현재 `backend/`에서 모두 연결되어 있습니다.
2. 여기에 [OpenApiConfig](../backend/src/main/java/com/example/springsecuritynotebook/shared/config/OpenApiConfig.java) 기반 Swagger 문서화, permission 기반 관리자 API, logout 무효화, 테스트 자동화가 추가되어 있습니다.
3. 따라서 현재 백엔드는 “강의 예제를 따라 만든 최소 구현”이 아니라 “강의 흐름을 실습 가능한 API 시스템으로 확장한 결과물”에 가깝습니다.

현재 프로젝트와의 차이:
1. 강의는 이해와 구현 순서 정리에 초점이 있지만, 현재 프로젝트는 재사용 가능한 계약과 테스트까지 포함한 학습용 백엔드입니다.
2. 가장 큰 확장 포인트는 permission 모델, typed claims/error contract, Valkey 기반 refresh 저장소, access token blocklist, Swagger/OpenAPI 검증입니다.

## 요약 판단

1. 강의 1~6의 핵심 백엔드 구현은 현재 프로젝트에 거의 직접적으로 반영되어 있습니다.
2. 강의 7~9는 현재 프로젝트에서 더 강하게 구현되어 있습니다. 특히 테스트 자동화, refresh 저장소 검증, logout 후 access token 무효화는 강의보다 한 단계 더 나간 부분입니다.
3. 따라서 현재 백엔드를 읽을 때는 “강의를 그대로 복사한 코드”로 보기보다 “강의 개념을 유지한 채 실습 프로젝트 수준으로 확장한 구현”으로 이해하는 것이 맞습니다.
