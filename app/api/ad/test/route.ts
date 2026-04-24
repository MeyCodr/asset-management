import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { testADConnection, ADConfig } from "@/lib/ldap";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Use submitted values, falling back to saved config for masked password
  const body: Partial<ADConfig> = await req.json();

  if (body.bindPassword === "••••••••") {
    const row = await prisma.systemConfig.findUnique({ where: { key: "ad_config" } });
    if (row) {
      const saved = JSON.parse(row.value);
      body.bindPassword = saved.bindPassword;
    }
  }

  const config: ADConfig = {
    host: body.host ?? "",
    port: body.port ?? 389,
    baseDN: body.baseDN ?? "",
    bindDN: body.bindDN ?? "",
    bindPassword: body.bindPassword ?? "",
    userSearchBase: body.userSearchBase,
    userFilter: body.userFilter,
    useTLS: body.useTLS ?? false,
  };

  if (!config.host || !config.baseDN || !config.bindDN || !config.bindPassword) {
    return NextResponse.json(
      { ok: false, message: "Please fill in all required fields." },
      { status: 400 }
    );
  }

  const result = await testADConnection(config);
  return NextResponse.json(result);
}
