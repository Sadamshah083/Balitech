/**
 * Where the consent checkbox sends applicants. Set
 * NEXT_PUBLIC_RECRUITMENT_PRIVACY_URL to the notice HR has approved; the local
 * page is used until then.
 */
export const RECRUITMENT_PRIVACY_URL =
  process.env.NEXT_PUBLIC_RECRUITMENT_PRIVACY_URL?.trim() || "/recruitment-privacy-notice";
