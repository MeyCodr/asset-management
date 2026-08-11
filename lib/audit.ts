import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export interface ActingUser {
  id: string;
  name: string;
}

export async function getActingUser(req: NextRequest): Promise<ActingUser | null> {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return { id: payload.id, name: payload.name };
}

type AuditAction = "CREATE" | "UPDATE" | "DELETE";

// Only diffs/snapshots scalar fields — relations (included objects/arrays) are
// dropped since they belong to the related entity's own audit trail.
function sanitizeSnapshot(record: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (key === "createdAt" || key === "updatedAt") continue;
    if (value !== null && typeof value === "object" && !(value instanceof Date)) continue;
    out[key] = value instanceof Date ? value.toISOString() : value;
  }
  return out;
}

function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    const from = before[key] ?? null;
    const to = after[key] ?? null;
    if (JSON.stringify(from) !== JSON.stringify(to)) {
      changes[key] = { from, to };
    }
  }
  return changes;
}

export async function logAudit(params: {
  entityType: string;
  entityId: string;
  entityLabel?: string | null;
  action: AuditAction;
  user: ActingUser | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}) {
  const { entityType, entityId, entityLabel, action, user, before, after } = params;

  let changes: Record<string, unknown> | null = null;
  if (action === "CREATE" && after) {
    changes = sanitizeSnapshot(after);
  } else if (action === "DELETE" && before) {
    changes = sanitizeSnapshot(before);
  } else if (action === "UPDATE" && before && after) {
    changes = diffFields(sanitizeSnapshot(before), sanitizeSnapshot(after));
  }

  try {
    await prisma.auditLog.create({
      data: {
        entityType,
        entityId,
        entityLabel: entityLabel ?? null,
        action,
        userId: user?.id ?? null,
        userName: user?.name ?? null,
        changes: changes ? JSON.stringify(changes) : null,
      },
    });
  } catch (error) {
    // Audit logging is best-effort — never let it break the primary operation.
    console.error("Failed to write audit log:", error);
  }
}
