# Task 2: User Domain and SecurityConfig Baseline

## Goal

사용자/권한 모델과 Spring Security 기본 설정을 도입해 이후 JWT/필터/인가 task가 얹힐 수 있는 최소 보안 골격을 만든다.

## Scope

- `Subscriber` 사용자 엔티티와 role enum 추가
- `@ElementCollection` 기반 권한 저장 구조 추가
- `SubscriberRepository`와 `findByEmail` 조회 추가
- `SecurityConfig` / `PasswordEncoder` / CORS / CSRF disable / stateless 정책 추가
- actuator health 공개와 기본 보안 컨텍스트 로딩 확인
- repository 및 보안 설정 검증 테스트 추가
- `.env.example`와 설정 파일에 프론트 origin 키 추가

## Verification

- `.\mvnw.cmd test`

## Libraries / Boundaries

- 직접 구현:
  - 사용자 도메인 필드와 역할 구조
  - repository 조회 메서드
  - SecurityFilterChain 정책
- 라이브러리에 맡김:
  - Password hashing: `BCryptPasswordEncoder`
  - persistence boilerplate: Spring Data JPA
  - security infrastructure: Spring Security

## Notes

- 로그인 핸들러와 JWT 발급은 다음 task에서 추가한다.
- 현재는 health endpoint와 향후 login 경로를 고려한 기본 정책만 세운다.
