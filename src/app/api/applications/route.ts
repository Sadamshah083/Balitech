import { unlink } from "fs/promises";
import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveCvAbsolutePath, saveLeadCv } from "@/lib/cv-upload";
import { getPublicOffices } from "@/lib/offices";
import { withCampaignBranchList } from "@/lib/campaign-locations";
import {
  branchLabel,
  buildSummary,
  campaignChoices,
  coerceAnswers,
  coerceSource,
  formatPhone,
  hasKnownSource,
  isGeneralApplication,
  pruneAnswers,
  validateApplication,
  type ApplicationContext,
} from "@/lib/careers/application";
import {
  findOpenVacancy,
  isCampaignVacancyId,
  leadPositionTitle,
} from "@/lib/careers/vacancies";

const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DUPLICATE_WINDOW_DAYS = 180;
const CV_EXTENSIONS = new Set([".pdf", ".docx"]);

function newReferenceId() {
  const now = new Date();
  const date = [
    String(now.getFullYear()).slice(-2),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  let suffix = "";
  for (let i = 0; i < 5; i++) suffix += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)];
  return `BT-${date}-${suffix}`;
}

function parseJson(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isUniqueViolation(error: unknown, field: string) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }
  const target = error.meta?.target;
  const text = Array.isArray(target) ? target.join(",") : String(target ?? "");
  return text.includes(field);
}

const failed = () =>
  NextResponse.json(
    {
      error:
        "Your application could not be submitted. Please try again. Your entered details are still available.",
    },
    { status: 500 }
  );

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid application." }, { status: 400 });
  }

  const submissionKey = String(form.get("submissionKey") ?? "");
  if (!/^[\w-]{8,64}$/.test(submissionKey)) {
    return NextResponse.json({ error: "Invalid application." }, { status: 400 });
  }

  let savedCvPath: string | null = null;

  try {
    /* A retry after a lost response must not file the application twice. */
    const already = await prisma.lead.findUnique({
      where: { submissionKey },
      select: { referenceId: true },
    });
    if (already?.referenceId) {
      return NextResponse.json({ referenceId: already.referenceId });
    }

    const answers = coerceAnswers(parseJson(form.get("answers")));
    const source = coerceSource(parseJson(form.get("source")));
    const cvEntry = form.get("cv");
    const cvFile = cvEntry instanceof File && cvEntry.size > 0 ? cvEntry : null;

    const general = isGeneralApplication(answers);
    const vacancy = general || !answers.vacancyId ? null : await findOpenVacancy(answers.vacancyId);

    const [offices, campaignRows] = await Promise.all([
      getPublicOffices(),
      prisma.campaign.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: { title: true, location: true, locations: true },
      }),
    ]);
    const campaigns = campaignRows.map(withCampaignBranchList);

    const ctx: ApplicationContext = {
      vacancy,
      offices: offices.map((o) => ({ name: o.name, address: o.address })),
      campaigns: campaignChoices(campaigns, answers.branch),
      sourceKnown: hasKnownSource(source),
      cv: cvFile ? { name: cvFile.name, size: cvFile.size } : null,
    };

    const fieldErrors = validateApplication(answers, ctx);
    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        { error: "Please check the highlighted answers and try again.", fieldErrors },
        { status: 400 }
      );
    }

    let cvFileName: string | null = null;
    if (cvFile) {
      try {
        const saved = await saveLeadCv(cvFile, {
          extensions: CV_EXTENSIONS,
          typeError: "Upload your CV as a PDF or DOCX file.",
        });
        cvFileName = saved.cvFileName;
        savedCvPath = saved.cvPath;
      } catch (error) {
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Your CV could not be uploaded.",
            fieldErrors: { cv: error instanceof Error ? error.message : "Your CV could not be uploaded." },
          },
          { status: 400 }
        );
      }
    }

    const phone = formatPhone(answers.mobile);
    const email = answers.email.trim().toLowerCase();
    const since = new Date(Date.now() - DUPLICATE_WINDOW_DAYS * 86_400_000);
    const duplicates = await prisma.lead.findMany({
      where: {
        createdAt: { gte: since },
        OR: [{ phone }, ...(email ? [{ email }] : [])],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, referenceId: true, position: true, createdAt: true },
    });

    const flags: string[] = [];
    if (duplicates.length > 0) flags.push("possible-duplicate");
    if (answers.employeeHistory === "previous") flags.push("previous-employee");

    /* Former employment routes the application for HR review; it never rejects it. */
    const queue =
      answers.employeeHistory === "previous" ? "hr-employment-check" : "recruitment";

    const positionTitle = general
      ? "General application"
      : vacancy
        ? leadPositionTitle(vacancy)
        : null;
    const details = JSON.stringify({
      version: 1,
      answers: pruneAnswers(answers, ctx),
      summary: buildSummary(answers, ctx),
      vacancy: vacancy
        ? {
            id: vacancy.id,
            title: vacancy.title,
            department: vacancy.department,
            roleGroups: vacancy.roleGroups,
            campaign: vacancy.campaign,
            workingDays: vacancy.workingDays,
            workingHours: vacancy.workingHours,
            workArrangement: vacancy.workArrangement,
            cvRequired: vacancy.cvRequired,
          }
        : null,
      duplicates: duplicates.map((d) => ({
        id: d.id,
        referenceId: d.referenceId,
        position: d.position,
        createdAt: d.createdAt.toISOString(),
      })),
    });
    const sourceJson = JSON.stringify({
      ...source,
      heardAbout: ctx.sourceKnown ? "" : answers.heardAbout,
      heardAboutOther: ctx.sourceKnown ? "" : answers.heardAboutOther.trim(),
      referrer: ctx.sourceKnown ? "" : answers.referrerName.trim(),
    });

    for (let attempt = 0; attempt < 5; attempt++) {
      const referenceId = newReferenceId();
      try {
        await prisma.lead.create({
          data: {
            name: answers.fullName.trim(),
            email,
            phone,
            company: branchLabel(answers.branch),
            position: positionTitle,
            message: null,
            cvFileName,
            cvPath: savedCvPath,
            referenceId,
            submissionKey,
            vacancyId: vacancy && !isCampaignVacancyId(vacancy.id) ? vacancy.id : null,
            queue,
            flags: JSON.stringify(flags),
            details,
            source: sourceJson,
          },
        });
        return NextResponse.json({ referenceId }, { status: 201 });
      } catch (error) {
        if (isUniqueViolation(error, "referenceId")) continue;
        if (isUniqueViolation(error, "submissionKey")) {
          const existing = await prisma.lead.findUnique({
            where: { submissionKey },
            select: { referenceId: true },
          });
          if (savedCvPath) await unlink(resolveCvAbsolutePath(savedCvPath)).catch(() => {});
          if (existing?.referenceId) return NextResponse.json({ referenceId: existing.referenceId });
        }
        throw error;
      }
    }
    throw new Error("Could not allocate a reference number");
  } catch (error) {
    console.error("[api/applications] submit failed:", error);
    if (savedCvPath) await unlink(resolveCvAbsolutePath(savedCvPath)).catch(() => {});
    return failed();
  }
}
