import { HomeWorkspace } from "@/components/home-workspace";
import { getOptionalSession } from "@/lib/server/session";

export default async function Home() {
  const session = await getOptionalSession();
  return <HomeWorkspace session={session} />;
}
