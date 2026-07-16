import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getCatAbbrev(categoryName: string): string {
  const words = categoryName.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).padEnd(3, "X");
  return words.map((w) => w.slice(0, Math.min(4, Math.ceil(w.length / 2)))).join("");
}

function buildTag(categoryName: string, name: string): string {
  const catPart = getCatAbbrev(categoryName);
  const namePart = name.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return `IT-${catPart}-${namePart}`;
}

// Case-insensitive, trimmed key lookup — handles extra spaces or different casing in Excel headers
function col(row: Record<string, string>, ...keys: string[]): string {
  const normalizedRow = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.trim().toLowerCase(), v])
  );
  for (const k of keys) {
    const val = normalizedRow[k.trim().toLowerCase()]?.trim();
    if (val && val.toLowerCase() !== "na" && val !== "#VALUE!") return val;
  }
  return "";
}

function normalizeStatus(raw: string): string {
  const s = raw.toUpperCase().replace(/\s/g, "");
  if (s === "CHECKIN")   return "Check In";
  if (s === "CHECKOUT")  return "Check Out";
  if (s === "REPAIR" || s === "INREPAIR") return "Repair";
  if (s === "DISPOSED" || s === "RETIRED" || s === "LOST") return "Disposed";
  // Already correct casing
  if (["Check In", "Check Out", "Repair", "Disposed"].includes(raw.trim())) return raw.trim();
  return "Check In"; // default
}

function parseDate(val: string | undefined): Date | null {
  if (!val?.trim() || val.trim().toLowerCase() === "na") return null;
  const d = new Date(val.trim());
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rows: Record<string, string>[] = body.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });
    }

    // Get IT department
    const itDept = await prisma.department.findFirst({
      where: { OR: [{ code: { contains: "IT" } }, { name: { contains: "IT" } }] },
    });
    if (!itDept) {
      return NextResponse.json({ error: "IT department not found. Please create it first." }, { status: 400 });
    }

    // Build category map (name → id), creating missing ones
    const categoryMap = new Map(
      (await prisma.assetCategory.findMany()).map((c) => [c.name.toLowerCase(), c.id])
    );

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const name = col(row, "Name");
      if (!name) {
        errors.push(`Row ${rowNum}: Name is required.`);
        skipped++;
        continue;
      }

      // Resolve or create category
      const categoryName = col(row, "Category") || "Other";
      let categoryId = categoryMap.get(categoryName.toLowerCase());
      if (!categoryId) {
        const created = await prisma.assetCategory.create({
          data: { name: categoryName, type: "hardware" },
        });
        categoryId = created.id;
        categoryMap.set(categoryName.toLowerCase(), categoryId);
      }

      // Auto-generate asset tag if not provided
      const assetTag = col(row, "Asset Tag") || buildTag(categoryName, name);

      // Status / condition
      const rawStatus = col(row, "Status", "Condition");
      const status = rawStatus ? normalizeStatus(rawStatus) : "Check In";

      // Asset status
      const assetStatus = col(row, "Asset Status") || null;

      try {
        const asset = await prisma.asset.create({
          data: {
            assetTag,
            name,
            brand:           col(row, "Brand") || null,
            model:           col(row, "Model") || null,
            serialNumber:    col(row, "Serial Number", "Serial number", "serial number") || null,
            status,
            assetStatus:     assetStatus || null,
            officeLicense:   col(row, "Office License") || null,
            categoryId,
            departmentId:    itDept.id,
            location:        col(row, "Location") || null,
            purchaseDate:    parseDate(col(row, "Purchase Date", "Date Purchase")),
            purchaseCost:    col(row, "Purchase Cost") ? parseFloat(col(row, "Purchase Cost")) : null,
            vendor:          col(row, "Vendor") || null,
            warrantyExpiry:  parseDate(col(row, "Warranty Expiry", "Warranty Expired")),
            ipAddress:       col(row, "IP Address") || null,
            macAddress:      col(row, "MAC Address") || null,
            operatingSystem: col(row, "OS", "Operating System") || null,
            processor:       col(row, "Processor") || null,
            ram:             col(row, "RAM") || null,
            storage:         col(row, "Storage") || null,
            notes:           col(row, "Notes") || null,
          },
        });

        // Create assignment if STAFF ID or Current User is provided
        const staffId   = col(row, "STAFF ID", "Staff ID", "Staff Id");
        const userName  = col(row, "Current User", "Assigned To");

        if (staffId || userName) {
          const employee = staffId
            ? await prisma.employee.findFirst({ where: { staffId } })
            : await prisma.employee.findFirst({ where: { name: { contains: userName } } });

          if (employee) {
            await prisma.assetAssignment.create({
              data: {
                assetId:      asset.id,
                employeeId:   employee.id,
                assignedDate: parseDate(col(row, "Purchase Date", "Date Purchase")) ?? new Date(),
              },
            });
            // Set status to Check Out if assigned
            await prisma.asset.update({
              where: { id: asset.id },
              data:  { status: "Check Out" },
            });
          } else {
            errors.push(`Row ${rowNum}: No employee found for ${staffId ? `Staff ID "${staffId}"` : `Current User "${userName}"`} — asset imported without assignment.`);
          }
        }

        imported++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        if (msg.includes("Unique constraint")) {
          errors.push(`Row ${rowNum}: Asset Tag "${assetTag}" already exists.`);
        } else {
          errors.push(`Row ${rowNum}: ${msg}`);
        }
        skipped++;
      }
    }

    return NextResponse.json({ imported, skipped, errors });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
