# Issue 14 Remaining Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the backend security hardening items from issue #14 that PR #15 intentionally left open.

**Architecture:** Keep the existing Spring Boot feature-package structure. Add refresh-token family metadata to JWT refresh tokens, store the current family token and retry successor in Valkey, fail closed when auth-critical Valkey state is unavailable, and gate public Swagger/OpenAPI access through a typed property.

**Tech Stack:** Spring Boot 4, Spring Security, JJWT 0.12.7, Spring Data Redis with `StringRedisTemplate`, JUnit 5, Mockito, MockMvc, Maven Spotless and Checkstyle.

---

## File Structure

- Modify `backend/src/main/java/com/example/springsecuritynotebook/auth/application/JwtService.java`: add refresh-token family id claim support and typed refresh-token claims validation.
- Create `backend/src/main/java/com/example/springsecuritynotebook/auth/application/RefreshTokenClaims.java`: hold validated refresh-token email and family id.
- Create `backend/src/main/java/com/example/springsecuritynotebook/auth/application/TokenStateException.java`: internal exception for unavailable Valkey-backed token state.
- Modify `backend/src/main/java/com/example/springsecuritynotebook/auth/application/RefreshTokenStore.java`: store current family token, retry successor, stale-token detection, family invalidation, and Redis exception wrapping.
- Modify `backend/src/main/java/com/example/springsecuritynotebook/auth/application/AccessTokenBlocklist.java`: wrap Redis lookup/write failures as `TokenStateException`.
- Modify `backend/src/main/java/com/example/springsecuritynotebook/auth/application/AuthService.java`: use typed refresh claims, family-aware store methods, retry handling, and auth error mapping.
- Create `backend/src/main/java/com/example/springsecuritynotebook/auth/config/DocsProperties.java`: bind `app.docs.public-enabled`.
- Modify `backend/src/main/java/com/example/springsecuritynotebook/auth/config/SecurityConfig.java`: gate Swagger/OpenAPI permit rules behind `DocsProperties`.
- Modify `backend/src/main/resources/application.yml`: add `app.docs.public-enabled`.
- Modify `backend/src/test/java/com/example/springsecuritynotebook/auth/application/JwtServiceTests.java`: assert refresh tokens carry a family id and reject missing family ids.
- Modify `backend/src/test/java/com/example/springsecuritynotebook/auth/application/RefreshTokenStoreTests.java`: assert family invalidation and retry behavior.
- Modify `backend/src/test/java/com/example/springsecuritynotebook/auth/application/AuthServiceTests.java`: assert stale reuse invalidates a family and token-state exceptions map to auth errors.
- Modify `backend/src/test/java/com/example/springsecuritynotebook/auth/application/RefreshTokenFlowTests.java`: assert end-to-end stale reuse invalidates later family refresh attempts.
- Modify `backend/src/test/java/com/example/springsecuritynotebook/auth/config/SecurityConfigTests.java`: preserve default public docs tests.
- Create `backend/src/test/java/com/example/springsecuritynotebook/auth/config/SecurityConfigDocsDisabledTests.java`: assert docs endpoints require authentication when disabled.
- Modify `backend/src/test/java/com/example/springsecuritynotebook/auth/security/JwtProtectedApiTests.java`: assert blocklist lookup failures reject protected access.

## Task 1: Add Typed Refresh Token Claims

**Files:**
- Create: `backend/src/main/java/com/example/springsecuritynotebook/auth/application/RefreshTokenClaims.java`
- Modify: `backend/src/main/java/com/example/springsecuritynotebook/auth/application/JwtService.java`
- Test: `backend/src/test/java/com/example/springsecuritynotebook/auth/application/JwtServiceTests.java`

- [ ] **Step 1: Write failing refresh-claim tests**

Add tests that call `generateRefreshToken`, validate the result, assert a nonblank `familyId`, and assert a refresh token without `fid` fails with `ERROR_REFRESH_TOKEN`.

Run: `.\mvnw.cmd -Dtest=JwtServiceTests test`

Expected: compilation fails because `validateRefreshToken` and `RefreshTokenClaims` do not exist.

- [ ] **Step 2: Add `RefreshTokenClaims`**

Create a record with `String email` and `String familyId`, plus `isSameFamily(RefreshTokenClaims other)` only if needed by implementation.

- [ ] **Step 3: Update `JwtService`**

Add constant `REFRESH_TOKEN_FAMILY_ID_CLAIM = "fid"`. Generate UUID family ids for login-issued refresh tokens. Add an overload that generates a successor refresh token for an existing family id. Add `validateRefreshToken(String token)` returning `RefreshTokenClaims`, and keep `validateRefreshTokenEmail(String token)` as a compatibility wrapper.

- [ ] **Step 4: Verify task tests**

Run: `.\mvnw.cmd -Dtest=JwtServiceTests test`

Expected: tests pass.

## Task 2: Make RefreshTokenStore Family-Aware And Fail-Closed

**Files:**
- Create: `backend/src/main/java/com/example/springsecuritynotebook/auth/application/TokenStateException.java`
- Modify: `backend/src/main/java/com/example/springsecuritynotebook/auth/application/RefreshTokenStore.java`
- Test: `backend/src/test/java/com/example/springsecuritynotebook/auth/application/RefreshTokenStoreTests.java`

- [ ] **Step 1: Write failing store tests**

Add tests for these cases:
- `invalidateFamilyRemovesCurrentTokenAndRetrySuccessor`
- `hasTokenStateReturnsTrueForCurrentOrRetryTrackedToken`
- Redis operation exceptions are wrapped as `TokenStateException`

Run: `.\mvnw.cmd -Dtest=RefreshTokenStoreTests test`

Expected: compilation fails for new family-aware methods.

- [ ] **Step 2: Add `TokenStateException`**

Create a package-private or public runtime exception with constructors accepting a message and optional cause.

- [ ] **Step 3: Update store keys and scripts**

Use `auth:refresh:<email>:<familyId>` for the current token, `auth:refresh:retry:<email>:<familyId>:<refreshToken>` for retry successors, and keep legacy `auth:refresh:<email>` cleanup during migration-safe invalidation.

- [ ] **Step 4: Add family-aware methods**

Implement:
- `store(String email, String familyId, String refreshToken, long expiresInSeconds)`
- `Optional<String> get(String email, String familyId)`
- `long getRemainingTtl(String email, String familyId)`
- `boolean rotateIfMatches(String email, String familyId, String expectedRefreshToken, String newRefreshToken, long expiresInSeconds)`
- `Optional<String> findRetrySuccessor(String email, String familyId, String expectedRefreshToken)`
- `boolean hasTokenState(String email, String familyId, String refreshToken)`
- `void invalidateFamily(String email, String familyId)`

Keep existing email-only methods only if tests or logout still need them, delegating where possible or limiting them to legacy cleanup.

- [ ] **Step 5: Wrap Redis exceptions**

Catch `RuntimeException` around `StringRedisTemplate` operations and rethrow `TokenStateException` with messages such as `Refresh token state is unavailable.`

- [ ] **Step 6: Verify task tests**

Run: `.\mvnw.cmd -Dtest=RefreshTokenStoreTests test`

Expected: tests pass.

## Task 3: Wire Family Reuse Detection In AuthService

**Files:**
- Modify: `backend/src/main/java/com/example/springsecuritynotebook/auth/application/AuthService.java`
- Test: `backend/src/test/java/com/example/springsecuritynotebook/auth/application/AuthServiceTests.java`
- Test: `backend/src/test/java/com/example/springsecuritynotebook/auth/application/RefreshTokenFlowTests.java`

- [ ] **Step 1: Write failing service tests**

Add unit tests proving:
- stale refresh token with known family state calls `invalidateFamily` and throws `ERROR_REFRESH_TOKEN`
- token-state failure from blocklist lookup maps to `ERROR_ACCESS_TOKEN`
- token-state failure from refresh rotation maps to `ERROR_REFRESH_TOKEN`

Run: `.\mvnw.cmd -Dtest=AuthServiceTests test`

Expected: compilation fails until AuthService uses new store methods.

- [ ] **Step 2: Update refresh flow**

Use `jwtService.validateRefreshToken(request.refreshToken())`. Compare access email to refresh email. Generate the new refresh token using the same family id. Rotate with `(email, familyId, oldToken, newToken, ttl)`.

- [ ] **Step 3: Add stale reuse handling**

When rotation fails:
- return retry successor if present and current
- if `hasTokenState(email, familyId, submittedToken)` is true, call `invalidateFamily(email, familyId)` and throw `ERROR_REFRESH_TOKEN`
- otherwise throw `ERROR_REFRESH_TOKEN`

- [ ] **Step 4: Map token-state failures**

Catch `TokenStateException` around blocklist checks as `ERROR_ACCESS_TOKEN`; catch token-state failures in refresh-token operations as `ERROR_REFRESH_TOKEN`.

- [ ] **Step 5: Update end-to-end refresh tests**

In `RefreshTokenFlowTests`, after original token reuse is rejected, assert refreshing with the second/current token also fails because the family was invalidated.

- [ ] **Step 6: Verify task tests**

Run:
- `.\mvnw.cmd -Dtest=AuthServiceTests test`
- `.\mvnw.cmd -Dtest=RefreshTokenFlowTests test`

Expected: tests pass.

## Task 4: Fail Closed On Access Token Blocklist State

**Files:**
- Modify: `backend/src/main/java/com/example/springsecuritynotebook/auth/application/AccessTokenBlocklist.java`
- Test: `backend/src/test/java/com/example/springsecuritynotebook/auth/security/JwtProtectedApiTests.java`

- [ ] **Step 1: Write failing blocklist failure test**

Mock or replace the `StringRedisTemplate` interaction so `isRevoked` throws through the filter path, then assert a protected API returns `401` with `ERROR_ACCESS_TOKEN`.

Run: `.\mvnw.cmd -Dtest=JwtProtectedApiTests test`

Expected: test fails before exception mapping is complete.

- [ ] **Step 2: Wrap blocklist Redis operations**

In `revoke` and `isRevoked`, catch Redis runtime failures and throw `TokenStateException("Access token state is unavailable.", exception)`.

- [ ] **Step 3: Verify filter mapping**

If `JwtAuthenticationFilter` already catches runtime auth exceptions through `CustomJwtException`, map `TokenStateException` there. Otherwise map it in `AccessTokenBlocklist.isRevoked` caller by converting to `CustomJwtException("ERROR_ACCESS_TOKEN")`.

- [ ] **Step 4: Verify task tests**

Run: `.\mvnw.cmd -Dtest=JwtProtectedApiTests test`

Expected: tests pass.

## Task 5: Gate Public Swagger And OpenAPI Docs

**Files:**
- Create: `backend/src/main/java/com/example/springsecuritynotebook/auth/config/DocsProperties.java`
- Modify: `backend/src/main/java/com/example/springsecuritynotebook/auth/config/SecurityConfig.java`
- Modify: `backend/src/main/resources/application.yml`
- Modify: `backend/src/test/java/com/example/springsecuritynotebook/auth/config/SecurityConfigTests.java`
- Create: `backend/src/test/java/com/example/springsecuritynotebook/auth/config/SecurityConfigDocsDisabledTests.java`

- [ ] **Step 1: Write failing docs-disabled test**

Create a Spring Boot test with `@TestPropertySource(properties = "app.docs.public-enabled=false")`. Assert `GET /v3/api-docs` and `GET /swagger-ui/index.html` do not return `200` anonymously.

Run: `.\mvnw.cmd -Dtest=SecurityConfigDocsDisabledTests test`

Expected: compilation fails because `DocsProperties` does not exist or test fails because docs are still public.

- [ ] **Step 2: Add `DocsProperties`**

Create a `@ConfigurationProperties(prefix = "app.docs")` record with `boolean publicEnabled`.

- [ ] **Step 3: Update `application.yml`**

Add:

```yaml
app:
  docs:
    public-enabled: ${APP_DOCS_PUBLIC_ENABLED:true}
```

inside the existing `app` tree.

- [ ] **Step 4: Gate request matchers**

Inject `DocsProperties` into `SecurityConfig`. Build the auth rules so Swagger/OpenAPI matchers are `permitAll()` only when `publicEnabled` is true. Keep health/info, login, refresh, and OPTIONS rules unchanged.

- [ ] **Step 5: Preserve default public-docs tests**

Keep existing `SecurityConfigTests` green under the test profile default where `app.docs.public-enabled` is true.

- [ ] **Step 6: Verify task tests**

Run:
- `.\mvnw.cmd -Dtest=SecurityConfigTests test`
- `.\mvnw.cmd -Dtest=SecurityConfigDocsDisabledTests test`

Expected: tests pass.

## Task 6: Final Backend Verification And Issue Comment

**Files:**
- Modify only files from tasks above unless formatting touches imports.

- [ ] **Step 1: Run formatter**

Run from `backend`: `.\mvnw.cmd spotless:apply`

Expected: build success.

- [ ] **Step 2: Run Checkstyle**

Run from `backend`: `.\mvnw.cmd checkstyle:check`

Expected: build success.

- [ ] **Step 3: Run tests**

Run from `backend`: `.\mvnw.cmd test`

Expected: build success.

- [ ] **Step 4: Review git diff**

Run from repo root: `git diff --stat` and `git diff --check`

Expected: only planned files changed and no whitespace errors.

- [ ] **Step 5: Commit implementation**

Stage only planned files and commit:

```powershell
git add -- backend/src/main/java/com/example/springsecuritynotebook/auth/application/JwtService.java `
  backend/src/main/java/com/example/springsecuritynotebook/auth/application/RefreshTokenClaims.java `
  backend/src/main/java/com/example/springsecuritynotebook/auth/application/TokenStateException.java `
  backend/src/main/java/com/example/springsecuritynotebook/auth/application/RefreshTokenStore.java `
  backend/src/main/java/com/example/springsecuritynotebook/auth/application/AccessTokenBlocklist.java `
  backend/src/main/java/com/example/springsecuritynotebook/auth/application/AuthService.java `
  backend/src/main/java/com/example/springsecuritynotebook/auth/config/DocsProperties.java `
  backend/src/main/java/com/example/springsecuritynotebook/auth/config/SecurityConfig.java `
  backend/src/main/resources/application.yml `
  backend/src/test/java/com/example/springsecuritynotebook/auth/application/JwtServiceTests.java `
  backend/src/test/java/com/example/springsecuritynotebook/auth/application/RefreshTokenStoreTests.java `
  backend/src/test/java/com/example/springsecuritynotebook/auth/application/AuthServiceTests.java `
  backend/src/test/java/com/example/springsecuritynotebook/auth/application/RefreshTokenFlowTests.java `
  backend/src/test/java/com/example/springsecuritynotebook/auth/config/SecurityConfigTests.java `
  backend/src/test/java/com/example/springsecuritynotebook/auth/config/SecurityConfigDocsDisabledTests.java `
  backend/src/test/java/com/example/springsecuritynotebook/auth/security/JwtProtectedApiTests.java
git commit -m "fix: finish issue 14 auth hardening"
```

- [ ] **Step 6: Comment on issue #14**

Post a concise issue comment summarizing the three completed items and verification commands.

Run: `gh issue comment 14 --body-file <temp-file>`

Expected: comment URL is returned.

## Self-Review

- Spec coverage: refresh-token family reuse detection is covered by Tasks 1-3; Valkey fail-closed behavior is covered by Tasks 2-4; Swagger/OpenAPI gating is covered by Task 5; backend verification and issue comment are covered by Task 6.
- Placeholder scan: no incomplete work markers are present.
- Type consistency: the plan consistently uses `RefreshTokenClaims`, `TokenStateException`, `DocsProperties`, `app.docs.public-enabled`, `fid`, `familyId`, and the family-aware `RefreshTokenStore` method signatures.
