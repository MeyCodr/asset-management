import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const rows: { name: string; code: string }[] = await req.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided." }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const name = row.name?.toString().trim();
      const code = row.code?.toString().trim().toUpperCase();

      if (!name || !code) {
        skipped++;
        continue;
      }

      try {
        await prisma.department.create({ data: { name, code } });
        imported++;
      } catch (err: unknown) {
        if ((err as { code?: string }).code === "P2002") {
          errors.push(`"${code}" already exists — skipped.`);
        }
        skipped++;
      }
    }

    return NextResponse.json({ imported, skipped, errors });
  } catch {
    return NextResponse.json({ error: "Failed to process import." }, { status: 500 });
  }
}
