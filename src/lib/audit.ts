import { db } from "./db";

/** Append-only record of admin actions. Never throws — auditing must not break the action itself. */
export async function audit(adminId: string, action: string, targetId?: string | null, detail?: string | null) {
  try {
    await db.adminAudit.create({ data: { adminId, action, targetId: targetId ?? null, detail: detail ?? null } });
  } catch (e) {
    console.error("[audit] failed", e);
  }
}
