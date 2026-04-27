# Spring Security 및 JWT 연동 완벽 가이드

이 문서는 Spring Security의 기본 흐름부터 JWT(JSON Web Token)를 이용한 인증/인가 구현, 그리고 실무적인 보안 전략까지 입문자가 체계적으로 학습할 수 있도록 구성된 스터디 가이드입니다.

---

## 1. Spring Security 핵심 개념

Spring Security는 애플리케이션의 **인증(Authentication)**과 **인가(Authorization)**를 담당하는 강력한 프레임워크입니다.

*   **인증(Authentication):** 사용자가 누구인지 확인하는 과정(예: 로그인).
*   **인가(Authorization):** 인증된 사용자가 특정 리소스에 접근할 권한이 있는지 확인하는 과정(예: 관리자 권한 체크).
*   **Security World:** Spring Security가 관리하는 영역으로, 자체적인 인터페이스와 클래스 타입을 사용합니다. 따라서 우리가 만든 서비스나 객체를 이 영역에 연결하려면 Spring Security가 정의한 타입을 상속받거나 구현해야 합니다.

---

## 2. 요청 처리 흐름과 Filter Chain

Spring Security는 서블릿 필터(Filter)를 기반으로 동작하며, 클라이언트의 요청이 컨트롤러에 도달하기 전 단계에서 보안 검사를 수행합니다.

### 처리 순서
1.  **클라이언트 요청:** 브라우저가 요청을 보냄.
2.  **Filter Chain:** 여러 개의 필터가 체인 형태로 연결되어 있으며, `SecurityFilterChain`이 이를 관리합니다. 인증 필터가 가장 먼저 요청을 가로챕니다.
3.  **DispatcherServlet:** 필터를 모두 통과하면 Spring MVC의 입구인 `DispatcherServlet`으로 전달됩니다.
4.  **Interceptor:** 서블릿과 컨트롤러 사이에서 동작하며, 컨트롤러 실행 전후 처리를 담당합니다.
5.  **Controller:** 최종적으로 비즈니스 로직이 실행됩니다.

---

## 3. SecurityConfig 설정 포인트

설정 클래스는 애플리케이션의 보안 정책을 정의하는 컨트롤 타워입니다.

### 주요 설정 항목
*   **CSRF(Cross-Site Request Forgery):** 사이트 간 요청 위조 방지. REST API나 JWT 방식에서는 보통 `disable` 처리합니다. (JWT 자체가 조작이 불가능한 특성을 가지기 때문)
*   **CORS(Cross-Origin Resource Sharing):** 다른 도메인(포트가 달라도 포함)에서의 리소스 요청 허용 설정. 실무에서는 허용할 도메인, 메서드(GET, POST 등), 헤더를 명확히 지정해야 합니다.
*   **세션 정책:** JWT를 사용할 때는 서버에 상태를 저장하지 않으므로 `SessionCreationPolicy.STATELESS`로 설정합니다.
*   **PasswordEncoder:** 비밀번호 암호화 알고리즘으로 `BCryptPasswordEncoder`를 권장합니다.

---

## 4. UserDetails, UserDetailsService, Entity/Repository 구조

Spring Security와 데이터베이스를 연결하기 위한 핵심 구조입니다.

| 구성 요소 | 역할 | 실무 주의사항 |
| :--- | :--- | :--- |
| **Entity (Subscriber)** | DB의 사용자 정보를 담는 객체. | 권한(Role) 저장 시 `@ElementCollection`을 사용하면 업데이트 시 기존 데이터를 모두 지우고 새로 입력하므로 주의가 필요함. |
| **Repository** | DB 접근 로직 담당. | 권한 정보를 한 번에 가져오기 위해 `@EntityGraph`를 사용하여 성능 최적화(Join)를 수행함. |
| **UserDetails (DTO)** | Security가 이해할 수 있는 사용자 객체. | `User` 클래스를 상속받아 구현하며, 반드시 비밀번호를 Security에게 알려주어야 인증이 가능함. |
| **UserDetailsService** | 사용자 이름(이메일)으로 DB에서 정보를 로드. | `loadUserByUsername` 메서드를 통해 DB 유저와 Security 유저를 매핑함. |

---

## 5. JWT 발급과 검증 흐름

JWT는 세션 대신 클라이언트가 들고 다니는 신분증과 같습니다.

1.  **발급:** 로그인 성공 시 서버는 `Access Token`과 `Refresh Token`을 생성하여 응답 본문이나 쿠키에 담아 보냅니다.
2.  **구조:** Header(알고리즘), Payload(데이터/클레임), Signature(위변조 방지 서명)로 구성됩니다.
3.  **검증:** 클라이언트가 요청 헤더에 토큰을 실어 보내면, 서버는 `Signature`를 확인하여 토큰의 유효성을 검사합니다.

---

## 6. JWTAuthenticationFilter 역할

이 필터는 모든 요청마다 실행되어 토큰의 유효성을 검사합니다.

*   **토큰 추출:** 헤더의 `Authorization` 필드에서 `Bearer `로 시작하는 문자열을 추출합니다.
*   **검증 및 저장:** 토큰이 유효하면 사용자 정보를 추출하여 **SecurityContextHolder**에 저장합니다. 
*   **Context Holder의 중요성:** 여기에 인증 정보가 저장되어 있어야만 이후 컨트롤러나 서비스에서 권한 체크(`@PreAuthorize` 등)가 가능해집니다. 이는 리액트의 Context API와 유사한 개념입니다.

---

## 7. Access Token과 Refresh Token 전략

보안과 편의성을 모두 잡기 위한 이중 토큰 전략입니다.

*   **Access Token:** 유효 기간을 짧게(예: 10분) 설정하여 탈취 시 피해를 최소화합니다.
*   **Refresh Token:** 유효 기간을 길게(예: 24시간) 설정하며, Access Token이 만료되었을 때 새로운 Access Token을 발급받는 용도로 사용합니다.
*   **갱신 로직:** Refresh Token의 남은 유효 기간이 얼마 남지 않았을 때(예: 1시간 미만) Refresh Token도 함께 재발급하여 로그인이 끊기지 않게 유지합니다.

---

## 8. 테스트 전략과 Bearer 토큰 사용법

JWT를 테스트할 때는 일반적인 폼 로그인 방식과는 다른 접근이 필요합니다.

*   **Bearer 토큰 전송:** HTTP 요청 헤더에 `Authorization: Bearer {TOKEN}` 형식을 사용해야 합니다.
*   **테스트 툴 활용:** IntelliJ의 `.http` 파일이나 Postman을 사용하여 로그인 요청 후 받은 토큰을 변수에 저장하고, 이후 요청 시 해당 변수를 헤더에 실어 보내는 방식으로 자동화할 수 있습니다.

---

## 9. 예외 처리와 보안상 주의점

보안 사고 방지를 위해 실무에서 반드시 챙겨야 할 포인트입니다.

1.  **비밀번호 제외:** JWT Payload(클레임)에는 절대로 비밀번호를 포함해서는 안 됩니다. 토큰은 누구나 내용을 열어볼 수 있기 때문입니다.
2.  **키 길이:** JWT 서명에 사용되는 Secret Key는 최소 256비트(32글자) 이상이어야 보안상 안전합니다. 짧은 키는 `WeakKeyException`을 발생시킵니다.
3.  **핸들러 분리:**
    *   `AuthenticationSuccessHandler`: 로그인 성공 시 JWT 발급 처리.
    *   `AuthenticationFailureHandler`: 로그인 실패 시 에러 메시지(JSON) 응답.
    *   `AccessDeniedHandler`: 권한 없는 리소스 접근 시(403 Forbidden) 처리.

---

## 10. 구현 순서 체크리스트와 핵심 요약

### 구현 순서 Checklist
- [ ] `SecurityConfig` 클래스 생성 및 기본 보안(CORS/CSRF/세션) 설정
- [ ] 사용자 `Entity` 및 `Repository` 구현 (권한 포함)
- [ ] `UserDetails` 구현 (사용자 정보 DTO)
- [ ] `UserDetailsService` 구현 (DB 연동 로직)
- [ ] `JWTUtil` 클래스 작성 (토큰 생성, 검증, 파싱 로직)
- [ ] `JWTAuthenticationFilter` 작성 및 Filter Chain 등록
- [ ] 로그인 성공/실패 핸들러 및 예외 핸들러 작성
- [ ] (선택) Refresh Token 발급 및 갱신 전용 컨트롤러 작성

### 핵심 요약
Spring Security는 **Filter Chain**을 통해 보안을 처리하며, JWT 방식에서는 서버에 상태를 저장하지 않는 **Stateless** 환경을 구축하는 것이 핵심입니다. 모든 보안 정보는 최종적으로 **SecurityContextHolder**에 저장되어 관리되며, 이를 통해 메서드 단위의 권한 제어가 가능해집니다.

---

## 📝 연습 문제

### 단답형 퀴즈
1. 사용자가 누구인지 확인하는 과정을 무엇이라 하는가? (정답: 인증)
2. JWT의 세 가지 구성 요소는 무엇인가? (정답: Header, Payload, Signature)
3. 인증된 사용자 정보를 보관하는 저장소의 이름은? (정답: SecurityContextHolder)
4. 비밀번호 암호화를 위해 Spring Security에서 권장하는 알고리즘은? (정답: BCrypt)

### 서술형 질문
1. JWT 방식에서 CSRF 설정을 해제(disable)해도 비교적 안전한 이유는 무엇입니까?
2. Access Token과 Refresh Token을 분리하여 사용하는 목적에 대해 설명하십시오.
3. `@ElementCollection`을 권한 저장에 사용할 때 발생할 수 있는 성능상 문제와 그 대안을 설명하십시오.

---

## 📖 용어 사전 (Glossary)

*   **Stateless:** 서버가 클라이언트의 상태(세션 등)를 보존하지 않는 방식.
*   **Bearer:** 토큰 기반 인증에서 토큰 타입임을 나타내는 접두어.
*   **Claim:** JWT의 Payload에 담기는 정보 조각(예: 유저네임, 이메일, 권한).
*   **Hmac:** 대칭키를 이용한 해시 메시지 인증 코드. JWT 서명 방식 중 하나.
*   **PreAuthorize:** 메서드 실행 전 권한을 체크하기 위해 사용하는 어노테이션.