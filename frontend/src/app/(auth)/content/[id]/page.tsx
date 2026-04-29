import { Suspense } from "react";
import { redirect } from "next/navigation";

import { ContentDetailWorkspace } from "@/components/content-detail-workspace";
import { GuardPanel } from "@/components/guard-panel";
import { BackendRequestError } from "@/lib/server/openapi-client";
import { getCachedContentDetail } from "@/lib/server/content-cache";
import { buildRefreshSessionRedirectPath } from "@/lib/server/refresh-session";
import { requireSession } from "@/lib/server/session";
import type { ContentDetail } from "@/lib/types";

export default function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <GuardPanel
          eyebrow="Content Detail"
          title="Loading protected content..."
          body="Fetching the selected content record from the secured backend."
        />
      }
    >
      <ContentDetailSection params={params} />
    </Suspense>
  );
}

async function ContentDetailSection({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const returnTo = `/content/${id}`;
  const session = await requireSession(returnTo);
  let item: ContentDetail;

  try {
    item = await getCachedContentDetail(session.tokens.accessToken, id);
  } catch (error) {
    if (error instanceof BackendRequestError && error.status === 401) {
      redirect(buildRefreshSessionRedirectPath(returnTo));
    }
    throw error;
  }

  return <ContentDetailWorkspace item={item} />;
}
