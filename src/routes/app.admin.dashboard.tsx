import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/components/admin-context";

export const Route = createFileRoute("/app/admin/dashboard")({
  component: AdminDashboard,
});
