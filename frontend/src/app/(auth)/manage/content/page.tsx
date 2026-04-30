import { ManageContentClient } from "@/components/manage-content-client";
import { loadManagedContentWorkspaceData } from "./workspace-data";

export default async function ManageContentPage({
  searchParams,
}: PageProps<"/manage/content">) {
  const resolvedSearchParams = await searchParams;
  const { items, selectedDetail } =
    await loadManagedContentWorkspaceData(resolvedSearchParams);

  return (
    <ManageContentClient initialItems={items} selectedDetail={selectedDetail} />
  );
}
