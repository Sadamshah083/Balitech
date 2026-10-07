/**
 * Everything the careers form offers as a fixed choice. Shared by the public
 * form, the application API and the admin vacancy editor, so a label changed
 * here reads the same in all three.
 */

export type Option = { value: string; label: string };

export const ROLE_GROUPS = [
  { value: "campaign", label: "Agents, verifiers and closers" },
  { value: "english", label: "Spoken English" },
  { value: "leadership", label: "Leadership" },
  { value: "hr", label: "HR" },
  { value: "it", label: "IT and dialer" },
  { value: "creative", label: "Creative, marketing and development" },
  { value: "specialist", label: "Other specialist and support" },
] as const;

export type RoleGroup = (typeof ROLE_GROUPS)[number]["value"];

export const ROLE_GROUP_VALUES = ROLE_GROUPS.map((g) => g.value) as RoleGroup[];

export function isRoleGroup(value: unknown): value is RoleGroup {
  return ROLE_GROUP_VALUES.includes(value as RoleGroup);
}

export type Department = {
  value: string;
  label: string;
  positions: { title: string; groups: RoleGroup[]; cvRequired?: boolean }[];
};

/**
 * The positions HR can open, with the question groups each one normally needs.
 * The groups are only a starting point: HR can change them per vacancy.
 */
export const DEPARTMENTS: Department[] = [
  {
    value: "operations",
    label: "Operations",
    positions: [
      { title: "Verifier", groups: ["campaign", "english"] },
      { title: "Self Verifier", groups: ["campaign", "english"] },
      { title: "Closer", groups: ["campaign", "english"] },
      { title: "Team Lead", groups: ["leadership", "campaign", "english"], cvRequired: true },
      { title: "Floor Manager", groups: ["leadership", "english"], cvRequired: true },
      { title: "Project Manager", groups: ["leadership", "english"], cvRequired: true },
      { title: "Operations Manager", groups: ["leadership", "english"], cvRequired: true },
      { title: "Operations Manager or HOD", groups: ["leadership", "english"], cvRequired: true },
    ],
  },
  {
    value: "medical-billing",
    label: "Medical Billing",
    positions: [
      { title: "Business Development Department", groups: ["specialist", "english"] },
      { title: "Billing and AR Department", groups: ["specialist", "english"] },
      { title: "Coding Department", groups: ["specialist", "english"] },
      { title: "QA and Reporting Department", groups: ["specialist", "english"] },
      { title: "Management", groups: ["leadership", "specialist", "english"] },
    ],
  },
  {
    value: "quality",
    label: "Quality and training",
    positions: [
      { title: "QA Executive", groups: ["specialist", "english"] },
      { title: "QA Manager", groups: ["leadership", "specialist", "english"], cvRequired: true },
      { title: "QA Team Lead", groups: ["leadership", "specialist", "english"], cvRequired: true },
      { title: "Trainer", groups: ["specialist", "english"], cvRequired: true },
      { title: "Training Manager", groups: ["leadership", "specialist", "english"], cvRequired: true },
    ],
  },
  {
    value: "hr",
    label: "HR and recruitment",
    positions: [
      { title: "HR Recruiter", groups: ["hr"] },
      { title: "Recruitment Executive", groups: ["hr"] },
      { title: "HR Executive", groups: ["hr"] },
      { title: "HR Receptionist", groups: ["hr", "specialist"] },
      { title: "HR Manager", groups: ["hr", "leadership"], cvRequired: true },
    ],
  },
  {
    value: "it",
    label: "IT and dialer",
    positions: [
      { title: "IT Support", groups: ["it"] },
      { title: "Dialer Support", groups: ["it"] },
      { title: "Dialer Executive", groups: ["it", "english"] },
      { title: "Dialer Manager", groups: ["it", "leadership", "english"], cvRequired: true },
      { title: "Dialer Administrator", groups: ["it"], cvRequired: true },
    ],
  },
  {
    value: "creative",
    label: "Creative and marketing",
    positions: [
      { title: "Social Media Executive", groups: ["creative"] },
      { title: "Content Writer", groups: ["creative"] },
      { title: "Graphic Designer", groups: ["creative"] },
      { title: "Video Editor", groups: ["creative"] },
      { title: "Animator", groups: ["creative"] },
      { title: "SEO Specialist", groups: ["creative"], cvRequired: true },
      { title: "Digital Marketing Executive", groups: ["creative"] },
    ],
  },
  {
    value: "development",
    label: "Development",
    positions: [
      { title: "Web Developer", groups: ["creative"], cvRequired: true },
      { title: "Software Developer", groups: ["creative"], cvRequired: true },
      { title: "Software QA", groups: ["creative"], cvRequired: true },
      { title: "UI or UX Designer", groups: ["creative"], cvRequired: true },
    ],
  },
  {
    value: "admin",
    label: "Administration and other",
    positions: [
      { title: "Receptionist", groups: ["specialist", "english"] },
      { title: "Admin Executive", groups: ["specialist"] },
      { title: "Accounts or Finance", groups: ["specialist"], cvRequired: true },
    ],
  },
];

export function departmentLabel(value: string) {
  return DEPARTMENTS.find((d) => d.value === value)?.label ?? value;
}

export function findCatalogPosition(title: string) {
  const wanted = title.trim().toLowerCase();
  for (const department of DEPARTMENTS) {
    const position = department.positions.find(
      (p) => p.title.toLowerCase() === wanted
    );
    if (position) return { department: department.value, ...position };
  }
  return null;
}

export const GENERAL_APPLICATION = "general";
export const GENERAL_APPLICATION_LABEL =
  "General application — help me find a suitable role";

/** Positions generated from active campaign cards; not Vacancy rows. */
export const CAMPAIGN_VACANCY_PREFIX = "campaign-";
export const CAMPAIGN_VACANCIES_LABEL = "Campaign openings";

export function isCampaignVacancyId(id: string | null | undefined) {
  return Boolean(id?.startsWith(CAMPAIGN_VACANCY_PREFIX));
}

/** Joins a campaign id and one of its department keys into a vacancy id. */
export const CAMPAIGN_POSITION_SEPARATOR = "--";

export function isMedicalBillingCampaign(title: string | null | undefined) {
  return Boolean(title && /medical\s*billing/i.test(title));
}

/**
 * Campaigns that hire into several departments. Each department is offered as
 * its own position; the key is kept short because it becomes part of the id.
 */
export const MEDICAL_BILLING_POSITIONS = [
  { key: "bd", title: "Business Development Department" },
  { key: "billing-ar", title: "Billing and AR Department" },
  { key: "coding", title: "Coding Department" },
  { key: "qa-reporting", title: "QA and Reporting Department" },
  { key: "management", title: "Management" },
] as const;

export const MEDICAL_BILLING_SKILLS_QUESTION =
  "Which US medical billing tasks and software have you worked with? For example charge entry, AR follow-up, denials, CPT or ICD coding.";

export const ANY_BRANCH = "any";
export const ANY_BRANCH_LABEL = "Any suitable branch";
export const REMOTE_BRANCH = "remote";
export const REMOTE_BRANCH_LABEL = "Remote";

export const OPEN_CAMPAIGN = "open";
export const OPEN_CAMPAIGN_LABEL = "Open to a suitable campaign";

/** Used to offer "which campaigns have you worked on" when none are published. */
export const EXAMPLE_CAMPAIGNS = [
  "ACA",
  "Medicare",
  "MVA",
  "Final Expense",
  "Medical Billing",
  "B2B",
  "Customer Support",
];

export const COUNTRY_CODES: Option[] = [
  { value: "+92", label: "Pakistan (+92)" },
  { value: "+971", label: "UAE (+971)" },
  { value: "+966", label: "Saudi Arabia (+966)" },
  { value: "+974", label: "Qatar (+974)" },
  { value: "+968", label: "Oman (+968)" },
  { value: "+44", label: "United Kingdom (+44)" },
  { value: "+1", label: "USA / Canada (+1)" },
];

export const EXPERIENCE_OPTIONS: Option[] = [
  { value: "none", label: "No experience yet" },
  { value: "lt6m", label: "Less than 6 months" },
  { value: "6-11m", label: "6–11 months" },
  { value: "1-3y", label: "1 year to under 3 years" },
  { value: "3-5y", label: "3 years to under 5 years" },
  { value: "5y+", label: "5 years or more" },
];

export const QUALIFICATION_OPTIONS: Option[] = [
  { value: "below-matric", label: "Below Matric" },
  { value: "matric", label: "Matric or O Levels" },
  { value: "intermediate", label: "Intermediate or A Levels" },
  { value: "diploma", label: "Diploma" },
  { value: "bachelors", label: "Bachelor's degree" },
  { value: "masters", label: "Master's degree or above" },
  { value: "other", label: "Other" },
];

export const SCHEDULE_OPTIONS: Option[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export const JOIN_OPTIONS: Option[] = [
  { value: "immediately", label: "Immediately" },
  { value: "1-7d", label: "In 1–7 days" },
  { value: "8-15d", label: "In 8–15 days" },
  { value: "16-30d", label: "In 16–30 days" },
  { value: "30d+", label: "More than 30 days" },
];

export const EMPLOYEE_HISTORY_OPTIONS: Option[] = [
  { value: "no", label: "No" },
  { value: "previous", label: "Yes, previously" },
];

export const EMPLOYMENT_END_OPTIONS: Option[] = [
  { value: "resigned", label: "Resigned" },
  { value: "contract-ended", label: "Contract ended" },
  { value: "ended-by-company", label: "Employment ended by the company" },
  { value: "other", label: "Other" },
  { value: "discuss-hr", label: "Prefer to discuss with HR" },
];

export const ENGLISH_OPTIONS: Option[] = [
  { value: "beginner", label: "Beginner — basic words and phrases" },
  { value: "intermediate", label: "Intermediate — everyday conversation" },
  { value: "confident", label: "Confident — professional conversations" },
  { value: "fluent", label: "Fluent — complex conversations" },
];

export const HR_TASK_OPTIONS: Option[] = [
  { value: "recruitment", label: "Recruitment" },
  { value: "onboarding", label: "Onboarding" },
  { value: "attendance", label: "Attendance" },
  { value: "payroll", label: "Payroll coordination" },
  { value: "employee-relations", label: "Employee relations" },
  { value: "hr-systems", label: "HR systems" },
  { value: "none", label: "No practical experience yet" },
  { value: "other", label: "Other" },
];

export const HEARD_ABOUT_OPTIONS: Option[] = [
  { value: "walk-in", label: "Walk In" },
  { value: "social-media", label: "Social Media" },
  { value: "website", label: "Website" },
];

export const WORK_ARRANGEMENTS = ["On-site", "Remote", "Hybrid"];

export const TEXT_LIMIT = 300;
export const CV_MAX_BYTES = 5 * 1024 * 1024;
export const CV_EXTENSIONS = [".pdf", ".docx"];

export function optionLabel(options: Option[], value: string | null | undefined) {
  if (!value) return "";
  return options.find((o) => o.value === value)?.label ?? value;
}
