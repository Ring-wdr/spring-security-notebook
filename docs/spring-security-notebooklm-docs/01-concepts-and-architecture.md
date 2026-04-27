# Spring Security 및 JWT 개념 학습 가이드 (Part 1)

본 문서는 'SpringSecurity 01 - 개념 이해하기 (1/10)' 소스 내용을 바탕으로 작성되었습니다.

원본 강의: [SpringSecurity 01 - 개념 이해하기 (1/10)](https://youtu.be/7VC2wV0OH24?si=NKmVDTH8fcER9WBF)

---

## 1. 문서 개요
이 문서는 Spring Security의 기본 아키텍처, 인증/인가 프로세스, 그리고 JWT(JSON Web Token)의 기초 개념을 다룹니다. 클라이언트의 요청이 서버에 도달하기 전 보안 필터가 어떻게 동작하며, 개발자가 어떤 인터페이스를 구현해야 하는지 자세히 설명합니다 [1], [2].

## 2. 핵심 개념 정리
*   **인증(Authentication) vs 인가(Authorization):** 인증은 '로그인 여부(누구인지)'를 확인하는 것이고, 인가는 '권한(어떤 것을 할 수 있는지)'을 확인하는 것입니다 [1], [3].
*   **필터 체인(Filter Chain):** 클라이언트 요청이 `DispatcherServlet`에 가기 전 거치는 여러 필터의 묶음입니다. 보안 관련 처리는 주로 이곳에서 이루어집니다 [1], [4].
*   **CORS(Cross-Origin Resource Sharing):** 도메인이나 포트가 다른 서버 간에 리소스(API, 이미지 등)를 공유할 수 있게 허용하는 설정입니다 [5].
*   **CSRF(Cross-Site Request Forgery):** 사용자가 의도하지 않은 요청을 통해 서버 리소스를 조작하는 공격을 방지하는 보안 설정입니다 [5], [6].
*   **JWT(JSON Web Token):** 클라이언트에 전달하는 인증 토큰으로, **Header(알고리즘), Payload(데이터), Signature(조작 방지)**로 구성됩니다 [7].

## 3. 요청 흐름 또는 동작 원리
1.  **클라이언트 요청:** 브라우저에서 아이디(이메일)와 패스워드를 담아 요청을 보냅니다 [1].
2.  **인증 필터(`AuthenticationFilter`):** 요청을 가장 먼저 받아 정보를 확인하고 `UsernamePasswordAuthenticationToken`을 생성합니다 [1], [8].
3.  **인증 관리자(`AuthenticationManager`):** 인터페이스이며 실체인 `ProviderManager`를 통해 인증을 진행합니다 [8].
4.  **인증 제공자(`AuthenticationProvider`):** 실제 인증 로직을 수행하며(예: JWT 프로바이더), `UserDetailsService`를 호출합니다 [8].
5.  **데이터 조회(`UserDetailsService`):** DB에서 사용자 정보를 조회합니다. 이때 JPA 리포지토리가 사용됩니다 [9], [2].
6.  **패스워드 검증:** `BCryptPasswordEncoder` 등을 사용하여 DB의 암호화된 비밀번호와 입력값을 비교합니다 [8], [7].
7.  **결과 처리:** 인증 성공 시 `SuccessHandler`가 동작하여 JWT 토큰 등을 발행하고, 실패 시 `FailureHandler`가 동작합니다 [9], [10], [7].

## 4. 코드/설정 포인트
*   **`SecurityConfig` (설정 클래스):** 로그인 페이지 경로, 세션/JWT 사용 여부, CORS/CSRF 정책, 핸들러 등록 등을 관장하는 '관제탑' 역할을 합니다 [6], [3].
*   **`UserDetailsService` 구현:** 스프링 시큐리티가 사용자를 인식할 수 있도록 반드시 이 인터페이스를 `implements`하여 DB 조회 로직을 작성해야 합니다 [2], [11].
*   **`UserDetails` 또는 `User` 클래스:** 사용자 데이터를 담는 객체입니다. 엔티티나 DTO가 이를 상속(`extends`)받거나 구현하여 스프링 시큐리티의 규격에 맞춰야 합니다 [2], [12].
*   **`BCryptPasswordEncoder`:** 패스워드를 해싱하여 저장하고 검증할 때 사용합니다 [8].
*   **필터 끼워넣기:** 우리가 만든 보안 설정은 `SecurityFilterChain`을 통해 기존 필터들 사이에 끼워져 동작하게 됩니다 [4], [12].

## 5. 실무 관점 주의사항
*   **JWT 데이터 노출:** JWT의 Payload는 누구나 복호화하여 내용을 볼 수 있습니다. 따라서 **패스워드, 계좌번호, 주민번호와 같은 민감 정보는 절대 Payload에 넣으면 안 됩니다** [13].
*   **조작 방지:** JWT의 시그니처(Signature)는 데이터 조작을 막는 역할만 할 뿐, 데이터 자체를 암호화하여 숨기는 용도가 아닙니다 [13].
*   **패스워드 보안:** 성능 좋은 컴퓨터로 해킹하는 것을 어렵게 하기 위해 해싱을 반복하는 **BCrypt** 알고리즘 사용이 권장됩니다 [8].
*   **CORS 설정:** 보안을 위해 모든 도메인(`*`)을 허용하기보다, 실제 서비스하는 특정 도메인만 허용하도록 정밀하게 설정해야 합니다 [5].
*   **CSRF 대응:** `Referer` 체크 등을 통해 신뢰할 수 있는 도메인에서 온 요청인지 확인해야 합니다 [6].

## 6. 자주 헷갈리는 포인트
*   **필터 vs 인터셉터:** 필터는 `DispatcherServlet` 앞에서 동작하고, 인터셉터는 `DispatcherServlet`과 컨트롤러 사이에서 동작합니다. 보안 처리는 주로 필터에서 수행합니다 [1].
*   **JWT와 세션의 보안성:** 세션 방식은 `httpOnly` 쿠키 등을 통해 자바스크립트 조작을 막을 수 있어 보안상 더 안전할 수 있지만, 확장성 때문에 JWT가 널리 쓰입니다 [13].
*   **JWT 복호화:** 누구나 JWT를 복호화해서 볼 수 있지만(`Base64` 인코딩), 서버에 있는 비밀키가 없으면 내용을 조작하는 것은 불가능합니다 [13].

## 7. 복습 체크리스트
- [ ] 인증(Authentication)과 인가(Authorization)의 차이를 설명할 수 있나요? [3]
- [ ] `UserDetailsService`를 왜 직접 구현해야 하는지 알고 있나요? [2]
- [ ] JWT의 세 가지 구성 요소(Header, Payload, Signature)의 역할을 이해했나요? [7], [13]
- [ ] CORS 설정이 왜 필요한지 설명할 수 있나요? [5]
- [ ] `AuthenticationManager`와 `AuthenticationProvider`의 관계를 이해했나요? [8]

## 8. 확인 문제 5개
1.  **Spring Security에서 클라이언트 요청을 가장 먼저 받아 인증 처리를 시작하는 필터의 이름은?**
    *   (정답: `AuthenticationFilter`) [1], [8]
2.  **사용자 정보를 DB에서 읽어오기 위해 개발자가 반드시 구현해야 하는 시큐리티 인터페이스는?**
    *   (정답: `UserDetailsService`) [2], [10]
3.  **JWT 구성 요소 중 데이터의 위변조 여부를 확인하여 보안을 유지하는 부분은?**
    *   (정답: 시그니처 / Signature) [7], [13]
4.  **도메인이 다른 클라이언트와 서버 간의 리소스 공유를 허용하기 위해 설정하는 것은?**
    *   (정답: CORS / Cross-Origin Resource Sharing) [5]
5.  **JWT의 Payload에는 어떤 종류의 데이터를 담지 말아야 하며, 그 이유는 무엇인가요?**
    *   (정답: 패스워드나 주민번호 등 민감 정보. 누구나 복호화해서 내용을 볼 수 있기 때문) [13]

---
**이 소스에서는 다루지 않음:** 구체적인 `SecurityConfig` 코드 작성법(2강), Refresh Token의 상세 로직, 구체적인 JPA 리포지토리 메서드 구현 등.
