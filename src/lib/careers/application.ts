/**
 * The careers application: which questions apply, how answers are checked, and
 * how they read back. The form and the API both run this, so a question hidden
 * in the browser can never block a submission on the server, and the review
 * step shows exactly what HR will see.
 */
import {
  ANY_BRANCH,
  ANY_BRANCH_LABEL,
  CV_EXTENSIONS,
  CV_MAX_BYTES,
  EMPLOYEE_HISTORY_OPTIONS,
  EMPLOYMENT_END_OPTIONS,
  ENGLISH_OPTIONS,
  EXPERIENCE_OPTIONS,
  GENERAL_APPLICATION,
  GENERAL_APPLICATION_LABEL,
  HEARD_ABOUT_OPTIONS,
  HR_TASK_OPTIONS,
  JOIN_OPTIONS,
  OPEN_CAMPAIGN,
  OPEN_CAMPAIGN_LABEL,
  QUALIFICATION_OPTIONS,
  REMOTE_BRANCH,
  REMOTE_BRANCH_LABEL,
  SCHEDULE_OPTIONS,
  TEXT_LIMIT,
  departmentLabel,
  isMedicalBillingCampaign,
  optionLabel,
  type Option,
  type RoleGroup,
} from "./catalog";

export type PublicVacancy = {
  id: string;
  title: string;
  department: string;
  roleGroups: RoleGroup[];
  /** Office names. Empty means every branch. */
  branches: string[];
  remoteAllowed: boolean;
  campaign: string | null;
  workingDays: string | null;
  workingHours: string | null;
  workArrangement: string | null;
  cvRequired: boolean;
  customQuestion: string | null;
  description: string | null;
};

export type BranchInfo = { name: string; address?: string | null };

export type PhoneValue = { code: string; number: string };

export type ApplicationAnswers = {
  fullName: string;
  mobile: PhoneValue;
  whatsappSame: boolean;
  whatsapp: PhoneValue;
  email: string;
  city: string;
  locality: string;
  qualification: string;
  employeeHistory: string;
  formerBranch: string;
  formerBranchOther: string;
  formerPosition: string;
  employeeId: string;
  lastWorkedMonth: string;
  lastWorkedUnknown: boolean;
  employmentEnd: string;
  employmentEndNote: string;

  vacancyId: string;
  branch: string;
  experience: string;
  recentRole: string;
  scheduleFit: string;
  availabilityNote: string;
  joinTiming: string;
  earliestDate: string;
  salary: string;
  salaryOpen: boolean;
  campaignInterest: string;
  campaignsWorked: string[];
  campaignsWorkedOther: string;
  englishLevel: string;
  supervisedCount: string;
  teamIssue: string;
  hrTasks: string[];
  hrTasksOther: string;
  itTools: string;
  creativeSkills: string;
  portfolioUrl: string;
  specialistSkills: string;
  anythingElse: string;

  heardAbout: string;
  heardAboutOther: string;
  referrerName: string;
  confirmAccurate: boolean;
  consentRecruitment: boolean;
  futureOpenings: boolean;
};

export type FieldKey = keyof ApplicationAnswers | "cv";

export const emptyAnswers: ApplicationAnswers = {
  fullName: "",
  mobile: { code: "+92", number: "" },
  whatsappSame: true,
  whatsapp: { code: "+92", number: "" },
  email: "",
  city: "",
  locality: "",
  qualification: "",
  employeeHistory: "",
  formerBranch: "",
  formerBranchOther: "",
  formerPosition: "",
  employeeId: "",
  lastWorkedMonth: "",
  lastWorkedUnknown: false,
  employmentEnd: "",
  employmentEndNote: "",
  vacancyId: "",
  branch: "",
  experience: "",
  recentRole: "",
  scheduleFit: "",
  availabilityNote: "",
  joinTiming: "",
  earliestDate: "",
  salary: "",
  salaryOpen: false,
  campaignInterest: "",
  campaignsWorked: [],
  campaignsWorkedOther: "",
  englishLevel: "",
  supervisedCount: "",
  teamIssue: "",
  hrTasks: [],
  hrTasksOther: "",
  itTools: "",
  creativeSkills: "",
  portfolioUrl: "",
  specialistSkills: "",
  anythingElse: "",
  heardAbout: "",
  heardAboutOther: "",
  referrerName: "",
  confirmAccurate: false,
  consentRecruitment: false,
  futureOpenings: false,
};

export type ApplicationContext = {
  /** null for a general application or while nothing is chosen. */
  vacancy: PublicVacancy | null;
  /** Every branch that exists, used for general applications and former staff. */
  offices: BranchInfo[];
  /** Published campaign titles, already narrowed to the chosen branch. */
  campaigns: string[];
  /** True when the ad link told us where the applicant came from. */
  sourceKnown: boolean;
  cv: { name: string; size: number } | null;
};

export const STEPS = [
  "Your Details",
  "Role and Availability",
  "Review and Submit",
] as const;

export const QUESTIONS = {
  recentRole:
    "Tell us about your most recent relevant role, including your job title, employer and how long you worked there.",
  formerBranch: "Which branch did you work at?",
  formerPosition: "What was your position?",
  lastWorked: "When did you last work here?",
  employmentEnd: "How did your employment end?",
  availabilityNote: "What availability should we consider?",
  campaignInterest: "Which campaign or project are you interested in?",
  campaignsWorked: "Which campaigns have you worked on?",
  englishLevel: "How comfortable are you communicating in English?",
  supervisedCount: "How many people have you directly supervised?",
  teamIssue:
    "Describe one team performance issue you helped resolve and the result.",
  hrTasks: "Which HR or recruitment tasks have you handled?",
  itTools: "Which systems, dialers or technical support tools have you used?",
  creativeSkills: "Which tools or skills are most relevant to this role?",
  portfolioUrl: "Portfolio link",
  specialistSkills: "Which skills or tasks best match this position?",
  heardAbout: "How did you hear about this opportunity?",
  referrerName: "Referring employee's name",
} as const;

const STEP_FIELDS: FieldKey[][] = [
  [
    "fullName",
    "mobile",
    "whatsapp",
    "email",
    "city",
    "locality",
    "qualification",
    "employeeHistory",
    "formerBranch",
    "formerBranchOther",
    "formerPosition",
    "employeeId",
    "lastWorkedMonth",
    "employmentEnd",
    "employmentEndNote",
  ],
  [
    "vacancyId",
    "branch",
    "experience",
    "recentRole",
    "scheduleFit",
    "availabilityNote",
    "joinTiming",
    "earliestDate",
    "salary",
    "campaignInterest",
    "campaignsWorked",
    "campaignsWorkedOther",
    "englishLevel",
    "supervisedCount",
    "teamIssue",
    "hrTasks",
    "hrTasksOther",
    "itTools",
    "creativeSkills",
    "portfolioUrl",
    "specialistSkills",
    "cv",
    "anythingElse",
  ],
  [
    "heardAbout",
    "heardAboutOther",
    "referrerName",
    "confirmAccurate",
    "consentRecruitment",
    "futureOpenings",
  ],
];

export function stepOfField(field: FieldKey) {
  const index = STEP_FIELDS.findIndex((fields) => fields.includes(field));
  return index === -1 ? 0 : index;
}

export function isGeneralApplication(answers: ApplicationAnswers) {
  return answers.vacancyId === GENERAL_APPLICATION;
}

export function hasExperience(answers: ApplicationAnswers) {
  return Boolean(answers.experience) && answers.experience !== "none";
}

export function isFormerEmployee(answers: ApplicationAnswers) {
  return answers.employeeHistory === "previous";
}

/** Branch choices for the chosen role, as stored values. */
export function branchChoices(
  vacancy: PublicVacancy | null,
  offices: BranchInfo[],
  general: boolean
): Option[] {
  const names =
    general || !vacancy || vacancy.branches.length === 0
      ? offices.map((o) => o.name)
      : vacancy.branches;

  const options: Option[] = names.map((name) => ({ value: name, label: name }));
  if (!general && vacancy?.remoteAllowed) {
    options.push({ value: REMOTE_BRANCH, label: REMOTE_BRANCH_LABEL });
  }
  return options;
}

/**
 * Campaigns to offer for the chosen branch. "Any" and "Remote" see them all,
 * and so does a branch with none of its own, rather than an empty list.
 */
export function campaignChoices(
  campaigns: { title: string; locations: string[] }[],
  branch: string
): string[] {
  const all = campaigns.map((c) => c.title);
  if (!branch || branch === ANY_BRANCH || branch === REMOTE_BRANCH) return all;
  const here = campaigns.filter((c) => c.locations.includes(branch)).map((c) => c.title);
  return here.length > 0 ? here : all;
}

export function branchLabel(value: string) {
  if (value === ANY_BRANCH) return ANY_BRANCH_LABEL;
  if (value === REMOTE_BRANCH) return REMOTE_BRANCH_LABEL;
  return value;
}

/**
 * Which conditional questions are on screen. Role-group questions are deferred
 * for general applications, and a role in several groups gets each question
 * once: the generic skills question is dropped when a creative or IT question
 * already asks it, unless HR wrote a vacancy-specific one.
 */
export function getVisibility(
  answers: ApplicationAnswers,
  ctx: Pick<ApplicationContext, "vacancy" | "sourceKnown">
) {
  const general = isGeneralApplication(answers);
  const groups = new Set<RoleGroup>(
    !general && ctx.vacancy ? ctx.vacancy.roleGroups : []
  );
  const experienced = hasExperience(answers);
  const employee = isFormerEmployee(answers);
  const previous = answers.employeeHistory === "previous";

  return {
    general,
    groups,
    whatsapp: !answers.whatsappSame,
    recentRole: experienced,
    employee,
    formerBranchOther: employee && answers.formerBranch === "other",
    previous,
    scheduleFit: !general && Boolean(ctx.vacancy),
    availabilityNote: false,
    earliestDate: answers.joinTiming === "30d+",
    campaignInterest: groups.has("campaign") && !ctx.vacancy?.campaign,
    campaignsWorked: groups.has("campaign") && experienced,
    campaignsWorkedOther:
      groups.has("campaign") &&
      experienced &&
      answers.campaignsWorked.includes("other"),
    english: groups.has("english"),
    leadership: groups.has("leadership"),
    hr: groups.has("hr"),
    hrTasksOther: groups.has("hr") && answers.hrTasks.includes("other"),
    it: groups.has("it"),
    creative: groups.has("creative"),
    specialist:
      Boolean(ctx.vacancy?.customQuestion?.trim()) && !general
        ? true
        : groups.has("specialist") && !groups.has("creative") && !groups.has("it"),
    heardAbout: !ctx.sourceKnown,
    heardAboutOther: !ctx.sourceKnown && answers.heardAbout === "other",
    referrerName: !ctx.sourceKnown && answers.heardAbout === "referral",
    cvRequired: !general && Boolean(ctx.vacancy?.cvRequired),
  };
}

export type Visibility = ReturnType<typeof getVisibility>;

export function experienceQuestion(general: boolean, vacancy?: PublicVacancy | null) {
  if (general) return "How much total work experience do you have?";
  if (isMedicalBillingCampaign(vacancy?.campaign)) {
    return "How much previous experience do you have in the US Medical Billing industry?";
  }
  return "How much relevant experience do you have for this role?";
}

export function specialistQuestion(vacancy: PublicVacancy | null) {
  return vacancy?.customQuestion?.trim() || QUESTIONS.specialistSkills;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function phoneDigits(phone: PhoneValue) {
  let digits = phone.number.replace(/\D/g, "");
  if (phone.code === "+92") {
    if (digits.startsWith("92") && digits.length === 12) digits = digits.slice(2);
    if (digits.startsWith("0")) digits = digits.slice(1);
  }
  return digits;
}

export function isValidPhone(phone: PhoneValue) {
  if (!/^\+\d{1,4}$/.test(phone.code)) return false;
  const digits = phoneDigits(phone);
  if (phone.code === "+92") return /^3\d{9}$/.test(digits);
  return digits.length >= 6 && digits.length <= 14;
}

export function formatPhone(phone: PhoneValue) {
  return `${phone.code} ${phoneDigits(phone)}`;
}

function todayIso() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function inOptions(options: Option[], value: string) {
  return options.some((o) => o.value === value);
}

function cvExtension(name: string) {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

export function describeCvRequirement(required: boolean) {
  return required
    ? "A CV is required for this vacancy. Upload a PDF or DOCX file up to 5 MB."
    : "A CV is optional. You may upload a PDF or DOCX file up to 5 MB.";
}

/**
 * Checks only what is visible. Returns a message per invalid field; the
 * `step` argument limits the check to one step of the form.
 */
export function validateApplication(
  answers: ApplicationAnswers,
  ctx: ApplicationContext,
  step?: number
): Partial<Record<FieldKey, string>> {
  const errors: Partial<Record<FieldKey, string>> = {};
  const v = getVisibility(answers, ctx);
  const set = (field: FieldKey, message: string) => {
    if (step === undefined || stepOfField(field) === step) errors[field] = message;
  };
  const requireText = (field: FieldKey, value: string, message: string, max = TEXT_LIMIT) => {
    const trimmed = value.trim();
    if (!trimmed) set(field, message);
    else if (trimmed.length > max) set(field, `Keep this to ${max} characters or fewer.`);
  };
  const limitText = (field: FieldKey, value: string, max = TEXT_LIMIT) => {
    if (value.trim().length > max) set(field, `Keep this to ${max} characters or fewer.`);
  };
  const requireOption = (field: FieldKey, options: Option[], value: string, message: string) => {
    if (!inOptions(options, value)) set(field, message);
  };

  requireText("fullName", answers.fullName, "Enter your full name.", 120);
  if (!answers.mobile.number.trim()) set("mobile", "Enter your mobile number.");
  else if (!isValidPhone(answers.mobile))
    set("mobile", "Enter a valid mobile number for the selected country code.");
  if (v.whatsapp && answers.whatsapp.number.trim() && !isValidPhone(answers.whatsapp)) {
    set("whatsapp", "Enter a valid WhatsApp number or leave it blank.");
  }
  if (!answers.email.trim()) {
    set("email", "Enter your email address.");
  } else if (!EMAIL_RE.test(answers.email.trim())) {
    set("email", "Enter a valid email address.");
  }
  requireText("city", answers.city, "Enter your current city.", 80);
  requireText("locality", answers.locality, "Enter your area or locality.", 80);
  if (answers.qualification && !inOptions(QUALIFICATION_OPTIONS, answers.qualification)) {
    set("qualification", "Choose a qualification from the list.");
  }
  requireOption(
    "employeeHistory",
    EMPLOYEE_HISTORY_OPTIONS,
    answers.employeeHistory,
    "Tell us whether you have worked for Balitech."
  );
  if (v.employee) {
    const branchValues = [...ctx.offices.map((o) => o.name), "other"];
    if (!branchValues.includes(answers.formerBranch)) {
      set("formerBranch", "Choose the branch you worked at.");
    }
    if (v.formerBranchOther) {
      requireText("formerBranchOther", answers.formerBranchOther, "Enter the branch name.", 120);
    }
    requireText("formerPosition", answers.formerPosition, "Enter your position.", 120);
    limitText("employeeId", answers.employeeId, 40);
  }
  if (v.previous) {
    if (!answers.lastWorkedUnknown) {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(answers.lastWorkedMonth)) {
        set("lastWorkedMonth", "Choose the month and year, or tick “I do not remember”.");
      } else if (answers.lastWorkedMonth > todayIso().slice(0, 7)) {
        set("lastWorkedMonth", "This date cannot be in the future.");
      }
    }
    requireOption(
      "employmentEnd",
      EMPLOYMENT_END_OPTIONS,
      answers.employmentEnd,
      "Tell us how your employment ended."
    );
    limitText("employmentEndNote", answers.employmentEndNote);
  }

  if (!answers.vacancyId) set("vacancyId", "Choose the position you are applying for.");
  else if (!v.general && !ctx.vacancy)
    set("vacancyId", "This position is no longer open. Choose another position.");

  if (answers.vacancyId && (v.general || ctx.vacancy)) {
    const choices = branchChoices(ctx.vacancy, ctx.offices, v.general);
    if (!inOptions(choices, answers.branch)) set("branch", "Choose a branch.");
  }

  requireOption(
    "experience",
    EXPERIENCE_OPTIONS,
    answers.experience,
    "Choose your experience."
  );
  if (v.recentRole) {
    requireText("recentRole", answers.recentRole, "Tell us about your most recent relevant role.");
  }

  if (v.scheduleFit) {
    requireOption(
      "scheduleFit",
      SCHEDULE_OPTIONS,
      answers.scheduleFit,
      "Tell us whether you can work this schedule."
    );
    if (v.availabilityNote) {
      requireText("availabilityNote", answers.availabilityNote, "Tell us what availability we should consider.");
    }
  }

  requireOption("joinTiming", JOIN_OPTIONS, answers.joinTiming, "Tell us when you can join.");
  if (v.earliestDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(answers.earliestDate)) {
      set("earliestDate", "Choose your earliest available date.");
    } else if (answers.earliestDate < todayIso()) {
      set("earliestDate", "This date cannot be in the past.");
    }
  }

  if (!answers.salaryOpen && answers.salary.trim()) {
    const amount = Number(answers.salary.replace(/,/g, ""));
    if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000 || !Number.isInteger(amount)) {
      set("salary", "Enter a whole amount in PKR, or choose “Open to discussion”.");
    }
  }

  if (v.campaignInterest) {
    const allowed = [...ctx.campaigns, OPEN_CAMPAIGN];
    if (!allowed.includes(answers.campaignInterest)) {
      set("campaignInterest", "Choose a campaign or “Open to a suitable campaign”.");
    }
  }
  if (v.campaignsWorked && answers.campaignsWorked.length === 0) {
    set("campaignsWorked", "Choose at least one campaign, or Other.");
  }
  if (v.campaignsWorkedOther) {
    requireText("campaignsWorkedOther", answers.campaignsWorkedOther, "Enter the other campaigns.", 120);
  }
  if (v.english) {
    requireOption("englishLevel", ENGLISH_OPTIONS, answers.englishLevel, "Choose your English level.");
  }
  if (v.leadership) {
    const count = answers.supervisedCount.trim();
    if (!/^\d{1,5}$/.test(count)) set("supervisedCount", "Enter a number (0 is allowed).");
    requireText("teamIssue", answers.teamIssue, "Describe one team performance issue you helped resolve.");
  }
  if (v.hr) {
    const valid = answers.hrTasks.filter((t) => inOptions(HR_TASK_OPTIONS, t));
    if (valid.length === 0) set("hrTasks", "Choose at least one option.");
    if (v.hrTasksOther) requireText("hrTasksOther", answers.hrTasksOther, "Enter the other tasks.", 120);
  }
  if (v.it) requireText("itTools", answers.itTools, "Tell us which systems or tools you have used.");
  if (v.creative) {
    requireText("creativeSkills", answers.creativeSkills, "Tell us which tools or skills are most relevant.");
    if (answers.portfolioUrl.trim() && !isHttpUrl(answers.portfolioUrl.trim())) {
      set("portfolioUrl", "Enter a full link starting with https://, or leave it blank.");
    }
  }
  if (v.specialist) {
    requireText("specialistSkills", answers.specialistSkills, "Please answer this question.");
  }

  if (ctx.cv) {
    if (!CV_EXTENSIONS.includes(cvExtension(ctx.cv.name))) {
      set("cv", "Upload your CV as a PDF or DOCX file.");
    } else if (ctx.cv.size > CV_MAX_BYTES) {
      set("cv", "Your CV must be 5 MB or smaller.");
    }
  } else if (v.cvRequired) {
    set("cv", "Upload your CV. It is required for this vacancy.");
  }

  limitText("anythingElse", answers.anythingElse);

  if (v.heardAbout) {
    if (answers.heardAbout && !inOptions(HEARD_ABOUT_OPTIONS, answers.heardAbout)) {
      set("heardAbout", "Choose an option from the list.");
    }
    limitText("heardAboutOther", answers.heardAboutOther, 120);
    limitText("referrerName", answers.referrerName, 120);
  }

  if (!answers.confirmAccurate) set("confirmAccurate", "Please confirm your information is accurate.");
  if (!answers.consentRecruitment)
    set("consentRecruitment", "Please agree to how Balitech will use your application.");

  return errors;
}

/** Only the answers to questions that were on screen, trimmed. */
export function pruneAnswers(answers: ApplicationAnswers, ctx: ApplicationContext) {
  const v = getVisibility(answers, ctx);
  const t = (value: string) => value.trim();
  const out: Record<string, unknown> = {
    fullName: t(answers.fullName),
    mobile: formatPhone(answers.mobile),
    whatsappSame: answers.whatsappSame,
    email: t(answers.email).toLowerCase(),
    city: t(answers.city),
    locality: t(answers.locality),
    qualification: answers.qualification,
    employeeHistory: answers.employeeHistory,
    vacancyId: answers.vacancyId,
    branch: answers.branch,
    experience: answers.experience,
    joinTiming: answers.joinTiming,
    salary: answers.salaryOpen ? "" : t(answers.salary).replace(/,/g, ""),
    salaryOpen: answers.salaryOpen,
    anythingElse: t(answers.anythingElse),
    confirmAccurate: answers.confirmAccurate,
    consentRecruitment: answers.consentRecruitment,
    futureOpenings: answers.futureOpenings,
  };
  if (v.whatsapp && answers.whatsapp.number.trim()) out.whatsapp = formatPhone(answers.whatsapp);
  if (v.employee) {
    out.formerBranch = answers.formerBranch;
    if (v.formerBranchOther) out.formerBranchOther = t(answers.formerBranchOther);
    out.formerPosition = t(answers.formerPosition);
    out.employeeId = t(answers.employeeId);
  }
  if (v.previous) {
    out.lastWorkedMonth = answers.lastWorkedUnknown ? "" : answers.lastWorkedMonth;
    out.lastWorkedUnknown = answers.lastWorkedUnknown;
    out.employmentEnd = answers.employmentEnd;
    out.employmentEndNote = t(answers.employmentEndNote);
  }
  if (v.recentRole) out.recentRole = t(answers.recentRole);
  if (v.scheduleFit) out.scheduleFit = answers.scheduleFit;
  if (v.availabilityNote) out.availabilityNote = t(answers.availabilityNote);
  if (v.earliestDate) out.earliestDate = answers.earliestDate;
  if (v.campaignInterest) out.campaignInterest = answers.campaignInterest;
  if (v.campaignsWorked) out.campaignsWorked = answers.campaignsWorked;
  if (v.campaignsWorkedOther) out.campaignsWorkedOther = t(answers.campaignsWorkedOther);
  if (v.english) out.englishLevel = answers.englishLevel;
  if (v.leadership) {
    out.supervisedCount = Number(answers.supervisedCount.trim());
    out.teamIssue = t(answers.teamIssue);
  }
  if (v.hr) {
    out.hrTasks = answers.hrTasks;
    if (v.hrTasksOther) out.hrTasksOther = t(answers.hrTasksOther);
  }
  if (v.it) out.itTools = t(answers.itTools);
  if (v.creative) {
    out.creativeSkills = t(answers.creativeSkills);
    out.portfolioUrl = t(answers.portfolioUrl);
  }
  if (v.specialist) out.specialistSkills = t(answers.specialistSkills);
  if (v.heardAbout) {
    out.heardAbout = answers.heardAbout;
    if (v.heardAboutOther) out.heardAboutOther = t(answers.heardAboutOther);
    if (v.referrerName) out.referrerName = t(answers.referrerName);
  }
  return out;
}

export type SummaryItem = { label: string; value: string };
export type SummarySection = { title: string; step: number; items: SummaryItem[] };

function monthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return value;
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

function listLabels(options: Option[], values: string[], other?: string) {
  return values
    .map((value) =>
      value === "other" && other?.trim() ? `Other: ${other.trim()}` : optionLabel(options, value)
    )
    .join(", ");
}

export function vacancyLabel(answers: ApplicationAnswers, vacancy: PublicVacancy | null) {
  if (isGeneralApplication(answers)) return "General application";
  if (!vacancy) return "";
  return vacancy.campaign && vacancy.campaign !== vacancy.title
    ? `${vacancy.campaign} — ${vacancy.title}`
    : vacancy.title;
}

/** The application as HR reads it. Only visible questions are included. */
export function buildSummary(
  answers: ApplicationAnswers,
  ctx: ApplicationContext
): SummarySection[] {
  const v = getVisibility(answers, ctx);
  const vacancy = ctx.vacancy;
  const add = (items: SummaryItem[], label: string, value: string | undefined | null) => {
    const text = value?.toString().trim();
    items.push({ label, value: text ? text : "—" });
  };

  const details: SummaryItem[] = [];
  add(details, "Full name", answers.fullName);
  add(details, "Mobile number", answers.mobile.number.trim() ? formatPhone(answers.mobile) : "");
  add(
    details,
    "WhatsApp",
    answers.whatsappSame
      ? "Same as mobile number"
      : answers.whatsapp.number.trim()
        ? formatPhone(answers.whatsapp)
        : "Not provided"
  );
  add(details, "Email", answers.email || "Not provided");
  add(details, "City and area", [answers.city.trim(), answers.locality.trim()].filter(Boolean).join(", "));
  add(details, "Highest qualification", optionLabel(QUALIFICATION_OPTIONS, answers.qualification) || "Not provided");
  add(details, "Worked for Balitech", optionLabel(EMPLOYEE_HISTORY_OPTIONS, answers.employeeHistory));
  if (v.employee) {
    add(
      details,
      QUESTIONS.formerBranch,
      answers.formerBranch === "other" ? `Other: ${answers.formerBranchOther}` : answers.formerBranch
    );
    add(details, QUESTIONS.formerPosition, answers.formerPosition);
    add(details, "Employee ID", answers.employeeId || "Not provided");
  }
  if (v.previous) {
    add(
      details,
      QUESTIONS.lastWorked,
      answers.lastWorkedUnknown ? "I do not remember" : monthLabel(answers.lastWorkedMonth)
    );
    add(details, QUESTIONS.employmentEnd, optionLabel(EMPLOYMENT_END_OPTIONS, answers.employmentEnd));
    if (answers.employmentEndNote.trim()) add(details, "Explanation", answers.employmentEndNote);
  }

  const role: SummaryItem[] = [];
  add(role, "Position", v.general ? GENERAL_APPLICATION_LABEL : vacancyLabel(answers, vacancy));
  if (vacancy && !v.general) add(role, "Department", departmentLabel(vacancy.department));
  add(role, "Branch preference", branchLabel(answers.branch));
  add(
    role,
    experienceQuestion(v.general, ctx.vacancy),
    optionLabel(EXPERIENCE_OPTIONS, answers.experience)
  );
  if (v.recentRole) add(role, "Most recent relevant role", answers.recentRole);
  if (v.scheduleFit) add(role, "Can work this schedule", optionLabel(SCHEDULE_OPTIONS, answers.scheduleFit));
  if (v.availabilityNote) add(role, QUESTIONS.availabilityNote, answers.availabilityNote);
  add(role, "Available to join", optionLabel(JOIN_OPTIONS, answers.joinTiming));
  if (v.earliestDate) add(role, "Earliest available date", answers.earliestDate);
  add(
    role,
    "Expected monthly basic salary",
    answers.salaryOpen
      ? "Open to discussion"
      : answers.salary.trim()
        ? `PKR ${Number(answers.salary.replace(/,/g, "")).toLocaleString("en-US")}`
        : "Not provided"
  );
  if (v.campaignInterest) {
    add(
      role,
      QUESTIONS.campaignInterest,
      answers.campaignInterest === OPEN_CAMPAIGN ? OPEN_CAMPAIGN_LABEL : answers.campaignInterest
    );
  }
  if (vacancy?.campaign && !v.general) add(role, "Campaign", vacancy.campaign);
  if (v.campaignsWorked) {
    add(
      role,
      QUESTIONS.campaignsWorked,
      answers.campaignsWorked
        .map((c) => (c === "other" ? `Other: ${answers.campaignsWorkedOther.trim()}` : c))
        .join(", ")
    );
  }
  if (v.english) add(role, QUESTIONS.englishLevel, optionLabel(ENGLISH_OPTIONS, answers.englishLevel));
  if (v.leadership) {
    add(role, QUESTIONS.supervisedCount, answers.supervisedCount);
    add(role, QUESTIONS.teamIssue, answers.teamIssue);
  }
  if (v.hr) add(role, QUESTIONS.hrTasks, listLabels(HR_TASK_OPTIONS, answers.hrTasks, answers.hrTasksOther));
  if (v.it) add(role, QUESTIONS.itTools, answers.itTools);
  if (v.creative) {
    add(role, QUESTIONS.creativeSkills, answers.creativeSkills);
    add(role, QUESTIONS.portfolioUrl, answers.portfolioUrl || "Not provided");
  }
  if (v.specialist) add(role, specialistQuestion(vacancy), answers.specialistSkills);
  add(role, "CV", ctx.cv ? ctx.cv.name : "Not uploaded");
  add(role, "Anything else", answers.anythingElse || "Nothing added");

  return [
    { title: STEPS[0], step: 0, items: details },
    { title: STEPS[1], step: 1, items: role },
  ];
}

/**
 * Reads untrusted JSON into the answers shape, so every later step can rely on
 * the field types regardless of what was posted.
 */
export function coerceAnswers(input: unknown): ApplicationAnswers {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const str = (key: keyof ApplicationAnswers, max = 2000) =>
    typeof src[key] === "string" ? (src[key] as string).slice(0, max) : "";
  const bool = (key: keyof ApplicationAnswers) => src[key] === true;
  const list = (key: keyof ApplicationAnswers) =>
    Array.isArray(src[key])
      ? (src[key] as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 30)
      : [];
  const phone = (key: keyof ApplicationAnswers): PhoneValue => {
    const value = (src[key] && typeof src[key] === "object" ? src[key] : {}) as Record<string, unknown>;
    return {
      code: typeof value.code === "string" ? value.code.slice(0, 5) : "+92",
      number: typeof value.number === "string" ? value.number.slice(0, 30) : "",
    };
  };

  return {
    fullName: str("fullName"),
    mobile: phone("mobile"),
    whatsappSame: src.whatsappSame !== false,
    whatsapp: phone("whatsapp"),
    email: str("email", 200),
    city: str("city"),
    locality: str("locality"),
    qualification: str("qualification"),
    employeeHistory: str("employeeHistory"),
    formerBranch: str("formerBranch"),
    formerBranchOther: str("formerBranchOther"),
    formerPosition: str("formerPosition"),
    employeeId: str("employeeId"),
    lastWorkedMonth: str("lastWorkedMonth", 7),
    lastWorkedUnknown: bool("lastWorkedUnknown"),
    employmentEnd: str("employmentEnd"),
    employmentEndNote: str("employmentEndNote"),
    vacancyId: str("vacancyId", 64),
    branch: str("branch"),
    experience: str("experience"),
    recentRole: str("recentRole"),
    scheduleFit: str("scheduleFit"),
    availabilityNote: str("availabilityNote"),
    joinTiming: str("joinTiming"),
    earliestDate: str("earliestDate", 10),
    salary: str("salary", 20),
    salaryOpen: bool("salaryOpen"),
    campaignInterest: str("campaignInterest"),
    campaignsWorked: list("campaignsWorked"),
    campaignsWorkedOther: str("campaignsWorkedOther"),
    englishLevel: str("englishLevel"),
    supervisedCount: str("supervisedCount", 10),
    teamIssue: str("teamIssue"),
    hrTasks: list("hrTasks"),
    hrTasksOther: str("hrTasksOther"),
    itTools: str("itTools"),
    creativeSkills: str("creativeSkills"),
    portfolioUrl: str("portfolioUrl", 500),
    specialistSkills: str("specialistSkills"),
    anythingElse: str("anythingElse"),
    heardAbout: str("heardAbout"),
    heardAboutOther: str("heardAboutOther"),
    referrerName: str("referrerName"),
    confirmAccurate: bool("confirmAccurate"),
    consentRecruitment: bool("consentRecruitment"),
    futureOpenings: bool("futureOpenings"),
  };
}

export type ApplicationSource = {
  channel: string;
  campaign: string;
  adId: string;
  medium: string;
  landing: string;
};

export function hasKnownSource(source: ApplicationSource) {
  return Boolean(source.channel.trim());
}

/** Reads ad-link parameters. `utm_*` and short names are both accepted. */
export function readSource(search: string): ApplicationSource {
  const params = new URLSearchParams(search);
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = params.get(key)?.trim();
      if (value) return value.slice(0, 120);
    }
    return "";
  };
  const channel =
    pick("source", "utm_source", "channel", "src") ||
    (params.get("fbclid") ? "facebook" : params.get("gclid") ? "google" : "");
  return {
    channel,
    campaign: pick("utm_campaign", "ad_campaign"),
    adId: pick("ad_id", "adid", "utm_content", "ad"),
    medium: pick("utm_medium", "medium"),
    landing: "",
  };
}

export function coerceSource(input: unknown): ApplicationSource {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const s = (key: string, max = 120) =>
    typeof src[key] === "string" ? (src[key] as string).trim().slice(0, max) : "";
  return {
    channel: s("channel"),
    campaign: s("campaign"),
    adId: s("adId", 200),
    medium: s("medium"),
    landing: s("landing", 300),
  };
}
