import "server-only";
import { requireRole } from "./session";

/** Any internal user (staff or admin). */
export const requireStaff = () => requireRole("staff", "admin");
/** Admin only: pricing, products, roles, deletes, audit log. */
export const requireAdmin = () => requireRole("admin");
