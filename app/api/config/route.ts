import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

const AD_CONFIG_KEY = "ad_config";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const row = await prisma.systemConfig.findUnique({
    where: { key: AD_CONFIG_KEY },
  });

  if (!row) return NextResponse.json(null);

  const config = JSON.parse(row.value);
  // Mask the password
  if (config.bindPassword) config.bindPassword = "••••••••";

  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();

  // If password is masked (unchanged), keep existing
  const existing = await prisma.systemConfig.findUnique({
    where: { key: AD_CONFIG_KEY },
  });

  let existingConfig: Record<string, unknown> = {};
  if (existing) existingConfig = JSON.parse(existing.value);

  const saved = {
    ...existingConfig,
    ...body,
    bindPassword:
      body.bindPassword === "••••••••"
        ? existingConfig.bindPassword
        : body.bindPassword,
  };

  await prisma.systemConfig.upsert({
    where: { key: AD_CONFIG_KEY },
    update: { value: JSON.stringify(saved) },
    create: { key: AD_CONFIG_KEY, value: JSON.stringify(saved) },
  });

  return NextResponse.json({ ok: true });
}
