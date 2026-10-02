import type { PublicVacancy } from "./application";

/**
 * What the form offers before HR has created any vacancy. Kept empty so the
 * dropdown only shows active campaigns / published vacancies — not default
 * Sales Agent or Customer Service Representative rows.
 */
export const fallbackVacancies: PublicVacancy[] = [];
