import { createFileRoute } from "@tanstack/react-router";
import { TicketsManager } from "@/components/admin-context";

export const Route = createFileRoute("/app/admin/tickets")({
  component: TicketsManager,
});
