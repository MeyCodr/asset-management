import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const active = searchParams.get("active");

    const where =
      active === "true" ? { returnedDate: null } : {};

    const assignments = await prisma.assetAssignment.findMany({
      where,
      include: {
        asset: { include: { category: true, department: true } },
        employee: { include: { department: true } },
      },
      orderBy: { assignedDate: "desc" },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Prevent assigning an asset that is already actively assigned
    const existing = await prisma.assetAssignment.findFirst({
      where: { assetId: body.assetId, returnedDate: null },
    });
    if (existing) {
      return NextResponse.json(
        { error: "This asset is already assigned to an employee. Please return it first before reassigning." },
        { status: 409 }
      );
    }

    const assignment = await prisma.assetAssignment.create({
      data: {
        assetId: body.assetId,
        employeeId: body.employeeId,
        assignedDate: body.assignedDate ? new Date(body.assignedDate) : new Date(),
        notes: body.notes || null,
      },
      include: {
        asset: { include: { category: true } },
        employee: true,
      },
    });

    // Update asset status to Active
    await prisma.asset.update({
      where: { id: body.assetId },
      data: { status: "Check Out" },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
  }
}
