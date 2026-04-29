import Link from "next/link";

import { GuardPanel } from "@/components/guard-panel";

export default function Forbidden() {
  return (
    <GuardPanel
      eyebrow="Forbidden"
      title="Access restricted"
      body="Your session is valid, but it does not include the role required for this protected workspace."
    >
      <Link href="/me" className="button-secondary">
        Review session
      </Link>
    </GuardPanel>
  );
}
