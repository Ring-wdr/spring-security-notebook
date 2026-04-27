# Spring Security: 인증 핸들러 구현 및 JWT 토큰 생성 가이드

본 문서는 'SpringSecurity 05 - Sucess/Failure Handler & JWT token 생성하기' 소스 내용을 바탕으로 작성되었습니다.

원본 강의: [SpringSecurity 05 - Sucess/Failure Handler & JWT token 생성하기](https://youtu.be/XVkLwKEPYk0?si=9xuIHjVIzjS1y1nG)

---

## 1. 문서 개요
이 문서는 Spring Security의 인증 성공(`AuthenticationSuccessHandler`) 및 실패(`AuthenticationFailureHandler`) 시의 처리 로직을 구현하고, 이를 통해 **JWT(JSON Web Token)를 생성하여 클라이언트에게 응답**하는 과정을 다룹니다. 특히 JWT의 구조와 `jjwt` 라이브러리를 활용한 토큰 생성 및 검증 유틸리티 클래스 작성법을 중점적으로 설명합니다 [1], [2], [3].

## 2. 핵심 개념 정리
*   **AuthenticationSuccessHandler:** 인증이 성공했을 때 실행되는 핸들러로, 여기에서 사용자 정보를 바탕으로 JWT를 생성하고 리스폰스 바디에 담아 보냅니다 [1], [4].
*   **AuthenticationFailureHandler:** 인증이 실패했을 때(비밀번호 불일치 등) 실행되는 핸들러로, 에러 메시지나 코드를 JSON 형태로 응답합니다 [5], [6].
*   **JWT 구성 요소:** 
    *   **Header:** 토큰의 타입(JWT)과 암호화 알고리즘 정보를 담습니다 [2].
    *   **Payload:** 실제 데이터인 클레임(Claims)이 담기며, 누구나 복호화해서 내용을 확인할 수 있습니다 [2].
    *   **Signature:** 서버의 시크릿 키를 사용하여 생성한 체크섬으로, 데이터의 조작 여부를 판별합니다 [2].
*   **Access Token:** 실제 인증에 사용되는 짧은 유효기간(예: 10분)을 가진 토큰입니다 [7].
*   **Refresh Token:** Access Token이 만료되었을 때 새로운 Access Token을 발급받기 위해 사용하는 긴 유효기간(예: 24시간)의 토큰입니다 [7].

## 3. 요청 흐름 또는 동작 원리
1.  **인증 완료:** `UserDetailsService`를 통해 인증이 성공하면 `LoginSuccessHandler`가 호출됩니다 [4].
2.  **사용자 정보 추출:** 핸들러는 `Authentication` 객체에서 `Principal`을 꺼내 우리가 정의한 DTO(`SubscribedDTO`)로 캐스팅합니다 [8].
3.  **클레임 준비:** DTO 내의 사용자 정보(이메일, 닉네임, 권한 등)를 맵(Map) 형태의 클레임으로 변환합니다 [8].
4.  **토큰 생성:** `JWTUtil`을 호출하여 설정된 유효기간(Access 10분, Refresh 24시간)에 맞춰 JWT 스트링을 생성합니다 [9], [7].
5.  **JSON 응답:** `ObjectMapper`(Jackson)를 사용하여 토큰 정보가 담긴 클레임 맵을 JSON 문자열로 변환한 후, 리스폰스의 `PrintWriter`를 통해 클라이언트에게 출력합니다 [10], [11].
6.  **실패 시:** 인증 실패 핸들러가 작동하여 에러 코드(예: `ERROR_LOGIN`)를 담은 JSON을 반환합니다 [6], [12].

## 4. 코드/설정 포인트
*   **SecurityConfig 설정:** `formLogin()` 설정 시 `.successHandler()`와 `.failureHandler()`에 직접 만든 핸들러 객체를 등록해야 합니다 [5], [4].
*   **JWT 라이브러리:** `jjwt` 0.11.5 버전을 사용하며, `build.gradle`에 관련 의존성을 추가해야 합니다 [3].
*   **JWTUtil 클래스:** 
    *   `generateToken(Map, int)`: 클레임과 분 단위 시간을 받아 토큰을 생성합니다 [13], [9].
    *   `validateToken(String)`: 토큰을 복호화하여 클레임을 추출하고 유효성을 검사합니다 [14].
*   **Secret Key 관리:** `HmacShaKeyFor`를 사용하여 스트링 키를 바이트 배열로 변환한 뒤 서명에 사용합니다. 실무에서는 `@Value`를 통해 외부 설정 파일에서 키를 관리하는 것이 권장됩니다 [13], [15].
*   **Response 헤더:** 응답 시 `Content-Type`을 `application/json`으로 명시하고, 가급적 `UTF-8` 인코딩을 지정합니다 [10], [11].

## 5. 실무 관점 주의사항
*   **패키지 구조:** 시큐리티 관련 서비스, DTO, 엔티티, 유틸, 핸들러, 익셉션 등은 `security` 패키지 하위로 별도 분리하여 관리하는 것이 관례입니다 [1].
*   **인젝션 문제:** 핸들러를 `SecurityConfig`에서 `new` 키워드로 직접 생성하여 사용할 경우, 해당 핸들러 내부에서는 `@Autowired`를 통한 빈 주입을 받을 수 없습니다 (빈으로 등록되지 않았기 때문) [10].
*   **JWT 노출:** 헤더와 페이로드는 누구나 열어볼 수 있으므로 민감한 정보는 담지 않아야 하며, 시그니처를 통해서만 위변조를 막을 수 있다는 점을 명심해야 합니다 [2].
*   **리소스 닫기:** `PrintWriter` 사용 후에는 `flush()`와 `close()`를 호출하여 스트림을 명확히 닫아주어야 합니다 [11].

## 6. 자주 헷갈리는 포인트
*   **Principal 캐스팅:** `Authentication.getPrincipal()`은 `Object` 타입을 반환하므로, 실제 우리가 사용 중인 `SubscribedDTO` 타입으로 형변환을 해줘야 데이터에 접근할 수 있습니다 [8].
*   **시그니처와 복호화:** 시그니처는 암호화가 아닌 '체크섬' 개념에 가깝습니다. 데이터 조작은 막을 수 있지만 데이터 자체를 숨기는 용도는 아닙니다 [2].
*   **Access vs Refresh:** 클라이언트는 평소에 Access Token만 보내며, 서버에서 만료 에러가 났을 때만 Refresh Token을 사용하여 재발급 요청을 보냅니다 [7].
*   **UTF-8 설정:** 최신 환경에서는 생략해도 무방한 경우가 많으나, 구형 환경 대응을 위해 명시적으로 인코딩을 설정하기도 합니다 [11].

## 7. 복습 체크리스트
- [ ] 인증 성공 시 실행되는 인터페이스와 메서드명을 알고 있는가? [5]
- [ ] JWT의 세 가지 구성 요소(Header, Payload, Signature)를 설명할 수 있는가? [2]
- [ ] `ObjectMapper`를 사용하여 객체를 JSON으로 변환하는 코드를 작성할 수 있는가? [11]
- [ ] Access Token과 Refresh Token의 유효기간을 다르게 설정하는 이유는 무엇인가? [7]
- [ ] JWT 시그니처가 데이터 조작을 어떻게 방지하는지 이해했는가? [2]

## 8. 확인 문제 5개
1. **성공 핸들러에서 사용자 정보가 담긴 객체를 가져오기 위해 호출하는 메서드는 무엇입니까?**
   * (정답: `authentication.getPrincipal()` [8])
2. **JWT 구성 요소 중 서버의 시크릿 키가 없으면 생성하거나 조작할 수 없는 부분은 어디입니까?**
   * (정답: 시그니처 / Signature [2])
3. **본 소스에서 Access Token의 유효기간으로 설정한 시간은 몇 분입니까?**
   * (정답: 10분 [7])
4. **JSON 데이터를 HTTP 응답으로 직접 내보내기 위해 `response` 객체에서 얻어오는 객체는?**
   * (정답: `PrintWriter` / `getWriter()` [11])
5. **Access Token이 만료되었을 때, 이를 재발급하기 위해 서버가 확인하는 토큰의 명칭은?**
   * (정답: 리프레시 토큰 / Refresh Token [7])

---
**이 소스에서는 다루지 않음:** Refresh Token을 처리하는 컨트롤러의 구체적 구현(Part 9 예정), 소셜 로그인 연동 상세 로직, 구체적인 RSA 암호화 구현 코드 등은 이 단계에서 자세히 다루지 않습니다 [16], [17].
