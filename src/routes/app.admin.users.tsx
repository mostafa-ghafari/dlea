import { createFileRoute } from "@tanstack/react-router";
import { UsersManager } from "@/components/admin-context";

export const Route = createFileRoute("/app/admin/users")({
  component: UsersManager,
});
