import { GuardPanel } from "@/components/guard-panel";

export default function Loading() {
  return (
    <GuardPanel
      eyebrow="Content Detail"
      title="Loading protected content..."
      body="Fetching the selected content record from the secured backend."
    />
  );
}
