# Role Permission Authorization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert backend authorization from direct role checks to permission authorities while preserving JWT and frontend contracts.

**Architecture:** Keep `ROLE_*` as assigned subscriber groups and add `SubscriberPermission` as action-level authorities. `SubscriberPrincipal` derives permission authorities from JWT `roleNames`; controllers and service option checks use `hasAuthority(...)` and permission authorities. Refresh reissues access tokens from the latest database subscriber roles instead of stale access-token claims.

**Tech Stack:** Java 21, Spring Boot 4, Spring Security method security, JPA, Maven, JUnit 5, AssertJ, MockMvc.

---

## File Structure

- Create `backend/src/main/java/com/example/springsecuritynotebook/subscriber/domain/SubscriberPermission.java`
  - Owns permission authority names such as `CONTENT_WRITE`.
- Modify `backend/src/main/java/com/example/springsecuritynotebook/subscriber/domain/SubscriberRole.java`
  - Maps each role to a fixed permission set.
- Modify `backend/src/main/java/com/example/springsecuritynotebook/auth/application/SubscriberPrincipal.java`
  - Combines `ROLE_*` authorities with derived permission authorities.
- Modify `backend/src/main/java/com/example/springsecuritynotebook/content/api/ContentController.java`
  - Replaces role checks with permission checks.
- Modify `backend/src/main/java/com/example/springsecuritynotebook/content/application/ContentService.java`
  - Replaces raw role comparison with `CONTENT_DRAFT_READ` authority checks.
- Modify `backend/src/main/java/com/example/springsecuritynotebook/auth/api/AuthController.java`
  - Replaces logout role check with `AUTH_LOGOUT`.
- Modify `backend/src/main/java/com/example/springsecuritynotebook/subscriber/api/UserController.java`
  - Replaces current-user role check with `ME_READ`.
- Modify `backend/src/main/java/com/example/springsecuritynotebook/subscriber/api/AdminSubscriberController.java`
  - Replaces admin role checks with `USER_READ` and `USER_ROLE_UPDATE`.
- Modify `backend/src/main/java/com/example/springsecuritynotebook/subscriber/application/SubscriberAdminService.java`
  - Parses and validates incoming role names explicitly.
- Modify `backend/src/main/java/com/example/springsecuritynotebook/auth/application/AuthService.java`
  - Loads latest subscriber roles during refresh.
- Modify `backend/src/test/java/com/example/springsecuritynotebook/auth/security/JwtProtectedApiTests.java`
  - Verifies permission-protected API behavior and invalid role payload handling.
- Modify `backend/src/test/java/com/example/springsecuritynotebook/auth/application/RefreshTokenFlowTests.java`
  - Verifies refresh uses latest database roles.
- Create `backend/src/test/java/com/example/springsecuritynotebook/auth/application/SubscriberPrincipalTests.java`
  - Verifies authority derivation.

---

### Task 1: Add Permission Model

**Files:**
- Create: `backend/src/main/java/com/example/springsecuritynotebook/subscriber/domain/SubscriberPermission.java`
- Modify: `backend/src/main/java/com/example/springsecuritynotebook/subscriber/domain/SubscriberRole.java`
- Test: `backend/src/test/java/com/example/springsecuritynotebook/auth/application/SubscriberPrincipalTests.java`

- [ ] **Step 1: Write the failing permission mapping tests**

Create `backend/src/test/java/com/example/springsecuritynotebook/auth/application/SubscriberPrincipalTests.java`:

```java
package com.example.springsecuritynotebook.auth.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.springsecuritynotebook.subscriber.domain.SubscriberRole;
import org.junit.jupiter.api.Test;

class SubscriberPrincipalTests {

  @Test
  void userRoleGrantsBasicPermissions() {
    assertThat(SubscriberRole.ROLE_USER.getPermissionNames())
        .containsExactlyInAnyOrder("ME_READ", "CONTENT_READ", "AUTH_LOGOUT");
  }

  @Test
  void managerRoleGrantsContentManagementPermissions() {
    assertThat(SubscriberRole.ROLE_MANAGER.getPermissionNames())
        .containsExactlyInAnyOrder(
            "ME_READ",
            "CONTENT_READ",
            "CONTENT_DRAFT_READ",
            "CONTENT_WRITE",
            "AUTH_LOGOUT");
  }

  @Test
  void adminRoleGrantsUserManagementPermissions() {
    assertThat(SubscriberRole.ROLE_ADMIN.getPermissionNames())
        .containsExactlyInAnyOrder(
            "ME_READ",
            "CONTENT_READ",
            "CONTENT_DRAFT_READ",
            "CONTENT_WRITE",
            "USER_READ",
            "USER_ROLE_UPDATE",
            "AUTH_LOGOUT");
  }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd backend
bash mvnw -Dtest=SubscriberPrincipalTests test
```

Expected: FAIL because `SubscriberRole.getPermissionNames()` and `SubscriberPermission` do not exist.

- [ ] **Step 3: Add the permission enum**

Create `backend/src/main/java/com/example/springsecuritynotebook/subscriber/domain/SubscriberPermission.java`:

```java
package com.example.springsecuritynotebook.subscriber.domain;

public enum SubscriberPermission {
  ME_READ,
  CONTENT_READ,
  CONTENT_DRAFT_READ,
  CONTENT_WRITE,
  USER_READ,
  USER_ROLE_UPDATE,
  AUTH_LOGOUT
}
```

- [ ] **Step 4: Map permissions from roles**

Replace `backend/src/main/java/com/example/springsecuritynotebook/subscriber/domain/SubscriberRole.java` with:

```java
package com.example.springsecuritynotebook.subscriber.domain;

import java.util.EnumSet;
import java.util.Set;

public enum SubscriberRole {
  ROLE_USER(EnumSet.of(
      SubscriberPermission.ME_READ,
      SubscriberPermission.CONTENT_READ,
      SubscriberPermission.AUTH_LOGOUT)),

  ROLE_MANAGER(EnumSet.of(
      SubscriberPermission.ME_READ,
      SubscriberPermission.CONTENT_READ,
      SubscriberPermission.CONTENT_DRAFT_READ,
      SubscriberPermission.CONTENT_WRITE,
      SubscriberPermission.AUTH_LOGOUT)),

  ROLE_ADMIN(EnumSet.of(
      SubscriberPermission.ME_READ,
      SubscriberPermission.CONTENT_READ,
      SubscriberPermission.CONTENT_DRAFT_READ,
      SubscriberPermission.CONTENT_WRITE,
      SubscriberPermission.USER_READ,
      SubscriberPermission.USER_ROLE_UPDATE,
      SubscriberPermission.AUTH_LOGOUT));

  private final Set<SubscriberPermission> permissions;

  SubscriberRole(Set<SubscriberPermission> permissions) {
    this.permissions = Set.copyOf(permissions);
  }

  public Set<SubscriberPermission> getPermissions() {
    return permissions;
  }

  public Set<String> getPermissionNames() {
    return permissions.stream().map(SubscriberPermission::name).collect(java.util.stream.Collectors.toUnmodifiableSet());
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run:

```bash
cd backend
bash mvnw -Dtest=SubscriberPrincipalTests test
```

Expected: PASS.

- [ ] **Step 6: Format if needed**

Run:

```bash
cd backend
bash mvnw spotless:apply
```

Expected: BUILD SUCCESS.

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/com/example/springsecuritynotebook/subscriber/domain/SubscriberPermission.java \
  backend/src/main/java/com/example/springsecuritynotebook/subscriber/domain/SubscriberRole.java \
  backend/src/test/java/com/example/springsecuritynotebook/auth/application/SubscriberPrincipalTests.java
git commit -m "feat: add subscriber permissions"
```

---

### Task 2: Derive Permission Authorities In Principal

**Files:**
- Modify: `backend/src/main/java/com/example/springsecuritynotebook/auth/application/SubscriberPrincipal.java`
- Test: `backend/src/test/java/com/example/springsecuritynotebook/auth/application/SubscriberPrincipalTests.java`

- [ ] **Step 1: Extend principal authority tests**

Append these tests to `SubscriberPrincipalTests`:

```java
  @Test
  void principalKeepsRoleAuthorityAndAddsPermissionAuthorities() {
    SubscriberPrincipal principal =
        new SubscriberPrincipal("manager@example.com", "", "manager", false, java.util.List.of("ROLE_MANAGER"));

    assertThat(principal.getAuthorities())
        .extracting(org.springframework.security.core.GrantedAuthority::getAuthority)
        .containsExactlyInAnyOrder(
            "ROLE_MANAGER",
            "ME_READ",
            "CONTENT_READ",
            "CONTENT_DRAFT_READ",
            "CONTENT_WRITE",
            "AUTH_LOGOUT");
  }

  @Test
  void principalIgnoresUnknownRoleNamesWhenDerivingPermissions() {
    SubscriberPrincipal principal =
        new SubscriberPrincipal("legacy@example.com", "", "legacy", false, java.util.List.of("ROLE_LEGACY"));

    assertThat(principal.getAuthorities())
        .extracting(org.springframework.security.core.GrantedAuthority::getAuthority)
        .containsExactly("ROLE_LEGACY");
  }
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd backend
bash mvnw -Dtest=SubscriberPrincipalTests test
```

Expected: FAIL because `SubscriberPrincipal` currently returns only role authorities.

- [ ] **Step 3: Update authority conversion**

Modify `SubscriberPrincipal.toAuthorities(...)` to:

```java
  private static Collection<? extends GrantedAuthority> toAuthorities(List<String> roleNames) {
    java.util.LinkedHashSet<String> authorityNames = new java.util.LinkedHashSet<>(roleNames);

    roleNames.stream()
        .map(SubscriberPrincipal::findRole)
        .flatMap(java.util.Optional::stream)
        .flatMap(role -> role.getPermissionNames().stream())
        .forEach(authorityNames::add);

    return authorityNames.stream().map(SimpleGrantedAuthority::new).toList();
  }

  private static java.util.Optional<SubscriberRole> findRole(String roleName) {
    try {
      return java.util.Optional.of(SubscriberRole.valueOf(roleName));
    } catch (IllegalArgumentException exception) {
      return java.util.Optional.empty();
    }
  }
```

Keep the existing imports or add these explicit imports if preferred:

```java
import java.util.LinkedHashSet;
import java.util.Optional;
```

If explicit imports are added, use `LinkedHashSet` and `Optional` instead of fully qualified names in the method body.

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
cd backend
bash mvnw -Dtest=SubscriberPrincipalTests test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/example/springsecuritynotebook/auth/application/SubscriberPrincipal.java \
  backend/src/test/java/com/example/springsecuritynotebook/auth/application/SubscriberPrincipalTests.java
git commit -m "feat: derive permission authorities"
```

---

### Task 3: Switch Protected APIs To Permission Checks

**Files:**
- Modify: `backend/src/main/java/com/example/springsecuritynotebook/content/api/ContentController.java`
- Modify: `backend/src/main/java/com/example/springsecuritynotebook/content/application/ContentService.java`
- Modify: `backend/src/main/java/com/example/springsecuritynotebook/auth/api/AuthController.java`
- Modify: `backend/src/main/java/com/example/springsecuritynotebook/subscriber/api/UserController.java`
- Modify: `backend/src/main/java/com/example/springsecuritynotebook/subscriber/api/AdminSubscriberController.java`
- Test: `backend/src/test/java/com/example/springsecuritynotebook/auth/security/JwtProtectedApiTests.java`

- [ ] **Step 1: Add protected API tests for permission behavior**

In `JwtProtectedApiTests`, add static imports:

```java
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
```

Add a field:

```java
  private String managerToken;
```

In `setUp()`, after the admin is created, create and save a manager:

```java
    Subscriber manager =
        Subscriber.builder()
            .email("manager@example.com")
            .password(passwordEncoder.encode("1111"))
            .nickname("manager")
            .build();
    manager.addRole(SubscriberRole.ROLE_MANAGER);

    subscriberRepository.saveAndFlush(manager);
```

After assigning `adminToken`, assign:

```java
    this.managerToken = loginAndExtractToken("manager@example.com", "1111");
```

Add these tests:

```java
  @Test
  void userCannotCreateContent() throws Exception {
    mockMvc
        .perform(
            post("/api/content")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "title": "User Draft",
                      "body": "user cannot write content",
                      "category": "security",
                      "published": true
                    }
                    """))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.error").value("ERROR_ACCESS_DENIED"));
  }

  @Test
  void managerCanCreateContent() throws Exception {
    mockMvc
        .perform(
            post("/api/content")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + managerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "title": "Manager Draft",
                      "body": "manager can write content",
                      "category": "security",
                      "published": false
                    }
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.title").value("Manager Draft"))
        .andExpect(jsonPath("$.published").value(false));
  }

  @Test
  void userIncludeAllDoesNotReturnDrafts() throws Exception {
    contentRepository.saveAndFlush(
        Content.builder()
            .title("Hidden Draft")
            .body("draft")
            .category("draft")
            .published(false)
            .build());

    mockMvc
        .perform(
            get("/api/content")
                .queryParam("includeAll", "true")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[?(@.title == 'Hidden Draft')]").isEmpty());
  }
```

Remove the local manager creation inside the existing `managerCanRequestAllContentsIncludingDrafts()` test and use `managerToken`.

- [ ] **Step 2: Run protected API tests to verify failures**

Run:

```bash
cd backend
bash mvnw -Dtest=JwtProtectedApiTests test
```

Expected: FAIL until method security and draft checks use permission authorities.

- [ ] **Step 3: Change controller annotations**

In `UserController`, change:

```java
  @PreAuthorize("hasAuthority('ME_READ')")
```

In `AuthController.logout`, change:

```java
  @PreAuthorize("hasAuthority('AUTH_LOGOUT')")
```

In `ContentController`, use:

```java
  @GetMapping
  @PreAuthorize("hasAuthority('CONTENT_READ')")
```

```java
  @GetMapping("/{contentId}")
  @PreAuthorize("hasAuthority('CONTENT_READ')")
```

```java
  @PostMapping
  @PreAuthorize("hasAuthority('CONTENT_WRITE')")
```

```java
  @PutMapping("/{contentId}")
  @PreAuthorize("hasAuthority('CONTENT_WRITE')")
```

In `AdminSubscriberController`, use:

```java
  @GetMapping
  @PreAuthorize("hasAuthority('USER_READ')")
```

```java
  @PatchMapping("/{email}/role")
  @PreAuthorize("hasAuthority('USER_ROLE_UPDATE')")
```

- [ ] **Step 4: Change content draft permission check**

In `ContentService`, replace `canViewAll(...)` with:

```java
  private boolean canViewAll(SubscriberPrincipal principal) {
    return principal != null
        && principal.getAuthorities().stream()
            .anyMatch(authority -> authority.getAuthority().equals("CONTENT_DRAFT_READ"));
  }
```

- [ ] **Step 5: Run protected API tests**

Run:

```bash
cd backend
bash mvnw -Dtest=JwtProtectedApiTests test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/example/springsecuritynotebook/content/api/ContentController.java \
  backend/src/main/java/com/example/springsecuritynotebook/content/application/ContentService.java \
  backend/src/main/java/com/example/springsecuritynotebook/auth/api/AuthController.java \
  backend/src/main/java/com/example/springsecuritynotebook/subscriber/api/UserController.java \
  backend/src/main/java/com/example/springsecuritynotebook/subscriber/api/AdminSubscriberController.java \
  backend/src/test/java/com/example/springsecuritynotebook/auth/security/JwtProtectedApiTests.java
git commit -m "feat: authorize APIs by permission"
```

---

### Task 4: Validate Role Update Payloads Explicitly

**Files:**
- Modify: `backend/src/main/java/com/example/springsecuritynotebook/subscriber/application/SubscriberAdminService.java`
- Test: `backend/src/test/java/com/example/springsecuritynotebook/auth/security/JwtProtectedApiTests.java`

- [ ] **Step 1: Add invalid role payload test**

Add this test to `JwtProtectedApiTests`:

```java
  @Test
  void unknownRoleNameReturnsBadRequestJson() throws Exception {
    mockMvc
        .perform(
            patch("/api/admin/users/user@example.com/role")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"roleNames\":[\"ROLE_USER\",\"ROLE_UNKNOWN\"]}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("ERROR_BAD_REQUEST"))
        .andExpect(jsonPath("$.message").value("Request payload is invalid."));
  }
```

- [ ] **Step 2: Run test to verify current behavior**

Run:

```bash
cd backend
bash mvnw -Dtest=JwtProtectedApiTests#unknownRoleNameReturnsBadRequestJson test
```

Expected: PASS if the existing global `IllegalArgumentException` handling already catches `valueOf`; if it fails with a different status, continue to Step 3 and make the validation explicit.

- [ ] **Step 3: Make role parsing explicit**

In `SubscriberAdminService`, replace the role mutation line with:

```java
    subscriber.clearRoles();
    parseRoles(request.roleNames()).forEach(subscriber::addRole);
```

Add this private method:

```java
  private List<SubscriberRole> parseRoles(List<String> roleNames) {
    return roleNames.stream().map(this::parseRole).toList();
  }

  private SubscriberRole parseRole(String roleName) {
    try {
      return SubscriberRole.valueOf(roleName);
    } catch (IllegalArgumentException exception) {
      throw new IllegalArgumentException("Unknown subscriber role: " + roleName, exception);
    }
  }
```

- [ ] **Step 4: Run tests**

Run:

```bash
cd backend
bash mvnw -Dtest=JwtProtectedApiTests#unknownRoleNameReturnsBadRequestJson,JwtProtectedApiTests#adminCanUpdateSubscriberRoles test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/example/springsecuritynotebook/subscriber/application/SubscriberAdminService.java \
  backend/src/test/java/com/example/springsecuritynotebook/auth/security/JwtProtectedApiTests.java
git commit -m "fix: validate subscriber role updates"
```

---

### Task 5: Refresh Access Tokens From Latest Subscriber Roles

**Files:**
- Modify: `backend/src/main/java/com/example/springsecuritynotebook/auth/application/AuthService.java`
- Test: `backend/src/test/java/com/example/springsecuritynotebook/auth/application/RefreshTokenFlowTests.java`

- [ ] **Step 1: Add refresh freshness test**

Add this test to `RefreshTokenFlowTests`:

```java
  @Test
  void refreshUsesLatestSubscriberRoles() throws Exception {
    SubscriberPrincipal originalPrincipal =
        new SubscriberPrincipal(
            "user@example.com", "", "user", false, java.util.List.of("ROLE_USER"));

    String expiredAccessToken =
        jwtService.generateAccessToken(originalPrincipal.toAccessTokenClaims(), -30);
    String refreshToken =
        jwtService.generateRefreshToken(
            "user@example.com", jwtService.getRefreshTokenExpiresInSeconds());
    refreshTokenStore.store(
        "user@example.com", refreshToken, jwtService.getRefreshTokenExpiresInSeconds());

    Subscriber subscriber = subscriberRepository.findByEmail("user@example.com").orElseThrow();
    subscriber.clearRoles();
    subscriber.addRole(SubscriberRole.ROLE_MANAGER);
    subscriberRepository.saveAndFlush(subscriber);

    MvcResult result =
        mockMvc
            .perform(
                post("/api/auth/refresh")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + expiredAccessToken)
                    .contentType("application/json")
                    .content(
                        objectMapper.writeValueAsString(new RefreshTokenRequest(refreshToken))))
            .andExpect(status().isOk())
            .andReturn();

    TokenPairResponse response =
        objectMapper.readValue(result.getResponse().getContentAsString(), TokenPairResponse.class);

    assertThat(jwtService.validateAccessToken(response.accessToken()).roleNames())
        .containsExactly("ROLE_MANAGER");
  }
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd backend
bash mvnw -Dtest=RefreshTokenFlowTests#refreshUsesLatestSubscriberRoles test
```

Expected: FAIL because `AuthService.refresh()` reuses stale `accessClaims`.

- [ ] **Step 3: Inject subscriber lookup into AuthService**

In `AuthService`, add imports:

```java
import com.example.springsecuritynotebook.subscriber.application.SubscriberUserLookup;
import com.example.springsecuritynotebook.subscriber.domain.Subscriber;
```

Add a field:

```java
  private final SubscriberUserLookup subscriberUserLookup;
```

Change the constructor to:

```java
  public AuthService(
      JwtService jwtService,
      RefreshTokenStore refreshTokenStore,
      AccessTokenBlocklist accessTokenBlocklist,
      SubscriberUserLookup subscriberUserLookup) {
    this.jwtService = jwtService;
    this.refreshTokenStore = refreshTokenStore;
    this.accessTokenBlocklist = accessTokenBlocklist;
    this.subscriberUserLookup = subscriberUserLookup;
  }
```

- [ ] **Step 4: Build refreshed access claims from the latest subscriber**

In `AuthService.refresh()`, replace:

```java
    String accessTokenValue =
        jwtService.generateAccessToken(accessClaims, jwtService.getAccessTokenExpiresInSeconds());
```

with:

```java
    Subscriber subscriber =
        subscriberUserLookup
            .findByEmail(email)
            .orElseThrow(() -> new CustomJwtException("ERROR_ACCESS_TOKEN"));
    AccessTokenClaims refreshedClaims = SubscriberPrincipal.from(subscriber).toAccessTokenClaims();

    String accessTokenValue =
        jwtService.generateAccessToken(refreshedClaims, jwtService.getAccessTokenExpiresInSeconds());
```

- [ ] **Step 5: Run refresh tests**

Run:

```bash
cd backend
bash mvnw -Dtest=RefreshTokenFlowTests test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/example/springsecuritynotebook/auth/application/AuthService.java \
  backend/src/test/java/com/example/springsecuritynotebook/auth/application/RefreshTokenFlowTests.java
git commit -m "fix: refresh access tokens with latest roles"
```

---

### Task 6: Full Backend Verification

**Files:**
- Verify all backend files touched in Tasks 1-5.

- [ ] **Step 1: Run formatting**

Run:

```bash
cd backend
bash mvnw spotless:apply
```

Expected: BUILD SUCCESS.

- [ ] **Step 2: Run full backend tests**

Run:

```bash
cd backend
bash mvnw test
```

Expected: BUILD SUCCESS.

- [ ] **Step 3: Inspect git diff**

Run:

```bash
git status --short
git diff --stat
```

Expected: only role-permission authorization implementation files are changed.

- [ ] **Step 4: Commit verification formatting changes if any**

If `spotless:apply` changed files after the previous commits, run:

```bash
git add backend
git commit -m "style: format role permission authorization"
```

Expected: commit is created only if formatting changed tracked files.

---

## Self-Review

Spec coverage:

- Permission enum and role mapping are covered by Task 1.
- Principal role and permission authorities are covered by Task 2.
- Permission-based `@PreAuthorize` rules and draft visibility are covered by Task 3.
- Explicit invalid role payload handling is covered by Task 4.
- Refresh latest-role behavior is covered by Task 5.
- Backend verification is covered by Task 6.
- Frontend is intentionally untouched because the spec preserves role-based frontend behavior and does not add JWT `permissionNames`.

Placeholder scan:

- This plan contains no red-flag markers, deferred implementation step, or unspecified test instruction.

Type consistency:

- `SubscriberPermission`, `SubscriberRole.getPermissionNames()`, `SubscriberPrincipal`, `AccessTokenClaims`, `SubscriberUserLookup`, and `AuthService.refresh()` names match the current codebase and the planned code snippets.
