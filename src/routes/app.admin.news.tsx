import { createFileRoute } from "@tanstack/react-router";
import { NewsManager } from "@/components/admin-context";

export const Route = createFileRoute("/app/admin/news")({
  component: NewsManager,
});
