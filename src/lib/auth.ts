import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getJwtExpiresIn } from "@/lib/env";
import {
  AUTH_COOKIE_NAME,
  signSessionToken,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/jwt";

export {
  AUTH_COOKIE_NAME,
  getJwtExpiresIn,
  verifySessionToken,
  type SessionPayload,
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload) {
  return signSessionToken(payload);
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) {
    return null;
  }
  const token = header.slice(7).trim();
  return token || null;
}

/**
 * A static key for server-to-server integrations such as the CRM. Unlike a
 * login token it has no expiry; revoke it by changing or removing
 * CRM_API_TOKEN in the server's .env and restarting the app.
 */
const CRM_SESSION: SessionPayload = {
  adminId: "crm-integration",
  email: "crm-integration@balitech.org",
  role: "admin",
};

function isCrmApiToken(token: string) {
  const expected = process.env.CRM_API_TOKEN?.trim();
  if (!expected || expected.length < 32) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function getSessionFromRequest(
  request: Request
): Promise<SessionPayload | null> {
  const bearer = extractBearerToken(request);
  if (bearer && isCrmApiToken(bearer)) return CRM_SESSION;
  if (bearer) {
    const session = await verifySessionToken(bearer);
    if (session) return session;
  }

  return getSession();
}

export async function requireApiAuth(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, response: null };
}
