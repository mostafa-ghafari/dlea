import { createFileRoute } from "@tanstack/react-router";
import { PlansManager } from "@/components/admin-context";

export const Route = createFileRoute("/app/admin/plans")({
  component: PlansManager,
});
