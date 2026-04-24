import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";

function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-MY", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

type LicenseEntry = {
  id: string;
  name: string;
  vendor: string;
  renewalEnd: Date | null;
  itSection: string | null;
  days: number;
  urgent: boolean; // true = ≤14 days, false = ≤60 days
};

function buildEmailHtml(critical: LicenseEntry[], warning: LicenseEntry[]): string {
  const all = [...critical, ...warning];

  function section(title: string, color: string, bg: string, border: string, items: LicenseEntry[]) {
    if (items.length === 0) return "";
    const rows = items.map((l) => `
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:10px 12px;font-weight:600;">${l.name}</td>
        <td style="padding:10px 12px;color:#4b5563;">${l.vendor}</td>
        <td style="padding:10px 12px;color:#4b5563;">${l.itSection ?? "—"}</td>
        <td style="padding:10px 12px;color:${color};font-weight:700;">${l.days} day${l.days !== 1 ? "s" : ""}</td>
        <td style="padding:10px 12px;color:#4b5563;">${formatDate(l.renewalEnd)}</td>
      </tr>
    `).join("");

    return `
      <div style="margin-bottom:28px;">
        <div style="background:${bg};border:1px solid ${border};border-radius:6px;padding:12px 16px;margin-bottom:12px;">
          <strong style="color:${color};">${title}</strong>
          <span style="color:#4b5563;"> — ${items.length} license${items.length > 1 ? "s" : ""}</span>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="padding:10px 12px;text-align:left;">Description</th>
              <th style="padding:10px 12px;text-align:left;">Supplier</th>
              <th style="padding:10px 12px;text-align:left;">IT Section</th>
              <th style="padding:10px 12px;text-align:left;">Days Left</th>
              <th style="padding:10px 12px;text-align:left;">Expiry Date</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family:Arial,sans-serif;color:#1e293b;margin:0;padding:0;background:#f8fafc;">
      <div style="max-width:700px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:#1e40af;padding:20px 28px;">
          <h1 style="margin:0;color:#fff;font-size:18px;">License Expiry Reminder</h1>
          <p style="margin:6px 0 0;color:#bfdbfe;font-size:14px;">
            ${all.length} license${all.length > 1 ? "s" : ""} require${all.length === 1 ? "s" : ""} attention
          </p>
        </div>
        <div style="padding:24px 28px;">
          ${section("⚠ Expiring within 14 days — CRITICAL", "#dc2626", "#fef2f2", "#fecaca", critical)}
          ${section("🔔 Expiring within 60 days — WARNING",  "#d97706", "#fffbeb", "#fde68a", warning)}
          <p style="margin-top:8px;font-size:13px;color:#64748b;">
            This is an automated notification from the IT Asset Management System (PHNIAMS).<br/>
            Please arrange renewals as soon as possible. Do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function POST(req: NextRequest) {
  const secret  = req.headers.get("x-cron-secret");
  const referer = req.headers.get("referer") ?? "";
  const isInternal = referer.includes("/licenses") || referer.includes(process.env.NEXT_PUBLIC_BASE_URL ?? "");
  const hasValidSecret = process.env.CRON_SECRET && secret === process.env.CRON_SECRET;

  if (process.env.CRON_SECRET && !isInternal && !hasValidSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      where: { status: { in: ["active", "approved"] } },
      select: { email: true },
    });

    if (users.length === 0) {
      return NextResponse.json({ sent: 0, recipients: 0, summary: [], message: "No active users to notify." });
    }

    const emails = users.map((u) => u.email);

    const licenses = await (prisma.softwareLicense.findMany as any)({
      where: { renewalEnd: { not: null } },
    });

    // Bucket licenses into critical (≤14d) and warning (15–60d)
    const critical: LicenseEntry[] = [];
    const warning:  LicenseEntry[] = [];

    for (const l of licenses) {
      const days = daysUntil(new Date(l.renewalEnd));
      if (days < 0 || days > 60) continue;
      const entry: LicenseEntry = {
        id:        l.id,
        name:      l.name,
        vendor:    l.vendor,
        renewalEnd: l.renewalEnd ? new Date(l.renewalEnd) : null,
        itSection: l.itSection ?? null,
        days,
        urgent:    days <= 14,
      };
      if (days <= 14) critical.push(entry);
      else            warning.push(entry);
    }

    if (critical.length === 0 && warning.length === 0) {
      return NextResponse.json({ sent: 0, recipients: 0, summary: ["No licenses expiring within 60 days."] });
    }

    // Filter out already-notified licenses (per threshold bucket)
    async function filterNotified(items: LicenseEntry[], threshold: number): Promise<LicenseEntry[]> {
      if (items.length === 0) return [];
      const alreadyLogged = await (prisma as any).notificationLog.findMany({
        where: {
          threshold,
          licenseId:  { in: items.map((l) => l.id) },
          renewalEnd: { in: items.map((l) => l.renewalEnd) },
        },
        select: { licenseId: true },
      });
      const notifiedIds = new Set(alreadyLogged.map((n: any) => n.licenseId));
      return items.filter((l) => !notifiedIds.has(l.id));
    }

    const newCritical = await filterNotified(critical, 14);
    const newWarning  = await filterNotified(warning,  60);

    if (newCritical.length === 0 && newWarning.length === 0) {
      return NextResponse.json({ sent: 0, recipients: 0, summary: ["All expiring licenses already notified."] });
    }

    // Send ONE combined email
    const totalNew = newCritical.length + newWarning.length;
    const subject  = `License Expiry Reminder — ${totalNew} license${totalNew > 1 ? "s" : ""} require attention`;
    const html     = buildEmailHtml(newCritical, newWarning);

    await sendMail(emails, subject, html);

    // Log sent notifications
    const logData = [
      ...newCritical.map((l) => ({ licenseId: l.id, threshold: 14, renewalEnd: l.renewalEnd })),
      ...newWarning.map((l)  => ({ licenseId: l.id, threshold: 60, renewalEnd: l.renewalEnd })),
    ];
    await (prisma as any).notificationLog.createMany({ data: logData, skipDuplicates: true });

    const summary: string[] = [];
    if (newCritical.length > 0) summary.push(`${newCritical.length} critical (≤14d)`);
    if (newWarning.length > 0)  summary.push(`${newWarning.length} warning (≤60d)`);

    return NextResponse.json({ sent: totalNew, recipients: emails.length, summary });
  } catch (error) {
    console.error("[license-expiry notification]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
