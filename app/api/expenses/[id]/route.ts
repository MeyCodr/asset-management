import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    if (!body.nature || !body.category || !body.supplier) {
      return NextResponse.json(
        { error: "Nature, category, and supplier are required." },
        { status: 400 }
      );
    }
    const expense = await prisma.expense.update({
      where: { id },
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
    return NextResponse.json(expense);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
