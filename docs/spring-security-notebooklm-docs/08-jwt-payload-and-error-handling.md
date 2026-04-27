# Spring Security: JWT 패스워드 제외 및 전역 에러 핸들링 학습 가이드

본 문서는 'SpringSecurity 08 - JWT 토큰에 패스워드 제외하고 에러 핸들링하기' 소스 내용을 바탕으로 작성되었습니다.

원본 강의: [SpringSecurity 08 - JWT 토큰에 패스워드 제외하고 에러 핸들링하기](https://youtu.be/unnnFnbw9zg?si=N6Nyrtk1t1lPxft2)

---

## 1. 문서 개요
이 문서는 보안 강화를 위해 JWT 토큰 내에서 **패스워드 정보를 완전히 제외하는 방법**과, 인증 및 인가 과정에서 발생하는 다양한 예외를 전역적으로 처리하는 **에러 핸들링 전략**을 다룹니다. 특히 `SecurityContextHolder`를 통한 인증 객체 관리와 `@RestControllerAdvice`를 이용한 커스텀 예외 응답 구성을 중점적으로 학습합니다 [1, 2].

## 2. 핵심 개념 정리
*   **SecurityContextHolder:** 스프링 시큐리티에서 가장 중요한 저장소로, 내부에 `SecurityContext`를 보관하며 그 안에 인증된 사용자 정보(`Authentication`)를 담습니다. 이를 통해 애플리케이션 어디서든 현재 로그인한 사용자의 정보를 참조할 수 있습니다 [3].
*   **메서드 보안 (Method Security):** `@EnableMethodSecurity` 설정을 통해 컨트롤러의 각 메서드 단위로 권한 체크를 수행하는 기능입니다. 이는 AOP(Aspect Oriented Programming) 방식으로 동작합니다 [4].
*   **403 Forbidden (인가 실패):** 사용자가 인증(로그인)은 되었으나, 해당 리소스에 접근할 권한이 없을 때 발생하는 에러입니다 [5].
*   **AccessDeniedHandler:** 403 에러가 발생했을 때 서버가 클라이언트에게 전달할 응답(JSON 등)을 직접 정의하는 핸들러입니다 [6].
*   **RestControllerAdvice:** 여러 컨트롤러에서 발생하는 예외를 한곳에서 가로채(Hooking) 공통된 포맷으로 처리해주는 전역 예외 처리기입니다 [2].

## 3. 요청 흐름 또는 동작 원리
1.  **인증 성공 시:** `SuccessHandler`에서 토큰을 생성할 때, 보안을 위해 기존 DTO에서 패스워드를 빈 문자열(`""`)로 치환한 새로운 DTO를 생성하여 클레임(Claims)을 구성합니다 [7, 8].
2.  **필터 검증 시:** `JWTAuthenticationFilter`에서 토큰이 유효하면, 해당 정보를 `SecurityContextHolder`에 `setAuthentication` 메서드로 등록합니다. 이 작업이 선행되어야 이후 권한 체크가 가능합니다 [4, 9].
3.  **메서드 권한 체크:** 컨트롤러 진입 전 `@PreAuthorize` 등이 설정되어 있다면, 시큐리티는 `SecurityContext`에서 권한 정보를 꺼내 현재 사용자가 리소스를 사용할 자격이 있는지 확인합니다 [3, 4].
4.  **인가 실패 시:** 권한이 부족하면 `AccessDeniedHandler`가 동작하여 미리 정의된 JSON 에러 메시지를 반환합니다 [10, 11].
5.  **예외 발생 시:** 토큰 조작이나 만료 등의 예외 발생 시 `JWTUtil`에서 예외를 던지고, 이를 `RestControllerAdvice`가 가로채서 401(Unauthorized) 상태 코드와 함께 응답합니다 [12, 13].

## 4. 코드/설정 포인트
*   **패스워드 제거 로직:**
    ```java
    // SuccessHandler 내에서 새로운 DTO 생성
    SubscribedDTO newDTO = new SubscribedDTO(d.getEmail(), "", d.getNickname(), d.isSocial(), d.getRoleNames());
    Map<String, Object> claims = newDTO.getClaims(); // 패스워드가 빈 값인 클레임 생성
    ``` [8]
*   **SecurityContext 등록:** 필터 내에서 `SecurityContextHolder.getContext().setAuthentication(authentication)`을 호출하여 인증 정보를 세션 단위로 저장합니다 [4, 9].
*   **권한 설정 어노테이션:**
    *   `@EnableMethodSecurity`: 설정 클래스 상단에 추가하여 메서드 수준 보안 활성화 [4].
    *   `@PreAuthorize("hasAnyRole('ROLE_USER')")`: 특정 권한이 있는 사용자만 접근 가능하도록 제한 [4, 5].
*   **전역 예외 처리기:** `@RestControllerAdvice`와 `@ExceptionHandler(CustomJWTException.class)`를 조합하여 특정 예외 발생 시 JSON 응답을 생성합니다 [2].

## 5. 실무 관점 주의사항
*   **권한의 세분화:** 실무에서는 읽기, 쓰기, 삭제 권한을 매우 복잡하게 분리하며, 상위 권한(Admin)은 하위 권한(User)의 기능을 모두 포함하도록 설계해야 합니다 [1, 5].
*   **토큰 내 민감 정보:** 패스워드는 암호화되어 있더라도 토큰 페이로드에 포함되면 위험하므로 반드시 제외해야 하며, 이를 위해 DTO를 분리하거나 생성 시점에서 값을 비워주는 처리가 필수적입니다 [1, 8].
*   **에러 메시지의 친절도:** 개발 시에는 상세한 에러가 도움이 되지만, 해커에게 너무 상세한 정보를 주는 것은 위험하므로 실무에서는 '조작된 토큰' 등을 약식으로 표현하기도 합니다 [11, 12].
*   **싱글톤 활용:** 핸들러를 빈으로 등록하여 사용할 수도 있지만, 설정 클래스에서 `new`로 직접 생성하여 사용하는 방식은 한 번만 등록되어 메모리 부담을 줄이는 효과가 있습니다 [6].

## 6. 자주 헷갈리는 포인트
*   **401 vs 403:** 401은 누구인지 모르는 상태(인증 실패), 403은 누구인지는 알지만 권한이 없는 상태(인가 실패)입니다 [5, 13].
*   **SecurityContext의 역할:** 단순히 토큰을 검증하는 것에서 끝나는 것이 아니라, 이를 컨텍스트에 등록해야만 스프링 시큐리티가 제공하는 권한 체크 기능을 온전히 사용할 수 있습니다 [3].
*   **JWT의 조작 방지:** JWT는 내용을 숨기는 것이 아니라 '조작되었는지'를 확인하는 것이 목적입니다. 시그니처가 이를 담당합니다 [1, 12].

## 7. 복습 체크리스트
- [ ] JWT 생성 시 패스워드를 빈 값으로 처리하는 이유를 알고 있는가? [1, 8]
- [ ] `SecurityContextHolder`에 인증 객체를 등록해야 하는 이유는 무엇인가? [3, 9]
- [ ] `@EnableMethodSecurity`가 왜 AOP와 관련이 있는지 설명할 수 있는가? [4]
- [ ] `AccessDeniedHandler`가 호출되는 정확한 상황은 언제인가? [6]
- [ ] `RestControllerAdvice`를 사용할 때 얻을 수 있는 이점은 무엇인가? [2]

## 8. 확인 문제 5개
1.  **JWT 토큰 페이로드에서 패스워드를 제외해야 하는 보안상 가장 큰 이유는 무엇입니까?**
    *   (정답: 패스워드는 암호화되어 있더라도 조작이나 유출 시 위험이 크기 때문) [1]
2.  **현재 로그인한 사용자의 정보를 세션 단위로 보관하여 어디서든 꺼내 쓸 수 있게 해주는 저장소의 이름은?**
    *   (정답: SecurityContextHolder / SecurityContext) [3]
3.  **메서드 실행 전후에 권한을 체크하기 위해 설정 클래스에 선언해야 하는 어노테이션은?**
    *   (정답: @EnableMethodSecurity) [4]
4.  **인가 실패(403 Forbidden)가 발생했을 때 동작하는 커스텀 핸들러의 인터페이스 명칭은?**
    *   (정답: AccessDeniedHandler) [6]
5.  **토큰이 만료되었을 때 `JWTUtil`에서 던져야 하는 구체적인 예외 클래스 명칭은 무엇입니까?**
    *   (정답: ExpiredJwtException) [12]

---
**이 소스에서는 다루지 않음:** 리프레시 토큰의 구체적인 갱신 컨트롤러 로직(다음 단계 예정), DB 연동을 위한 상세 SQL 쿼리, 소셜 로그인 API의 상세 명세 등 [13].
