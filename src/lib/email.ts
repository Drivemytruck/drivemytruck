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
        from: process.env.EMAIL_FROM || "Drive My Truck <onboarding@resend.dev>",
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

export function siteUrl() {
  return (process.env.SITE_URL || "https://drivemytruck.co.uk").replace(/\/$/, "");
}
