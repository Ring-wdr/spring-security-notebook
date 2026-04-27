import type { AuthenticatedSession } from "./server/session";

export type LectureAuditStatus =
  | "already_covered"
  | "partially_covered"
  | "implemented_by_this_phase";

export type LectureAuditItem = {
  step: number;
  title: string;
  status: LectureAuditStatus;
  summary: string;
};

export type LearningSnapshot = {
  state: "anonymous" | "authenticated";
  primaryMessage: string;
  tokenMetadata: Array<{ label: string; value: string }>;
  roleNames: string[];
};

export const LECTURE_AUDIT_ITEMS: LectureAuditItem[] = [
  {
    step: 1,
    title: "Concepts and architecture",
    status: "already_covered",
    summary: "The repo already demonstrates the filter-chain-first mental model and JWT request flow.",
  },
  {
    step: 2,
    title: "SecurityConfig and stateless setup",
    status: "already_covered",
    summary: "CORS, CSRF disablement, stateless sessions, and login processing are configured in the backend.",
  },
  {
    step: 3,
    title: "Subscriber entity and repository tests",
    status: "already_covered",
    summary: "Subscriber persistence, role storage, and repository coverage already exist.",
  },
  {
    step: 4,
    title: "UserDetails and UserDetailsService",
    status: "already_covered",
    summary: "Security loads subscribers through a custom principal and database-backed user details service.",
  },
  {
    step: 5,
    title: "Login handlers and JWT creation",
    status: "already_covered",
    summary: "Login success returns token pairs and login failure returns structured JSON errors.",
  },
  {
    step: 6,
    title: "JWT authentication filter",
    status: "already_covered",
    summary: "Protected requests are authenticated once per request from Bearer tokens.",
  },
  {
    step: 7,
    title: "Bearer token testing and review",
    status: "partially_covered",
    summary: "Backend tests exist, and this phase makes the protected-route results easier to inspect from the frontend.",
  },
  {
    step: 8,
    title: "Payload safety and error handling",
    status: "implemented_by_this_phase",
    summary: "The learning surface highlights payload-safe metadata only and documents stable 401 and 403 responses.",
  },
  {
    step: 9,
    title: "Refresh token controller",
    status: "implemented_by_this_phase",
    summary: "Refresh retry, token rotation rules, and logout invalidation are now surfaced as explicit learning checkpoints.",
  },
  {
    step: 10,
    title: "Final review",
    status: "implemented_by_this_phase",
    summary: "The new guide page ties the backend, tests, and role-gated frontend routes into one review surface.",
  },
];

export function createLearningSnapshot(
  session: AuthenticatedSession | null,
): LearningSnapshot {
  if (!session) {
    return {
      state: "anonymous",
      primaryMessage:
        "Log in with a seeded account to inspect the current principal, token TTL metadata, and protected-route behavior.",
      tokenMetadata: [],
      roleNames: [],
    };
  }

  return {
    state: "authenticated",
    primaryMessage: `Authenticated as ${session.user.email} with ${session.user.roleNames.join(", ")}.`,
    roleNames: session.user.roleNames,
    tokenMetadata: [
      { label: "Grant type", value: session.tokens.grantType },
      { label: "Access token TTL", value: `${session.tokens.accessTokenExpiresIn} sec` },
      { label: "Refresh token TTL", value: `${session.tokens.refreshTokenExpiresIn} sec` },
      {
        label: "Refresh behavior",
        value: "Retry once on 401, then rotate stored tokens.",
      },
    ],
  };
}

export function describeProtectedRouteAccess(kind: "unauthorized" | "forbidden"): {
  status: 401 | 403;
  code: string;
  summary: string;
} {
  if (kind === "unauthorized") {
    return {
      status: 401,
      code: "ERROR_UNAUTHORIZED",
      summary: "Authentication is required.",
    };
  }

  return {
    status: 403,
    code: "ERROR_ACCESS_DENIED",
    summary: "You do not have permission.",
  };
}
