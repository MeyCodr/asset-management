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
    const before = await prisma.assetAssignment.findUnique({ where: { id } });

    const assignment = await prisma.assetAssignment.update({
      where: { id },
      data: {
        returnedDate: body.returnedDate ? new Date(body.returnedDate) : null,
        notes: body.notes || null,
      },
      include: { asset: true, employee: true },
    });

    // If returning, set asset back to In Stock
    if (body.returnedDate) {
      await prisma.asset.update({
        where: { id: assignment.assetId },
        data: { status: "Check In" },
      });
    }

    const user = await getActingUser(req);
    await logAudit({
      entityType: "AssetAssignment",
      entityId: assignment.id,
      entityLabel: `${assignment.asset.assetTag} → ${assignment.employee.name}`,
      action: "UPDATE",
      user,
      before,
      after: assignment,
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const before = await prisma.assetAssignment.findUnique({
      where: { id },
      include: { asset: true, employee: true },
    });
    await prisma.assetAssignment.delete({ where: { id } });

    const user = await getActingUser(req);
    await logAudit({
      entityType: "AssetAssignment",
      entityId: id,
      entityLabel: before ? `${before.asset.assetTag} → ${before.employee.name}` : undefined,
      action: "DELETE",
      user,
      before,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 });
  }
}
