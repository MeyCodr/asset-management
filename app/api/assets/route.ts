import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { assetTag: { contains: search } },
        { serialNumber: { contains: search } },
        { brand: { contains: search } },
      ];
    }

    const assets = await prisma.asset.findMany({
      where,
      include: {
        category: true,
        department: true,
        assignments: {
          where: { returnedDate: null },
          include: { employee: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(assets);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const asset = await prisma.asset.create({
      data: {
        assetTag: body.assetTag,
        name: body.name,
        brand: body.brand || null,
        model: body.model || null,
        serialNumber: body.serialNumber || null,
        status: body.status || "Check In",
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
    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create asset" }, { status: 500 });
  }
}
