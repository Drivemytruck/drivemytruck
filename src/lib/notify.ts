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
  build: (tx: Tx, lang: Lang) => { subject: string; paragraphs: string[]; cta: string; path: string },
) {
  try {
    const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, locale: true, suspended: true } });
    if (!user || user.suspended) return;
    const lang = (user.locale === "pl" ? "pl" : "en") as Lang;
    const m = build(makeTx(lang), lang);
    const { html, text } = brandedEmail({ paragraphs: m.paragraphs, cta: m.cta, url: `${siteUrl()}${m.path}` });
    await sendEmail({ to: user.email, subject: m.subject, html, text });
  } catch (e) {
    console.error("[notify]", e);
  }
}

export const line = (job: JobForLine, lang: Lang) => jobLine(job, lang);
