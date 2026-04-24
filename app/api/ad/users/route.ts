import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { fetchADUsers, ADConfig } from "@/lib/ldap";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await prisma.systemConfig.findUnique({ where: { key: "ad_config" } });
  if (!row) {
    return NextResponse.json(
      { error: "Active Directory is not configured. Please configure it in Settings." },
      { status: 400 }
    );
  }

  const config: ADConfig = JSON.parse(row.value);

  if (!config.host || !config.baseDN || !config.bindDN || !config.bindPassword) {
    return NextResponse.json(
      { error: "Active Directory configuration is incomplete. Please check Settings." },
      { status: 400 }
    );
  }

  try {
    const adUsers = await fetchADUsers(config);

    // Get existing employees keyed by email for change detection
    const existingEmployees = await prisma.employee.findMany({
      include: { department: true },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingMap = new Map(existingEmployees.map((e) => [e.email.toLowerCase(), e as any]));

    const result = adUsers
      .filter((u) => u.department && u.department.trim() !== "")
      .map((u) => {
        const existing = existingMap.get(u.email.toLowerCase());
        if (!existing) return { ...u, alreadyImported: false, hasChanges: false };

        const hasChanges =
          (u.displayName || "") !== (existing.name || "") ||
          (u.jobTitle || "") !== (existing.jobTitle || "") ||
          (u.phone || "") !== (existing.phone || "") ||
          (u.description || "") !== (existing.staffId || "") ||
          (u.department || "") !== (existing.department?.name || "");

        return { ...u, alreadyImported: true, hasChanges };
      });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to connect to AD.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
