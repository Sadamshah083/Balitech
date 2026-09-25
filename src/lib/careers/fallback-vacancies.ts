import { companyContent } from "@/lib/content";
import type { PublicVacancy } from "./application";

const [shiftDays, shiftHours] = companyContent.joinUs.contact.hours
  .split("·")
  .map((part) => part.trim());

function openRole(id: string, title: string): PublicVacancy {
  return {
    id,
    title,
    department: "operations",
    roleGroups: ["campaign", "english"],
    branches: [],
    remoteAllowed: false,
    campaign: null,
    workingDays: shiftDays ?? null,
    workingHours: shiftHours ?? null,
    workArrangement: "On-site",
    cvRequired: false,
    customQuestion: null,
    description: null,
  };
}

/**
 * What the form offers before HR has created any vacancy: the roles the careers
 * page already advertises. Once a vacancy row exists the admin list is the only
 * source, so hiding every vacancy there really does close the form to them.
 */
export const fallbackVacancies: PublicVacancy[] = [
  openRole("fallback-csr", "Customer Service Representative"),
  openRole("fallback-sales-agent", "Sales Agent"),
];
