import { ContentFeedView } from "@/components/content-feed-view";
import { getPublishedContentSummariesForRequest } from "@/lib/server/content/content-dal";

export default async function ContentListPage() {
  const items = await getPublishedContentSummariesForRequest("/content");

  return <ContentFeedView items={items} />;
}
