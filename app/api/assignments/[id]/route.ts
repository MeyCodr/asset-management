import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

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

    return NextResponse.json(assignment);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.assetAssignment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 });
  }
}
