import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { SITE_LEGAL_NAME, SITE_URL } from "@/lib/seo";
import {
  officePhoneDisplay,
  type PublicOffice,
} from "@/lib/fallback-offices";

export type MailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  attachments?: MailAttachment[];
};

const HR_EMAIL = "humanresource@balitech.org";

let transporter: Transporter | null | undefined;

function smtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS
  );
}

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  if (!smtpConfigured()) {
    transporter = null;
    return null;
  }

  const port = Number(process.env.SMTP_PORT) || 465;
  const secure =
    process.env.SMTP_SECURE === "true" ||
    process.env.SMTP_SECURE === "1" ||
    port === 465;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!.trim(),
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER!.trim(),
      pass: process.env.SMTP_PASS!,
    },
  });
  return transporter;
}

/** Destination for HR / lead notifications (defaults to the SMTP mailbox). */
export function mailNotifyTo() {
  return (
    process.env.SMTP_TO?.trim() ||
    process.env.SMTP_USER?.trim() ||
    HR_EMAIL
  );
}

function mailFrom() {
  const address =
    process.env.SMTP_FROM?.trim() ||
    process.env.SMTP_USER?.trim() ||
    HR_EMAIL;
  return `"${SITE_LEGAL_NAME}" <${address}>`;
}

/**
 * Sends via Titan SMTP when env is set. Never throws to callers — logs and
 * returns false so form submissions still succeed if mail is down.
 */
export async function sendMail(input: SendMailInput): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) {
    console.warn("[mail] SMTP not configured — skipping send");
    return false;
  }

  const to = input.to.trim();
  if (!to) {
    console.warn("[mail] missing recipient — skipping send");
    return false;
  }

  try {
    await transport.sendMail({
      from: mailFrom(),
      to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
      attachments: input.attachments,
    });
    return true;
  } catch (error) {
    console.error("[mail] send failed:", error);
    return false;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rowsHtml(rows: Array<[string, string]>) {
  return rows
    .filter(([, v]) => v.trim())
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#64748b;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:6px 0;color:#0f172a">${escapeHtml(value).replace(/\n/g, "<br/>")}</td></tr>`
    )
    .join("");
}

function formatApplicationDate(date = new Date()) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Karachi",
  });
}

export function resolveBranchForMail(
  branchName: string | null | undefined,
  offices: PublicOffice[]
): { name: string; address: string; phone: string } {
  const label = (branchName ?? "").trim();
  const match =
    offices.find((o) => o.name.toLowerCase() === label.toLowerCase()) ??
    offices.find((o) => o.isHeadOffice) ??
    offices[0];

  if (match) {
    return {
      name: label || match.name,
      address: match.address,
      phone: match.phone?.trim() || officePhoneDisplay,
    };
  }

  return {
    name: label || "BALITECH",
    address: "Rawalpindi / Islamabad, Pakistan",
    phone: officePhoneDisplay,
  };
}

/** Confirmation email to the candidate after a successful Join Us application. */
export async function sendApplicationConfirmation(opts: {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  branchName: string;
  branchAddress: string;
  branchPhone: string;
  applicationDate?: Date;
  referenceId?: string;
}) {
  const email = opts.candidateEmail.trim().toLowerCase();
  if (!email) return false;

  const candidateName = opts.candidateName.trim() || "Applicant";
  const jobTitle = opts.jobTitle.trim() || "General application";
  const branchName = opts.branchName.trim() || "BALITECH";
  const branchAddress = opts.branchAddress.trim();
  const branchPhone = opts.branchPhone.trim() || officePhoneDisplay;
  const applicationDate = formatApplicationDate(opts.applicationDate);
  const referenceId = opts.referenceId?.trim() || "";
  const hrMailto = `mailto:${HR_EMAIL}`;
  const siteHref = SITE_URL;
  const letterheadUrl = `${SITE_URL}/email-header-banner.jpg`;
  /* Brand fonts when loaded; Helvetica/Arial keep alignment clean in Gmail. */
  const fontBody =
    "Manrope,'Helvetica Neue',Helvetica,Arial,sans-serif";
  const fontDisplay =
    "Sora,Manrope,'Helvetica Neue',Helvetica,Arial,sans-serif";

  const textBody = [
    `Dear ${candidateName},`,
    "",
    `Thank you for applying for the ${jobTitle} position at BaliTech.`,
    "",
    "We have successfully received your application.",
    "",
    "Application Details",
    `Position: ${jobTitle}`,
    `Branch: ${branchName}`,
    `Application Date: ${applicationDate}`,
    ...(referenceId ? [`Reference: ${referenceId}`] : []),
    "",
    "What happens next?",
    "Our HR team will review your application. If your profile matches our requirements, shortlisted candidates will be contacted for the next stage.",
    "",
    "Branch Contact Information",
    branchName,
    branchAddress,
    `Phone: ${branchPhone}`,
    `Email: ${HR_EMAIL}`,
    "",
    "For interview scheduling, please contact the branch using the phone number above, or HR at humanresource@balitech.org.",
    "",
    `Website: ${siteHref}`,
    "",
    "Thank you for your interest in joining BaliTech.",
    "",
    "Best regards,",
    "Human Resources Team",
    "BaliTech Pvt. Ltd.",
    HR_EMAIL,
    siteHref,
  ].join("\n");

  const pad = "20px";
  const detailRows = [
    ["Position", jobTitle],
    ["Branch", branchName],
    ["Date", applicationDate],
    ...(referenceId ? [["Reference", referenceId] as [string, string]] : []),
  ]
    .map(
      ([label, value]) =>
        `<tr>
          <td align="left" valign="top" width="88" style="width:88px;padding:3px 16px 3px 0;margin:0;font-family:${fontBody};font-size:14px;line-height:1.5;color:#64748b;white-space:nowrap">${escapeHtml(label)}</td>
          <td align="left" valign="top" style="padding:3px 0;margin:0;font-family:${fontBody};font-size:14px;line-height:1.5;font-weight:700;color:#0d1a3a">${escapeHtml(value)}</td>
        </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta http-equiv="x-ua-compatible" content="ie=edge"/>
<title>Your BaliTech application</title>
<style type="text/css">
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&family=Sora:wght@600;700&display=swap');
  html,body{margin:0!important;padding:0!important;width:100%!important}
  *{box-sizing:border-box}
  table,td{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0}
  img{border:0;outline:none;text-decoration:none;display:block;max-width:100%;height:auto}
  p{margin:0;padding:0}
  a{color:#0d1a3a;text-decoration:underline}
</style>
<!--[if !mso]><!-->
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&family=Sora:wght@600;700&display=swap" rel="stylesheet"/>
<!--<![endif]-->
</head>
<body style="margin:0;padding:0;width:100%;background:#ffffff;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;font-family:${fontBody}">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#ffffff">
    We have received your application for ${escapeHtml(jobTitle)} at BaliTech.
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" align="left" style="margin:0;padding:0;width:100%;border-collapse:collapse;background:#ffffff;text-align:left">
    <tr>
      <td align="left" style="margin:0;padding:0;width:100%;text-align:left">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" align="left" style="margin:0;padding:0;width:100%;border-collapse:collapse;background:#ffffff;text-align:left">
          <tr>
            <td align="left" style="margin:0;padding:0;line-height:0;font-size:0;background:#0d1a3a;text-align:left">
              <img src="${letterheadUrl}" alt="BaliTech" width="800" style="display:block;width:100%;max-width:100%;height:auto;border:0;margin:0;padding:0"/>
            </td>
          </tr>
          <tr>
            <td align="left" style="margin:0;padding:${pad} ${pad} 0;font-family:${fontBody};font-size:15px;line-height:1.55;color:#1e293b;text-align:left">
              <p style="margin:0 0 10px;padding:0;font-family:${fontDisplay};font-size:22px;font-weight:700;line-height:1.25;letter-spacing:-0.01em;color:#0d1a3a;text-align:left">Application received</p>
              <p style="margin:0 0 8px;padding:0;font-family:${fontBody};font-size:15px;font-weight:400;line-height:1.5;color:#0d1a3a;text-align:left">Dear ${escapeHtml(candidateName)},</p>
              <p style="margin:0 0 18px;padding:0;font-family:${fontBody};font-size:15px;font-weight:400;line-height:1.55;color:#1e293b;text-align:left">Thank you for applying for the <strong style="font-weight:700;color:#0d1a3a">${escapeHtml(jobTitle)}</strong> position at <strong style="font-weight:700;color:#0d1a3a">BaliTech</strong>. We have successfully received your application.</p>

              <p style="margin:0 0 8px;padding:0;font-family:${fontDisplay};font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#0d1a3a;text-align:left">Application details</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" align="left" style="margin:0 0 18px;padding:0;width:100%;border-collapse:collapse;text-align:left">
                ${detailRows}
              </table>

              <p style="margin:0 0 4px;padding:0;font-family:${fontDisplay};font-size:15px;font-weight:700;line-height:1.4;color:#0d1a3a;text-align:left">What happens next?</p>
              <p style="margin:0 0 16px;padding:0;font-family:${fontBody};font-size:15px;font-weight:400;line-height:1.55;color:#1e293b;text-align:left">Our HR team will review your application. If your profile matches our requirements, shortlisted candidates will be contacted for the next stage.</p>

              <p style="margin:0 0 4px;padding:0;font-family:${fontDisplay};font-size:15px;font-weight:700;line-height:1.4;color:#0d1a3a;text-align:left">Branch contact information</p>
              <p style="margin:0 0 2px;padding:0;font-family:${fontBody};font-size:15px;font-weight:700;line-height:1.45;color:#0d1a3a;text-align:left">${escapeHtml(branchName)}</p>
              <p style="margin:0 0 2px;padding:0;font-family:${fontBody};font-size:14px;font-weight:400;line-height:1.45;color:#475569;text-align:left">${escapeHtml(branchAddress)}</p>
              <p style="margin:0 0 2px;padding:0;font-family:${fontBody};font-size:15px;font-weight:700;line-height:1.45;color:#0d1a3a;text-align:left">${escapeHtml(branchPhone)}</p>
              <p style="margin:0 0 14px;padding:0;font-family:${fontBody};font-size:15px;line-height:1.45;text-align:left"><a href="${hrMailto}" style="color:#0d1a3a;font-weight:600;text-decoration:underline">${HR_EMAIL}</a></p>

              <p style="margin:0 0 14px;padding:0;font-family:${fontBody};font-size:15px;font-weight:400;line-height:1.55;color:#1e293b;text-align:left">For interview scheduling, please contact the branch using the phone number above, or HR at <a href="${hrMailto}" style="color:#0d1a3a;font-weight:600;text-decoration:underline">${HR_EMAIL}</a> · <a href="${siteHref}" style="color:#0d1a3a;font-weight:600;text-decoration:underline">www.balitech.org</a>.</p>

              <p style="margin:0 0 16px;padding:0;font-family:${fontBody};font-size:15px;font-weight:400;line-height:1.55;color:#1e293b;text-align:left">Thank you for your interest in joining <strong style="font-weight:700;color:#0d1a3a">BaliTech</strong>.</p>

              <p style="margin:0 0 2px;padding:0;font-family:${fontBody};font-size:15px;font-weight:400;line-height:1.45;color:#64748b;text-align:left">Best regards,</p>
              <p style="margin:0 0 2px;padding:0;font-family:${fontDisplay};font-size:15px;font-weight:700;line-height:1.45;color:#0d1a3a;text-align:left">Human Resources Team</p>
              <p style="margin:0 0 20px;padding:0;font-family:${fontBody};font-size:15px;font-weight:600;line-height:1.45;color:#0d1a3a;text-align:left">BaliTech Pvt. Ltd.</p>
            </td>
          </tr>
          <tr>
            <td align="left" style="margin:0;padding:12px ${pad};background:#0d1a3a;font-family:${fontBody};font-size:12px;line-height:1.45;color:#94a3b8;text-align:left">
              <a href="${hrMailto}" style="color:#ffffff;font-weight:600;text-decoration:none">${HR_EMAIL}</a>
              <span style="color:#475569"> &nbsp;</span>
              <a href="${siteHref}" style="color:#e2e8f0;font-weight:600;text-decoration:none">www.balitech.org</a>
              <span style="color:#64748b"> — Together We Build Success.</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
  return sendMail({
    to: email,
    subject: `Your BaliTech application for ${jobTitle}`,
    text: textBody,
    html,
    replyTo: process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim() || HR_EMAIL,
  });
}

export async function notifyNewApplication(opts: {
  referenceId: string;
  name: string;
  email: string;
  phone: string | null;
  branch: string | null;
  position: string | null;
  queue: string;
  flags: string[];
  summaryLines?: string[];
  cv?: { filename: string; content: Buffer; contentType?: string } | null;
}) {
  const adminUrl = `${SITE_URL}/admin/leads`;
  const lines: Array<[string, string]> = [
    ["Reference", opts.referenceId],
    ["Name", opts.name],
    ["Email", opts.email],
    ["Phone", opts.phone ?? ""],
    ["Branch", opts.branch ?? ""],
    ["Position", opts.position ?? ""],
    ["Queue", opts.queue],
    ["Flags", opts.flags.length ? opts.flags.join(", ") : ""],
  ];
  if (opts.summaryLines?.length) {
    lines.push(["Details", opts.summaryLines.join("\n")]);
  }

  const text = [
    `New job application — ${opts.referenceId}`,
    "",
    ...lines.filter(([, v]) => v.trim()).map(([k, v]) => `${k}: ${v}`),
    "",
    `Admin: ${adminUrl}`,
  ].join("\n");

  const html = `
    <div style="font-family:Manrope,Segoe UI,sans-serif;font-size:14px;line-height:1.5">
      <p style="margin:0 0 12px"><strong>New job application</strong></p>
      <table style="border-collapse:collapse">${rowsHtml(lines)}</table>
      <p style="margin:16px 0 0"><a href="${escapeHtml(adminUrl)}">Open leads in admin</a></p>
    </div>
  `;

  return sendMail({
    to: mailNotifyTo(),
    subject: `[BALITECH] Application ${opts.referenceId}${opts.position ? ` — ${opts.position}` : ""}`,
    text,
    html,
    replyTo: opts.email || undefined,
    attachments: opts.cv
      ? [
          {
            filename: opts.cv.filename,
            content: opts.cv.content,
            contentType: opts.cv.contentType,
          },
        ]
      : undefined,
  });
}

export async function notifyNewLead(opts: {
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  position: string | null;
  message: string | null;
  leadId: string;
  hasCv: boolean;
}) {
  const adminUrl = `${SITE_URL}/admin/leads/${opts.leadId}`;
  const lines: Array<[string, string]> = [
    ["Name", opts.name],
    ["Email", opts.email],
    ["Phone", opts.phone ?? ""],
    ["Company / Branch", opts.company ?? ""],
    ["Position", opts.position ?? ""],
    ["Message", opts.message ?? ""],
    ["CV attached", opts.hasCv ? "Yes (download in admin)" : "No"],
  ];

  const text = [
    "New website inquiry",
    "",
    ...lines.filter(([, v]) => v.trim()).map(([k, v]) => `${k}: ${v}`),
    "",
    `Admin: ${adminUrl}`,
  ].join("\n");

  const html = `
    <div style="font-family:Manrope,Segoe UI,sans-serif;font-size:14px;line-height:1.5">
      <p style="margin:0 0 12px"><strong>New website inquiry</strong></p>
      <table style="border-collapse:collapse">${rowsHtml(lines)}</table>
      <p style="margin:16px 0 0"><a href="${escapeHtml(adminUrl)}">Open lead in admin</a></p>
    </div>
  `;

  return sendMail({
    to: mailNotifyTo(),
    subject: `[BALITECH] New inquiry — ${opts.name}${opts.position ? ` (${opts.position})` : ""}`,
    text,
    html,
    replyTo: opts.email || undefined,
  });
}
