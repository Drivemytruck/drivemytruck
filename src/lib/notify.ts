import "server-only";
import { db } from "./db";
import { brandedEmail, sendEmail, siteUrl } from "./email";
import { makeTx, type Lang, type Tx } from "./tx";
import { jobLine } from "./alerts";

type JobForLine = Parameters<typeof jobLine>[0];

/**
 * Email one user about something that happened, in their language.
 * `build` gets the user's translator and returns subject, paragraphs and a button.
 */
export async function notifyUser(
  userId: string,
  build: (tx: Tx, lang: Lang) => { subject: string; paragraphs: string[]; cta: string; path: string; icon?: string },
) {
  try {
    const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, locale: true, suspended: true } });
    if (!user || user.suspended) return;
    const lang = (user.locale === "pl" ? "pl" : "en") as Lang;
    const m = build(makeTx(lang), lang);
    // In-app bell + banner, then the email.
    await addNotification(userId, { icon: m.icon, title: m.subject, body: m.paragraphs.slice(1, 2).join(" ") || null, link: m.path });
    const { html, text } = brandedEmail({ paragraphs: m.paragraphs, cta: m.cta, url: `${siteUrl()}${m.path}` });
    await sendEmail({ to: user.email, subject: m.subject, html, text });
  } catch (e) {
    console.error("[notify]", e);
  }
}

export const line = (job: JobForLine, lang: Lang) => jobLine(job, lang);

export async function addNotification(userId: string, n: { icon?: string; title: string; body?: string | null; link?: string | null }) {
  try {
    await db.notification.create({ data: { userId, icon: n.icon ?? "🔔", title: n.title.slice(0, 200), body: n.body?.slice(0, 400) ?? null, link: n.link ?? null } });
  } catch (e) {
    console.error("[notify] in-app", e);
  }
}

/** Visiting the page a notification points to counts as reading it. */
export async function markReadByLink(userId: string, path: string) {
  await db.notification.updateMany({ where: { userId, link: path, readAt: null }, data: { readAt: new Date() } });
}
