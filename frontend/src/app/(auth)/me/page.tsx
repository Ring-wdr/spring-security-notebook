import { ProfileWorkspace } from "@/components/profile-workspace";
import { requireSession } from "@/lib/server/session";

export default async function MePage() {
  const session = await requireSession("/me");
  return <ProfileWorkspace session={session} />;
}
