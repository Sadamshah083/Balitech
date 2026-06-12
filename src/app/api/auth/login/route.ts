import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  getJwtExpiresIn,
  setAuthCookie,
  verifyPassword,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { email: String(email).toLowerCase().trim() },
    });

    if (!admin || !(await verifyPassword(password, admin.password))) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = await createSessionToken({
      adminId: admin.id,
      email: admin.email,
    });
    await setAuthCookie(token);

    return NextResponse.json({
      admin: { id: admin.id, email: admin.email, name: admin.name },
      token,
      expiresIn: getJwtExpiresIn(),
    });
  } catch {
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
