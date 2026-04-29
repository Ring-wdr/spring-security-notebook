import { Suspense } from "react";

import { ContentDetailWorkspace } from "@/components/content-detail-workspace";
import { GuardPanel } from "@/components/guard-panel";
import { getContentDetailForRequest } from "@/lib/server/content/content-dal";

type ContentDetailPageProps = PageProps<"/content/[id]">;

export default function ContentDetailPage({ params }: ContentDetailPageProps) {
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
  params: ContentDetailPageProps["params"];
}) {
  const { id } = await params;
  const item = await getContentDetailForRequest(id, `/content/${id}`);

  return <ContentDetailWorkspace item={item} />;
}
