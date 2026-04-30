import { ContentDetailWorkspace } from "@/components/content-detail-workspace";
import { getContentDetailForRequest } from "@/lib/server/content/content-dal";

type ContentDetailPageProps = PageProps<"/content/[id]">;

export default async function ContentDetailPage({
  params,
}: ContentDetailPageProps) {
  const { id } = await params;
  const item = await getContentDetailForRequest(id, `/content/${id}`);

  return <ContentDetailWorkspace item={item} />;
}
