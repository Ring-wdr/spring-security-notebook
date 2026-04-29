import { Suspense } from "react";

import { ContentFeedView } from "@/components/content-feed-view";
import { GuardPanel } from "@/components/guard-panel";
import { getPublishedContentSummariesForRequest } from "@/lib/server/content/content-dal";

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
  const items = await getPublishedContentSummariesForRequest("/content");

  return <ContentFeedView items={items} />;
}
