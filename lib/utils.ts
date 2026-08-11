import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export const BASE_PATH = "/phniams";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, "dd/MM/yyyy");
  } catch {
    return "—";
  }
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export const ASSET_STATUSES = [
  "Check In",
  "Check Out",
  "Repair",
  "Disposed",
] as const;

export type AssetStatus = (typeof ASSET_STATUSES)[number];

export const STATUS_COLORS: Record<string, string> = {
  "Check In": "bg-blue-100 text-blue-800",
  "Check Out": "bg-green-100 text-green-800",
  Repair: "bg-yellow-100 text-yellow-800",
  Disposed: "bg-gray-100 text-gray-800",
  Completed: "bg-green-100 text-green-800",
  Scheduled: "bg-blue-100 text-blue-800",
  "In Progress": "bg-yellow-100 text-yellow-800",
};

export const ASSET_OWNERSHIP_TYPES = [
  "Purchase",
  "Leasing",
  "Buyout",
] as const;

export const ASSET_OWNERSHIP_COLORS: Record<string, string> = {
  Purchase: "bg-purple-100 text-purple-800",
  Leasing: "bg-orange-100 text-orange-800",
  Buyout: "bg-teal-100 text-teal-800",
};

export const MAINTENANCE_TYPES = [
  "Repair",
  "Preventive",
  "Upgrade",
  "Inspection",
] as const;

export const LICENSE_TYPES = [
  "Perpetual",
  "Subscription",
  "OEM",
  "Volume",
] as const;

export const CATEGORY_TYPES = [
  "hardware",
  "software",
  "peripheral",
  "network",
  "mobile",
  "other",
] as const;

export const FIN_ASSET_TYPES = [
  "Hardware",
  "Software",
  "Peripheral",
  "Network",
  "Mobile",
  "Other",
] as const;

export const FIN_ASSET_CATEGORIES = [
  "Projector",
  "Software",
  "Desktop",
  "Laptop",
  "Desktop Workstation",
  "Laptop Workstation",
] as const;

export const FIN_ASSET_PLANTS = [
  "PHNSA",
  "PHNSA2",
  "PHNFIF",
  "PHNPKN",
  "PHNTGM",
  "PHNPGH",
  "PHNBB",
] as const;

export const EXPENSE_NATURES = ["OPEX", "CAPEX"] as const;

export const EXPENSE_COST_CENTERS = ["16IPD", "16ISI", "16IAP"] as const;

export const EXPENSE_RENEWAL_TYPES = [
  "Annual",
  "One Time Purchase",
  "Monthly",
  "Quarterly",
  "Half Yearly",
  "Biennial",
  "Contract",
  "Project Based",
] as const;

export const EXPENSE_UNITS = ["Lot", "Per Month", "Per Qtr", "Per Year"] as const;

export const EXPENSE_SST_RATE = 0.08;

export const EXPENSE_SST_RATES = [0, 0.06, 0.08] as const;

export function expenseYearOptions(): string[] {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let y = currentYear + 5; y >= currentYear - 2; y--) years.push(String(y));
  return years;
}

export const EXPENSE_CATEGORIES = [
  {
    name: "Cloud",
    subCategories: ["Managed Cloud Services/Hosting", "Others"],
  },
  {
    name: "Cybersecurity",
    subCategories: [
      "Cybersecurity Services (General)",
      "Application Security",
      "Endpoint Security",
      "Network Security",
      "Others",
    ],
  },
  {
    name: "Hardware",
    subCategories: ["Printing/Peripheral", "End-User Computing", "Accessories/Others"],
  },
  {
    name: "Internet Connectivity",
    subCategories: ["SDWAN", "Internet Broadband", "Others"],
  },
  {
    name: "Software",
    subCategories: [
      "ERP Related",
      "HR & Corporate Services",
      "Business Productivity - IT",
      "Business Productivity - Tech",
      "Service Mgmt - IT",
      "Service Mgmt - Non IT",
    ],
  },
] as const;
