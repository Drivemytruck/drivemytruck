import { db } from "@/lib/db";
import { brandedEmail, sendEmail, siteUrl } from "@/lib/email";
import { PERM_LISTING_DAYS } from "@/lib/constants";
import { licenceLabel } from "@/lib/constants";
import { encrypt, isEncrypted } from "@/lib/crypto";

/**
 * Runs once a day (Vercel Cron, see vercel.json):
 *  - reminds companies the day before a permanent advert expires
 *  - asks drivers whether they're still looking for permanent work before their status lapses
 * Each reminder is sent once (tracked in the database), so extra calls are harmless.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const now = new Date();
  const soon = new Date(now.getTime() + 36 * 3600000);
  let jobsReminded = 0;
  let driversReminded = 0;

  const expiring = await db.job.findMany({
    where: { kind: "PERMANENT", status: "OPEN", expiresAt: { gt: now, lte: soon }, expiryReminderSentAt: null },
    include: { company: { include: { user: { select: { email: true, suspended: true } } } } },
    take: 200,
  });
  for (const job of expiring) {
    if (job.company.user.suspended) continue;
    const { html, text } = brandedEmail({
      paragraphs: [
        `Hi ${job.company.contactName ?? job.company.companyName},`,
        `Your permanent advert for a ${licenceLabel(job.licenceClass)} driver (${job.town ?? job.postcode}) expires tomorrow.`,
        `Still looking? Renew it for another ${PERM_LISTING_DAYS} days with one click — it's free during our launch period.`,
      ],
      cta: "Renew my advert",
      url: `${siteUrl()}/company/jobs/${job.id}`,
    });
    await sendEmail({ to: job.company.user.email, subject: "Your Drive My Truck advert expires tomorrow", html, text });
    await db.job.update({ where: { id: job.id }, data: { expiryReminderSentAt: now } });
    jobsReminded++;
  }

  const lapsing = await db.driverProfile.findMany({
    where: { openToPermanent: true, permanentUntil: { gt: now, lte: new Date(now.getTime() + 48 * 3600000) }, permReminderSentAt: null },
    include: { user: { select: { email: true, suspended: true } } },
    take: 500,
  });
  for (const d of lapsing) {
    if (d.user.suspended) continue;
    const { html, text } = brandedEmail({
      paragraphs: [
        `Hi ${d.fullName.split(" ")[0]},`,
        "Are you still looking for a permanent driving job? Your “open to permanent work” status ends in 2 days.",
        "If you're still looking, open your profile and press Save — companies will keep seeing you for another 30 days.",
      ],
      cta: "I'm still looking",
      url: `${siteUrl()}/driver/profile`,
    });
    await sendEmail({ to: d.user.email, subject: "Still looking for permanent work?", html, text });
    await db.driverProfile.update({ where: { id: d.id }, data: { permReminderSentAt: now } });
    driversReminded++;
  }

  // Housekeeping: drop old failed-login records and expired reset tokens; encrypt any legacy plaintext document fields.
  await db.failedLogin.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 86400000) } } });
  await db.passwordResetToken.deleteMany({ where: { expiresAt: { lt: new Date(now.getTime() - 7 * 86400000) } } });
  const docs = await db.driverDocument.findMany({ select: { id: true, reference: true, checkCode: true }, take: 1000 });
  let encrypted = 0;
  for (const d of docs) {
    if (isEncrypted(d.reference) && (!d.checkCode || isEncrypted(d.checkCode))) continue;
    await db.driverDocument.update({ where: { id: d.id }, data: { reference: encrypt(d.reference)!, checkCode: encrypt(d.checkCode) } });
    encrypted++;
  }

  return Response.json({ ok: true, jobsReminded, driversReminded, encrypted });
}
