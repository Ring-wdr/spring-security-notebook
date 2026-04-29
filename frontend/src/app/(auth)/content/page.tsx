import { Suspense } from "react";
import { redirect } from "next/navigation";

import { ContentFeedView } from "@/components/content-feed-view";
import { GuardPanel } from "@/components/guard-panel";
import { BackendRequestError } from "@/lib/server/backend-auth";
import { getCachedContentSummaries } from "@/lib/server/content-cache";
import { buildRefreshSessionRedirectPath } from "@/lib/server/refresh-session";
import { requireSession } from "@/lib/server/session";
import type { ContentSummary } from "@/lib/types";

export default function ContentListPage() {
  return (
    <Suspense
      fallback={
        <GuardPanel
          eyebrow="Subscriber Content"
          title="Loading protected content..."
          body="Preparing the published content feed from the JWT-protected backend."
        />
      }
    >
      <ContentList />
    </Suspense>
  );
}

async function ContentList() {
  const session = await requireSession("/content");
  let items: ContentSummary[];

  try {
    items = await getCachedContentSummaries(session.tokens.accessToken);
  } catch (error) {
    if (error instanceof BackendRequestError && error.status === 401) {
      redirect(buildRefreshSessionRedirectPath("/content"));
    }
    throw error;
  }

  return <ContentFeedView items={items} />;
}
