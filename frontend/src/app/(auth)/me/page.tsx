import { Suspense } from "react";

import { GuardPanel } from "@/components/guard-panel";
import { ProfileWorkspace } from "@/components/profile-workspace";
import { requireSession } from "@/lib/server/session";

export default function MePage() {
  return (
    <Suspense
      fallback={
        <GuardPanel
          eyebrow="Current Principal"
          title="Loading session..."
          body="Resolving the authenticated subscriber profile from the secured backend."
        />
      }
    >
      <ProfilePage />
    </Suspense>
  );
}

async function ProfilePage() {
  const session = await requireSession("/me");
  return <ProfileWorkspace session={session} />;
}
