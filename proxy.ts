import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];
const PUBLIC_API_PREFIX = "/api/auth/";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Strip basePath prefix to get the logical path
  const basePath = "/phniams";
  const logicalPath = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length) || "/"
    : pathname;

  // Allow public auth pages and auth API routes
  if (PUBLIC_PATHS.includes(logicalPath)) return NextResponse.next();
  if (logicalPath.startsWith(PUBLIC_API_PREFIX)) return NextResponse.next();

  // Allow Next.js internals
  if (
    logicalPath.startsWith("/_next") ||
    logicalPath.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;
  const isApiRoute = logicalPath.startsWith("/api/");

  if (!token) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL(`${basePath}/login`, req.url));
  }

  const user = await verifyToken(token);
  if (!user) {
    if (isApiRoute) {
      const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      res.cookies.delete("token");
      return res;
    }
    const res = NextResponse.redirect(new URL(`${basePath}/login`, req.url));
    res.cookies.delete("token");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
