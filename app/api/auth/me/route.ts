import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json(null, { status: 401 });

  const user = await verifyToken(token);
  if (!user) return NextResponse.json(null, { status: 401 });

  return NextResponse.json(user);
}
