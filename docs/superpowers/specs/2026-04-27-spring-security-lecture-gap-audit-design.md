# Spring Security Lecture Gap Audit And Completion Design

## Goal

이 설계 문서는 `docs/spring-security-notebooklm-docs/01`부터 `10`까지의 강의 흐름, 그리고 NotebookLM 노트북 `Spring Security Architecture and JWT Implementation Guide`를 기준으로 현재 레포가 강의에서 설명하는 기능을 어디까지 구현했는지 점검하고, 부족한 부분을 백엔드와 프론트엔드에 학습용 완성도로 보완하기 위한 기준을 정의한다.

이 작업의 목적은 단순히 “JWT 로그인 예제 하나를 만든다”가 아니다. 강의 10개가 설명하는 인증, 인가, 토큰 수명주기, 테스트, 프론트엔드 연결을 하나의 일관된 실습 표면으로 완성하고, 각 단계의 학습 포인트가 실제 동작하는 코드와 UI에서 확인되도록 만드는 것이다.

## Current Snapshot

현재 저장소는 이미 강의 초반 수준을 넘어선 인증 골격을 갖고 있다.

- 백엔드에는 `SecurityFilterChain`, `Subscriber` 기반 `UserDetailsService`, 로그인 성공/실패 핸들러, JWT 발급/검증, `JwtAuthenticationFilter`, `@PreAuthorize` 기반 역할 제어, refresh/logout API, 예외 핸들러가 존재한다.
- 프론트엔드에는 로그인 액션, 세션 쿠키 저장, 보호된 서버 fetch, 401 시 refresh 재시도, 역할 기반 페이지 노출, 관리자/매니저 화면이 존재한다.
- `backend`의 `.\mvnw.cmd test`는 2026-04-27 기준 통과했고, `frontend`의 `npm test`도 통과했다.
- NotebookLM 노트북에는 강의 10개 YouTube 소스가 모두 연결되어 있으며, NotebookLM 질의 결과도 프로젝트의 핵심 범주를 `backend auth`, `authorization`, `token lifecycle`, `testing`, `frontend integration`으로 요약했다.

따라서 이번 작업은 “강의 기능을 처음부터 새로 만든다”보다 “이미 구현된 인증 시스템을 강의 기준으로 audit하고, 누락된 학습 포인트를 체계적으로 보강한다”로 정의한다.

## Lecture Capability Baseline

강의와 NotebookLM 기준으로 완성 프로젝트가 반드시 보여줘야 하는 기능 범주는 아래와 같다.

### Backend Auth

- 필터 체인 기반 인증 진입 구조
- `UserDetails` / `UserDetailsService`를 통한 DB 사용자 조회
- `BCryptPasswordEncoder` 기반 패스워드 검증
- 로그인 성공 시 JWT 발급
- 로그인 실패 시 JSON 에러 응답

### Authorization

- `ROLE_` 규칙의 역할 모델
- `SecurityContextHolder`에 인증 객체 저장
- `@PreAuthorize` 기반 메서드 보안
- 403 응답을 명확히 구분하는 접근 거부 처리

### Token Lifecycle

- Access Token / Refresh Token 분리
- JWT payload에 민감 정보 제외
- Bearer 토큰 검증 필터
- 만료 Access Token과 유효 Refresh Token을 이용한 재발급
- Refresh Token 만료 임박 시 회전 전략

### Testing

- 사용자/권한 persistence 검증
- 로그인 성공/실패 검증
- 보호 API의 401/403 검증
- Bearer 토큰으로 실제 보호 자원 접근 검증
- Refresh 흐름과 logout 이후 무효화 검증

### Frontend Integration

- CORS와 stateless 백엔드 전제 하의 클라이언트 통신
- 로그인 후 토큰 저장과 보호 페이지 접근
- 401 발생 시 refresh 후 재시도
- 역할별 화면 차등 노출
- 강의 개념을 눈으로 확인할 수 있는 학습용 UI

## Audit Summary

### Already Implemented Well

- `backend/src/main/java/.../auth/config/SecurityConfig.java`에서 stateless, CORS, CSRF 비활성화, form login, handler, JWT 필터 순서가 구성되어 있다.
- `Subscriber`, `SubscriberRepository`, `SubscriberPrincipal`, `SubscriberUserDetailsService`가 강의 3~4단계의 사용자 도메인 연결을 충족한다.
- `LoginSuccessHandler`, `LoginFailureHandler`, `JwtService`가 강의 5단계 핵심인 토큰 발급과 실패 응답을 담당한다.
- `JwtAuthenticationFilter`, `ApiAuthenticationEntryPoint`, `ApiAccessDeniedHandler`, `GlobalExceptionHandler`가 강의 6~8단계의 인증 필터와 에러 처리를 담당한다.
- `AuthService`와 `AuthController`의 refresh/logout 흐름이 강의 9단계 토큰 재발급 전략을 구현하고 있다.
- `JwtProtectedApiTests`, `LoginFlowTests`, `RefreshTokenFlowTests`, `SecurityConfigTests`, `SubscriberRepositoryTests`가 강의 3/5/7/9에 해당하는 검증 기반을 이미 제공한다.
- 프론트엔드의 `session.ts`, `backend-auth.ts`, `loginAction`, `/me`, `/manage/content`, `/manage/users`는 실제 백엔드 인증 흐름을 소비한다.

### Gaps To Close

현재 구현은 기능은 많지만, 강의 전체를 “모든 기능이 구현되고 프론트엔드에 이식된 프로젝트”로 보기엔 몇 가지 간극이 남아 있다.

1. 강의 단계와 실제 화면의 대응 관계가 약하다.
프론트는 동작하지만, 각 강의에서 설명하는 인증/인가/토큰 개념을 사용자가 순서대로 확인하는 학습 UX는 부족하다.

2. 토큰 라이프사이클의 가시성이 낮다.
토큰 TTL, refresh 회전 여부, 401 후 재시도, logout 후 무효화 같은 포인트가 일부 페이지에만 암시적으로 드러난다.

3. 강의 기반 acceptance criteria 문서가 없다.
어떤 강의 기능이 이미 충족됐고 어떤 기능이 보강 대상인지 정리된 체크리스트가 저장소에 없다.

4. 프론트의 보호 흐름이 “작동” 중심이지 “학습 검증” 중심은 아니다.
예를 들어 role별 접근 차이, unauthorized/forbidden 차이, refresh 재발급 결과를 비교 관찰하는 전용 표면이 아직 부족하다.

5. 테스트는 백엔드 중심으로 충분하지만, 프론트에서 강의 학습 포인트를 보존하는 최소 회귀 검증은 아직 얇다.

## Recommended Approach

추천 접근은 “기존 인증 코드를 갈아엎지 않고, 강의 완성도를 드러내는 audit-driven augmentation”이다.

이 접근의 장점은 다음과 같다.

- 이미 통과 중인 백엔드 인증 로직을 불필요하게 흔들지 않는다.
- 강의 문서와 실제 구현 사이의 차이를 체크리스트화할 수 있다.
- 프론트엔드를 단순 소비자 화면이 아니라 학습 실습 콘솔로 진화시킬 수 있다.
- 이후 README와 문서 연결이 쉬워진다.

대안으로는 “강의 문서 순서대로 다시 처음부터 재구현”이 있지만, 현재 저장소에는 이미 더 진전된 흐름이 있으므로 중복 작업이 많고 회귀 위험이 커서 비추천이다.

## Design

### 1. Deliverable Shape

최종 결과물은 세 층으로 구성한다.

- 강의 기준 audit 문서
- 실제 구현 보완 코드
- 강의 포인트를 확인할 수 있는 프론트 학습 표면

### 2. Documentation Layer

문서 계층에서는 강의 1~10 각각에 대해 아래 중 하나로 판정한다.

- already covered
- partially covered
- missing and must implement

이 문서는 구현 전에 acceptance criteria 역할을 하고, 구현 후에는 학습용 진행표 역할을 한다. 위치는 기존 문서 흐름과 연결 가능한 `docs/` 아래가 적절하다.

### 3. Backend Layer

백엔드는 기존 구조를 유지하되, 강의 관점에서 부족한 포인트만 보강한다.

- 인증/인가/토큰 관련 응답 포맷이 프론트 학습 표면에서 안정적으로 소비되도록 맞춘다.
- refresh 회전 규칙, logout 무효화, unauthorized/forbidden 구분을 테스트 가능한 계약으로 고정한다.
- 필요 시 강의 체크리스트를 만족시키는 보조 조회 API를 추가하되, 보안 민감도를 해치지 않는 범위로 제한한다.

### 4. Frontend Layer

프론트는 단순 CRUD 화면이 아니라 “강의 검증용 대시보드” 역할을 맡는다.

구체적으로는 다음을 포함한다.

- 현재 인증 상태와 역할 표시
- access/refresh TTL 및 refresh 재시도 흐름 설명
- anonymous / authenticated / forbidden 상태를 비교할 수 있는 화면
- manager/admin 권한 차이를 확인할 수 있는 진입점
- logout 후 refresh 무효화 같은 토큰 수명주기 관찰 포인트

이 계층은 기존 `App Router + server actions + protected fetch` 패턴을 유지하고, auth semantics를 숨기는 과한 추상화는 피한다.

### 5. Verification Layer

완료 기준은 “코드가 있다”가 아니라 아래가 모두 만족되는 것이다.

- 강의 기준 audit 문서가 저장소에 존재한다.
- 백엔드 테스트가 녹색이다.
- 프론트 테스트와 lint/build가 필요한 범위에서 녹색이다.
- 사용자가 브라우저에서 강의의 주요 개념을 실제로 따라가며 확인할 수 있다.

## Implementation Phases

### Phase 1. Audit Artifact

- 강의 10개 문서와 현재 코드의 매핑표를 만든다.
- 이미 충족된 항목과 누락 항목을 문서화한다.
- 구현 대상 범위를 확정한다.

### Phase 2. Backend Contract Hardening

- 누락된 인증/인가/refresh 계약을 보강한다.
- 필요한 테스트를 추가한다.
- 기존 테스트와 함께 회귀를 확인한다.

### Phase 3. Frontend Learning Surface

- 홈 또는 별도 학습 페이지에서 강의 흐름을 따라갈 수 있는 UI를 만든다.
- 로그인, 현재 principal, role 차이, 토큰 재발급, 오류 상태를 시각적으로 드러낸다.
- 기존 관리자/콘텐츠 화면과 자연스럽게 연결한다.

### Phase 4. Final Documentation And Wiring

- README에서 새 문서/화면을 찾을 수 있게 연결한다.
- 구현 후 문서와 화면이 실제 흐름과 일치하는지 정리한다.

## Risks And Constraints

- 강의 기반 “모든 기능”을 과하게 해석하면 OAuth, 소셜 로그인, 임의의 운영 기능까지 범위가 번질 수 있다. 이번 범위는 현재 노트북과 `01`~`10` 문서가 반복해서 다루는 JWT, role, filter chain, refresh 전략으로 제한한다.
- 보안을 보여주기 위한 학습용 가시성을 늘리더라도 실제 토큰 payload나 민감 정보 노출은 허용하지 않는다.
- 프론트 학습 UX를 위해 디버그 정보를 늘릴 때도 raw JWT 자체를 화면에 그대로 노출할지 여부는 신중히 판단해야 한다.
- `backend` 변경 시 repo-local workflow에 따라 `spotless`, `checkstyle`, `test` 검증이 필요하다.

## Verification Plan

구현 단계로 넘어가면 기본 검증 순서는 아래를 따른다.

- `backend`: `.\mvnw.cmd spotless:apply`
- `backend`: `.\mvnw.cmd checkstyle:check`
- `backend`: `.\mvnw.cmd test`
- `frontend`: `npm run lint`
- `frontend`: `npm test`
- `frontend`: `npm run build` if routing, config, or auth flow semantics change

UI 변화가 크면 로컬 브라우저 확인까지 포함한다.

## Decision

이 작업은 단일 “버그 수정”이 아니라, 강의 프로젝트 전체를 실습 가능한 학습 시스템으로 다듬는 확장 작업이다. 따라서 다음 단계는 바로 구현이 아니라, 이 설계 문서를 기준으로 세부 구현 계획을 작성하고 그 계획에 따라 백엔드 보강과 프론트 이식을 순차적으로 수행하는 것이다.
