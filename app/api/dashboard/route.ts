import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalAssets,
      activeAssets,
      inRepairAssets,
      inStockAssets,
      retiredAssets,
      lostAssets,
      totalEmployees,
      activeAssignments,
      expiringWarranties,
      scheduledMaintenance,
      totalLicenses,
      expiringLicenses,
      assetsByCategory,
      assetsByStatus,
      recentAssets,
      recentAssignments,
    ] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: "Check Out" } }),
      prisma.asset.count({ where: { status: "Repair" } }),
      prisma.asset.count({ where: { status: "Check In" } }),
      prisma.asset.count({ where: { status: "Disposed" } }),
      prisma.asset.count({ where: { status: "Disposed" } }),
      prisma.employee.count(),
      prisma.assetAssignment.count({ where: { returnedDate: null } }),
      prisma.asset.count({
        where: {
          warrantyExpiry: {
            lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            gte: new Date(),
          },
        },
      }),
      prisma.maintenanceRecord.count({
        where: { status: { in: ["Scheduled", "In Progress"] } },
      }),
      prisma.softwareLicense.count(),
      (prisma.softwareLicense.count as any)({
        where: {
          renewalEnd: {
            lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            gte: new Date(),
          },
        },
      }),
      prisma.asset.groupBy({
        by: ["categoryId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 8,
      }),
      prisma.asset.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.asset.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { category: true, department: true },
      }),
      prisma.assetAssignment.findMany({
        take: 5,
        orderBy: { assignedDate: "desc" },
        where: { returnedDate: null },
        include: {
          asset: { include: { category: true } },
          employee: true,
        },
      }),
    ]);

    // Resolve category names
    const categoryIds = assetsByCategory.map((a) => a.categoryId);
    const categories = await prisma.assetCategory.findMany({
      where: { id: { in: categoryIds } },
    });
    const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

    const totalCost = await prisma.asset.aggregate({
      _sum: { purchaseCost: true },
      where: { status: { not: "Disposed" } },
    });

    return NextResponse.json({
      stats: {
        totalAssets,
        activeAssets,
        inRepairAssets,
        inStockAssets,
        retiredAssets,
        lostAssets,
        totalEmployees,
        activeAssignments,
        expiringWarranties,
        scheduledMaintenance,
        totalLicenses,
        expiringLicenses,
        totalCost: totalCost._sum.purchaseCost ?? 0,
      },
      assetsByCategory: assetsByCategory.map((a) => ({
        name: catMap[a.categoryId] ?? "Unknown",
        count: a._count.id,
      })),
      assetsByStatus: assetsByStatus.map((a) => ({
        name: a.status,
        count: a._count.id,
      })),
      recentAssets,
      recentAssignments,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
