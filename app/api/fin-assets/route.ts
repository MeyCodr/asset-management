import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActingUser, logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const finAssets = await prisma.finAsset.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(finAssets);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch financial assets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.finAssetTag || !body.assetCategory) {
      return NextResponse.json(
        { error: "FIN Asset TAG and Asset Category are required." },
        { status: 400 }
      );
    }
    const finAsset = await prisma.finAsset.create({
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
      action: "CREATE",
      user,
      after: finAsset,
    });

    return NextResponse.json(finAsset, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "A financial asset with this FIN Asset TAG already exists." }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to create financial asset" }, { status: 500 });
  }
}
