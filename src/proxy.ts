import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/jwt";

const ADMIN_LOGIN = "/admin/login";

function isAdminRoute(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isAdminLogin(pathname: string) {
  return pathname === ADMIN_LOGIN;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isAdminRoute(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (isAdminLogin(pathname)) {
    if (session) {
      return NextResponse.redirect(new URL("/admin/leads", request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL(ADMIN_LOGIN, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
