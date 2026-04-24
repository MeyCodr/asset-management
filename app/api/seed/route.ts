import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Departments
    const itDept = await prisma.department.upsert({
      where: { code: "IT" },
      update: {},
      create: { name: "Information Technology", code: "IT" },
    });
    await prisma.department.upsert({
      where: { code: "HR" },
      update: {},
      create: { name: "Human Resources", code: "HR" },
    });
    await prisma.department.upsert({
      where: { code: "FIN" },
      update: {},
      create: { name: "Finance", code: "FIN" },
    });
    await prisma.department.upsert({
      where: { code: "OPS" },
      update: {},
      create: { name: "Operations", code: "OPS" },
    });

    // Categories
    const categories = [
      { name: "Laptop", type: "hardware" },
      { name: "Desktop", type: "hardware" },
      { name: "Monitor", type: "peripheral" },
      { name: "Server", type: "hardware" },
      { name: "Network Switch", type: "network" },
      { name: "Router", type: "network" },
      { name: "Printer", type: "peripheral" },
      { name: "Mobile Phone", type: "mobile" },
      { name: "Tablet", type: "mobile" },
      { name: "UPS", type: "hardware" },
      { name: "Keyboard & Mouse", type: "peripheral" },
      { name: "Headset", type: "peripheral" },
      { name: "Docking Station", type: "peripheral" },
      { name: "External Storage", type: "peripheral" },
      { name: "Firewall", type: "network" },
    ];

    const createdCategories: Record<string, string> = {};
    for (const cat of categories) {
      const c = await prisma.assetCategory.upsert({
        where: { name: cat.name },
        update: {},
        create: cat,
      });
      createdCategories[cat.name] = c.id;
    }

    // Employees
    const employees = [
      { name: "Ahmed Al-Rashidi", email: "ahmed.alrashidi@phn.com", jobTitle: "IT Manager", departmentId: itDept.id },
      { name: "Sarah Johnson", email: "sarah.johnson@phn.com", jobTitle: "Systems Administrator", departmentId: itDept.id },
      { name: "Mohammed Al-Farsi", email: "m.alfarsi@phn.com", jobTitle: "Network Engineer", departmentId: itDept.id },
      { name: "Fatima Hassan", email: "fatima.hassan@phn.com", jobTitle: "IT Support Specialist", departmentId: itDept.id },
      { name: "Khalid Al-Mansouri", email: "k.almansouri@phn.com", jobTitle: "Database Administrator", departmentId: itDept.id },
      { name: "Emily Chen", email: "emily.chen@phn.com", jobTitle: "DevOps Engineer", departmentId: itDept.id },
      { name: "Omar Abdullah", email: "omar.abdullah@phn.com", jobTitle: "IT Support Technician", departmentId: itDept.id },
      { name: "Lisa Park", email: "lisa.park@phn.com", jobTitle: "Cybersecurity Analyst", departmentId: itDept.id },
    ];

    const createdEmployees: Record<string, string> = {};
    for (const emp of employees) {
      const e = await prisma.employee.upsert({
        where: { email: emp.email },
        update: {},
        create: emp,
      });
      createdEmployees[emp.email] = e.id;
    }

    // Assets
    const now = new Date();
    const assets = [
      {
        assetTag: "IT-LAP-001", name: "Dell Latitude 5540", brand: "Dell", model: "Latitude 5540",
        serialNumber: "SN-DL5540-001", status: "Active", categoryId: createdCategories["Laptop"],
        departmentId: itDept.id, location: "Office Floor 3", purchaseDate: new Date("2023-06-15"),
        purchaseCost: 1299.99, vendor: "Dell Technologies", warrantyExpiry: new Date("2026-06-15"),
        operatingSystem: "Windows 11 Pro", processor: "Intel Core i7-1365U", ram: "16GB DDR4", storage: "512GB NVMe SSD",
      },
      {
        assetTag: "IT-LAP-002", name: "HP EliteBook 840 G10", brand: "HP", model: "EliteBook 840 G10",
        serialNumber: "SN-HP840-002", status: "Active", categoryId: createdCategories["Laptop"],
        departmentId: itDept.id, location: "Office Floor 3", purchaseDate: new Date("2023-08-20"),
        purchaseCost: 1450.00, vendor: "HP Inc.", warrantyExpiry: new Date("2026-08-20"),
        operatingSystem: "Windows 11 Pro", processor: "Intel Core i5-1345U", ram: "16GB DDR4", storage: "256GB SSD",
      },
      {
        assetTag: "IT-LAP-003", name: "Lenovo ThinkPad X1 Carbon", brand: "Lenovo", model: "ThinkPad X1 Carbon Gen 11",
        serialNumber: "SN-LNV-X1-003", status: "In Repair", categoryId: createdCategories["Laptop"],
        departmentId: itDept.id, location: "IT Workshop", purchaseDate: new Date("2022-11-10"),
        purchaseCost: 1799.00, vendor: "Lenovo", warrantyExpiry: new Date("2025-11-10"),
        operatingSystem: "Windows 11 Pro", processor: "Intel Core i7-1365U", ram: "32GB LPDDR5", storage: "1TB NVMe SSD",
      },
      {
        assetTag: "IT-LAP-004", name: "MacBook Pro 14-inch", brand: "Apple", model: "MacBook Pro M3 Pro",
        serialNumber: "SN-APL-MBP-004", status: "Active", categoryId: createdCategories["Laptop"],
        departmentId: itDept.id, location: "Office Floor 3", purchaseDate: new Date("2024-01-05"),
        purchaseCost: 1999.00, vendor: "Apple", warrantyExpiry: new Date("2025-01-05"),
        operatingSystem: "macOS Sequoia", processor: "Apple M3 Pro", ram: "18GB Unified", storage: "512GB SSD",
      },
      {
        assetTag: "IT-LAP-005", name: "Dell Latitude 5540", brand: "Dell", model: "Latitude 5540",
        serialNumber: "SN-DL5540-005", status: "In Stock", categoryId: createdCategories["Laptop"],
        departmentId: itDept.id, location: "IT Storage Room", purchaseDate: new Date("2024-03-01"),
        purchaseCost: 1299.99, vendor: "Dell Technologies", warrantyExpiry: new Date("2027-03-01"),
        operatingSystem: "Windows 11 Pro", processor: "Intel Core i5-1345U", ram: "8GB DDR4", storage: "256GB SSD",
      },
      {
        assetTag: "IT-DSK-001", name: "Dell OptiPlex 7010", brand: "Dell", model: "OptiPlex 7010",
        serialNumber: "SN-DOPTX-001", status: "Active", categoryId: createdCategories["Desktop"],
        departmentId: itDept.id, location: "Server Room", purchaseDate: new Date("2022-04-15"),
        purchaseCost: 899.00, vendor: "Dell Technologies", warrantyExpiry: new Date("2025-04-15"),
        operatingSystem: "Windows 11 Pro", processor: "Intel Core i5-13500", ram: "16GB DDR4", storage: "512GB SSD",
      },
      {
        assetTag: "IT-SRV-001", name: "Dell PowerEdge R750", brand: "Dell", model: "PowerEdge R750",
        serialNumber: "SN-DPWR-001", status: "Active", categoryId: createdCategories["Server"],
        departmentId: itDept.id, location: "Data Center", purchaseDate: new Date("2022-01-20"),
        purchaseCost: 12500.00, vendor: "Dell Technologies", warrantyExpiry: new Date("2027-01-20"),
        ipAddress: "192.168.1.10", operatingSystem: "Windows Server 2022", processor: "2x Intel Xeon Gold 6330", ram: "256GB DDR4 ECC", storage: "8TB RAID",
      },
      {
        assetTag: "IT-SRV-002", name: "HPE ProLiant DL380 Gen10", brand: "HP", model: "ProLiant DL380 Gen10",
        serialNumber: "SN-HPE-002", status: "Active", categoryId: createdCategories["Server"],
        departmentId: itDept.id, location: "Data Center", purchaseDate: new Date("2021-09-10"),
        purchaseCost: 9800.00, vendor: "HPE", warrantyExpiry: new Date("2024-09-10"),
        ipAddress: "192.168.1.11", operatingSystem: "VMware ESXi 8.0", processor: "2x Intel Xeon Silver 4210R", ram: "128GB DDR4 ECC", storage: "4TB RAID",
      },
      {
        assetTag: "IT-MON-001", name: "Dell UltraSharp U2722D", brand: "Dell", model: "U2722D",
        serialNumber: "SN-DU27-001", status: "Active", categoryId: createdCategories["Monitor"],
        departmentId: itDept.id, location: "Office Floor 3", purchaseDate: new Date("2023-06-15"),
        purchaseCost: 549.00, vendor: "Dell Technologies", warrantyExpiry: new Date("2026-06-15"),
      },
      {
        assetTag: "IT-MON-002", name: "Dell UltraSharp U2722D", brand: "Dell", model: "U2722D",
        serialNumber: "SN-DU27-002", status: "Active", categoryId: createdCategories["Monitor"],
        departmentId: itDept.id, location: "Office Floor 3", purchaseDate: new Date("2023-06-15"),
        purchaseCost: 549.00, vendor: "Dell Technologies", warrantyExpiry: new Date("2026-06-15"),
      },
      {
        assetTag: "IT-NET-001", name: "Cisco Catalyst 2960-X", brand: "Cisco", model: "Catalyst 2960-X",
        serialNumber: "SN-CSCO-001", status: "Active", categoryId: createdCategories["Network Switch"],
        departmentId: itDept.id, location: "Server Room", purchaseDate: new Date("2021-05-10"),
        purchaseCost: 3200.00, vendor: "Cisco Systems", warrantyExpiry: new Date("2026-05-10"),
        ipAddress: "192.168.1.2", macAddress: "00:1A:2B:3C:4D:5E",
      },
      {
        assetTag: "IT-FW-001", name: "Fortinet FortiGate 200F", brand: "Fortinet", model: "FortiGate 200F",
        serialNumber: "SN-FTN-001", status: "Active", categoryId: createdCategories["Firewall"],
        departmentId: itDept.id, location: "Server Room", purchaseDate: new Date("2022-03-15"),
        purchaseCost: 5500.00, vendor: "Fortinet", warrantyExpiry: new Date("2025-03-15"),
        ipAddress: "192.168.1.1",
      },
      {
        assetTag: "IT-PRT-001", name: "HP LaserJet Enterprise M507dn", brand: "HP", model: "M507dn",
        serialNumber: "SN-HPLJ-001", status: "Active", categoryId: createdCategories["Printer"],
        departmentId: itDept.id, location: "Office Floor 3", purchaseDate: new Date("2022-07-20"),
        purchaseCost: 650.00, vendor: "HP Inc.", warrantyExpiry: new Date("2025-07-20"),
      },
      {
        assetTag: "IT-MOB-001", name: "iPhone 15 Pro", brand: "Apple", model: "iPhone 15 Pro 256GB",
        serialNumber: "SN-IP15-001", status: "Active", categoryId: createdCategories["Mobile Phone"],
        departmentId: itDept.id, location: "IT Manager Office", purchaseDate: new Date("2023-10-01"),
        purchaseCost: 999.00, vendor: "Apple", warrantyExpiry: new Date("2025-10-01"),
        operatingSystem: "iOS 18",
      },
      {
        assetTag: "IT-LAP-006", name: "HP Spectre x360", brand: "HP", model: "Spectre x360 14",
        serialNumber: "SN-HPSP-006", status: "Retired", categoryId: createdCategories["Laptop"],
        departmentId: itDept.id, location: "Storage", purchaseDate: new Date("2019-03-10"),
        purchaseCost: 1200.00, vendor: "HP Inc.", warrantyExpiry: new Date("2022-03-10"),
        notes: "Retired - Battery failure, screen cracked",
      },
    ];

    const createdAssets: Record<string, string> = {};
    for (const asset of assets) {
      try {
        const a = await prisma.asset.upsert({
          where: { assetTag: asset.assetTag },
          update: {},
          create: asset,
        });
        createdAssets[asset.assetTag] = a.id;
      } catch {
        // skip duplicates
      }
    }

    // Assignments
    const assignments = [
      { assetTag: "IT-LAP-001", email: "ahmed.alrashidi@phn.com", daysAgo: 120 },
      { assetTag: "IT-LAP-002", email: "sarah.johnson@phn.com", daysAgo: 90 },
      { assetTag: "IT-LAP-004", email: "emily.chen@phn.com", daysAgo: 60 },
      { assetTag: "IT-MOB-001", email: "ahmed.alrashidi@phn.com", daysAgo: 180 },
      { assetTag: "IT-MON-001", email: "ahmed.alrashidi@phn.com", daysAgo: 120 },
      { assetTag: "IT-MON-002", email: "sarah.johnson@phn.com", daysAgo: 90 },
    ];

    for (const a of assignments) {
      const assetId = createdAssets[a.assetTag];
      const employeeId = createdEmployees[a.email];
      if (assetId && employeeId) {
        const existing = await prisma.assetAssignment.findFirst({
          where: { assetId, employeeId, returnedDate: null },
        });
        if (!existing) {
          const d = new Date();
          d.setDate(d.getDate() - a.daysAgo);
          await prisma.assetAssignment.create({
            data: { assetId, employeeId, assignedDate: d },
          });
        }
      }
    }

    // Maintenance Records
    const maintenanceDate1 = new Date();
    maintenanceDate1.setDate(maintenanceDate1.getDate() - 30);
    const maintenanceDate2 = new Date();
    maintenanceDate2.setDate(maintenanceDate2.getDate() - 60);
    const nextMaint = new Date();
    nextMaint.setMonth(nextMaint.getMonth() + 3);

    const laptopRepairId = createdAssets["IT-LAP-003"];
    const serverAssetId = createdAssets["IT-SRV-001"];

    if (laptopRepairId) {
      await prisma.maintenanceRecord.create({
        data: {
          assetId: laptopRepairId,
          type: "Repair",
          description: "Screen replacement and battery replacement due to physical damage",
          cost: 350.00,
          performedBy: "Omar Abdullah",
          vendor: "Dell Authorized Service",
          maintenanceDate: maintenanceDate1,
          status: "In Progress",
          notes: "Parts ordered, awaiting delivery",
        },
      });
    }

    if (serverAssetId) {
      await prisma.maintenanceRecord.create({
        data: {
          assetId: serverAssetId,
          type: "Preventive",
          description: "Quarterly server maintenance - cleaning, firmware update, health check",
          cost: 200.00,
          performedBy: "Sarah Johnson",
          maintenanceDate: maintenanceDate2,
          nextMaintenanceDate: nextMaint,
          status: "Completed",
        },
      });
    }

    // Software Licenses
    const licenses = [
      {
        name: "Microsoft 365 Business Premium", vendor: "Microsoft", licenseType: "Subscription",
        purchaseDate: new Date("2024-01-01"), expiryDate: new Date("2024-12-31"),
        totalSeats: 50, usedSeats: 38, cost: 22.00,
        notes: "Monthly per-user subscription - Enterprise agreement",
      },
      {
        name: "Windows 11 Pro", vendor: "Microsoft", licenseType: "Volume",
        purchaseDate: new Date("2023-01-01"), expiryDate: null,
        totalSeats: 40, usedSeats: 32, cost: 199.00,
        notes: "Volume licensing - OEM licenses attached to hardware",
      },
      {
        name: "Adobe Creative Cloud", vendor: "Adobe", licenseType: "Subscription",
        purchaseDate: new Date("2024-04-01"), expiryDate: new Date("2025-03-31"),
        totalSeats: 10, usedSeats: 7, cost: 54.99,
        notes: "Design team and IT dept",
      },
      {
        name: "VMware vSphere 8 Enterprise Plus", vendor: "VMware", licenseType: "Perpetual",
        purchaseDate: new Date("2022-06-15"), expiryDate: null,
        totalSeats: 4, usedSeats: 3, cost: 4995.00,
        notes: "Covers 4 physical sockets",
      },
      {
        name: "Fortinet FortiGate Support", vendor: "Fortinet", licenseType: "Subscription",
        purchaseDate: new Date("2022-03-15"), expiryDate: new Date("2025-03-15"),
        totalSeats: 1, usedSeats: 1, cost: 1200.00,
        notes: "Hardware support + FortiGuard security services",
      },
      {
        name: "Veeam Backup & Replication", vendor: "Veeam", licenseType: "Subscription",
        purchaseDate: new Date("2024-02-01"), expiryDate: new Date("2025-01-31"),
        totalSeats: 10, usedSeats: 4, cost: 699.00,
        notes: "VM backup solution",
      },
    ];

    for (const lic of licenses) {
      const existing = await prisma.softwareLicense.findFirst({ where: { name: lic.name } });
      if (!existing) {
        await prisma.softwareLicense.create({ data: lic });
      }
    }

    return NextResponse.json({ success: true, message: "Seed data created successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to seed data", details: String(error) },
      { status: 500 }
    );
  }
}
