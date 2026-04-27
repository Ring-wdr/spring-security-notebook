# Task 1: Infra Foundation

## Goal

PostgreSQL + Valkey 기반의 로컬 개발 인프라를 Docker Compose로 구성하고, backend가 환경변수를 통해 두 서비스를 바라보도록 전환한다.

## Scope

- root `compose.yaml` 추가
- root `.env.example` 추가
- root `.gitignore` 추가 (`.env` 무시)
- backend H2 런타임 제거, PostgreSQL/Redis/Actuator 기준으로 전환
- backend 환경설정 파일을 계층형 구조로 정리
- DB/Valkey 연결 검증 테스트 추가
- README/백엔드 README에 실행 흐름 반영

## Verification

- `docker compose up -d`
- `.\mvnw.cmd test`
- `docker compose ps`

## Libraries / Images

- 직접 구현:
  - Compose 서비스 구조
  - Spring 설정 키 구조
  - 연결 검증 테스트
- 라이브러리에 맡김:
  - DB/JPA: Spring Data JPA
  - Valkey 연동: Spring Data Redis
  - Health: Spring Boot Actuator
  - PostgreSQL: official `postgres` image
  - Valkey: official `valkey/valkey` image

## Notes

- 앱 컨테이너화는 이 task 범위에 넣지 않는다.
- JWT는 아직 발급하지 않지만, secret/issuer 관련 환경변수 키는 미리 고정한다.
