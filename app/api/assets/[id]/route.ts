import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActingUser, logAudit } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        department: true,
        assignments: {
          include: { employee: true },
          orderBy: { assignedDate: "desc" },
        },
        maintenance: {
          orderBy: { maintenanceDate: "desc" },
        },
      },
    });
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }
    return NextResponse.json(asset);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch asset" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const before = await prisma.asset.findUnique({ where: { id } });
    const asset = await prisma.asset.update({
      where: { id },
      data: {
        assetTag: body.assetTag,
        name: body.name,
        brand: body.brand || null,
        model: body.model || null,
        serialNumber: body.serialNumber || null,
        status: body.status,
        assetStatus: body.assetStatus || null,
        officeLicense: body.officeLicense || null,
        categoryId: body.categoryId,
        departmentId: body.departmentId,
        location: body.location || null,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        purchaseCost: body.purchaseCost ? parseFloat(body.purchaseCost) : null,
        vendor: body.vendor || null,
        warrantyExpiry: body.warrantyExpiry ? new Date(body.warrantyExpiry) : null,
        ipAddress: body.ipAddress || null,
        macAddress: body.macAddress || null,
        operatingSystem: body.operatingSystem || null,
        processor: body.processor || null,
        ram: body.ram || null,
        storage: body.storage || null,
        notes: body.notes || null,
      },
      include: { category: true, department: true },
    });

    const user = await getActingUser(req);
    await logAudit({
      entityType: "Asset",
      entityId: asset.id,
      entityLabel: asset.assetTag,
      action: "UPDATE",
      user,
      before,
      after: asset,
    });

    return NextResponse.json(asset);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const before = await prisma.asset.findUnique({ where: { id } });
    await prisma.asset.delete({ where: { id } });

    const user = await getActingUser(req);
    await logAudit({
      entityType: "Asset",
      entityId: id,
      entityLabel: before?.assetTag,
      action: "DELETE",
      user,
      before,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 });
  }
}
