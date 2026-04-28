import { Suspense } from "react";

import { LearnWorkspaceView } from "@/components/learn-workspace-view";
import {
  createLearningSnapshot,
  describeProtectedRouteAccess,
} from "@/lib/learn";
import { getOptionalSession } from "@/lib/server/session";

const UNAUTHORIZED_ROUTE = describeProtectedRouteAccess("unauthorized");
const FORBIDDEN_ROUTE = describeProtectedRouteAccess("forbidden");

export default function LearnPage() {
  return (
    <Suspense fallback={<LearnPageSkeleton />}>
      <LearnWorkspace />
    </Suspense>
  );
}

async function LearnWorkspace() {
  const session = await getOptionalSession();
  const snapshot = createLearningSnapshot(session);

  return (
    <LearnWorkspaceView
      snapshot={snapshot}
      unauthorizedRoute={UNAUTHORIZED_ROUTE}
      forbiddenRoute={FORBIDDEN_ROUTE}
    />
  );
}

function LearnPageSkeleton() {
  return (
    <section className="panel space-y-4">
      <p className="eyebrow">Lecture Companion</p>
      <h1 className="text-2xl font-semibold">Loading the learning guide...</h1>
      <p className="text-sm text-[color:var(--muted-foreground)]">
        Preparing the current session snapshot and lecture audit cards.
      </p>
    </section>
  );
}
