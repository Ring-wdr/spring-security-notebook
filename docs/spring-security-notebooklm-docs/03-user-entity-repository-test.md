# 사용자 Entity, Repository 및 Test 코드 작성 학습 가이드

본 문서는 'SpringSecurity 03 - 사용자 Entity/Repository/Test 코드 작성' 소스 내용을 바탕으로 작성되었습니다.

원본 강의: [SpringSecurity 03 - 사용자 Entity/Repository/Test 코드 작성](https://youtu.be/iqVKBCPkxAo?si=wp0axLBbyryaWZaG)

---

## 1. 문서 개요
이 문서는 Spring Security 연동을 위한 사용자 엔티티(`Subscribed`)의 설계, 권한(Role) 처리 방식, 그리고 이를 검증하기 위한 리포지토리 및 테스트 코드 작성 방법을 다룹니다. 특히 JPA의 `@ElementCollection`을 활용한 권한 관리와 `@EntityGraph`를 통한 성능 최적화 기법을 중점적으로 설명합니다 [1], [2], [3].

## 2. 핵심 개념 정리
*   **엔티티(Entity) 설계:** 일반적인 `Member`나 `User` 대신 `Subscribed`라는 명칭을 사용하며, 고유 식별자(PK)로 **이메일(email)**을 사용합니다 [1].
*   **권한(Role) 관리:** `ROLE_`로 시작하는 명명 규칙을 따르는 Enum(이놈) 타입을 사용합니다 (예: `ROLE_USER`, `ROLE_MANAGER`, `ROLE_ADMIN`) [4].
*   **@ElementCollection:** 1대다 관계에서 상대방이 별도의 엔티티가 아닌 단순한 값(String, Enum, Number 등)일 때 사용하며, 자동으로 별도의 테이블을 생성해 관리합니다 [2].
*   **@EntityGraph:** JPA에서 데이터를 조회할 때 연관된 컬렉션을 한 번에 조인(Join)해서 가져오도록 설정하는 기능입니다 [3].
*   **PasswordEncoder:** 데이터베이스에 비밀번호를 저장할 때 평문이 아닌 암호화된 상태로 저장하기 위해 사용합니다 [5].

## 3. 요청 흐름 또는 동작 원리
1.  **엔티티 정의:** `Subscribed` 클래스에 사용자 정보와 권한 리스트를 정의합니다 [1], [4].
2.  **데이터베이스 매핑:** JPA가 `@ElementCollection` 설정을 확인하여 사용자 테이블과 권한 테이블(예: `subscribed_role`)을 생성합니다 [6].
3.  **데이터 저장:** 테스트 코드나 서비스 로직에서 `PasswordEncoder`를 통해 암호화된 비밀번호를 생성하고, 사용자와 권한 정보를 저장합니다 [5], [7].
4.  **데이터 조회:** 리포지토리의 `findByEmail` 등을 호출할 때 `@EntityGraph`가 설정되어 있으면 사용자와 권한 테이블을 조인하여 한 번의 쿼리로 모든 정보를 가져옵니다 [3].
5.  **권한 업데이트:** `@ElementCollection` 방식은 특정 권한만 수정하는 것이 아니라, 해당 사용자의 기존 권한을 모두 삭제(Delete)한 후 새로운 권한들을 다시 삽입(Insert)하는 방식으로 동작합니다 [8].

## 4. 코드/설정 포인트
*   **PK 설정:** `@Id`를 이메일 필드에 부여하여 이메일을 기본키로 활용합니다 [1].
*   **권한 리스트 설정:** 
    ```java
    @ElementCollection(fetch = FetchType.LAZY)
    @Builder.Default
    private List<SubscriberRole> roleList = new ArrayList<>();
    ```
    위와 같이 설정하며, 기본값은 지연 로딩(LAZY)입니다 [4].
*   **테이블 및 컬럼명 커스텀:** `@CollectionTable`과 `@Column`을 사용하여 자동 생성되는 권한 테이블의 이름과 컬럼명을 지정할 수 있습니다 [6], [5].
*   **@EntityGraph 적용:**
    ```java
    @EntityGraph(attributePaths = {"roleList"}, type = EntityGraphType.FETCH)
    Optional<Subscribed> findByEmail(String email);
    ```
    이 설정을 통해 권한 정보를 함께 페치 조인(Fetch Join)합니다 [3].
*   **테스트 코드 내 빈 주입:** `PasswordEncoder`와 같은 일반 스프링 빈을 사용하려면 `@DataJpaTest` 대신 `@SpringBootTest`를 사용해야 합니다 [5], [7].

## 5. 실무 관점 주의사항
*   **Setter 사용 자제:** 실무에서는 데이터 무결성을 위해 클래스 전체에 `@Setter`를 붙이기보다, 필요한 필드에만 제한적으로 메서드를 제공하는 것이 권장됩니다 [1].
*   **@ElementCollection의 한계:** 이 방식은 수정 시 전체 삭제 후 재삽입을 하므로, 댓글(Comment)처럼 데이터 양이 많거나 복잡한 생명주기를 가진 경우에는 `OneToMany` 엔티티 분리 방식을 사용해야 합니다 [8].
*   **패스워드 보안:** 성능이 좋은 하드웨어에 대응하기 위해 해싱을 반복하는 **BCrypt**와 같은 알고리즘을 사용해 DB에 저장해야 합니다 [5].
*   **권한 체계:** 게스트, 직원, 매니저, 어드민 등으로 권한을 세분화하며, 상위 권한자는 하위 또는 동급 권한자의 정보를 조정할 수 있는 로직이 필요합니다 [4], [9].

## 6. 자주 헷갈리는 포인트
*   **Fetch Join vs EntityGraph:** 둘 다 조인을 통해 데이터를 한 번에 가져오는 목적은 같으나, `@EntityGraph`는 메서드 어노테이션만으로 간편하게 설정할 수 있다는 장점이 있습니다 [3].
*   **@DataJpaTest의 범위:** 이 어노테이션은 JPA 관련 빈만 로드하므로, `SecurityConfig`에 등록된 `PasswordEncoder` 빈을 찾지 못해 에러가 발생할 수 있습니다 [5], [7].
*   **비밀번호 암호화 시점:** 서버 내부에서 비교할 때 스프링 시큐리티가 DB의 암호화된 값과 입력값을 비교하므로, 저장 시점에 반드시 암호화를 거쳐야 합니다 [5].

## 7. 복습 체크리스트
- [ ] 이메일을 PK로 쓸 때의 장단점을 이해했는가? [1]
- [ ] `@ElementCollection`이 업데이트될 때 쿼리가 어떻게 발생하는지 아는가? [8]
- [ ] 권한 이름 앞에 `ROLE_`을 붙여야 하는 이유는 무엇인가? [4]
- [ ] `@EntityGraph`를 사용하지 않았을 때 지연 로딩으로 인한 문제를 설명할 수 있는가? [4], [3]
- [ ] 왜 테스트 코드에서 `@SpringBootTest`가 필요했는지 이해했는가? [5], [7]

## 8. 확인 문제 5개
1.  **본 소스에서 `Subscribed` 엔티티의 기본키(PK)로 사용한 필드는 무엇입니까?**
    *   (정답: 이메일 / email) [1]
2.  **JPA에서 별도의 엔티티 클래스 없이 단순 값 리스트를 테이블로 관리할 때 사용하는 어노테이션은?**
    *   (정답: `@ElementCollection`) [2]
3.  **스프링 시큐리티의 권한 명명 규칙에 따라 매니저 권한을 정의할 때 권장되는 이름은?**
    *   (정답: `ROLE_MANAGER`) [4]
4.  **`@ElementCollection`으로 관리되는 데이터를 수정할 때 JPA가 내부적으로 취하는 행동은?**
    *   (정답: 해당 ID의 모든 레코드를 삭제(Delete)한 후 새로 인서트(Insert)함) [8]
5.  **테스트 환경에서 `BCryptPasswordEncoder` 빈을 주입받아 사용하기 위해 필요한 클래스 레벨 어노테이션은?**
    *   (정답: `@SpringBootTest`) [7]

---
**이 소스에서는 다루지 않음:** JWT 토큰의 상세 구조 및 생성 로직, `Success/Failure Handler`의 구체적인 구현, `SecurityConfig`의 전체 설정 코드 등은 본 소스의 설명 범위를 벗어납니다.
