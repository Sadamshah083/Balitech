import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  // Only admin has access to Settings/User management
  if (auth.session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const users = await prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plainPassword: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  if (auth.session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { name, email, password, role } = await request.json();

    if (!name?.trim() || !email?.trim() || !password?.trim() || !role?.trim()) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await prisma.admin.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email is already in use" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.admin.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        plainPassword: password,
        role: role.trim(),
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plainPassword: user.plainPassword,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create user" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  if (auth.session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id, name, email, password, role } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const cleanEmail = email ? email.toLowerCase().trim() : undefined;

    if (cleanEmail) {
      const existingUser = await prisma.admin.findFirst({
        where: { email: cleanEmail, NOT: { id } },
      });
      if (existingUser) {
        return NextResponse.json({ error: "Email is already in use" }, { status: 400 });
      }
    }

    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (cleanEmail !== undefined) data.email = cleanEmail;
    if (role !== undefined) data.role = role.trim();

    if (password && password.trim()) {
      data.password = await bcrypt.hash(password, 12);
      data.plainPassword = password;
    }

    const user = await prisma.admin.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plainPassword: user.plainPassword,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  if (auth.session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (id === auth.session.adminId) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    await prisma.admin.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete user" }, { status: 500 });
  }
}
