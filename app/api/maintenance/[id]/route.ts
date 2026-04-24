import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const record = await prisma.maintenanceRecord.update({
      where: { id },
      data: {
        type: body.type,
        description: body.description,
        cost: body.cost ? parseFloat(body.cost) : null,
        performedBy: body.performedBy || null,
        vendor: body.vendor || null,
        maintenanceDate: new Date(body.maintenanceDate),
        nextMaintenanceDate: body.nextMaintenanceDate
          ? new Date(body.nextMaintenanceDate)
          : null,
        status: body.status,
        notes: body.notes || null,
      },
      include: { asset: { include: { category: true } } },
    });
    return NextResponse.json(record);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update maintenance record" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.maintenanceRecord.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete maintenance record" }, { status: 500 });
  }
}
