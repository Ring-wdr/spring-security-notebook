# Backend Workspace

이 디렉터리는 `start.spring.io` 공식 템플릿으로 생성한 Spring Boot 백엔드 실습 영역입니다.

## Current Stack

- Spring Boot `4.0.6`
- Maven Wrapper (`mvnw`, `mvnw.cmd`)
- Java `21`
- Dependencies: `Spring Web MVC`, `Spring Security`, `Spring Data JPA`, `Spring Data Redis`, `Validation`, `PostgreSQL`, `Actuator`, `Lombok`

## Key Structure

```text
backend/
├─ .mvn/wrapper/
├─ mvnw
├─ mvnw.cmd
├─ pom.xml
├─ HELP.md
└─ src/
   ├─ main/java/
   ├─ main/resources/
   └─ test/java/
```

## Verification

- 인프라 실행: `docker compose up -d`
- 테스트: `.\mvnw.cmd test`
- 백엔드 실행(Windows): `..\scripts\run-backend.ps1`
- 백엔드 실행(Linux/macOS): `bash ../scripts/run-backend.sh`

## Runtime Defaults

- 운영/공용 환경에서 예측 가능한 시크릿으로 부팅되지 않도록 `APP_JWT_SECRET`는 필수 환경변수로 사용합니다.
- `APP_CONTENT_PUBLISHED_SERVICE_TOKEN` and `APP_CONTENT_MANAGEMENT_SERVICE_TOKEN` are optional static service-token credentials for server-to-server content cache reads.
- When configured, each content service token must be at least 32 characters. Use high-entropy generated values; the length check is only a minimum guard.
- Content service tokens authenticate machine principals only and remain read-only: published tokens receive `CONTENT_READ`, management tokens receive `CONTENT_READ` and `CONTENT_DRAFT_READ`.
- In shared environments, restrict service-token traffic to the frontend server at the ingress, VPC, firewall, security group, or API gateway layer.
- Swagger UI and `/v3/api-docs` are public by default for local learning; set `APP_DOCS_PUBLIC_ENABLED=false` in shared environments.
- 데모 계정과 샘플 콘텐츠 초기화는 기본 비활성화 상태이며, `app.bootstrap.demo-data-enabled=true`일 때만 동작합니다.
- 로컬 학습용으로 데모 데이터를 넣고 싶다면 `dev` 프로필로 실행하거나 `APP_BOOTSTRAP_DEMO_DATA_ENABLED=true`를 설정합니다.
- 테스트는 `src/test/resources/application-test.yml`의 전용 secret을 사용하므로 별도 secret 주입 없이 실행할 수 있습니다.

## Notes

- 이 프로젝트는 공식 Initializr 생성물을 기준으로 점진적으로 확장합니다.
- 실습 순서는 `docs/spring-security-notebooklm-docs/` 문서 번호를 따릅니다.
- DB는 PostgreSQL, 토큰/세션성 저장소는 Valkey를 기준으로 확장합니다.
- 환경변수 예시는 루트 `.env.example`에 둡니다.
