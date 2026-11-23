import "server-only";
import { SUPPORT_EMAIL } from "./constants";

/**
 * Sends an email via Resend (https://resend.com) using its REST API.
 * Needs RESEND_API_KEY. EMAIL_FROM defaults to Resend's test sender, which can only
 * deliver to the Resend account owner's address until the domain is verified.
 * Returns false (and logs) instead of throwing, so user flows never break on email issues.
 */
export async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[email] RESEND_API_KEY not set — email to ${to} not sent: ${subject}`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: senderAddress(),
        to: [to],
        reply_to: SUPPORT_EMAIL,
        subject,
        html,
        text,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`[email] Resend error ${res.status}: ${await res.text()}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] send failed", e);
    return false;
  }
}

/** EMAIL_FROM may be a bare address ("hello@…") or a full "Name <hello@…>" — both work. */
function senderAddress() {
  const raw = (process.env.EMAIL_FROM || "").trim();
  if (!raw) return "Drive My Truck <onboarding@resend.dev>";
  return raw.includes("<") ? raw : `Drive My Truck <${raw}>`;
}

export function siteUrl() {
  return (process.env.SITE_URL || "https://drivemytruck.co.uk").replace(/\/$/, "");
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Simple branded email: a few paragraphs and one red button. */
export function brandedEmail({ paragraphs, cta, url }: { paragraphs: string[]; cta: string; url: string }) {
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#0f172a">
    <h2 style="color:#0b2a5b">Drive My <span style="color:#e31b23">Truck</span></h2>
    ${paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}
    <p><a href="${url}" style="display:inline-block;background:#e31b23;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">${esc(cta)}</a></p>
    <p style="color:#64748b;font-size:12px">Questions? Just reply to this email.</p>
  </div>`;
  const text = `${paragraphs.join("\n\n")}\n\n${cta}: ${url}`;
  return { html, text };
}
