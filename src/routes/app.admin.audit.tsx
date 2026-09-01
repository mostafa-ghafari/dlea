import { createFileRoute } from "@tanstack/react-router";
import { AuditLogPanel } from "@/components/admin-context";

export const Route = createFileRoute("/app/admin/audit")({
  component: AuditLogPanel,
});
