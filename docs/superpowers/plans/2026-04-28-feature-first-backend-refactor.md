# Feature-First Backend Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the backend from the current global `persistence` detour into feature-owned Spring Boot packages while preserving all API contracts and authentication behavior.

**Architecture:** Use feature/domain-first packaging: `subscriber` owns `Subscriber`, `SubscriberRole`, and `SubscriberRepository`; `content` owns `Content` and `ContentRepository`; `auth` keeps Spring Security concerns and uses a narrow subscriber lookup boundary. JPA entities remain entities, but ownership follows the feature rather than a global technical layer.

**Tech Stack:** Java 21, Spring Boot 4, Spring Security, Spring Data JPA, Maven wrapper, JUnit 5, MockMvc.

---

## Starting State

The worktree already contains an in-progress global persistence move. Treat that as the starting point, not as committed baseline:

- Existing temporary packages:
  - `backend/src/main/java/com/example/springsecuritynotebook/persistence/entity/Subscriber.java`
  - `backend/src/main/java/com/example/springsecuritynotebook/persistence/entity/Content.java`
  - `backend/src/main/java/com/example/springsecuritynotebook/persistence/model/SubscriberRole.java`
  - `backend/src/main/java/com/example/springsecuritynotebook/persistence/repository/SubscriberRepository.java`
  - `backend/src/main/java/com/example/springsecuritynotebook/persistence/repository/ContentRepository.java`
- Deleted original feature-owned files:
  - `backend/src/main/java/com/example/springsecuritynotebook/subscriber/domain/Subscriber.java`
  - `backend/src/main/java/com/example/springsecuritynotebook/subscriber/domain/SubscriberRole.java`
  - `backend/src/main/java/com/example/springsecuritynotebook/subscriber/domain/SubscriberRepository.java`
  - `backend/src/main/java/com/example/springsecuritynotebook/content/domain/Content.java`
  - `backend/src/main/java/com/example/springsecuritynotebook/content/domain/ContentRepository.java`
- Temporary structure test:
  - `backend/src/test/java/com/example/springsecuritynotebook/persistence/PersistencePackageStructureTests.java`

Do not revert unrelated user work. Use explicit `git add` paths at each commit.

## File Structure

Final ownership:

- `backend/src/main/java/com/example/springsecuritynotebook/subscriber/domain/Subscriber.java`
  - JPA entity for subscribers plus domain behavior such as role and profile changes.
- `backend/src/main/java/com/example/springsecuritynotebook/subscriber/domain/SubscriberRole.java`
  - Security/domain role enum.
- `backend/src/main/java/com/example/springsecuritynotebook/subscriber/persistence/SubscriberRepository.java`
  - Spring Data repository for subscriber persistence.
- `backend/src/main/java/com/example/springsecuritynotebook/subscriber/application/SubscriberUserLookup.java`
  - Narrow auth-facing lookup boundary.
- `backend/src/main/java/com/example/springsecuritynotebook/subscriber/application/SubscriberUserLookupService.java`
  - Transactional implementation of subscriber lookup for Spring Security.
- `backend/src/main/java/com/example/springsecuritynotebook/content/domain/Content.java`
  - JPA entity for content plus update behavior.
- `backend/src/main/java/com/example/springsecuritynotebook/content/persistence/ContentRepository.java`
  - Spring Data repository for content persistence.
- `backend/src/test/java/com/example/springsecuritynotebook/architecture/FeaturePackageStructureTests.java`
  - Lightweight structure test documenting the final feature-owned packages.
- `backend/src/test/java/com/example/springsecuritynotebook/subscriber/persistence/SubscriberRepositoryTests.java`
  - Repository integration test under subscriber ownership.

Existing application, API, bootstrap, and auth tests remain in place with imports adjusted.

---

### Task 1: Replace Global Persistence Structure Test With Feature-Owned Failing Test

**Files:**
- Delete: `backend/src/test/java/com/example/springsecuritynotebook/persistence/PersistencePackageStructureTests.java`
- Create: `backend/src/test/java/com/example/springsecuritynotebook/architecture/FeaturePackageStructureTests.java`

- [ ] **Step 1: Write the failing structure test**

Create `backend/src/test/java/com/example/springsecuritynotebook/architecture/FeaturePackageStructureTests.java`:

```java
package com.example.springsecuritynotebook.architecture;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class FeaturePackageStructureTests {

  @Test
  void domainAndPersistenceTypesAreOwnedByFeatures() {
    assertPackage("com.example.springsecuritynotebook.subscriber.domain.Subscriber");
    assertPackage("com.example.springsecuritynotebook.subscriber.domain.SubscriberRole");
    assertPackage("com.example.springsecuritynotebook.subscriber.persistence.SubscriberRepository");
    assertPackage("com.example.springsecuritynotebook.content.domain.Content");
    assertPackage("com.example.springsecuritynotebook.content.persistence.ContentRepository");
  }

  @Test
  void globalPersistencePackageDoesNotOwnFeatureTypes() {
    assertClassMissing("com.example.springsecuritynotebook.persistence.entity.Subscriber");
    assertClassMissing("com.example.springsecuritynotebook.persistence.entity.Content");
    assertClassMissing("com.example.springsecuritynotebook.persistence.model.SubscriberRole");
    assertClassMissing("com.example.springsecuritynotebook.persistence.repository.SubscriberRepository");
    assertClassMissing("com.example.springsecuritynotebook.persistence.repository.ContentRepository");
  }

  private void assertPackage(String className) {
    Class<?> type = assertDoesNotThrow(() -> Class.forName(className));

    assertEquals(packageName(className), type.getPackageName());
  }

  private void assertClassMissing(String className) {
    assertThrows(ClassNotFoundException.class, () -> Class.forName(className));
  }

  private String packageName(String className) {
    return className.substring(0, className.lastIndexOf('.'));
  }
}
```

- [ ] **Step 2: Remove the obsolete global persistence structure test**

Run:

```bash
rm backend/src/test/java/com/example/springsecuritynotebook/persistence/PersistencePackageStructureTests.java
```

- [ ] **Step 3: Run the structure test and verify it fails for the right reason**

Run from `backend/`:

```bash
bash mvnw -Dtest=FeaturePackageStructureTests test
```

Expected: FAIL because the feature-owned classes do not exist yet and temporary global persistence classes still exist.

- [ ] **Step 4: Commit the failing architecture test**

```bash
git add backend/src/test/java/com/example/springsecuritynotebook/architecture/FeaturePackageStructureTests.java \
  backend/src/test/java/com/example/springsecuritynotebook/persistence/PersistencePackageStructureTests.java
git commit -m "test: define feature-owned backend package structure"
```

---

### Task 2: Move Subscriber Domain And Repository To Feature-Owned Packages

**Files:**
- Move: `backend/src/main/java/com/example/springsecuritynotebook/persistence/entity/Subscriber.java` -> `backend/src/main/java/com/example/springsecuritynotebook/subscriber/domain/Subscriber.java`
- Move: `backend/src/main/java/com/example/springsecuritynotebook/persistence/model/SubscriberRole.java` -> `backend/src/main/java/com/example/springsecuritynotebook/subscriber/domain/SubscriberRole.java`
- Move: `backend/src/main/java/com/example/springsecuritynotebook/persistence/repository/SubscriberRepository.java` -> `backend/src/main/java/com/example/springsecuritynotebook/subscriber/persistence/SubscriberRepository.java`
- Move: `backend/src/test/java/com/example/springsecuritynotebook/persistence/repository/SubscriberRepositoryTests.java` -> `backend/src/test/java/com/example/springsecuritynotebook/subscriber/persistence/SubscriberRepositoryTests.java`
- Modify imports in auth, subscriber, bootstrap, and tests that reference subscriber persistence classes.

- [ ] **Step 1: Move the files**

Run:

```bash
mkdir -p backend/src/main/java/com/example/springsecuritynotebook/subscriber/domain
mkdir -p backend/src/main/java/com/example/springsecuritynotebook/subscriber/persistence
mkdir -p backend/src/test/java/com/example/springsecuritynotebook/subscriber/persistence
git mv backend/src/main/java/com/example/springsecuritynotebook/persistence/entity/Subscriber.java \
  backend/src/main/java/com/example/springsecuritynotebook/subscriber/domain/Subscriber.java
git mv backend/src/main/java/com/example/springsecuritynotebook/persistence/model/SubscriberRole.java \
  backend/src/main/java/com/example/springsecuritynotebook/subscriber/domain/SubscriberRole.java
git mv backend/src/main/java/com/example/springsecuritynotebook/persistence/repository/SubscriberRepository.java \
  backend/src/main/java/com/example/springsecuritynotebook/subscriber/persistence/SubscriberRepository.java
git mv backend/src/test/java/com/example/springsecuritynotebook/persistence/repository/SubscriberRepositoryTests.java \
  backend/src/test/java/com/example/springsecuritynotebook/subscriber/persistence/SubscriberRepositoryTests.java
```

- [ ] **Step 2: Update package declarations**

Set the first line of each moved file to:

```java
package com.example.springsecuritynotebook.subscriber.domain;
```

for `Subscriber.java` and `SubscriberRole.java`.

Set the first line of `SubscriberRepository.java` and `SubscriberRepositoryTests.java` to:

```java
package com.example.springsecuritynotebook.subscriber.persistence;
```

- [ ] **Step 3: Update subscriber repository imports**

In `backend/src/main/java/com/example/springsecuritynotebook/subscriber/persistence/SubscriberRepository.java`, use:

```java
import com.example.springsecuritynotebook.subscriber.domain.Subscriber;
```

In `backend/src/test/java/com/example/springsecuritynotebook/subscriber/persistence/SubscriberRepositoryTests.java`, use:

```java
import com.example.springsecuritynotebook.subscriber.domain.Subscriber;
import com.example.springsecuritynotebook.subscriber.domain.SubscriberRole;
```

- [ ] **Step 4: Replace subscriber imports across the backend**

Run:

```bash
rg -n "com\\.example\\.springsecuritynotebook\\.persistence\\.(entity\\.Subscriber|model\\.SubscriberRole|repository\\.SubscriberRepository)" backend/src/main/java backend/src/test/java
```

Replace matches with these imports:

```java
import com.example.springsecuritynotebook.subscriber.domain.Subscriber;
import com.example.springsecuritynotebook.subscriber.domain.SubscriberRole;
import com.example.springsecuritynotebook.subscriber.persistence.SubscriberRepository;
```

Do not change controller request mappings, DTO record component names, or response field names.

- [ ] **Step 5: Run subscriber repository and structure tests**

Run from `backend/`:

```bash
bash mvnw -Dtest=SubscriberRepositoryTests,FeaturePackageStructureTests test
```

Expected: `SubscriberRepositoryTests` PASS. `FeaturePackageStructureTests` still FAIL because content remains in the temporary global persistence package.

- [ ] **Step 6: Commit subscriber feature ownership**

```bash
git add backend/src/main/java/com/example/springsecuritynotebook/subscriber/domain/Subscriber.java \
  backend/src/main/java/com/example/springsecuritynotebook/subscriber/domain/SubscriberRole.java \
  backend/src/main/java/com/example/springsecuritynotebook/subscriber/persistence/SubscriberRepository.java \
  backend/src/test/java/com/example/springsecuritynotebook/subscriber/persistence/SubscriberRepositoryTests.java \
  backend/src/main/java/com/example/springsecuritynotebook \
  backend/src/test/java/com/example/springsecuritynotebook
git commit -m "refactor: move subscriber persistence under subscriber feature"
```

---

### Task 3: Move Content Domain And Repository To Feature-Owned Packages

**Files:**
- Move: `backend/src/main/java/com/example/springsecuritynotebook/persistence/entity/Content.java` -> `backend/src/main/java/com/example/springsecuritynotebook/content/domain/Content.java`
- Move: `backend/src/main/java/com/example/springsecuritynotebook/persistence/repository/ContentRepository.java` -> `backend/src/main/java/com/example/springsecuritynotebook/content/persistence/ContentRepository.java`
- Modify: `backend/src/main/java/com/example/springsecuritynotebook/content/application/ContentService.java`
- Modify: `backend/src/main/java/com/example/springsecuritynotebook/content/application/ContentDetailResponse.java`
- Modify: `backend/src/main/java/com/example/springsecuritynotebook/content/application/ContentSummaryResponse.java`
- Modify test imports that reference content persistence classes.

- [ ] **Step 1: Move the files**

Run:

```bash
mkdir -p backend/src/main/java/com/example/springsecuritynotebook/content/domain
mkdir -p backend/src/main/java/com/example/springsecuritynotebook/content/persistence
git mv backend/src/main/java/com/example/springsecuritynotebook/persistence/entity/Content.java \
  backend/src/main/java/com/example/springsecuritynotebook/content/domain/Content.java
git mv backend/src/main/java/com/example/springsecuritynotebook/persistence/repository/ContentRepository.java \
  backend/src/main/java/com/example/springsecuritynotebook/content/persistence/ContentRepository.java
```

- [ ] **Step 2: Update package declarations**

Set `Content.java` to:

```java
package com.example.springsecuritynotebook.content.domain;
```

Set `ContentRepository.java` to:

```java
package com.example.springsecuritynotebook.content.persistence;
```

- [ ] **Step 3: Update content repository imports**

In `backend/src/main/java/com/example/springsecuritynotebook/content/persistence/ContentRepository.java`, use:

```java
import com.example.springsecuritynotebook.content.domain.Content;
```

- [ ] **Step 4: Replace content imports across the backend**

Run:

```bash
rg -n "com\\.example\\.springsecuritynotebook\\.persistence\\.(entity\\.Content|repository\\.ContentRepository)" backend/src/main/java backend/src/test/java
```

Replace matches with:

```java
import com.example.springsecuritynotebook.content.domain.Content;
import com.example.springsecuritynotebook.content.persistence.ContentRepository;
```

- [ ] **Step 5: Remove empty temporary persistence directories**

Run:

```bash
find backend/src/main/java/com/example/springsecuritynotebook/persistence -type f
find backend/src/test/java/com/example/springsecuritynotebook/persistence -type f
```

Expected: no files are printed. If empty directories remain, remove them:

```bash
rmdir backend/src/main/java/com/example/springsecuritynotebook/persistence/entity \
  backend/src/main/java/com/example/springsecuritynotebook/persistence/model \
  backend/src/main/java/com/example/springsecuritynotebook/persistence/repository \
  backend/src/main/java/com/example/springsecuritynotebook/persistence \
  backend/src/test/java/com/example/springsecuritynotebook/persistence/repository \
  backend/src/test/java/com/example/springsecuritynotebook/persistence
```

- [ ] **Step 6: Run structure test**

Run from `backend/`:

```bash
bash mvnw -Dtest=FeaturePackageStructureTests test
```

Expected: PASS.

- [ ] **Step 7: Commit content feature ownership**

```bash
git add backend/src/main/java/com/example/springsecuritynotebook/content/domain/Content.java \
  backend/src/main/java/com/example/springsecuritynotebook/content/persistence/ContentRepository.java \
  backend/src/main/java/com/example/springsecuritynotebook/content/application \
  backend/src/test/java/com/example/springsecuritynotebook/architecture/FeaturePackageStructureTests.java
git commit -m "refactor: move content persistence under content feature"
```

---

### Task 4: Add Narrow Subscriber Lookup Boundary For Auth

**Files:**
- Create: `backend/src/main/java/com/example/springsecuritynotebook/subscriber/application/SubscriberUserLookup.java`
- Create: `backend/src/main/java/com/example/springsecuritynotebook/subscriber/application/SubscriberUserLookupService.java`
- Modify: `backend/src/main/java/com/example/springsecuritynotebook/auth/application/SubscriberUserDetailsService.java`
- Modify: `backend/src/main/java/com/example/springsecuritynotebook/auth/application/SubscriberPrincipal.java`
- Test: existing login/auth tests.

- [ ] **Step 1: Create the lookup interface**

Create `backend/src/main/java/com/example/springsecuritynotebook/subscriber/application/SubscriberUserLookup.java`:

```java
package com.example.springsecuritynotebook.subscriber.application;

import com.example.springsecuritynotebook.subscriber.domain.Subscriber;
import java.util.Optional;

public interface SubscriberUserLookup {

  Optional<Subscriber> findByEmail(String email);
}
```

- [ ] **Step 2: Create the lookup service**

Create `backend/src/main/java/com/example/springsecuritynotebook/subscriber/application/SubscriberUserLookupService.java`:

```java
package com.example.springsecuritynotebook.subscriber.application;

import com.example.springsecuritynotebook.subscriber.domain.Subscriber;
import com.example.springsecuritynotebook.subscriber.persistence.SubscriberRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SubscriberUserLookupService implements SubscriberUserLookup {

  private final SubscriberRepository subscriberRepository;

  public SubscriberUserLookupService(SubscriberRepository subscriberRepository) {
    this.subscriberRepository = subscriberRepository;
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<Subscriber> findByEmail(String email) {
    return subscriberRepository.findByEmail(email);
  }
}
```

- [ ] **Step 3: Update `SubscriberUserDetailsService` to use the lookup boundary**

Replace the repository field and constructor dependency in `backend/src/main/java/com/example/springsecuritynotebook/auth/application/SubscriberUserDetailsService.java` with:

```java
private final SubscriberUserLookup subscriberUserLookup;

public SubscriberUserDetailsService(SubscriberUserLookup subscriberUserLookup) {
  this.subscriberUserLookup = subscriberUserLookup;
}
```

Use this import:

```java
import com.example.springsecuritynotebook.subscriber.application.SubscriberUserLookup;
import com.example.springsecuritynotebook.subscriber.domain.Subscriber;
```

Use this lookup call:

```java
Subscriber subscriber =
    subscriberUserLookup
        .findByEmail(username)
        .orElseThrow(() -> new UsernameNotFoundException("Subscriber not found: " + username));
```

- [ ] **Step 4: Confirm `SubscriberPrincipal` imports domain types only**

In `backend/src/main/java/com/example/springsecuritynotebook/auth/application/SubscriberPrincipal.java`, use:

```java
import com.example.springsecuritynotebook.subscriber.domain.Subscriber;
import com.example.springsecuritynotebook.subscriber.domain.SubscriberRole;
```

- [ ] **Step 5: Run auth-focused tests**

Run from `backend/`:

```bash
bash mvnw -Dtest=LoginFlowTests,AuthServiceTests,JwtProtectedApiTests,RefreshTokenFlowTests test
```

Expected: PASS.

- [ ] **Step 6: Commit auth lookup boundary**

```bash
git add backend/src/main/java/com/example/springsecuritynotebook/subscriber/application/SubscriberUserLookup.java \
  backend/src/main/java/com/example/springsecuritynotebook/subscriber/application/SubscriberUserLookupService.java \
  backend/src/main/java/com/example/springsecuritynotebook/auth/application/SubscriberUserDetailsService.java \
  backend/src/main/java/com/example/springsecuritynotebook/auth/application/SubscriberPrincipal.java
git commit -m "refactor: decouple auth subscriber lookup from repository"
```

---

### Task 5: Verify API Contract Safety Net

**Files:**
- Modify: `backend/src/test/java/com/example/springsecuritynotebook/auth/security/JwtProtectedApiTests.java`
- Modify: `backend/src/test/java/com/example/springsecuritynotebook/auth/application/RefreshTokenFlowTests.java`

- [ ] **Step 1: Inspect existing MockMvc response assertions**

Run:

```bash
rg -n "jsonPath|status\\(\\)|/api/auth/login|/api/users/me|/api/content|/api/admin/users|ERROR_ACCESS_TOKEN|ERROR_REFRESH_TOKEN" backend/src/test/java/com/example/springsecuritynotebook/auth backend/src/test/java/com/example/springsecuritynotebook/subscriber backend/src/test/java/com/example/springsecuritynotebook/content
```

Expected: output includes `grantType`, `accessToken`, `refreshToken`, `/api/users/me`, `/api/content`, `/api/admin/users`, `ERROR_ACCESS_TOKEN`, and `ERROR_BAD_REQUEST`.

- [ ] **Step 2: Tighten current-user response-shape assertions**

In `backend/src/test/java/com/example/springsecuritynotebook/auth/security/JwtProtectedApiTests.java`, update `validTokenCanAccessProtectedEndpoint()` so the response assertions are:

```java
.andExpect(status().isOk())
.andExpect(jsonPath("$.email").value("user@example.com"))
.andExpect(jsonPath("$.nickname").value("user"))
.andExpect(jsonPath("$.social").value(false))
.andExpect(jsonPath("$.roleNames[0]").value("ROLE_USER"));
```

- [ ] **Step 3: Tighten refresh token response-shape assertions**

In `backend/src/test/java/com/example/springsecuritynotebook/auth/application/RefreshTokenFlowTests.java`, update `expiredAccessAndValidRefreshReturnsNewAccessToken()` so the success response assertions include the stable numeric expiry fields:

```java
.andExpect(status().isOk())
.andExpect(jsonPath("$.grantType").value("Bearer"))
.andExpect(jsonPath("$.accessToken").isString())
.andExpect(jsonPath("$.refreshToken").isString())
.andExpect(jsonPath("$.accessTokenExpiresIn").value(600))
.andExpect(jsonPath("$.refreshTokenExpiresIn").isNumber())
.andReturn();
```

- [ ] **Step 4: Run API contract tests**

Run from `backend/`:

```bash
bash mvnw -Dtest=LoginFlowTests,JwtProtectedApiTests,RefreshTokenFlowTests test
```

Expected: PASS.

- [ ] **Step 5: Commit test assertion updates**

```bash
git add backend/src/test/java/com/example/springsecuritynotebook/auth/security/JwtProtectedApiTests.java \
  backend/src/test/java/com/example/springsecuritynotebook/auth/application/RefreshTokenFlowTests.java
git commit -m "test: preserve backend auth api contracts"
```

---

### Task 6: Full Backend Verification And Cleanup

**Files:**
- Inspect all backend files touched by previous tasks.
- No frontend changes are expected.

- [ ] **Step 1: Ensure no global persistence package references remain**

Run:

```bash
rg -n "com\\.example\\.springsecuritynotebook\\.persistence|springsecuritynotebook/persistence" backend/src/main/java backend/src/test/java
```

Expected: no output.

- [ ] **Step 2: Ensure final feature-owned files exist**

Run:

```bash
test -f backend/src/main/java/com/example/springsecuritynotebook/subscriber/domain/Subscriber.java
test -f backend/src/main/java/com/example/springsecuritynotebook/subscriber/domain/SubscriberRole.java
test -f backend/src/main/java/com/example/springsecuritynotebook/subscriber/persistence/SubscriberRepository.java
test -f backend/src/main/java/com/example/springsecuritynotebook/content/domain/Content.java
test -f backend/src/main/java/com/example/springsecuritynotebook/content/persistence/ContentRepository.java
```

Expected: all commands exit with status `0`.

- [ ] **Step 3: Run full backend tests**

Run from `backend/`:

```bash
bash mvnw clean test
```

Expected: BUILD SUCCESS.

- [ ] **Step 4: Run formatting/checkstyle if the previous command passes**

Run from `backend/`:

```bash
bash mvnw spotless:apply checkstyle:check
```

Expected: BUILD SUCCESS. If Spotless changes files, run `bash mvnw clean test` again.

- [ ] **Step 5: Review git diff for API contract drift**

Run:

```bash
git diff -- backend/src/main/java/com/example/springsecuritynotebook/*/api backend/src/main/java/com/example/springsecuritynotebook/*/application
```

Expected: package/import changes are acceptable; controller mappings, DTO record component names, and auth error codes are unchanged.

- [ ] **Step 6: Commit final cleanup**

If Step 4 or Step 5 changed files, commit:

```bash
git add backend/src/main/java backend/src/test/java
git commit -m "chore: verify feature-first backend refactor"
```

If no files changed after the previous task commits, do not create an empty commit.

---

## Self-Review Checklist

- Spec coverage:
  - Feature-first package ownership is covered by Tasks 1, 2, and 3.
  - API contract preservation is covered by Task 5 and Task 6.
  - Narrow auth subscriber lookup boundary is covered by Task 4.
  - Removal of global `persistence` ownership is covered by Tasks 1, 3, and 6.
  - Backend regression verification is covered by Task 6.
- Placeholder scan:
  - No task uses open-ended placeholders.
  - Each code step includes concrete paths, imports, commands, and expected results.
- Type consistency:
  - `SubscriberUserLookup` returns `Optional<Subscriber>`.
  - `SubscriberUserDetailsService` depends on `SubscriberUserLookup`.
  - Final package names match the design spec.
