# Issue 14 Remaining Hardening Design

## Context

Issue #14 recorded a read-only security and code-quality audit. PR #15 already handled issuer validation, JWT clock skew, JWT secret length validation, refresh rotation, logout ordering, refresh-token error codes, request size bounds, and generic user lookup errors.

This design covers only the items PR #15 intentionally left open:

- refresh token family reuse detection and family invalidation
- Valkey failure policy for auth-critical token state
- environment-aware Swagger UI and OpenAPI exposure

## Goals

- Keep the backend JWT learning flow visible while moving token-state behavior closer to production-grade security.
- Fail closed when Valkey state is required to decide whether a token is valid, revoked, or reusable.
- Keep Swagger convenient for local learning, but avoid always-open documentation endpoints in non-local deployments.
- Add focused regression tests for each changed security behavior.

## Non-Goals

- Do not redesign the frontend session flow.
- Do not replace JWT with server sessions.
- Do not add device-level refresh-token inventory or per-device management UI.
- Do not introduce a new persistence technology beyond the existing Valkey-backed Redis template.

## Recommended Approach

Implement the remaining audit items in one backend hardening pass.

Refresh token rotation should keep a family identifier in a refresh-token JWT claim named `fid`. Each successful refresh rotates to a successor token in the same family. If an old refresh token is replayed after the retry grace successor is no longer current, the store should invalidate the family so subsequent refresh attempts from that family fail. The existing short retry grace behavior can stay for network retries immediately after a successful rotation.

Valkey failures should be fail-closed for auth-critical decisions. If the backend cannot check the access-token blocklist, compare or rotate refresh tokens, read retry successors, or invalidate token state during refresh/logout, it should surface the existing auth error boundary instead of silently accepting a token. This makes unavailable token state deny access rather than resurrect revoked or replayed credentials.

Swagger UI and `/v3/api-docs` should remain allowed by default for local learning profiles, but become configurable through a backend property named `app.docs.public-enabled`. The default should preserve the current developer experience. A non-local deployment can set `app.docs.public-enabled=false` to disable the public docs endpoints without changing code.

## Alternatives Considered

### Token-state and Valkey hardening only

This would leave Swagger as a documented learning-project exception. It is smaller, but it leaves one explicit issue item unresolved.

### Split three separate PRs

This gives smaller review chunks, but the remaining work shares the same backend verification path and issue context. A single scoped backend pass is easier to validate here.

### Full per-device refresh-token sessions

This is stronger for production account management, but it is larger than the current issue and would change the learning surface beyond the audit's requested scope.

## Components

### `JwtService`

- Add a refresh-token family id claim named `fid` and expose validated refresh-token identity as email plus family id.
- Keep access token validation behavior from PR #15 unchanged.
- Preserve existing public error codes.

### `RefreshTokenStore`

- Store enough state to identify the current refresh token and its family.
- Preserve the existing retry successor behavior for a short retry window.
- Add family invalidation when a stale refresh token is detected outside the retry-successor path.
- Wrap Valkey operations in a consistent auth-state exception path.

### `AuthService`

- Treat failed rotation as one of three outcomes: accepted retry successor, detected stale-family reuse, or invalid refresh token.
- Invalidate the family on detected reuse.
- Keep response shape and frontend contract unchanged.

### `AccessTokenBlocklist`

- Treat Valkey lookup or write failures as auth-critical failures rather than returning a false negative.
- Preserve no-op behavior when an already-expired token is logged out.

### `SecurityConfig`

- Move Swagger/OpenAPI permit rules behind a configuration property.
- Keep local learning defaults permissive.
- Keep health/info endpoints public.

## Data Flow

1. Login issues an access token and refresh token, then stores the refresh token as the current token for its family.
2. Refresh validates access-token identity and refresh-token identity.
3. The store atomically rotates only if the submitted refresh token is still the current family token.
4. If rotation fails, the store checks the short retry-successor key.
5. If the retry successor is valid, the backend returns the current rotated token.
6. If the submitted token is stale and not retry-accepted, the family is invalidated and refresh fails.
7. Future refresh attempts for the invalidated family fail until the user logs in again.

## Error Handling

- Refresh reuse, missing token state, and Valkey auth-state failures should map to `ERROR_REFRESH_TOKEN` on refresh.
- Access-token blocklist lookup failures should map to `ERROR_ACCESS_TOKEN`.
- Logout should attempt both access-token revocation and refresh-family invalidation, but failures should not make revoked state appear successful in tests.
- Internal Valkey exceptions should not leak infrastructure details in HTTP responses.

## Testing Plan

- Add unit or integration tests proving stale refresh-token reuse invalidates the family.
- Add tests preserving the immediate retry-successor success path.
- Add tests proving refresh fails when Valkey rotation or lookup fails.
- Add tests proving access-token blocklist lookup failures reject protected access.
- Add tests for Swagger/OpenAPI permit behavior when the docs property is enabled and disabled.
- Run backend verification sequentially: `.\mvnw.cmd spotless:apply`, `.\mvnw.cmd checkstyle:check`, and `.\mvnw.cmd test`.

## Documentation

- Add a concise backend README or existing docs note only if a new configuration property is introduced and not otherwise discoverable.
- Do not record notebook ids, auth state, or account identifiers.

## Scope Check

This is a single backend security-hardening task. It does not require frontend UI changes, NotebookLM source regeneration, or broad architecture rewrites.
