import { Suspense } from "react";

import { ContentDetailWorkspace } from "@/components/content-detail-workspace";
import { GuardPanel } from "@/components/guard-panel";
import { getContentDetailForRequest } from "@/lib/server/content/content-dal";

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
  const item = await getContentDetailForRequest(id, `/content/${id}`);

  return <ContentDetailWorkspace item={item} />;
}
