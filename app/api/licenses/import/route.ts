import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Case-insensitive, trimmed key lookup
function col(row: Record<string, string>, ...keys: string[]): string {
  const normalized = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.trim().toLowerCase(), v])
  );
  for (const k of keys) {
    const val = normalized[k.trim().toLowerCase()]?.trim();
    if (val && val.toLowerCase() !== "na" && val !== "#VALUE!") return val;
  }
  return "";
}

function parseDate(val: string | undefined): Date | null {
  if (!val?.trim() || val.trim().toLowerCase() === "na") return null;
  // Handle D/M/YYYY format (from period renewal column)
  const dmyMatch = val.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const dt = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return isNaN(dt.getTime()) ? null : dt;
  }
  const d = new Date(val.trim());
  return isNaN(d.getTime()) ? null : d;
}

function normalizeStatus(raw: string): string {
  const s = raw.trim().toUpperCase().replace(/\s/g, "");
  if (s === "ONGOING" || s === "ON-GOING") return "On Going";
  if (s === "CLOSED" || s === "CLOSE")     return "Closed";
  if (s === "NEW")                         return "New";
  if (["New", "On Going", "Closed"].includes(raw.trim())) return raw.trim();
  return "On Going"; // default
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rows: Record<string, string>[] = body.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const vendor = col(row, "Supplier", "Vendor");
      const name   = col(row, "Description", "Name");

      if (!vendor || !name) {
        errors.push(`Row ${rowNum}: Supplier and Description are required.`);
        skipped++;
        continue;
      }

      // Period renewal — supports both separate columns and a single "D/M/YYYY~D/M/YYYY" column
      let renewalStart: Date | null = parseDate(col(row, "Period Renewal Start", "Renewal Start"));
      let renewalEnd:   Date | null = parseDate(col(row, "Period Renewal End",   "Renewal End"));

      const combined = col(row, "Period Renewal");
      if (combined && combined.includes("~")) {
        const [startStr, endStr] = combined.split("~");
        if (!renewalStart) renewalStart = parseDate(startStr);
        if (!renewalEnd)   renewalEnd   = parseDate(endStr);
      }

      const rawStatus = col(row, "Status");
      const status = rawStatus ? normalizeStatus(rawStatus) : "On Going";
      const refLetter = col(row, "Official Ref Letter", "Ref Letter") || null;

      const data = {
        name,
        vendor,
        refLetter,
        refLetterDate: parseDate(col(row, "Letter Ref Date", "Ref Letter Date")),
        version:       col(row, "Version") || null,
        renewalStart,
        renewalEnd,
        itSection:     col(row, "IT Section") || null,
        status,
        licenseType:   col(row, "License Type", "Type") || "Subscription",
        cost:          col(row, "Cost (RM)", "Cost") ? parseFloat(col(row, "Cost (RM)", "Cost")) : null,
        totalSeats:    col(row, "Quantity", "Total Seats")  ? parseInt(col(row, "Quantity", "Total Seats"))  : 1,
        usedSeats:     col(row, "Deployment", "Used Seats") ? parseInt(col(row, "Deployment", "Used Seats")) : 0,
        notes:         col(row, "Notes") || null,
      };

      try {
        // Official Ref Letter is the natural unique key for a license renewal record.
        // Rows without one (or a duplicate within the DB) always insert as new.
        const existing = refLetter
          ? await (prisma.softwareLicense.findFirst as any)({ where: { refLetter } })
          : null;

        if (existing) {
          await (prisma.softwareLicense.update as any)({ where: { id: existing.id }, data });
          updated++;
        } else {
          await (prisma.softwareLicense.create as any)({ data });
          imported++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        errors.push(`Row ${rowNum}: ${msg}`);
        skipped++;
      }
    }

    return NextResponse.json({ imported, updated, skipped, errors });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
