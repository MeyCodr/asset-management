import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];
const PUBLIC_API_PREFIX = "/api/auth/";
const BASE_PATH = "/phniams";

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline'`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const logicalPath = pathname.startsWith(BASE_PATH)
    ? pathname.slice(BASE_PATH.length) || "/"
    : pathname;

  const isApiRoute = logicalPath.startsWith("/api/");

  // Generate nonce for page routes only (CSP is irrelevant on API/JSON responses)
  const nonce = !isApiRoute ? Buffer.from(crypto.randomUUID()).toString("base64") : null;
  const csp = nonce ? buildCsp(nonce) : null;

  // Forward nonce to server components via request header
  const requestHeaders = new Headers(req.headers);
  if (nonce) requestHeaders.set("x-nonce", nonce);
  if (csp) requestHeaders.set("Content-Security-Policy", csp);

  function withCsp(response: NextResponse): NextResponse {
    if (csp) response.headers.set("Content-Security-Policy", csp);
    return response;
  }

  // Allow Next.js internals
  if (logicalPath.startsWith("/_next") || logicalPath.startsWith("/favicon")) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Allow public auth pages and auth API routes
  if (PUBLIC_PATHS.includes(logicalPath) || logicalPath.startsWith(PUBLIC_API_PREFIX)) {
    return withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  const token = req.cookies.get("token")?.value;

  if (!token) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL(`${BASE_PATH}/login`, req.url));
  }

  const user = await verifyToken(token);
  if (!user) {
    if (isApiRoute) {
      const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      res.cookies.delete("token");
      return res;
    }
    const res = NextResponse.redirect(new URL(`${BASE_PATH}/login`, req.url));
    res.cookies.delete("token");
    return res;
  }

  return withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
