import { randomInt } from "crypto";

const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type OfficeCode = "MAIN" | "ISM" | "COM" | "IRRD";

export const OFFICE_CODE_META: Record<
  OfficeCode,
  { code: OfficeCode; label: string; aliases: string[] }
> = {
  MAIN: {
    code: "MAIN",
    label: "Shamsabad Office",
    aliases: ["shamsabad", "main", "head", "maryam"],
  },
  ISM: {
    code: "ISM",
    label: "Islamabad Office",
    aliases: ["islamabad", "i-9", "i9", "i-9/3"],
  },
  COM: {
    code: "COM",
    label: "Commercial Office",
    aliases: ["commercial", "comm"],
  },
  IRRD: {
    code: "IRRD",
    label: "Iran Road Office",
    aliases: ["iran", "satellite", "irrd"],
  },
};

/** Map a branch preference label to the short office code used in reference IDs. */
export function officeCodeFromBranch(branch: string | null | undefined): OfficeCode {
  const value = (branch ?? "").toLowerCase();
  if (!value) return "MAIN";
  for (const meta of Object.values(OFFICE_CODE_META)) {
    if (meta.aliases.some((alias) => value.includes(alias))) return meta.code;
  }
  return "MAIN";
}

/**
 * Application date stamp: YYMMDD in Asia/Karachi — e.g. 30 Sep 2026 → `260930`.
 */
export function referenceDateStamp(date = new Date(), timeZone = "Asia/Karachi") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value ?? "00";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}${month}${day}`;
}

function randomIdToken(length = 5) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)];
  }
  return out;
}

/**
 * Format: `BT-{OFFICE}-{ID}-{DATE}`
 * Example: `BT-ISM-DHRTD-260930` (branch applied, unique id, apply date).
 */
export function buildApplicationReferenceId(opts: {
  branch: string | null | undefined;
  appliedAt?: Date;
  idToken?: string;
}) {
  const office = officeCodeFromBranch(opts.branch);
  const id = (opts.idToken ?? randomIdToken(5)).toUpperCase();
  const date = referenceDateStamp(opts.appliedAt ?? new Date());
  return `BT-${office}-${id}-${date}`;
}

/** Resolve search tokens like COM / ISM / MAIN / IRRD to office name keywords. */
export function officeSearchFromQuery(query: string): {
  code: OfficeCode | null;
  keyword: string | null;
} {
  const raw = query.trim().toUpperCase();
  if (!raw) return { code: null, keyword: null };

  const direct = (Object.keys(OFFICE_CODE_META) as OfficeCode[]).find(
    (code) => code === raw || OFFICE_CODE_META[code].aliases.some((a) => a.toUpperCase() === raw)
  );
  if (direct) {
    return {
      code: direct,
      keyword: OFFICE_CODE_META[direct].label.replace(/\s+office$/i, "").trim(),
    };
  }

  if (raw.startsWith("COM")) {
    return { code: "COM", keyword: "Commercial" };
  }
  if (raw.startsWith("ISM") || raw === "ISB") {
    return { code: "ISM", keyword: "Islamabad" };
  }
  if (raw.startsWith("IRR") || raw === "IRAN") {
    return { code: "IRRD", keyword: "Iran" };
  }
  if (raw === "MAIN" || raw.startsWith("SHAM")) {
    return { code: "MAIN", keyword: "Shamsabad" };
  }

  return { code: null, keyword: null };
}

export function officeCodeLabel(code: OfficeCode) {
  return `${OFFICE_CODE_META[code].label} (${code})`;
}
