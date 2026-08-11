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

function parseNumber(val: string | undefined): number | null {
  if (!val?.trim()) return null;
  const n = parseFloat(val.replace(/,/g, ""));
  return isNaN(n) ? null : n;
}

// Accepts "8%", "8", or "0.08" and always returns a decimal fraction (0.08)
function parseRate(val: string | undefined): number | null {
  if (!val?.trim()) return null;
  const hasPercent = val.includes("%");
  const n = parseFloat(val.replace(/%/g, "").trim());
  if (isNaN(n)) return null;
  return hasPercent || n >= 1 ? n / 100 : n;
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

      const nature = col(row, "Nature");
      const category = col(row, "Category");
      const supplier = col(row, "Supplier");

      if (!nature || !category || !supplier) {
        errors.push(`Row ${rowNum}: Nature, Category, and Supplier are required.`);
        skipped++;
        continue;
      }

      try {
        await prisma.expense.create({
          data: {
            nature,
            category,
            subCategory:      col(row, "Sub Category") || null,
            amp:              col(row, "AMP (Year)", "AMP", "Year") || null,
            costCtr:          col(row, "Cost Ctr", "Cost Centre") || null,
            supplier,
            dateEntry:        parseDate(col(row, "Date Entry")),
            phnRefLetter:     col(row, "PHN Ref Letter") || null,
            agreementPo:      col(row, "Agreement/PO", "Agreement", "PO") || null,
            typeOfRenewal:    col(row, "Type of Renewal") || null,
            quotationNo:      col(row, "Quotation No") || null,
            invoiceNo:        col(row, "Invoice No") || null,
            doNo:             col(row, "DO No") || null,
            services:         col(row, "Services") || null,
            description:      col(row, "Description") || null,
            licenseProductId: col(row, "License/Product ID", "License Product ID") || null,
            qty:              parseNumber(col(row, "Qty")),
            unit:             col(row, "Unit", "Unit (Pcs)") || null,
            unitPrice:        parseNumber(col(row, "Price/Unit (RM)", "Unit Price")),
            subTotalRm:       parseNumber(col(row, "Sub Total (RM)", "Sub Total")),
            sstRm:            parseRate(col(row, "SST (RM)", "SST")),
            sstTotalRm:       parseNumber(col(row, "SST Total (RM)", "SST Total")),
            grandTotalRm:     parseNumber(col(row, "Grand Total (RM)", "Grand Total")),
            effectiveDate:    parseDate(col(row, "Effective Date")),
          },
        });
        imported++;
      } catch (err) {
        console.error(`Expense import row ${rowNum} failed:`, err);
        const msg = friendlyImportRowError(err);
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
