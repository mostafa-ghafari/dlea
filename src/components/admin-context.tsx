// Barrel file — re-exports from src/components/admin/
// All admin components now live in separate files under admin/
export {
  AdminProvider,
  useAdminContext,
  formatNum,
  TableSearch,
  AdminPagination,
} from "./admin/shared";
export { AdminDashboard } from "./admin/AdminDashboard";
export { UsersManager } from "./admin/UsersManager";
export { PlansManager } from "./admin/PlansManager";
export { NewsManager } from "./admin/NewsManager";
export { TicketsManager } from "./admin/TicketsManager";
export { AuditLogPanel } from "./admin/AuditLogPanel";
