import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import crypto from "crypto";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const { staffId } = await req.json();

    if (!staffId) {
      return NextResponse.json({ error: "Staff ID is required." }, { status: 400 });
    }

    const user = await (prisma as any).user.findUnique({ where: { staffId } });

    // Always return success to avoid leaking whether a staff ID exists
    if (!user || !user.email) {
      return NextResponse.json({ success: true });
    }

    // Delete any existing tokens for this user
    await (prisma as any).passwordResetToken.deleteMany({ where: { userId: user.id } });

    // Create a new token valid for 1 hour
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await (prisma as any).passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const resetUrl = `${BASE_URL}/phniams/reset-password?token=${token}`;

    await sendMail(
      user.email,
      "PHNIAMS – Password Reset Request",
      `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#1e293b">Password Reset</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>We received a request to reset your PHNIAMS password. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;margin:16px 0;padding:10px 24px;background:#3b82f6;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
          Reset Password
        </a>
        <p style="color:#64748b;font-size:13px">If you did not request this, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
        <p style="color:#94a3b8;font-size:12px">PHNIAMS · PHN Organization</p>
      </div>
      `
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
