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
    const before = await prisma.softwareLicense.findUnique({ where: { id } });
    const license = await (prisma.softwareLicense.update as any)({
      where: { id },
      data: {
        name:          body.name,
        vendor:        body.vendor,
        refLetter:     body.refLetter     || null,
        refLetterDate: body.refLetterDate ? new Date(body.refLetterDate) : null,
        renewalStart:  body.renewalStart  ? new Date(body.renewalStart)  : null,
        renewalEnd:    body.renewalEnd    ? new Date(body.renewalEnd)    : null,
        itSection:     body.itSection     || null,
        status:        body.status        || "On Going",
        licenseType:   body.licenseType,
        cost:          body.cost          ? parseFloat(body.cost)        : null,
        totalSeats:    body.totalSeats    ? parseInt(body.totalSeats)    : 1,
        usedSeats:     body.usedSeats     ? parseInt(body.usedSeats)     : 0,
        notes:         body.notes         || null,
      },
    });

    const user = await getActingUser(req);
    await logAudit({
      entityType: "SoftwareLicense",
      entityId: license.id,
      entityLabel: license.name,
      action: "UPDATE",
      user,
      before,
      after: license,
    });

    return NextResponse.json(license);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update license" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const before = await prisma.softwareLicense.findUnique({ where: { id } });
    await prisma.softwareLicense.delete({ where: { id } });

    const user = await getActingUser(req);
    await logAudit({
      entityType: "SoftwareLicense",
      entityId: id,
      entityLabel: before?.name,
      action: "DELETE",
      user,
      before,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete license" }, { status: 500 });
  }
}
