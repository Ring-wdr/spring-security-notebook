# Backend Workspace

이 디렉터리는 `start.spring.io` 공식 템플릿으로 생성한 Spring Boot 백엔드 실습 영역입니다.

## Current Stack

- Spring Boot `4.0.6`
- Maven Wrapper (`mvnw`, `mvnw.cmd`)
- Java `21`
- Dependencies: `Spring Web MVC`, `Spring Security`, `Spring Data JPA`, `Validation`, `H2`, `Lombok`

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

- 테스트: `.\mvnw.cmd test`

## Notes

- 이 프로젝트는 공식 Initializr 생성물을 기준으로 점진적으로 확장합니다.
- 실습 순서는 `docs/spring-security-notebooklm-docs/` 문서 번호를 따릅니다.
