import type { Request } from "express";
import { db } from "./db";
import { auditLogs } from "@shared/schema";
import { eq, and, or, lte, desc, isNull } from "drizzle-orm";

interface AuditLogEntry {
  tenantSlug?: string;
  userId: string;
  userEmail: string;
  userRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      tenantSlug: entry.tenantSlug || null,
      userId: entry.userId,
      userEmail: entry.userEmail,
      userRole: entry.userRole || null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId || null,
      details: entry.details || null,
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[AUDIT] Failed to write audit log:", err);
  }
}

export function logFromRequest(
  req: Request,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>
): void {
  if (!req.user) return;

  logAuditEvent({
    tenantSlug: req.tenantSlug,
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.tenantRole,
    action,
    entityType,
    entityId,
    details,
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.headers["user-agent"],
  });
}

export async function getAuditLogs(
  tenantSlug: string,
  userId: string,
  limit: number = 50,
  offset: number = 0
) {
  return db
    .select()
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.userId, userId),
        or(
          eq(auditLogs.tenantSlug, tenantSlug),
          and(isNull(auditLogs.tenantSlug), eq(auditLogs.entityType, "auth"))
        )
      )
    )
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function purgeExpiredLogs(retentionDays: number): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);
  const cutoffStr = cutoff.toISOString();

  const result = await db
    .delete(auditLogs)
    .where(lte(auditLogs.createdAt, cutoffStr))
    .returning({ id: auditLogs.id });

  return result.length;
}
