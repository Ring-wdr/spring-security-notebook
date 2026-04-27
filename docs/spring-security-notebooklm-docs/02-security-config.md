# Spring Security 설정 및 SecurityConfig 상세 학습 가이드

본 문서는 'SpringSecurity 02 - 설정(SecurityConfig) (2/10)' 소스 내용을 바탕으로 작성되었습니다.

---

## 1. 문서 개요
이 문서는 Spring Security의 핵심 설정 클래스인 `SecurityConfig`를 작성하고, 필터 체인(Filter Chain)을 통해 요청을 제어하는 방법을 다룹니다. 특히 REST API 환경에서 필수적인 **CORS, CSRF, 세션 정책 설정**과 **패스워드 암호화 알고리즘 등록** 과정을 상세히 설명합니다 [1], [2].

## 2. 핵심 개념 정리
*   **SecurityFilterChain:** 스프링 시큐리티에서 인증과 인가 처리를 담당하는 필터들의 집합입니다. 빈(Bean)으로 등록하여 요청이 이 필터들을 거치도록 설정합니다 [2], [3].
*   **CSRF (Cross-Site Request Forgery):** 사용자가 의도하지 않은 요청을 통해 서버 리소스를 조작하는 공격입니다. 본 소스에서는 JWT를 사용하므로 보안상의 이유로 이 기능을 비활성화(Disable)합니다 [4].
*   **CORS (Cross-Origin Resource Sharing):** 출발지(Origin)가 다른 클라이언트(웹 브라우저, 모바일 앱 등)가 서버 리소스에 접근할 수 있도록 허용하는 정책입니다 [4], [5].
*   **Stateless (무상태성):** 서버가 클라이언트의 상태를 유지하지 않는 방식입니다. REST API에서는 세션을 사용하지 않기 위해 세션 정책을 `STATELESS`로 설정합니다 [6].
*   **BCryptPasswordEncoder:** 패스워드를 안전하게 암호화하기 위한 알고리즘으로, 현재 가장 널리 권장되는 방식 중 하나입니다 [7].

## 3. 요청 흐름 또는 동작 원리
1.  **요청 수신:** 클라이언트의 HTTP 요청이 서버에 도달합니다.
2.  **FilterChainProxy 작동:** `FilterChainProxy`가 요청을 가로채서 설정된 필터 체인으로 보냅니다 [3], [4].
3.  **필터 통과:** 요청은 `SecurityFilterChain`에 정의된 여러 필터(CORS, CSRF 등)를 순차적으로 거치며 검증을 받습니다 [3].
4.  **보안 정책 적용:** 설정에 따라 세션을 생성하지 않거나(`STATELESS`), 허용된 도메인의 요청인지(`CORS`) 확인합니다 [5], [6].
5.  **최종 도달:** 모든 필터를 무사히 통과한 요청만 실제 비즈니스 로직(컨트롤러 등)으로 전달됩니다.

## 4. 코드/설정 포인트
*   **@Configuration 등록:** 클래스 상단에 `@Configuration`을 붙여 스프링이 실행될 때 설정 정보를 빈으로 등록하게 합니다 [2].
*   **HTTP 시큐리티 빌드:** `http.csrf()`, `http.cors()`, `http.sessionManagement()` 등을 체이닝 방식으로 설정한 후 최종적으로 `http.build()`를 호출합니다 [3], [4], [6].
*   **CORS 세부 설정:**
    *   `setAllowedOriginPatterns`: 모든 출발지(`*`) 또는 특정 도메인을 허용합니다 [5], [8].
    *   `setAllowedMethods`: GET, POST, DELETE, PATCH 등 허용할 HTTP 메서드를 지정합니다 [9].
    *   `setAllowedHeaders`: Authorization, Content-Type 등 클라이언트가 보낼 수 있는 헤더를 정의합니다 [5].
    *   `setAllowCredentials(true)`: 로그인 상태를 유지하거나 토큰을 재사용할 수 있도록 설정합니다 [10].
*   **세션 정책:** `SessionCreationPolicy.STATELESS`를 통해 서버가 세션을 생성하거나 유지하지 않도록 강제합니다 [6].
*   **PasswordEncoder 빈 등록:** `BCryptPasswordEncoder` 객체를 생성하여 시큐리티가 암호화 검증 시 사용할 수 있도록 빈으로 등록합니다 [7].

## 5. 실무 관점 주의사항
*   **패키지 구조:** 실무에서는 `security` 패키지 하위에 `config`, `handler`, `service`, `dto` 등으로 세분화하여 관리하는 경우가 많습니다 [1].
*   **도메인 용어 사용:** 엔티티(Entity) 대신 '도메인(Domain)'이라는 용어를 패키지 명으로 자주 사용하며, 이는 쇼핑몰 데이터 등 해당 업무 영역의 데이터를 의미합니다 [1].
*   **로그 확인:** 설정 클래스가 정상적으로 로딩되었는지 확인하기 위해 초기 개발 단계에서 로그(`log.info`)를 찍어 빈 등록 여부를 체크하는 것이 좋습니다 [3].
*   **CORS의 Credential 설정:** 오픈 API처럼 다수의 사용자가 호출하고 즉시 응답을 종료해야 하는 경우, 서버 자원 절약을 위해 `AllowCredentials`를 `false`로 설정하기도 합니다 [10].

## 6. 자주 헷갈리는 포인트
*   **Arrays.asList() vs List.of():** `List.of()`는 Java 9 이상에서 사용 가능하며, 생성된 리스트가 수정 불가능(Immutable)하여 보안 설정과 같이 값이 변하면 안 되는 곳에 적합합니다 [8].
*   **PUT vs PATCH:** 본 소스에서는 전체 수정을 의미하는 `PUT` 대신 부분 수정을 의미하는 `PATCH`를 주로 사용하도록 설정했습니다 [9].
*   **CORS 경로 설정:** 특정 API 경로(예: `/api/**`)에만 CORS 정책을 적용할지, 모든 경로(`/**`)에 적용할지 명확히 구분해야 합니다 [10], [8].

## 7. 복습 체크리스트
- [ ] `SecurityFilterChain`을 빈으로 등록하는 이유를 이해했는가? [2]
- [ ] JWT 환경에서 왜 CSRF를 비활성화(Disable)하는지 설명할 수 있는가? [4]
- [ ] CORS 설정에서 `AllowCredentials`가 `true`일 때의 효과는 무엇인가? [10]
- [ ] REST API에서 세션 정책을 `STATELESS`로 설정해야 하는 이유는 무엇인가? [6]
- [ ] 패스워드 암호화 시 `BCrypt` 알고리즘의 특징은 무엇인가? [7]

## 8. 확인 문제 5개
1.  **Spring Security 설정 클래스에서 빈 등록 여부를 확인하기 위해 로그를 찍는 이유는 무엇입니까?**
    *   (정답: 설정이 제대로 로딩되지 않아 빈이 등록되지 않았을 때 발생하는 문제를 확인하기 위해) [3]
2.  **모바일 앱이나 다른 도메인의 클라이언트가 서버 API에 접근할 수 있도록 허용하는 설정의 명칭은?**
    *   (정답: CORS / Cross-Origin Resource Sharing) [4]
3.  **수정 불가능한 리스트를 만들기 위해 Java 9 이후부터 권장되는 리스트 생성 메서드는?**
    *   (정답: `List.of()`) [8]
4.  **세션 관리 정책 중 서버가 상태를 유지하지 않도록 설정하는 옵션 값은?**
    *   (정답: `SessionCreationPolicy.STATELESS`) [6]
5.  **시큐리티 필터 체인 설정에서 최종적으로 설정을 완성하고 객체를 생성하는 메서드는?**
    *   (정답: `http.build()`) [3]

---
**이 소스에서는 다루지 않음:** JWT 토큰의 실제 생성 로직, `UserDetailsService`의 구체적인 구현 내용, 핸들러(`Success/FailureHandler`)의 내부 코드 등은 본 소스의 범위가 아닙니다 [1], [6].