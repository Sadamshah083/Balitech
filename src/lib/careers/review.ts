export const QUEUES = [
  { value: "recruitment", label: "Recruitment" },
  { value: "hr-employment-check", label: "HR employment check" },
] as const;

export const FLAG_LABELS: Record<string, string> = {
  "possible-duplicate": "Possible duplicate",
  "previous-employee": "Previous employee",
};

export function queueLabel(value: string | null | undefined) {
  if (!value) return null;
  return QUEUES.find((q) => q.value === value)?.label ?? value;
}

export function parseFlags(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((f): f is string => typeof f === "string") : [];
  } catch {
    return [];
  }
}
