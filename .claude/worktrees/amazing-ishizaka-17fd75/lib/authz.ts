import { redirect } from "next/navigation";

import { getSession } from "@/lib/server-session";
import { hasPermission } from "@/lib/rbac";

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user?.id || !session.user.isActive) redirect("/admin/login");
  return session;
}

export async function requirePermission(permission: string) {
  const session = await requireAuth();
  if (!hasPermission(session.user?.permissions, permission)) redirect("/admin");
  return session;
}

