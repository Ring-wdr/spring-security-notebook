# Feature-First Backend Refactor Design

## Goal

Refactor the Spring Boot backend using the architectural lessons from
`/home/user/private/MoEasy-backend`, but translate those patterns into Spring
Boot conventions. The refactor should improve package ownership and dependency
direction without changing existing API endpoints, request bodies, response
fields, status codes, or authentication behavior consumed by the frontend.

The target is not a literal NestJS-style port. MoEasy separates public service
logic, domain components, and DAO persistence concerns. In this repository, the
same idea should become a feature-first Spring structure: each feature owns its
API, application use cases, domain model, and persistence interfaces where
needed.

## Constraints

- Keep frontend-facing API contracts unchanged.
- Keep behavior changes minimal.
- Refactor the backend as one coordinated pass, but implement it in verifiable
  internal steps.
- Do not continue the current global `persistence` package direction.
- Preserve the Spring Security learning value of the repository by keeping auth
  flow names and responsibilities easy to trace.

## Reference Pattern

MoEasy roughly maps to this repository as follows:

| MoEasy pattern | Spring Boot translation |
| --- | --- |
| `service/*` | Feature-local `api` and `application` packages |
| `domain/*` | Feature-local `domain` packages |
| `component` | Domain service or application collaborator, only when needed |
| `dao` | Spring Data repository in feature-local `persistence` |
| `middleware` | `auth.security`, `auth.handler`, and shared web concerns |

The important part is responsibility separation, not preserving the TypeScript
package names.

## Target Package Structure

Use feature/domain-first packaging with internal layers:

```text
com.example.springsecuritynotebook
├─ auth
│  ├─ api
│  ├─ application
│  ├─ config
│  ├─ handler
│  └─ security
├─ subscriber
│  ├─ api
│  ├─ application
│  ├─ domain
│  │  ├─ Subscriber
│  │  └─ SubscriberRole
│  └─ persistence
│     └─ SubscriberRepository
├─ content
│  ├─ api
│  ├─ application
│  ├─ domain
│  │  └─ Content
│  └─ persistence
│     └─ ContentRepository
├─ bootstrap
│  └─ DemoDataInitializer
└─ shared
   ├─ config
   └─ exception
```

The global `persistence/entity`, `persistence/repository`, and
`persistence/model` packages are not part of the final design. `Subscriber`,
`Content`, and `SubscriberRole` carry domain vocabulary and behavior, so they
belong to their owning features.

## Dependency Direction

The normal dependency direction is:

```text
api -> application -> domain
application -> persistence
auth/security -> narrow subscriber lookup boundary
shared -> no feature dependency
```

`api` packages keep HTTP concerns only: route mappings, validation, principal
binding, request extraction, and response return.

`application` packages own use cases and transaction boundaries. Existing
services such as `AuthService`, `SubscriberAdminService`, and `ContentService`
remain application services, but state changes should be expressed through
domain methods on `Subscriber` and `Content`.

`domain` packages hold JPA entities, enums, and feature rules. This repository
does not need separate pure domain objects and JPA entities; that would add
complexity without improving the current learning goal.

`persistence` packages hold Spring Data repositories. Do not add DAO adapter
classes unless a concrete query or mapping problem appears.

`bootstrap` is a composition package for startup data wiring that may depend on
multiple features. It is intentionally separate from `shared` so `shared` can
remain feature-independent.

`auth` needs subscriber data for Spring Security. Prefer a narrow lookup
boundary such as `SubscriberUserLookup` if the refactor would otherwise make
auth depend directly on subscriber repository details.

## API Contract Preservation

Controllers, endpoint paths, HTTP methods, request record fields, response
record fields, and auth error response shapes must remain stable. Because the
frontend already consumes these contracts, any contract change would require a
separate frontend migration and is outside this refactor.

The frontend is a regression target, not an implementation target, for this
work.

## Migration Plan

1. Redirect the current global `persistence` worktree state into feature-owned
   packages.
2. Move `Subscriber` and `SubscriberRole` to `subscriber.domain`.
3. Move `SubscriberRepository` to `subscriber.persistence`.
4. Move `Content` to `content.domain`.
5. Move `ContentRepository` to `content.persistence`.
6. Update auth, subscriber, content, bootstrap, and test imports.
7. Introduce or preserve a narrow subscriber lookup boundary for auth if it
   reduces direct repository coupling.
8. Replace the global persistence package structure test with a feature-owned
   structure test.
9. Run backend regression tests.

## Testing Strategy

Use three verification layers.

First, preserve API contract behavior through existing MockMvc tests and add
assertions if necessary around endpoint paths, status codes, response fields,
auth error bodies, and role-sensitive content visibility. Existing login, JWT
protected API, and refresh token tests are part of this contract safety net.

Second, replace `PersistencePackageStructureTests` with a lightweight package
structure test that asserts the final feature-owned layout:

```text
subscriber.domain.Subscriber
subscriber.domain.SubscriberRole
subscriber.persistence.SubscriberRepository
content.domain.Content
content.persistence.ContentRepository
```

ArchUnit is not required for this refactor. The current `Class.forName` style is
clear enough for the repository's learning purpose.

Third, run backend regression with:

```bash
bash mvnw clean test
```

If backend response contracts change unexpectedly, run the relevant frontend
tests before proceeding. The desired outcome is that no frontend code changes
are needed.

## Risks

- JPA entity package moves can break scanning if a class leaves the application
  root package. The target packages stay under `com.example.springsecuritynotebook`,
  and tests must confirm bootstrapping.
- Direct auth-to-repository coupling can make the package cleanup superficial.
  Use a narrow subscriber lookup boundary where it improves clarity.
- A package structure test can accidentally encode the wrong architecture. The
  replacement test must assert feature ownership, not global layer ownership.
- Literal copying of MoEasy names such as `component` and `dao` would make the
  Spring Boot code less idiomatic. Use Spring stereotypes and package names.

## Acceptance Criteria

- No global `com.example.springsecuritynotebook.persistence` package remains for
  subscriber or content ownership.
- Subscriber and content domain behavior lives in feature-owned `domain`
  packages.
- Spring Data repositories live in feature-owned `persistence` packages.
- Existing API contracts remain unchanged.
- Backend tests pass with `bash mvnw clean test`.
- The structure test documents and protects the feature-first package layout.
