# JWT RefreshTokenController 구현 및 토큰 갱신 전략 학습 가이드

본 문서는 'SpringSecurity 09 - JWT RefreshTokenController 작성하기' 소스 내용을 바탕으로 작성되었습니다.

원본 강의: [SpringSecurity 09 - JWT RefreshTokenController 작성하기](https://youtu.be/bBWDV6Rj-HI?si=zrHOV-cba71I2EBE)

---

## 1. 문서 개요
이 문서는 JWT 기반 인증 시스템에서 **Access Token이 만료되었을 때 Refresh Token을 사용하여 새로운 토큰을 발급받는 과정**을 다룹니다. `RefreshTokenController`의 구현 방법, 토큰의 유효 기간 체크 로직, 그리고 보안성과 편의성을 고려한 토큰 갱신 전략(Access Token 무조건 갱신, Refresh Token 선택적 갱신)에 대해 상세히 설명합니다 [1], [2].

## 2. 핵심 개념 정리
*   **Access Token:** API 요청 시 인증을 위해 사용하는 토큰으로, 본 소스에서는 보안을 위해 10분이라는 짧은 유효 기간을 설정합니다 [3], [4].
*   **Refresh Token:** Access Token이 만료되었을 때 새로운 Access Token을 발급받기 위해 사용하는 토큰으로, 본 소스에서는 24시간(1440분)의 유효 기간을 가집니다 [1], [3].
*   **Bearer Header:** REST 방식에서 토큰을 전달할 때 사용하는 표준 형식으로, `Authorization: Bearer <토큰값>` 형태를 취합니다 [1], [2].
*   **Claims (클레임):** JWT 내부에 담긴 데이터 정보로, 발행 시간(`iat`), 만료 시간(`exp`), 사용자 식별 정보 등을 포함합니다 [5].
*   **IAT (Issued At):** 토큰이 발행된 시간을 나타내는 초 단위 값입니다 [5].
*   **EXP (Expiration Time):** 토큰이 만료되는 시간을 나타내는 초 단위 값입니다 [5], [6].

## 3. 요청 흐름 또는 동작 원리
1.  **토큰 만료 확인:** 클라이언트가 API를 호출했으나 Access Token이 만료(Expired)되어 에러가 발생하면, 클라이언트는 리프레시 API를 호출합니다 [1].
2.  **헤더 및 파라미터 검증:** 서버는 요청 헤더(`Authorization`)에서 Access Token을, 요청 파라미터에서 Refresh Token을 수신합니다 [3], [2].
3.  **Access Token 상태 체크:** 먼저 Access Token이 정말 만료되었는지 확인합니다. 만약 만료되지 않은 정상 토큰이라면 갱신 없이 그대로 반환합니다 [4], [7].
4.  **Refresh Token 검증:** Access Token이 만료된 경우, 함께 보낸 Refresh Token의 유효성을 검사합니다. 만약 이 토큰까지 만료되었다면 사용자는 다시 로그인해야 합니다 [1], [3], [6].
5.  **새 토큰 발급:**
    *   **Access Token:** 무조건 새로 생성하여 유효 기간을 다시 연장합니다 [4], [6].
    *   **Refresh Token:** 만료 시간까지 남은 시간이 일정 기준(예: 1시간) 미만인 경우에만 새로 생성하여 발급하고, 시간이 많이 남았다면 기존 토큰을 그대로 사용합니다 [4], [6].
6.  **응답:** 생성된 토큰들을 JSON 형태(Map)로 클라이언트에게 반환합니다 [2], [6].

## 4. 코드/설정 포인트
*   **`@RestController` 및 매핑:** `/api/subscribed/refresh`와 같은 경로로 `GET` 또는 `POST` 등 모든 요청을 처리하기 위해 `@RequestMapping`을 사용합니다 [2].
*   **헤더 추출:** `@RequestHeader("Authorization")`을 사용하여 Bearer 토큰 문자열을 가져옵니다 [2].
*   **`substring(7)`:** "Bearer " 접두사(7글자)를 제거하고 실제 토큰 값만 추출하는 로직이 필요합니다 [3], [7].
*   **`JWTUtil.validateToken()`:** 토큰의 조작 여부와 만료 여부를 확인하며, 문제가 있을 경우 익셉션을 던지도록 구성합니다 [7], [8].
*   **예외 처리:** 토큰이 없거나 유효하지 않을 때 `CustomJWTException`을 던져 `@RestControllerAdvice`에서 처리하도록 합니다 [7], [8].
*   **시간 계산:** `System.currentTimeMillis()`를 1,000으로 나눠 초 단위로 만든 뒤, 클레임의 `exp` 값과 비교하여 남은 시간을 계산합니다 [6].

## 5. 실무 관점 주의사항
*   **금융권 보안 기준:** 금융권이나 인터넷 뱅킹 서비스의 경우 보안을 위해 Access Token은 5분, Refresh Token은 20분 정도로 매우 짧게 설정하기도 합니다 [4].
*   **변수명 관리:** `authHeader` 등 의미가 명확한 변수명을 사용하여 코드 가독성을 높여야 합니다 [2], [7].
*   **Refresh Token 재발급 기준:** 리프레시 토큰을 매번 재발급하면 서버 부하가 생길 수 있으므로, 만료 임박 시점(예: 1시간 전)을 체크하여 선택적으로 재발급하는 로직이 권장됩니다 [4], [6].
*   **REST 방식의 특성:** HTML 방식과 달리 REST API는 브라우저 쿠키에 토큰을 자동으로 굽지 않으므로, 클라이언트 개발자가 직접 헤더에 토큰을 심어 보내야 합니다 [1].

## 6. 자주 헷갈리는 포인트
*   **Spring 라이프사이클 순서:** **Filter → DispatcherServlet → Interceptor → Controller** 순서로 요청이 진행됩니다. 따라서 토큰 체크 필터에서 이미 오류가 걸러질 수 있습니다 [3].
*   **`substring(7)`의 이유:** 'Bearer' 뒤에 반드시 **한 칸의 공백**이 포함되어야 하므로 총 7글자를 잘라내야 합니다 [3], [7].
*   **만료 체크 함수의 반환값:** `isExpired`와 같은 함수를 만들 때, `true`가 만료됨을 의미하는지 아니면 유효함을 의미하는지 명확히 설계해야 혼선을 줄일 수 있습니다 [8].

## 7. 복습 체크리스트
- [ ] Access Token과 Refresh Token의 유효 기간을 각각 다르게 설정하는 이유는 무엇인가요? [4]
- [ ] 요청 헤더에서 'Bearer '를 잘라내기 위해 사용하는 문자열 메서드와 인덱스는 무엇인가요? [3], [7]
- [ ] Refresh Token이 만료되지 않았을 때 Access Token만 재발급하는 로직을 설명할 수 있나요? [4], [6]
- [ ] 토큰의 만료 시간(`exp`) 단위는 밀리초(ms)인가요, 초(s)인가요? [6]
- [ ] 사용자가 다시 로그인해야 하는 상황(Access와 Refresh 모두 만료)을 구분할 수 있나요? [1], [3]

## 8. 확인 문제 5개
1.  **본 소스에서 Access Token의 기본 유효 기간으로 설정한 시간은 몇 분입니까?**
    *   (정답: 10분) [3], [4]
2.  **Refresh Token의 남은 유효 시간이 몇 시간 미만일 때 새로운 Refresh Token을 발급하기로 예시를 들었습니까?**
    *   (정답: 1시간 / 3600초) [4], [6]
3.  **JWT 클레임 정보 중 토큰의 발행 시간을 의미하는 약어는 무엇입니까?**
    *   (정답: iat / Issued At) [5]
4.  **클라이언트가 서버에 토큰을 보낼 때 HTTP 헤더의 어떤 키(Key) 값을 사용합니까?**
    *   (정답: Authorization) [3], [2]
5.  **토큰 검증 도중 오류가 발생했을 때 이 소스에서 사용하는 커스텀 예외 클래스의 이름은?**
    *   (정답: CustomJWTException) [7], [8]

---
**이 소스에서는 다루지 않음:**
*   데이터베이스(JPA/Hibernate)를 이용한 사용자의 실제 권한 정보 조회 쿼리 상세 내용.
*   Refresh Token을 데이터베이스나 Redis에 저장하여 관리하는 서버측 저장 로직.
*   프론트엔드(React, Vue 등)에서 Axios 인터셉터를 이용해 401 에러를 처리하는 구체적인 자바스크립트 코드.
*   특정 암호화 알고리즘(RSA 등)의 상세 구현 수학 공식.
