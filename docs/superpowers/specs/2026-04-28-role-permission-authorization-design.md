# Role Permission Authorization Design

## Goal

Advance the current role-based authorization model into a permission-based
backend authorization model while preserving the existing frontend contract.

The repository should continue to teach Spring Security concepts clearly:
roles represent the subscriber's assigned group, while permissions represent
the concrete actions that Spring Security checks with `hasAuthority(...)`.

## Scope

This design covers backend authorization only.

- Keep JWT response fields and frontend-facing user fields unchanged.
- Keep `roleNames` in access token claims.
- Do not add `permissionNames` to JWT claims in this iteration.
- Do not change frontend navigation or page guards; they may continue using
  role names.
- Do not add database tables for role-permission policy.
- Do not implement role-version or token-version invalidation in this
  iteration.

## Current Context

The backend currently has three subscriber roles:

```text
ROLE_USER
ROLE_MANAGER
ROLE_ADMIN
```

These roles are stored on `Subscriber`, copied into JWT access token
`roleNames`, restored into `SubscriberPrincipal`, and used directly in
`@PreAuthorize` expressions such as `hasAnyRole('USER', 'MANAGER', 'ADMIN')`.

The current content service also performs a role-name check to decide whether
`includeAll=true` may include drafts.

## Permission Model

Add a new `SubscriberPermission` enum under the subscriber domain. Use Spring
Security authority-style names without a `ROLE_` prefix:

```text
ME_READ
CONTENT_READ
CONTENT_DRAFT_READ
CONTENT_WRITE
USER_READ
USER_ROLE_UPDATE
AUTH_LOGOUT
```

Keep `SubscriberRole` as the source of assigned user roles. Each role returns a
fixed set of permissions:

```text
ROLE_USER
- ME_READ
- CONTENT_READ
- AUTH_LOGOUT

ROLE_MANAGER
- ME_READ
- CONTENT_READ
- CONTENT_DRAFT_READ
- CONTENT_WRITE
- AUTH_LOGOUT

ROLE_ADMIN
- ME_READ
- CONTENT_READ
- CONTENT_DRAFT_READ
- CONTENT_WRITE
- USER_READ
- USER_ROLE_UPDATE
- AUTH_LOGOUT
```

This mapping is intentionally code-defined. The project is a Spring Security
learning repository, and a database-backed policy model would add operational
complexity before it adds learning value.

## Granted Authorities

`SubscriberPrincipal` should expose both role authorities and permission
authorities.

For example, a manager principal should contain:

```text
ROLE_MANAGER
ME_READ
CONTENT_READ
CONTENT_DRAFT_READ
CONTENT_WRITE
AUTH_LOGOUT
```

This preserves compatibility with any existing role-based checks while allowing
new backend authorization rules to use permission authorities.

The JWT payload should still store only `roleNames`. On each request,
`AccessTokenClaims.toPrincipal()` restores roles from the token, and
`SubscriberPrincipal` derives permissions from those roles.

## Authorization Rules

Move backend `@PreAuthorize` checks from role names to permission authorities:

```text
GET /api/users/me
- hasAuthority('ME_READ')

POST /api/auth/logout
- hasAuthority('AUTH_LOGOUT')

GET /api/content
GET /api/content/{contentId}
- hasAuthority('CONTENT_READ')

POST /api/content
PUT /api/content/{contentId}
- hasAuthority('CONTENT_WRITE')

GET /api/admin/users
- hasAuthority('USER_READ')

PATCH /api/admin/users/{email}/role
- hasAuthority('USER_ROLE_UPDATE')
```

`ContentService` should also stop comparing raw role strings. The
`includeAll=true` path should be allowed only when the principal has
`CONTENT_DRAFT_READ`.

This creates two authorization layers:

- controller method security checks whether the user may enter the API
- application service logic checks option-specific behavior such as draft
  visibility

## JWT Freshness Policy

This project will continue to trust role names inside a valid access token.
That means role changes in the database are not reflected in already-issued
access tokens until the user receives a new access token.

This is the chosen trade-off for the current project because checking the
database on every request would weaken the stateless value of JWT.

The refresh flow should reload the latest subscriber roles from the database
before issuing the new access token. The current `AuthService.refresh()` reuses
the old access token claims, so implementation must change that flow to build
the refreshed access token from the latest subscriber state.

For services that require immediate permission revocation, a later design can
add `roleVersion`, `tokenVersion`, or `rolesUpdatedAt` validation. That is
outside this iteration.

## Error Handling

Permission-based authorization should reuse the existing error response shapes:

```text
401 ERROR_UNAUTHORIZED
401 ERROR_ACCESS_TOKEN
403 ERROR_ACCESS_DENIED
400 ERROR_BAD_REQUEST
```

Role update validation should become explicit:

- an empty `roleNames` list returns `400 ERROR_BAD_REQUEST`
- an unknown role name returns `400 ERROR_BAD_REQUEST`
- clients cannot directly assign permissions

## Components

`SubscriberPermission`
: Domain enum for action-level authorities.

`SubscriberRole`
: Keeps the current role names and exposes its fixed permission set.

`SubscriberPrincipal`
: Converts role names into Spring Security authorities by combining role
  authorities and derived permission authorities.

`AccessTokenClaims`
: Continues to serialize and deserialize `roleNames` only.

`AuthService.refresh()`
: Must issue refreshed access tokens from the latest subscriber roles, not from
  stale access token role claims.

`SubscriberAdminService`
: Validates incoming role names explicitly before mutating subscriber roles.

## Testing Strategy

Backend tests should cover the permission model and the protected API behavior.

Add focused unit tests for authority derivation:

```text
ROLE_USER grants ME_READ, CONTENT_READ, AUTH_LOGOUT
ROLE_MANAGER also grants CONTENT_DRAFT_READ and CONTENT_WRITE
ROLE_ADMIN also grants USER_READ and USER_ROLE_UPDATE
```

Update protected API tests:

```text
user can read /api/users/me
user cannot create content
manager can create content
manager can use includeAll=true to view drafts
user cannot read /api/admin/users
admin can read /api/admin/users
admin can update subscriber roles
unknown role update payload returns 400 ERROR_BAD_REQUEST
```

Add or update refresh tests:

```text
when a subscriber's role changes in the database, refresh issues a new access
token containing the latest roleNames
```

## Acceptance Criteria

- Backend method security uses `hasAuthority(...)` for the current protected
  APIs.
- `SubscriberPrincipal` authorities include both `ROLE_*` names and derived
  permission names.
- JWT access token claims keep `roleNames` and do not add `permissionNames`.
- Refresh token flow issues new access tokens from current database roles.
- Unknown role names in admin role updates return `400 ERROR_BAD_REQUEST`.
- Frontend behavior and generated API contracts do not need to change.
- Backend tests pass with `bash mvnw test`.
