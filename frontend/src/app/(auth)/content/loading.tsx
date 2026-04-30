import { GuardPanel } from "@/components/guard-panel";

export default function Loading() {
  return (
    <GuardPanel
      eyebrow="Subscriber Content"
      title="Loading protected content..."
      body="Preparing the published content feed from the JWT-protected backend."
    />
  );
}
