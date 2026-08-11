import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActingUser, logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { jobTitle: { contains: search } },
            { staffId: { contains: search } },
          ],
        }
      : {};

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: true,
        assignments: {
          where: { returnedDate: null },
          include: { asset: { include: { category: true } } },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const employee = await prisma.employee.create({
      data: {
        name: body.name,
        email: body.email,
        jobTitle: body.jobTitle,
        phone: body.phone || null,
        staffId: body.staffId || null,
        departmentId: body.departmentId,
      },
      include: { department: true },
    });

    const user = await getActingUser(req);
    await logAudit({
      entityType: "Employee",
      entityId: employee.id,
      entityLabel: employee.name,
      action: "CREATE",
      user,
      after: employee,
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
