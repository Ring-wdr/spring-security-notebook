import { Suspense } from "react";

import { HomeWorkspace } from "@/components/home-workspace";
import { getOptionalSession } from "@/lib/server/session";

export default function Home() {
  return (
    <Suspense fallback={<HomeWorkspace session={null} />}>
      <HomeWorkspaceServer />
    </Suspense>
  );
}

async function HomeWorkspaceServer() {
  const session = await getOptionalSession();
  return <HomeWorkspace session={session} />;
}
