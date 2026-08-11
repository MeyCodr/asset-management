import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActingUser, logAudit } from "@/lib/audit";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    if (!body.finAssetTag || !body.assetCategory) {
      return NextResponse.json(
        { error: "FIN Asset TAG and Asset Category are required." },
        { status: 400 }
      );
    }
    const before = await prisma.finAsset.findUnique({ where: { id } });
    const finAsset = await prisma.finAsset.update({
      where: { id },
      data: {
        finAssetTag:        body.finAssetTag,
        assetCategory:      body.assetCategory,
        itAssetId:          body.itAssetId          || null,
        assetType:          body.assetType          || null,
        assetStatus:        body.assetStatus        || null,
        serialNumberLic:    body.serialNumberLic    || null,
        brand:              body.brand              || null,
        model:              body.model              || null,
        os:                 body.os                 || null,
        qty:                body.qty                ? parseInt(body.qty, 10)    : null,
        department:         body.department         || null,
        plant:              body.plant              || null,
        approvedFinCapexNo: body.approvedFinCapexNo || null,
        dateOfPurchase:     body.dateOfPurchase      ? new Date(body.dateOfPurchase) : null,
        purchaseOrder:      body.purchaseOrder      || null,
        totalAmountRm:      body.totalAmountRm      ? parseFloat(body.totalAmountRm) : null,
        supplier:           body.supplier           || null,
      },
    });

    const user = await getActingUser(req);
    await logAudit({
      entityType: "FinAsset",
      entityId: finAsset.id,
      entityLabel: finAsset.finAssetTag,
      action: "UPDATE",
      user,
      before,
      after: finAsset,
    });

    return NextResponse.json(finAsset);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "A financial asset with this FIN Asset TAG already exists." }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to update financial asset" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const before = await prisma.finAsset.findUnique({ where: { id } });
    await prisma.finAsset.delete({ where: { id } });

    const user = await getActingUser(req);
    await logAudit({
      entityType: "FinAsset",
      entityId: id,
      entityLabel: before?.finAssetTag,
      action: "DELETE",
      user,
      before,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete financial asset" }, { status: 500 });
  }
}
