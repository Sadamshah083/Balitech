/**
 * Every public form lands on /thank-you after a successful submit, so the
 * funnel's conversion step is one URL that GA4 and GTM can target. The form
 * type rides in the query string; the application reference number does not,
 * so it never ends up in analytics page URLs, and is handed over through
 * sessionStorage instead.
 */
export const THANK_YOU_PATH = "/thank-you";

export type ThankYouForm = "inquiry" | "contact" | "application";

const REFERENCE_KEY = "balitech:application-reference";

export function thankYouHref(form: ThankYouForm, referenceId?: string) {
  if (referenceId) {
    try {
      sessionStorage.setItem(REFERENCE_KEY, referenceId);
    } catch {
      // Storage can be unavailable (private mode); the page copes without it.
    }
  }
  return `${THANK_YOU_PATH}?form=${form}`;
}

export function readApplicationReference() {
  try {
    return sessionStorage.getItem(REFERENCE_KEY);
  } catch {
    return null;
  }
}
