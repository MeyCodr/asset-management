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
