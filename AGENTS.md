# AGENTS.md

## Purpose

이 저장소에서 에이전트는 Spring Security, JWT 인증 구조, 필터 체인, 토큰 전략, 테스트 흐름을 학습하고 정리하는 문서 작업을 수행합니다.

## Primary Skill

스프링 시큐리티 관련 설명, 요약, 보충 자료, 비교, 학습용 아티팩트가 필요하면 설치된 `notebooklm` 스킬을 우선 사용합니다.

- `backend/` 아래 코드를 실제로 수정하는 작업일 때만 repo-local `backend-spring-security-workflow` 스킬을 사용합니다.
- 프론트엔드 개선 작업은 루트 `AGENTS.md`에 세부 규칙을 적지 않고, repo-local `modernize-next-react19` 스킬과 `frontend/AGENTS.md`로 위임합니다.

## Workflow Rules

1. 먼저 루트 가이드와 `docs/spring-security-notebooklm-docs/` 문서를 읽고 현재 학습 맥락을 파악합니다.
2. 보안 학습 자료 정리는 `notebooklm`, `backend/` 코드 수정은 `backend-spring-security-workflow`, 프론트엔드 개선 작업은 repo-local `modernize-next-react19` 스킬을 우선 적용합니다.
3. 생성된 내용은 이 레포의 학습 목적에 맞게 간결하게 재구성하고, 문서 간 중복은 최소화합니다.
4. notebook id, 인증 상태, 계정 식별자 같은 개인정보성 정보는 어떤 문서에도 남기지 않습니다.

## Skill Design Policy

이 저장소의 스킬 사용 규칙이나 관련 문서를 설계하거나 수정할 때는 `skill-creator` 스킬의 원칙을 함께 따릅니다.

- 스킬 문서는 트리거 조건이 분명해야 합니다.
- 긴 설명보다 실제 작업 흐름과 재사용 규칙을 우선합니다.
- 에이전트가 언제 `notebooklm`을 써야 하는지 문서에서 즉시 판단할 수 있어야 합니다.
- 세부 참고 정보는 필요한 파일로 분리하고, 핵심 운영 규칙은 `AGENTS.md`에 유지합니다.

## Writing Expectations

- 문서는 학습 순서가 드러나도록 작성합니다.
- Spring Security 용어는 원어를 유지하되, 필요한 경우 한국어 설명을 함께 적습니다.
- 구현 가이드, 테스트 포인트, 보안상 주의점을 분리해서 정리합니다.
- 새로운 문서를 추가할 때는 가능하면 `README.md`에서 발견 가능하도록 연결합니다.
