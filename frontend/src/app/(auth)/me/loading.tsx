import { GuardPanel } from "@/components/guard-panel";

export default function Loading() {
  return (
    <GuardPanel
      eyebrow="Current Principal"
      title="Loading session..."
      body="Resolving the authenticated subscriber profile from the secured backend."
    />
  );
}
