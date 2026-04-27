# Project Structure Bootstrap Implementation Plan

> Historical note: this bootstrap plan was written before the official templates were generated. The current source-of-truth structure is documented in `README.md`, `backend/README.md`, and `frontend/README.md`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the initial `Spring Boot backend + React frontend` folder structure so the repository can follow the documented Spring Security practice flow.

**Architecture:** Keep the bootstrap intentionally small. Create only the shared root structure, backend/frontend source directories, and short entrypoint docs so later lecture-driven implementation can fill in framework-specific files without rework.

**Tech Stack:** Markdown, Git, planned Spring Boot backend, planned React frontend

---

### Task 1: Align repository docs with the bootstrap structure

**Files:**
- Create: `docs/superpowers/plans/2026-04-27-project-structure-bootstrap.md`
- Modify: `README.md`

- [ ] **Step 1: Update the root README to describe the current structure**

```md
## Directory Structure

아래 구조는 현재 저장소에 잡힌 기본 실습 구조입니다.
```

- [ ] **Step 2: Reflect the actual bootstrap directories in the tree**

```text
backend/
  README.md
  src/main/java/
  src/main/resources/
  src/test/java/
frontend/
  README.md
  public/
  src/
```

- [ ] **Step 3: Clarify deferred setup decisions**

```md
- `backend`: Spring Security 설정, 필터 체인, JWT 생성/검증, 사용자/권한 모델, 예외 처리, 테스트
- `frontend`: 로그인 화면, 인증 상태 관리, Access Token/Refresh Token 연동, 보호된 라우트, API 호출 흐름 확인
- build tool(`Gradle` or `Maven`)과 React scaffold는 실제 구현 단계에서 확정합니다.
```

### Task 2: Create the backend bootstrap structure

**Files:**
- Create: `backend/README.md`
- Create: `backend/src/main/java/.gitkeep`
- Create: `backend/src/main/resources/.gitkeep`
- Create: `backend/src/test/java/.gitkeep`

- [ ] **Step 1: Add a backend entrypoint note**

```md
# Backend Workspace

이 디렉터리는 Spring Boot 기반의 Spring Security 실습 영역입니다.
```

- [ ] **Step 2: Create empty source roots**

```text
backend/src/main/java/.gitkeep
backend/src/main/resources/.gitkeep
backend/src/test/java/.gitkeep
```

- [ ] **Step 3: Keep the backend scaffold framework-neutral for now**

```md
- build tool(`Gradle` or `Maven`)은 실제 백엔드 생성 시점에 확정합니다.
- 실습 순서는 `docs/spring-security-notebooklm-docs/` 문서 번호를 따릅니다.
```

### Task 3: Create the frontend bootstrap structure

**Files:**
- Create: `frontend/README.md`
- Create: `frontend/public/.gitkeep`
- Create: `frontend/src/.gitkeep`

- [ ] **Step 1: Add a frontend entrypoint note**

```md
# Frontend Workspace

이 디렉터리는 React 기반의 인증 흐름 실습 영역입니다.
```

- [ ] **Step 2: Create empty source roots**

```text
frontend/public/.gitkeep
frontend/src/.gitkeep
```

- [ ] **Step 3: Keep the frontend scaffold lecture-driven**

```md
- 로그인 UI, 인증 상태 관리, 보호된 라우트, API 연동을 단계적으로 추가합니다.
- 실제 React scaffold는 백엔드 실습 흐름과 맞추어 생성합니다.
```
