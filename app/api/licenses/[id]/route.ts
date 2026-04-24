import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
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
    return NextResponse.json(license);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update license" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.softwareLicense.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete license" }, { status: 500 });
  }
}
