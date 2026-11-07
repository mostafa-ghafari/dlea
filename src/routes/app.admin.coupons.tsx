import { createFileRoute } from "@tanstack/react-router";
import { CouponsManager } from "@/components/admin-context";

export const Route = createFileRoute("/app/admin/coupons")({
  component: CouponsManager,
});
