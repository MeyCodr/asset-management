import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Departments
  const itDept = await prisma.department.upsert({
    where: { code: "IT" }, update: {},
    create: { name: "Information Technology", code: "IT" },
  });
  await prisma.department.upsert({ where: { code: "HR" }, update: {}, create: { name: "Human Resources", code: "HR" } });
  await prisma.department.upsert({ where: { code: "FIN" }, update: {}, create: { name: "Finance", code: "FIN" } });
  await prisma.department.upsert({ where: { code: "OPS" }, update: {}, create: { name: "Operations", code: "OPS" } });
  console.log("✓ Departments created");

  // Categories
  const cats = [
    { name: "Laptop", type: "hardware" }, { name: "Desktop", type: "hardware" },
    { name: "Monitor", type: "peripheral" }, { name: "Server", type: "hardware" },
    { name: "Network Switch", type: "network" }, { name: "Router", type: "network" },
    { name: "Printer", type: "peripheral" }, { name: "Mobile Phone", type: "mobile" },
    { name: "Tablet", type: "mobile" }, { name: "UPS", type: "hardware" },
    { name: "Keyboard & Mouse", type: "peripheral" }, { name: "Headset", type: "peripheral" },
    { name: "Docking Station", type: "peripheral" }, { name: "External Storage", type: "peripheral" },
    { name: "Firewall", type: "network" },
    { name: "Laptop Workstation", type: "hardware" },
    { name: "Desktop Workstation", type: "hardware" },
  ];

  const catMap = {};
  for (const c of cats) {
    const r = await prisma.assetCategory.upsert({ where: { name: c.name }, update: {}, create: c });
    catMap[c.name] = r.id;
  }
  console.log("✓ Categories created");

  // Employees
  const emps = [
    { name: "Ahmed Al-Rashidi", email: "ahmed.alrashidi@phn.com", jobTitle: "IT Manager", phone: "+971 50 111 2233" },
    { name: "Sarah Johnson", email: "sarah.johnson@phn.com", jobTitle: "Systems Administrator", phone: "+971 50 222 3344" },
    { name: "Mohammed Al-Farsi", email: "m.alfarsi@phn.com", jobTitle: "Network Engineer", phone: "+971 50 333 4455" },
    { name: "Fatima Hassan", email: "fatima.hassan@phn.com", jobTitle: "IT Support Specialist", phone: "+971 50 444 5566" },
    { name: "Khalid Al-Mansouri", email: "k.almansouri@phn.com", jobTitle: "Database Administrator", phone: "+971 50 555 6677" },
    { name: "Emily Chen", email: "emily.chen@phn.com", jobTitle: "DevOps Engineer" },
    { name: "Omar Abdullah", email: "omar.abdullah@phn.com", jobTitle: "IT Support Technician" },
    { name: "Lisa Park", email: "lisa.park@phn.com", jobTitle: "Cybersecurity Analyst" },
  ];

  const empMap = {};
  for (const e of emps) {
    const r = await prisma.employee.upsert({
      where: { email: e.email }, update: {},
      create: { ...e, departmentId: itDept.id },
    });
    empMap[e.email] = r.id;
  }
  console.log("✓ Employees created");

  // Assets
  const assets = [
    { assetTag: "IT-LAP-001", name: "Dell Latitude 5540", brand: "Dell", model: "Latitude 5540", serialNumber: "SN-DL5540-001", status: "Active", categoryId: catMap["Laptop"], departmentId: itDept.id, location: "Office Floor 3", purchaseDate: new Date("2023-06-15"), purchaseCost: 1299.99, vendor: "Dell Technologies", warrantyExpiry: new Date("2026-06-15"), operatingSystem: "Windows 11 Pro", processor: "Intel Core i7-1365U", ram: "16GB DDR4", storage: "512GB NVMe SSD" },
    { assetTag: "IT-LAP-002", name: "HP EliteBook 840 G10", brand: "HP", model: "EliteBook 840 G10", serialNumber: "SN-HP840-002", status: "Active", categoryId: catMap["Laptop"], departmentId: itDept.id, location: "Office Floor 3", purchaseDate: new Date("2023-08-20"), purchaseCost: 1450.00, vendor: "HP Inc.", warrantyExpiry: new Date("2026-08-20"), operatingSystem: "Windows 11 Pro", processor: "Intel Core i5-1345U", ram: "16GB DDR4", storage: "256GB SSD" },
    { assetTag: "IT-LAP-003", name: "Lenovo ThinkPad X1 Carbon", brand: "Lenovo", model: "ThinkPad X1 Carbon Gen 11", serialNumber: "SN-LNV-X1-003", status: "In Repair", categoryId: catMap["Laptop"], departmentId: itDept.id, location: "IT Workshop", purchaseDate: new Date("2022-11-10"), purchaseCost: 1799.00, vendor: "Lenovo", warrantyExpiry: new Date("2025-11-10"), operatingSystem: "Windows 11 Pro", processor: "Intel Core i7-1365U", ram: "32GB LPDDR5", storage: "1TB NVMe SSD" },
    { assetTag: "IT-LAP-004", name: "MacBook Pro 14-inch", brand: "Apple", model: "MacBook Pro M3 Pro", serialNumber: "SN-APL-MBP-004", status: "Active", categoryId: catMap["Laptop"], departmentId: itDept.id, location: "Office Floor 3", purchaseDate: new Date("2024-01-05"), purchaseCost: 1999.00, vendor: "Apple", warrantyExpiry: new Date("2025-01-05"), operatingSystem: "macOS Sequoia", processor: "Apple M3 Pro", ram: "18GB Unified", storage: "512GB SSD" },
    { assetTag: "IT-LAP-005", name: "Dell Latitude 5540 (Stock)", brand: "Dell", model: "Latitude 5540", serialNumber: "SN-DL5540-005", status: "In Stock", categoryId: catMap["Laptop"], departmentId: itDept.id, location: "IT Storage Room", purchaseDate: new Date("2024-03-01"), purchaseCost: 1299.99, vendor: "Dell Technologies", warrantyExpiry: new Date("2027-03-01"), operatingSystem: "Windows 11 Pro", processor: "Intel Core i5-1345U", ram: "8GB DDR4", storage: "256GB SSD" },
    { assetTag: "IT-DSK-001", name: "Dell OptiPlex 7010", brand: "Dell", model: "OptiPlex 7010", serialNumber: "SN-DOPTX-001", status: "Active", categoryId: catMap["Desktop"], departmentId: itDept.id, location: "Server Room", purchaseDate: new Date("2022-04-15"), purchaseCost: 899.00, vendor: "Dell Technologies", warrantyExpiry: new Date("2025-04-15"), operatingSystem: "Windows 11 Pro", processor: "Intel Core i5-13500", ram: "16GB DDR4", storage: "512GB SSD" },
    { assetTag: "IT-SRV-001", name: "Dell PowerEdge R750", brand: "Dell", model: "PowerEdge R750", serialNumber: "SN-DPWR-001", status: "Active", categoryId: catMap["Server"], departmentId: itDept.id, location: "Data Center", purchaseDate: new Date("2022-01-20"), purchaseCost: 12500.00, vendor: "Dell Technologies", warrantyExpiry: new Date("2027-01-20"), ipAddress: "192.168.1.10", operatingSystem: "Windows Server 2022", processor: "2x Intel Xeon Gold 6330", ram: "256GB DDR4 ECC", storage: "8TB RAID" },
    { assetTag: "IT-SRV-002", name: "HPE ProLiant DL380 Gen10", brand: "HP", model: "ProLiant DL380 Gen10", serialNumber: "SN-HPE-002", status: "Active", categoryId: catMap["Server"], departmentId: itDept.id, location: "Data Center", purchaseDate: new Date("2021-09-10"), purchaseCost: 9800.00, vendor: "HPE", warrantyExpiry: new Date("2024-09-10"), ipAddress: "192.168.1.11", operatingSystem: "VMware ESXi 8.0", processor: "2x Intel Xeon Silver 4210R", ram: "128GB DDR4 ECC", storage: "4TB RAID" },
    { assetTag: "IT-MON-001", name: "Dell UltraSharp U2722D", brand: "Dell", model: "U2722D", serialNumber: "SN-DU27-001", status: "Active", categoryId: catMap["Monitor"], departmentId: itDept.id, location: "Office Floor 3", purchaseDate: new Date("2023-06-15"), purchaseCost: 549.00, vendor: "Dell Technologies", warrantyExpiry: new Date("2026-06-15") },
    { assetTag: "IT-MON-002", name: "Dell UltraSharp U2722D", brand: "Dell", model: "U2722D", serialNumber: "SN-DU27-002", status: "Active", categoryId: catMap["Monitor"], departmentId: itDept.id, location: "Office Floor 3", purchaseDate: new Date("2023-06-15"), purchaseCost: 549.00, vendor: "Dell Technologies", warrantyExpiry: new Date("2026-06-15") },
    { assetTag: "IT-NET-001", name: "Cisco Catalyst 2960-X", brand: "Cisco", model: "Catalyst 2960-X", serialNumber: "SN-CSCO-001", status: "Active", categoryId: catMap["Network Switch"], departmentId: itDept.id, location: "Server Room", purchaseDate: new Date("2021-05-10"), purchaseCost: 3200.00, vendor: "Cisco Systems", warrantyExpiry: new Date("2026-05-10"), ipAddress: "192.168.1.2", macAddress: "00:1A:2B:3C:4D:5E" },
    { assetTag: "IT-FW-001", name: "Fortinet FortiGate 200F", brand: "Fortinet", model: "FortiGate 200F", serialNumber: "SN-FTN-001", status: "Active", categoryId: catMap["Firewall"], departmentId: itDept.id, location: "Server Room", purchaseDate: new Date("2022-03-15"), purchaseCost: 5500.00, vendor: "Fortinet", warrantyExpiry: new Date("2025-03-15"), ipAddress: "192.168.1.1" },
    { assetTag: "IT-PRT-001", name: "HP LaserJet Enterprise M507dn", brand: "HP", model: "M507dn", serialNumber: "SN-HPLJ-001", status: "Active", categoryId: catMap["Printer"], departmentId: itDept.id, location: "Office Floor 3", purchaseDate: new Date("2022-07-20"), purchaseCost: 650.00, vendor: "HP Inc.", warrantyExpiry: new Date("2025-07-20") },
    { assetTag: "IT-MOB-001", name: "iPhone 15 Pro", brand: "Apple", model: "iPhone 15 Pro 256GB", serialNumber: "SN-IP15-001", status: "Active", categoryId: catMap["Mobile Phone"], departmentId: itDept.id, location: "IT Manager Office", purchaseDate: new Date("2023-10-01"), purchaseCost: 999.00, vendor: "Apple", warrantyExpiry: new Date("2025-10-01"), operatingSystem: "iOS 18" },
    { assetTag: "IT-LAP-006", name: "HP Spectre x360 (Retired)", brand: "HP", model: "Spectre x360 14", serialNumber: "SN-HPSP-006", status: "Retired", categoryId: catMap["Laptop"], departmentId: itDept.id, location: "Storage", purchaseDate: new Date("2019-03-10"), purchaseCost: 1200.00, vendor: "HP Inc.", warrantyExpiry: new Date("2022-03-10"), notes: "Retired - Battery failure, screen cracked" },
  ];

  const assetMap = {};
  for (const a of assets) {
    try {
      const r = await prisma.asset.upsert({ where: { assetTag: a.assetTag }, update: {}, create: a });
      assetMap[a.assetTag] = r.id;
    } catch (e) { console.error("Asset error:", a.assetTag, e.message); }
  }
  console.log("✓ Assets created:", Object.keys(assetMap).length);

  // Assignments
  const today = new Date();
  const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return d; };
  const assignPairs = [
    { tag: "IT-LAP-001", email: "ahmed.alrashidi@phn.com", days: 120 },
    { tag: "IT-LAP-002", email: "sarah.johnson@phn.com", days: 90 },
    { tag: "IT-LAP-004", email: "emily.chen@phn.com", days: 60 },
    { tag: "IT-MOB-001", email: "ahmed.alrashidi@phn.com", days: 180 },
    { tag: "IT-MON-001", email: "ahmed.alrashidi@phn.com", days: 120 },
    { tag: "IT-MON-002", email: "sarah.johnson@phn.com", days: 90 },
    { tag: "IT-DSK-001", email: "k.almansouri@phn.com", days: 200 },
  ];

  for (const p of assignPairs) {
    const assetId = assetMap[p.tag];
    const employeeId = empMap[p.email];
    if (assetId && employeeId) {
      const exists = await prisma.assetAssignment.findFirst({ where: { assetId, employeeId, returnedDate: null } });
      if (!exists) {
        await prisma.assetAssignment.create({ data: { assetId, employeeId, assignedDate: daysAgo(p.days) } });
      }
    }
  }
  console.log("✓ Assignments created");

  // Maintenance
  const maint1 = assetMap["IT-LAP-003"];
  const maint2 = assetMap["IT-SRV-001"];
  if (maint1) {
    const ex = await prisma.maintenanceRecord.findFirst({ where: { assetId: maint1 } });
    if (!ex) await prisma.maintenanceRecord.create({ data: { assetId: maint1, type: "Repair", description: "Screen and battery replacement due to physical damage", cost: 350.00, performedBy: "Omar Abdullah", vendor: "Dell Authorized Service", maintenanceDate: daysAgo(30), status: "In Progress", notes: "Parts ordered, awaiting delivery" } });
  }
  if (maint2) {
    const ex = await prisma.maintenanceRecord.findFirst({ where: { assetId: maint2 } });
    const nextMaint = new Date(); nextMaint.setMonth(nextMaint.getMonth() + 3);
    if (!ex) await prisma.maintenanceRecord.create({ data: { assetId: maint2, type: "Preventive", description: "Quarterly server maintenance - cleaning, firmware update, health check", cost: 200.00, performedBy: "Sarah Johnson", maintenanceDate: daysAgo(60), nextMaintenanceDate: nextMaint, status: "Completed" } });
  }
  console.log("✓ Maintenance records created");

  // Licenses
  const lics = [
    { name: "Microsoft 365 Business Premium", vendor: "Microsoft", licenseType: "Subscription", purchaseDate: new Date("2024-01-01"), expiryDate: new Date("2024-12-31"), totalSeats: 50, usedSeats: 38, cost: 22.00, notes: "Monthly per-user subscription" },
    { name: "Windows 11 Pro", vendor: "Microsoft", licenseType: "Volume", purchaseDate: new Date("2023-01-01"), totalSeats: 40, usedSeats: 32, cost: 199.00, notes: "Volume licensing" },
    { name: "Adobe Creative Cloud", vendor: "Adobe", licenseType: "Subscription", purchaseDate: new Date("2024-04-01"), expiryDate: new Date("2025-03-31"), totalSeats: 10, usedSeats: 7, cost: 54.99, notes: "Design team and IT dept" },
    { name: "VMware vSphere 8 Enterprise Plus", vendor: "VMware", licenseType: "Perpetual", purchaseDate: new Date("2022-06-15"), totalSeats: 4, usedSeats: 3, cost: 4995.00, notes: "Covers 4 physical sockets" },
    { name: "Fortinet FortiGate Support", vendor: "Fortinet", licenseType: "Subscription", purchaseDate: new Date("2022-03-15"), expiryDate: new Date("2025-03-15"), totalSeats: 1, usedSeats: 1, cost: 1200.00, notes: "Hardware support + FortiGuard security services" },
    { name: "Veeam Backup & Replication", vendor: "Veeam", licenseType: "Subscription", purchaseDate: new Date("2024-02-01"), expiryDate: new Date("2025-01-31"), totalSeats: 10, usedSeats: 4, cost: 699.00, notes: "VM backup solution" },
  ];
  for (const l of lics) {
    const ex = await prisma.softwareLicense.findFirst({ where: { name: l.name } });
    if (!ex) await prisma.softwareLicense.create({ data: l });
  }
  console.log("✓ Software licenses created");
  console.log("\n🎉 Seed completed successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
