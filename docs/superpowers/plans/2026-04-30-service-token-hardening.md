# Service Token Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the existing static content service token path with read-only machine-principal tests, authorization-order tests, and clear runtime compromise documentation.

**Architecture:** Keep the current static bearer token implementation, but pin its boundaries with focused tests and clearer names. Backend service tokens remain content-read machine credentials; frontend service-token cache helpers remain reachable only after user session and role checks pass.

**Tech Stack:** Spring Boot 4, Spring Security, JUnit 5, AssertJ, Next.js 16, React 19, Vitest, T3 Env.

---

## File Structure

- Modify: `backend/src/main/java/com/example/springsecuritynotebook/auth/application/ContentServiceTokenAuthenticationService.java`
  - Clarify principal names and denied-authority intent through constants without changing behavior.
- Create: `backend/src/test/java/com/example/springsecuritynotebook/auth/application/ContentServiceTokenAuthenticationServiceTests.java`
  - Unit-test token matching, machine principals, and read-only authority boundaries.
- Modify: `frontend/src/lib/server/content/content-dal.test.ts`
  - Add tests proving unauthorized sessions do not reach cached service-token helpers.
- Modify: `.env.example`
  - Add backend service-token environment keys with empty defaults.
- Modify: `frontend/.env.example`
  - Add comments explaining frontend service-token values must match backend values and stay server-only.
- Modify: `backend/README.md`
  - Document backend service-token runtime notes.
- Modify: `frontend/README.md`
  - Document frontend cache-token authorization ordering.
- Modify: `README.md`
  - Add a short service-token hardening note and link to the design spec.

---

### Task 1: Backend Service Token Unit Tests

**Files:**
- Create: `backend/src/test/java/com/example/springsecuritynotebook/auth/application/ContentServiceTokenAuthenticationServiceTests.java`
- Read: `backend/src/main/java/com/example/springsecuritynotebook/auth/application/ContentServiceTokenAuthenticationService.java`
- Read: `backend/src/main/java/com/example/springsecuritynotebook/auth/config/ContentServiceTokenProperties.java`

- [ ] **Step 1: Write the failing tests**

Create `backend/src/test/java/com/example/springsecuritynotebook/auth/application/ContentServiceTokenAuthenticationServiceTests.java`:

```java
package com.example.springsecuritynotebook.auth.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.example.springsecuritynotebook.auth.config.ContentServiceTokenProperties;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;

class ContentServiceTokenAuthenticationServiceTests {

  private static final String PUBLISHED_TOKEN = "published-service-token-32-characters";
  private static final String MANAGEMENT_TOKEN = "management-service-token-32-characters";

  @Test
  void publishedTokenAuthenticatesAsReadOnlyMachinePrincipal() {
    ContentServiceTokenAuthenticationService service =
        new ContentServiceTokenAuthenticationService(
            new ContentServiceTokenProperties(PUBLISHED_TOKEN, MANAGEMENT_TOKEN));

    var authentication = service.authenticate(PUBLISHED_TOKEN);

    assertThat(authentication).isPresent();
    assertThat(authentication.orElseThrow().getName()).isEqualTo("content-published-service");
    assertThat(authentication.orElseThrow().getAuthorities())
        .extracting(GrantedAuthority::getAuthority)
        .containsExactly("CONTENT_READ")
        .doesNotContain(
            "CONTENT_DRAFT_READ",
            "CONTENT_WRITE",
            "USER_READ",
            "USER_ROLE_UPDATE",
            "ROLE_USER",
            "ROLE_MANAGER",
            "ROLE_ADMIN");
  }

  @Test
  void managementTokenAuthenticatesAsDraftReadMachinePrincipalWithoutWriteOrUserAuthorities() {
    ContentServiceTokenAuthenticationService service =
        new ContentServiceTokenAuthenticationService(
            new ContentServiceTokenProperties(PUBLISHED_TOKEN, MANAGEMENT_TOKEN));

    var authentication = service.authenticate(MANAGEMENT_TOKEN);

    assertThat(authentication).isPresent();
    assertThat(authentication.orElseThrow().getName()).isEqualTo("content-management-service");
    assertThat(authentication.orElseThrow().getAuthorities())
        .extracting(GrantedAuthority::getAuthority)
        .containsExactlyInAnyOrder("CONTENT_READ", "CONTENT_DRAFT_READ")
        .doesNotContain(
            "CONTENT_WRITE",
            "USER_READ",
            "USER_ROLE_UPDATE",
            "ROLE_USER",
            "ROLE_MANAGER",
            "ROLE_ADMIN");
  }

  @Test
  void unknownBlankOrMissingTokensDoNotAuthenticate() {
    ContentServiceTokenAuthenticationService service =
        new ContentServiceTokenAuthenticationService(
            new ContentServiceTokenProperties(PUBLISHED_TOKEN, MANAGEMENT_TOKEN));

    assertThat(service.authenticate("unknown-service-token-32-characters")).isEmpty();
    assertThat(service.authenticate("")).isEmpty();
    assertThat(service.authenticate("   ")).isEmpty();

    ContentServiceTokenAuthenticationService unconfiguredService =
        new ContentServiceTokenAuthenticationService(new ContentServiceTokenProperties("", ""));

    assertThat(unconfiguredService.authenticate(PUBLISHED_TOKEN)).isEmpty();
  }

  @Test
  void configuredTokensMustMeetMinimumLength() {
    assertThatThrownBy(
            () ->
                new ContentServiceTokenAuthenticationService(
                    new ContentServiceTokenProperties("too-short", MANAGEMENT_TOKEN)))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("app.service-tokens.content.published")
        .hasMessageContaining("at least 32 characters");

    assertThatThrownBy(
            () ->
                new ContentServiceTokenAuthenticationService(
                    new ContentServiceTokenProperties(PUBLISHED_TOKEN, "too-short")))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("app.service-tokens.content.management")
        .hasMessageContaining("at least 32 characters");
  }
}
```

- [ ] **Step 2: Run the backend test to verify it fails if behavior is not pinned**

Run:

```bash
cd backend
./mvnw -Dtest=ContentServiceTokenAuthenticationServiceTests test
```

Expected: The test should compile and pass against current behavior. If it fails, the failure identifies an existing mismatch with the approved design and Task 2 must correct that mismatch.

- [ ] **Step 3: Commit the test**

```bash
git add backend/src/test/java/com/example/springsecuritynotebook/auth/application/ContentServiceTokenAuthenticationServiceTests.java
git commit -m "test: pin content service token authorities"
```

---

### Task 2: Backend Service Token Naming Clarity

**Files:**
- Modify: `backend/src/main/java/com/example/springsecuritynotebook/auth/application/ContentServiceTokenAuthenticationService.java`
- Test: `backend/src/test/java/com/example/springsecuritynotebook/auth/application/ContentServiceTokenAuthenticationServiceTests.java`
- Test: `backend/src/test/java/com/example/springsecuritynotebook/auth/security/JwtProtectedApiTests.java`

- [ ] **Step 1: Replace inline principal names with constants**

In `ContentServiceTokenAuthenticationService`, add constants near `MIN_TOKEN_LENGTH`:

```java
  private static final String PUBLISHED_SERVICE_PRINCIPAL = "content-published-service";
  private static final String MANAGEMENT_SERVICE_PRINCIPAL = "content-management-service";
```

Then replace:

```java
      return Optional.of(createAuthentication("content-published-service", PUBLISHED_AUTHORITIES));
```

with:

```java
      return Optional.of(createAuthentication(PUBLISHED_SERVICE_PRINCIPAL, PUBLISHED_AUTHORITIES));
```

And replace:

```java
          createAuthentication("content-management-service", MANAGEMENT_AUTHORITIES));
```

with:

```java
          createAuthentication(MANAGEMENT_SERVICE_PRINCIPAL, MANAGEMENT_AUTHORITIES));
```

- [ ] **Step 2: Run backend service-token tests**

Run:

```bash
cd backend
./mvnw -Dtest=ContentServiceTokenAuthenticationServiceTests,JwtProtectedApiTests test
```

Expected: `BUILD SUCCESS`, with service-token unit tests and protected API tests passing.

- [ ] **Step 3: Commit backend clarity change**

```bash
git add backend/src/main/java/com/example/springsecuritynotebook/auth/application/ContentServiceTokenAuthenticationService.java
git commit -m "refactor: name content service principals"
```

---

### Task 3: Frontend Authorization-Order Tests

**Files:**
- Modify: `frontend/src/lib/server/content/content-dal.test.ts`
- Read: `frontend/src/lib/server/content/content-dal.ts`
- Read: `frontend/src/lib/server/content/permissions.ts`

- [ ] **Step 1: Add unauthorized session fixtures**

In `frontend/src/lib/server/content/content-dal.test.ts`, after `managerSession`, add:

```ts
const userSession = {
  ...managerSession,
  user: {
    id: 2,
    email: "user@example.com",
    nickname: "user",
    roleNames: ["ROLE_USER"],
  },
};

const noRoleSession = {
  ...managerSession,
  user: {
    id: 3,
    email: "norole@example.com",
    nickname: "norole",
    roleNames: [],
  },
};
```

- [ ] **Step 2: Add tests proving cached helpers are not called before authorization**

In the same `describe("content DAL", () => { ... })` block, add:

```ts
  it("rejects published content before cached service-token fetch when the session lacks read roles", async () => {
    mockedRequireSession.mockResolvedValue(noRoleSession);
    mockedHasPublishedToken.mockReturnValue(true);

    await expect(getPublishedContentSummariesForRequest("/content")).rejects.toThrow(
      "forbidden",
    );

    expect(mockedForbidden).toHaveBeenCalledOnce();
    expect(mockedCachedPublishedList).not.toHaveBeenCalled();
    expect(mockedFetchProtectedOpenApi).not.toHaveBeenCalled();
  });

  it("rejects managed content before cached service-token fetch when the session is not a manager", async () => {
    mockedRequireSession.mockResolvedValue(userSession);
    mockedHasManagementToken.mockReturnValue(true);

    await expect(getManagedContentSummariesForRequest()).rejects.toThrow("forbidden");

    expect(mockedForbidden).toHaveBeenCalledOnce();
    expect(mockedCachedManagedList).not.toHaveBeenCalled();
    expect(mockedFetchProtectedOpenApi).not.toHaveBeenCalled();
  });

  it("rejects managed detail before cached service-token fetch when the session is not a manager", async () => {
    mockedRequireSession.mockResolvedValue(userSession);
    mockedHasManagementToken.mockReturnValue(true);

    await expect(getManagedContentDetailForRequest("9")).rejects.toThrow("forbidden");

    expect(mockedRequireSession).toHaveBeenCalledWith("/manage/content?contentId=9");
    expect(mockedForbidden).toHaveBeenCalledOnce();
    expect(mockedCachedManagedDetail).not.toHaveBeenCalled();
    expect(mockedFetchProtectedOpenApi).not.toHaveBeenCalled();
  });
```

- [ ] **Step 3: Run the targeted frontend test**

Run:

```bash
cd frontend
npm run test:unit -- src/lib/server/content/content-dal.test.ts
```

Expected: The content DAL tests pass. If `test:unit` does not accept a file argument in this project, run `npm run test:unit` and confirm `content-dal.test.ts` passes in the output.

- [ ] **Step 4: Commit frontend tests**

```bash
git add frontend/src/lib/server/content/content-dal.test.ts
git commit -m "test: pin service token authorization order"
```

---

### Task 4: Service Token Documentation and Environment Examples

**Files:**
- Modify: `.env.example`
- Modify: `frontend/.env.example`
- Modify: `backend/README.md`
- Modify: `frontend/README.md`
- Modify: `README.md`
- Read: `docs/superpowers/specs/2026-04-30-service-token-hardening-design.md`

- [ ] **Step 1: Add backend service-token keys to root environment example**

Append to `.env.example`:

```dotenv
APP_CONTENT_PUBLISHED_SERVICE_TOKEN=
APP_CONTENT_MANAGEMENT_SERVICE_TOKEN=
```

- [ ] **Step 2: Add server-only comments to frontend environment example**

Replace `frontend/.env.example` with:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

# Server-only content cache credentials. Values must match the backend
# APP_CONTENT_* tokens when enabled. Do not rename these to NEXT_PUBLIC_*.
CONTENT_PUBLISHED_SERVICE_TOKEN=
CONTENT_MANAGEMENT_SERVICE_TOKEN=
```

- [ ] **Step 3: Add backend README runtime notes**

In `backend/README.md`, under `## Runtime Defaults`, add these bullets after the JWT secret bullet:

```markdown
- `APP_CONTENT_PUBLISHED_SERVICE_TOKEN` and `APP_CONTENT_MANAGEMENT_SERVICE_TOKEN` are optional static service-token credentials for server-to-server content cache reads.
- When configured, each content service token must be at least 32 characters. Use high-entropy generated values; the length check is only a minimum guard.
- Content service tokens authenticate machine principals only and remain read-only: published tokens receive `CONTENT_READ`, management tokens receive `CONTENT_READ` and `CONTENT_DRAFT_READ`.
- In shared environments, restrict service-token traffic to the frontend server at the ingress, VPC, firewall, security group, or API gateway layer.
```

- [ ] **Step 4: Add frontend README environment notes**

In `frontend/README.md`, replace the existing service-token bullet under `## Environment`:

```markdown
- `CONTENT_PUBLISHED_SERVICE_TOKEN`, `CONTENT_MANAGEMENT_SERVICE_TOKEN`은 선택값입니다. 값이 없으면 현재 사용자 세션 토큰으로 backend API를 호출하고, 값이 있으면 최소 32자 이상이어야 캐시된 content fetch에 사용됩니다.
```

with:

```markdown
- `CONTENT_PUBLISHED_SERVICE_TOKEN`, `CONTENT_MANAGEMENT_SERVICE_TOKEN`은 선택값입니다. 값이 없으면 현재 사용자 세션 토큰으로 backend API를 호출하고, 값이 있으면 최소 32자 이상이어야 캐시된 content fetch에 사용됩니다.
- 두 값은 server-only 환경변수입니다. `NEXT_PUBLIC_*`로 노출하거나 UI, props, 로그, cache key에 포함하지 않습니다.
- service token 캐시 경로는 먼저 사용자 session과 role 권한을 확인한 뒤에만 사용합니다. 토큰은 캐시 가능한 backend fetch credential이지 사용자 인가를 대체하지 않습니다.
- 운영형 환경에서는 backend의 `APP_CONTENT_*` 값과 frontend의 `CONTENT_*` 값을 함께 회전하고, backend ingress/VPC/API gateway에서 frontend 서버만 service-token 요청을 보낼 수 있게 제한합니다.
```

- [ ] **Step 5: Add root README service-token hardening note**

In `README.md`, after `## Backend Runtime Notes`, add:

```markdown
## Service Token Hardening Notes

- Content service tokens are optional server-to-server credentials for cached content reads.
- They are static bearer credentials in this learning project. If the Next.js server runtime is compromised, assume environment variables and in-memory token values may be exposed.
- The intended defense is least privilege: service tokens are read-only machine credentials and do not grant subscriber roles or write/admin permissions.
- Frontend cached content helpers must still check the current user session and role before using a service token for backend fetches.
- In shared environments, pair token rotation with source restrictions such as ingress, VPC, firewall, security group, or API gateway allowlists.
- Design details: [2026-04-30-service-token-hardening-design.md](docs/superpowers/specs/2026-04-30-service-token-hardening-design.md)
```

- [ ] **Step 6: Run documentation diff review**

Run:

```bash
git diff -- .env.example frontend/.env.example backend/README.md frontend/README.md README.md
```

Expected: The diff contains no token values, no notebook IDs, no account identifiers, and no claims that static service tokens are safe after runtime compromise.

- [ ] **Step 7: Commit documentation**

```bash
git add .env.example frontend/.env.example backend/README.md frontend/README.md README.md
git commit -m "docs: document content service token hardening"
```

---

### Task 5: Final Verification

**Files:**
- Verify: `backend/src/test/java/com/example/springsecuritynotebook/auth/application/ContentServiceTokenAuthenticationServiceTests.java`
- Verify: `backend/src/test/java/com/example/springsecuritynotebook/auth/security/JwtProtectedApiTests.java`
- Verify: `frontend/src/lib/server/content/content-dal.test.ts`
- Verify: documentation files changed in Task 4

- [ ] **Step 1: Run backend targeted tests**

Run:

```bash
cd backend
./mvnw -Dtest=ContentServiceTokenAuthenticationServiceTests,JwtProtectedApiTests test
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 2: Run frontend unit tests**

Run:

```bash
cd frontend
npm run test:unit
```

Expected: All unit tests pass.

- [ ] **Step 3: Run frontend lint**

Run:

```bash
cd frontend
npm run lint
```

Expected: Lint passes with no errors.

- [ ] **Step 4: Check working tree**

Run:

```bash
git status --short
```

Expected: no uncommitted changes.

---

## Self-Review

- Spec coverage: Backend read-only service-token authorities are covered by Task 1 and Task 2. Frontend authorization-before-cache behavior is covered by Task 3. Runtime compromise, rotation, source restriction, and server-only guidance are covered by Task 4. Verification is covered by Task 5.
- Placeholder scan: No prohibited placeholder text or undefined follow-up steps remain.
- Type consistency: The plan uses existing names from the codebase: `ContentServiceTokenAuthenticationService`, `ContentServiceTokenProperties`, `getPublishedContentSummariesForRequest`, `getManagedContentSummariesForRequest`, `getManagedContentDetailForRequest`, `CONTENT_READ`, and `CONTENT_DRAFT_READ`.
