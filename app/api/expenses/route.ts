import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActingUser, logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(expenses);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.nature || !body.category || !body.supplier) {
      return NextResponse.json(
        { error: "Nature, category, and supplier are required." },
        { status: 400 }
      );
    }
    const expense = await prisma.expense.create({
      data: {
        nature:           body.nature,
        category:         body.category,
        subCategory:      body.subCategory      || null,
        amp:              body.amp              || null,
        costCtr:          body.costCtr          || null,
        supplier:         body.supplier,
        dateEntry:        body.dateEntry        ? new Date(body.dateEntry)     : null,
        phnRefLetter:     body.phnRefLetter      || null,
        agreementPo:      body.agreementPo       || null,
        typeOfRenewal:    body.typeOfRenewal     || null,
        quotationNo:      body.quotationNo       || null,
        invoiceNo:        body.invoiceNo         || null,
        doNo:             body.doNo              || null,
        services:         body.services          || null,
        description:      body.description       || null,
        licenseProductId: body.licenseProductId  || null,
        qty:              body.qty               ? parseFloat(body.qty)          : null,
        unitPrice:        body.unitPrice         ? parseFloat(body.unitPrice)    : null,
        unit:             body.unit              || null,
        subTotalRm:       body.subTotalRm        ? parseFloat(body.subTotalRm)   : null,
        sstRm:            body.sstRm             ? parseFloat(body.sstRm)        : null,
        sstTotalRm:       body.sstTotalRm        ? parseFloat(body.sstTotalRm)   : null,
        grandTotalRm:     body.grandTotalRm      ? parseFloat(body.grandTotalRm) : null,
        effectiveDate:    body.effectiveDate     ? new Date(body.effectiveDate)  : null,
      },
    });

    const user = await getActingUser(req);
    await logAudit({
      entityType: "Expense",
      entityId: expense.id,
      entityLabel: `${expense.nature} — ${expense.supplier}`,
      action: "CREATE",
      user,
      after: expense,
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
