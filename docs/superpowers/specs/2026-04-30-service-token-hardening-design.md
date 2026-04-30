# Service Token Hardening Design

## Goal

Harden the current content service token path while keeping the repository's
learning-focused static service token model.

This change does not try to make environment variables safe after a server
runtime compromise. If the Next.js server is compromised through a runtime
execution vulnerability, service token values in environment variables or
process memory may be exposed. The design therefore limits what exposed tokens
can do, makes their trust boundary explicit, and documents the operational
controls that must surround them.

## Scope

This design covers content service tokens used by the frontend server to fetch
cacheable content from the backend.

- Keep static service tokens for this iteration.
- Keep the current user JWT login, refresh, and logout flow unchanged.
- Keep service tokens server-only.
- Keep service tokens read-only.
- Do not add short-lived service token issuance in this iteration.
- Do not add mTLS or workload identity implementation in this iteration.
- Do not make service tokens a replacement for user authorization checks.

## Current Context

The frontend has two optional server-side environment variables:

```text
CONTENT_PUBLISHED_SERVICE_TOKEN
CONTENT_MANAGEMENT_SERVICE_TOKEN
```

When configured, cached content helpers use these tokens as backend bearer
credentials. When missing, the frontend falls back to the current user's session
token.

The backend accepts matching configured tokens through
`ContentServiceTokenAuthenticationService` and creates machine principals:

```text
content-published-service
content-management-service
```

The published token receives `CONTENT_READ`. The management token receives
`CONTENT_READ` and `CONTENT_DRAFT_READ`.

## Threat Model

Service tokens are long-lived bearer credentials. Anyone who obtains the raw
token can present it until the token is rotated or removed.

The main concern is a server runtime compromise such as remote code execution
in the Next.js process. In that case, defensive coding cannot reliably prevent
environment variables or in-memory values from being read. The practical
controls are:

- reduce token authority
- avoid token exposure in browser-visible code
- avoid token exposure in logs and error messages
- restrict where token-authenticated requests can originate
- rotate tokens after suspected exposure
- move to short-lived or infrastructure-bound credentials in higher-security
  deployments

## Authorization Boundary

Service tokens are machine credentials for backend content reads. They are not
user credentials and they do not grant user roles.

The frontend request flow must remain:

```text
incoming page request
-> require user session
-> verify the user's content permission
-> use service token only for the server-side cached backend fetch
```

This preserves the user authorization boundary. A service token can improve
cacheability, but it must not let an unauthenticated or unauthorized user read
content.

## Backend Design

`ContentServiceTokenAuthenticationService` remains the backend component that
validates configured content service tokens.

Keep constant-time comparison with `MessageDigest.isEqual`. Keep the startup
validation that rejects configured tokens shorter than 32 characters. Document
that 32 characters is only a minimum guard; production-like environments should
use high-entropy random values.

The authority model must stay read-only:

```text
CONTENT_PUBLISHED_SERVICE_TOKEN
- principal: content-published-service
- authorities: CONTENT_READ

CONTENT_MANAGEMENT_SERVICE_TOKEN
- principal: content-management-service
- authorities: CONTENT_READ, CONTENT_DRAFT_READ
```

Neither service token may receive:

```text
CONTENT_WRITE
USER_READ
USER_ROLE_UPDATE
ROLE_USER
ROLE_MANAGER
ROLE_ADMIN
```

This keeps service-token authentication distinct from subscriber
authentication.

## Frontend Design

The frontend service token module remains server-only.

`frontend/src/lib/server/content/service-tokens.ts` should continue to import
`server-only` and read values through the server side T3 env schema. Service
tokens must not be renamed to `NEXT_PUBLIC_*`, serialized into props, rendered
in the UI, stored in cache keys, or included in error messages.

The content DAL must continue to check the current user's session and content
permission before selecting the cached service-token fetch path. The service
token path is an implementation detail after authorization, not an
authorization shortcut.

When a service token is not configured, the session-backed fetch path remains
the fallback so local learning remains easy.

## Error Handling

Use the existing authentication and authorization response shapes.

- Missing or invalid service token: authentication failure, usually `401`.
- Valid service token without required authority: `403 ERROR_ACCESS_DENIED`.
- Misconfigured short service token: application startup failure.

Token values must never appear in exceptions, logs, API responses, test names,
or snapshots.

## Operational Guidance

Static service tokens require operational controls outside application code.

- Store tokens only as server-side secrets.
- Rotate tokens after suspected runtime compromise or accidental exposure.
- Rotate frontend and backend token values together.
- Treat cache invalidation and stale cached content as part of the rotation
  checklist.
- Restrict backend service-token traffic to the frontend server by ingress,
  VPC, security group, firewall, or API gateway policy.
- Prefer separate values for local, test, staging, and production-like
  environments.
- Use high-entropy generated values rather than human-readable strings.

For stronger production designs, replace static bearer tokens with one of these
follow-up approaches:

- short-lived service access tokens
- mTLS between frontend and backend
- workload identity from the deployment platform
- secret-manager-backed credential rotation

## Testing Strategy

Backend tests should pin the service-token authority model.

- Published token authenticates as `content-published-service`.
- Published token grants `CONTENT_READ`.
- Published token does not grant draft, write, user, admin, or role
  authorities.
- Management token authenticates as `content-management-service`.
- Management token grants `CONTENT_READ` and `CONTENT_DRAFT_READ`.
- Management token does not grant write, user, admin, or role authorities.
- Unknown token is not authenticated.
- Configured tokens shorter than 32 characters fail startup validation.

Frontend tests should pin the request ordering and fallback behavior.

- Published content uses the cached service-token fetch only after a valid
  session with content read permission exists.
- Managed content uses the cached service-token fetch only after a valid
  session with content management permission exists.
- Without a configured service token, the frontend uses the session-backed
  protected fetch path.
- Unauthorized users are rejected before cached service-token helpers run.

## Completion Criteria

- Backend tests prove service tokens remain read-only machine principals.
- Frontend tests prove service-token cached fetches do not bypass user
  authorization.
- Documentation explains the runtime compromise threat model, rotation
  guidance, and source restriction requirement.
- Existing JWT user authentication and refresh behavior remains unchanged.
- Service tokens remain server-only and never appear in browser-visible
  configuration.
