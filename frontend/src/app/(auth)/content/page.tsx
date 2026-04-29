import { Suspense } from "react";

import { ContentFeedView } from "@/components/content-feed-view";
import { GuardPanel } from "@/components/guard-panel";
import { fetchProtectedOpenApi } from "@/lib/server/session";
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
  const items: ContentSummary[] = await fetchProtectedOpenApi(
    "/content",
    ({ content }) => content,
    (content) => content.getContents({}),
  );

  return <ContentFeedView items={items} />;
}
