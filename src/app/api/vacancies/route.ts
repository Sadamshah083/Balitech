import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { refreshPublicPages } from "@/lib/refresh-public-pages";
import {
  fallbackVacancies,
  listPublicVacancies,
  toAdminVacancy,
  toVacancyData,
} from "@/lib/careers/vacancies";

const VACANCY_EDITOR_ROLES = new Set(["admin", "manager"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (searchParams.get("public") === "true") {
    try {
      return NextResponse.json(await listPublicVacancies());
    } catch (error) {
      console.error("[api/vacancies] Database unavailable:", error);
      return NextResponse.json({ vacancies: fallbackVacancies, fallback: true });
    }
  }

  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const rows = await prisma.vacancy.findMany({
    orderBy: [{ order: "asc" }, { title: "asc" }],
  });
  return NextResponse.json({ vacancies: rows.map(toAdminVacancy) });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;
  if (!VACANCY_EDITOR_ROLES.has(auth.session.role)) {
    return NextResponse.json({ error: "Only admins and managers can edit vacancies." }, { status: 403 });
  }

  try {
    const parsed = toVacancyData(await request.json(), false);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const row = await prisma.vacancy.create({
      data: parsed.data as Parameters<typeof prisma.vacancy.create>[0]["data"],
    });
    refreshPublicPages();
    return NextResponse.json({ vacancy: toAdminVacancy(row) }, { status: 201 });
  } catch (error) {
    console.error("[api/vacancies] create failed:", error);
    return NextResponse.json({ error: "Failed to create vacancy" }, { status: 500 });
  }
}
