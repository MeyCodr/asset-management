import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActingUser, logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const licenses = await prisma.softwareLicense.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(licenses);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch licenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const license = await (prisma.softwareLicense.create as any)({
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
      action: "CREATE",
      user,
      after: license,
    });

    return NextResponse.json(license, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create license" }, { status: 500 });
  }
}
