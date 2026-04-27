# Spring Security Notebook

이 저장소는 `Spring Boot + Next.js(React)` 기반 프로젝트로 Spring Security 클린 패턴을 실습하고 정리하기 위한 학습용 레포지토리입니다. 문서 학습에 그치지 않고, 백엔드 인증 구조와 프론트엔드 인증 흐름을 함께 연결해 보면서 `Spring Security + JWT` 아키텍처를 단계적으로 구현하는 것을 목표로 합니다.

## Project Goal

- Spring Boot 백엔드와 Next.js 프론트엔드를 함께 구성하며 인증/인가 흐름을 실습합니다.
- `SecurityFilterChain`, `UserDetails`, `UserDetailsService`, JWT 발급/검증, Refresh Token 전략을 단계적으로 구현합니다.
- Spring Security를 단순 설정 모음이 아니라 역할이 분리된 클린 패턴 관점으로 이해합니다.
- 구현 가이드, 테스트 포인트, 보안상 주의점을 문서와 코드 흐름으로 함께 축적합니다.

## Project Direction

이 프로젝트는 다음 원칙으로 진행합니다.

- 프로젝트 형태는 `Spring Boot backend + Next.js frontend` 조합으로 진행합니다.
- Spring Boot 일반 구현 가이드는 설치된 `java-springboot` 스킬을 참고합니다.
- Spring Security 보안 학습과 참고 자료는 `notebooklm` 기반 README 및 학습 문서 흐름을 우선 사용합니다.
- 프론트엔드는 `create-next-app`, 백엔드는 `start.spring.io` 공식 템플릿을 기준으로 확장합니다.
- 개발 순서는 강의 순서와 동일하게 가져갑니다.
- 즉, `docs/spring-security-notebooklm-docs/`의 문서 번호가 곧 실습 및 구현 순서입니다.
- 앞 문서에서 만든 개념과 구조를 다음 단계의 기반으로 삼으며, 번호를 건너뛰지 않고 순차적으로 진행합니다.

## Directory Structure

아래 구조는 공식 템플릿 생성 이후의 현재 기본 구조입니다.

```text
spring-security-notebook/
├─ backend/
│  ├─ .mvn/wrapper/
│  ├─ mvnw
│  ├─ mvnw.cmd
│  ├─ pom.xml
│  ├─ HELP.md
│  └─ src/
│     ├─ main/java/
│     ├─ main/resources/
│     └─ test/java/
├─ frontend/
│  ├─ src/app/
│  ├─ public/
│  ├─ package.json
│  ├─ next.config.ts
│  ├─ tsconfig.json
│  └─ README.md
├─ docs/
│  ├─ spring-security-notebooklm-docs/
│  ├─ spring-security-architecture-jwt-study-guide.md
│  └─ superpowers/plans/
├─ AGENTS.md
└─ README.md
```

각 영역의 실습 초점은 다음과 같습니다.

- `backend`: `start.spring.io`로 생성한 Spring Boot 프로젝트이며 현재는 Maven wrapper, JPA, Security, Validation, PostgreSQL, Valkey 연동, Actuator 구성을 포함합니다.
- `frontend`: `create-next-app`으로 생성한 Next.js App Router 프로젝트이며 현재는 TypeScript, ESLint, Tailwind 기본 구성을 포함합니다.
- `target/`, `.next/`, `node_modules/` 같은 빌드 산출물은 문서 구조 설명에서 제외합니다.

## Study Materials

- 핵심 요약 가이드: [spring-security-architecture-jwt-study-guide.md](/D:/spring-security-notebook/docs/spring-security-architecture-jwt-study-guide.md)
- 단계별 실습 문서:
  - [01-concepts-and-architecture.md](/D:/spring-security-notebook/docs/spring-security-notebooklm-docs/01-concepts-and-architecture.md)
  - [02-security-config.md](/D:/spring-security-notebook/docs/spring-security-notebooklm-docs/02-security-config.md)
  - [03-user-entity-repository-test.md](/D:/spring-security-notebook/docs/spring-security-notebooklm-docs/03-user-entity-repository-test.md)
  - [04-userdetails-and-userservice.md](/D:/spring-security-notebook/docs/spring-security-notebooklm-docs/04-userdetails-and-userservice.md)
  - [05-success-failure-handler-and-jwt-creation.md](/D:/spring-security-notebook/docs/spring-security-notebooklm-docs/05-success-failure-handler-and-jwt-creation.md)
  - [06-jwt-authentication-filter.md](/D:/spring-security-notebook/docs/spring-security-notebooklm-docs/06-jwt-authentication-filter.md)
  - [07-bearer-token-testing-and-review.md](/D:/spring-security-notebook/docs/spring-security-notebooklm-docs/07-bearer-token-testing-and-review.md)
  - [08-jwt-payload-and-error-handling.md](/D:/spring-security-notebook/docs/spring-security-notebooklm-docs/08-jwt-payload-and-error-handling.md)
  - [09-refresh-token-controller.md](/D:/spring-security-notebook/docs/spring-security-notebooklm-docs/09-refresh-token-controller.md)
  - [10-final-review.md](/D:/spring-security-notebook/docs/spring-security-notebooklm-docs/10-final-review.md)

## Development Order

실습은 아래 순서대로 진행합니다.

1. [01-concepts-and-architecture.md](/D:/spring-security-notebook/docs/spring-security-notebooklm-docs/01-concepts-and-architecture.md): 전체 인증/인가 구조 이해
2. [02-security-config.md](/D:/spring-security-notebook/docs/spring-security-notebooklm-docs/02-security-config.md): `SecurityConfig`, CORS, CSRF, 세션 정책 구성
3. [03-user-entity-repository-test.md](/D:/spring-security-notebook/docs/spring-security-notebooklm-docs/03-user-entity-repository-test.md): 사용자 엔티티, 리포지토리, 테스트 기반 준비
4. [04-userdetails-and-userservice.md](/D:/spring-security-notebook/docs/spring-security-notebooklm-docs/04-userdetails-and-userservice.md): Security World와 사용자 도메인 연결
5. [05-success-failure-handler-and-jwt-creation.md](/D:/spring-security-notebook/docs/spring-security-notebooklm-docs/05-success-failure-handler-and-jwt-creation.md): 로그인 성공/실패 처리와 JWT 발급
6. [06-jwt-authentication-filter.md](/D:/spring-security-notebook/docs/spring-security-notebooklm-docs/06-jwt-authentication-filter.md): 요청 필터에서 JWT 인증 처리
7. [07-bearer-token-testing-and-review.md](/D:/spring-security-notebook/docs/spring-security-notebooklm-docs/07-bearer-token-testing-and-review.md): Bearer 토큰 테스트와 흐름 점검
8. [08-jwt-payload-and-error-handling.md](/D:/spring-security-notebook/docs/spring-security-notebooklm-docs/08-jwt-payload-and-error-handling.md): JWT payload 설계와 예외 응답 정리
9. [09-refresh-token-controller.md](/D:/spring-security-notebook/docs/spring-security-notebooklm-docs/09-refresh-token-controller.md): Refresh Token 재발급 흐름 구현
10. [10-final-review.md](/D:/spring-security-notebook/docs/spring-security-notebooklm-docs/10-final-review.md): 전체 아키텍처 복습과 마무리 점검

## Recommended Learning Flow

1. 먼저 [spring-security-architecture-jwt-study-guide.md](/D:/spring-security-notebook/docs/spring-security-architecture-jwt-study-guide.md)로 전체 구조를 훑습니다.
2. 이후 `docs/spring-security-notebooklm-docs/` 문서를 번호 순서대로 따라가며 구현합니다.
3. 백엔드 인증 흐름과 Next.js 프론트엔드 인증 흐름을 함께 연결해서 점검합니다.
4. 마지막에는 JWT 발급, 인증 필터, Refresh Token, 예외 처리, 테스트 흐름을 하나의 시스템으로 복습합니다.

## Local Infra Quick Start

이 프로젝트의 로컬 인프라는 `Docker Desktop + docker compose` 기준으로 관리합니다.

1. 루트에서 환경 파일을 준비합니다.
   - `Copy-Item .env.example .env`
2. 인프라를 실행합니다.
   - `docker compose up -d`
3. backend 테스트로 PostgreSQL/Valkey 연결을 확인합니다.
   - `cd backend`
   - `.\mvnw.cmd test`

기본 서비스는 아래 두 가지입니다.

- PostgreSQL: `localhost:5432`
- Valkey: `localhost:6379`

백엔드 헬스 엔드포인트는 `http://localhost:8080/actuator/health`입니다.

## Guide Summary

이 레포의 학습 축은 다음과 같습니다.

- Spring Security는 필터 체인 기반으로 요청을 가로채고 인증/인가를 처리합니다.
- JWT 기반 구성에서는 보통 `SessionCreationPolicy.STATELESS`를 사용하고 서버 세션 상태를 최소화합니다.
- 사용자 정보는 `Entity`, `Repository`, `UserDetails`, `UserDetailsService`를 통해 Security 세계와 연결됩니다.
- 로그인 성공 시 JWT를 발급하고, 요청마다 필터에서 토큰을 검증해 `SecurityContextHolder`에 인증 정보를 저장합니다.
- 프론트엔드는 발급된 토큰을 이용해 로그인 상태를 유지하고 보호된 페이지 및 API 호출 흐름을 제어합니다.
- 실무에서는 Access Token / Refresh Token 분리, 에러 핸들러 구성, 민감 정보 제외, 충분한 길이의 시크릿 키 사용이 중요합니다.

## Skill Usage

이 저장소는 스프링 시큐리티 관련 자료를 정리하거나 확장할 때 설치된 `notebooklm` 스킬을 활용하는 것을 전제로 합니다.

- `notebooklm` 스킬은 학습 자료 요약, 보충 설명, 질의응답, 실습용 아티팩트 생성에 사용합니다.
- 프론트엔드 현대화 작업은 repo-local `modernize-next-react19` 스킬을 우선 사용하고, 브라우저 확인이 필요할 때 그 흐름 안에서 `next-browser`를 사용합니다.
- 개인정보 또는 계정 식별에 해당하는 notebook id, 인증 정보, 로컬 계정 정보는 문서에 기록하지 않습니다.
- 스킬 호출 여부와 운영 규칙은 [AGENTS.md](/D:/spring-security-notebook/AGENTS.md)에서 관리합니다.
