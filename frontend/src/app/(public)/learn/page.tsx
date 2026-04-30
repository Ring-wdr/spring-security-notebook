import { LearnWorkspaceView } from "@/components/learn-workspace-view";
import {
  createLearningSnapshot,
  describeProtectedRouteAccess,
} from "@/lib/learn";
import { getOptionalSession } from "@/lib/server/session";

const UNAUTHORIZED_ROUTE = describeProtectedRouteAccess("unauthorized");
const FORBIDDEN_ROUTE = describeProtectedRouteAccess("forbidden");

export default async function LearnPage() {
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
