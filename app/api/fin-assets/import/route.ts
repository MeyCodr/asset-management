import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { friendlyImportRowError } from "@/lib/api-errors";

// Case-insensitive, trimmed key lookup — handles extra spaces or different casing in Excel headers
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
  const dmyMatch = val.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const dt = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return isNaN(dt.getTime()) ? null : dt;
  }
  const d = new Date(val.trim());
  return isNaN(d.getTime()) ? null : d;
}

function parseFloatVal(val: string | undefined): number | null {
  if (!val?.trim()) return null;
  const n = parseFloat(val.replace(/,/g, ""));
  return isNaN(n) ? null : n;
}

function parseIntVal(val: string | undefined): number | null {
  if (!val?.trim()) return null;
  const n = parseInt(val.replace(/,/g, ""), 10);
  return isNaN(n) ? null : n;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rows: Record<string, string>[] = body.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const finAssetTag = col(row, "FIN Asset TAG", "FIN Asset Tag");
      const assetCategory = col(row, "Asset Category");

      if (!finAssetTag || !assetCategory) {
        errors.push(`Row ${rowNum}: FIN Asset TAG and Asset Category are required.`);
        skipped++;
        continue;
      }

      try {
        await prisma.finAsset.create({
          data: {
            finAssetTag,
            assetCategory,
            itAssetId:          col(row, "IT Asset ID") || null,
            assetType:          col(row, "Asset Type") || null,
            assetStatus:        col(row, "Asset Status") || null,
            serialNumberLic:    col(row, "Serial Number/Lic", "Serial Number") || null,
            brand:              col(row, "Brand") || null,
            model:              col(row, "Model") || null,
            os:                 col(row, "OS") || null,
            qty:                parseIntVal(col(row, "Qty")),
            department:         col(row, "Department") || null,
            plant:              col(row, "Plant") || null,
            approvedFinCapexNo: col(row, "Approved FIN CAPEX No", "Approved FIN CAPEX NO") || null,
            dateOfPurchase:     parseDate(col(row, "Date of Purchase")),
            purchaseOrder:      col(row, "Purchase Order") || null,
            totalAmountRm:      parseFloatVal(col(row, "Total Amount (RM)", "Total Amount")),
            supplier:           col(row, "Supplier") || null,
          },
        });
        imported++;
      } catch (err) {
        console.error(`FinAsset import row ${rowNum} failed:`, err);
        const msg = friendlyImportRowError(err, `FIN Asset TAG "${finAssetTag}"`);
        errors.push(`Row ${rowNum}: ${msg}`);
        skipped++;
      }
    }

    return NextResponse.json({ imported, skipped, errors });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
