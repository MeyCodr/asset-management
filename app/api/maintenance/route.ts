import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where = status ? { status } : {};

    const records = await prisma.maintenanceRecord.findMany({
      where,
      include: {
        asset: { include: { category: true, department: true } },
      },
      orderBy: { maintenanceDate: "desc" },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch maintenance records" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const record = await prisma.maintenanceRecord.create({
      data: {
        assetId: body.assetId,
        type: body.type,
        description: body.description,
        cost: body.cost ? parseFloat(body.cost) : null,
        performedBy: body.performedBy || null,
        vendor: body.vendor || null,
        maintenanceDate: new Date(body.maintenanceDate),
        nextMaintenanceDate: body.nextMaintenanceDate
          ? new Date(body.nextMaintenanceDate)
          : null,
        status: body.status || "Completed",
        notes: body.notes || null,
      },
      include: {
        asset: { include: { category: true } },
      },
    });

    // If maintenance is in progress, update asset status
    if (body.status === "In Progress") {
      await prisma.asset.update({
        where: { id: body.assetId },
        data: { status: "In Repair" },
      });
    }

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create maintenance record" }, { status: 500 });
  }
}
