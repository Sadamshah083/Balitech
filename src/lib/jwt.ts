import { SignJWT, jwtVerify } from "jose";
import {
  getJwtAudience,
  getJwtExpiresIn,
  getJwtIssuer,
  getJwtSecret,
} from "@/lib/env";

export const AUTH_COOKIE_NAME = "balitech_admin_token";

export type SessionPayload = {
  adminId: string;
  email: string;
};

function getSecretKey() {
  return new TextEncoder().encode(getJwtSecret());
}

export async function signSessionToken(payload: SessionPayload) {
  return new SignJWT({
    adminId: payload.adminId,
    email: payload.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.adminId)
    .setIssuer(getJwtIssuer())
    .setAudience(getJwtAudience())
    .setIssuedAt()
    .setExpirationTime(getJwtExpiresIn())
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: getJwtIssuer(),
      audience: getJwtAudience(),
    });

    const adminId =
      typeof payload.adminId === "string"
        ? payload.adminId
        : typeof payload.sub === "string"
          ? payload.sub
          : null;
    const email = typeof payload.email === "string" ? payload.email : null;

    if (!adminId || !email) {
      return null;
    }

    return { adminId, email };
  } catch {
    return null;
  }
}
