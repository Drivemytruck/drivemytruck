"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getTx } from "@/lib/i18n";
import { canDriveClass } from "@/lib/constants";
import { isLive } from "@/lib/jobs";
import { bookDriver, BookingError } from "@/lib/bookings";
import { createOffer, parseTerms, termsLabel } from "@/lib/offers";
import { notifyUser } from "@/lib/notify";
import type { ActionState } from "@/components/forms";

const T = async (s: string, v?: Record<string, string | number>) => (await getTx()).tx(s, v);

function refresh(jobId: string) {
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/company/jobs/${jobId}`);
  revalidatePath("/driver/bookings");
}

/** Driver proposes (or counters with) different pay / start time; company counters on an application. */
export async function proposeTerms(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = parseTerms(fd);
  if ("error" in parsed) return { error: await T(parsed.error) };
  const terms = parsed.terms;

  if (user.role === "DRIVER" && user.driver) {
    const driver = user.driver;
    const jobId = String(fd.get("jobId"));
    const job = await db.job.findUnique({ where: { id: jobId }, include: { company: { select: { userId: true } } } });
    if (!job || job.kind !== "SHIFT" || !isLive(job)) return { error: await T("This job is no longer open.") };
    if (!canDriveClass(driver.licenceClasses, job.licenceClass)) return { error: await T("Your licence class doesn't cover this job.") };
    const app = await db.application.upsert({
      where: { jobId_driverId: { jobId, driverId: driver.id } },
      create: { jobId, driverId: driver.id, message: terms.note },
      update: { status: "APPLIED" },
    });
    await createOffer(app.id, "DRIVER", terms);
    refresh(jobId);
    after(() =>
      notifyUser(job.company.userId, (tx, lang) => ({
        subject: tx("{name} proposed different terms", { name: driver.fullName.split(" ")[0] }),
        paragraphs: [
          tx("{name} would like to do your job on these terms:", { name: driver.fullName }),
          termsLabel(terms, tx, lang),
          ...(terms.note ? [`“${terms.note}”`] : []),
          tx("You can accept, make a counter-offer or decline."),
        ],
        cta: tx("Review offer"),
        path: `/company/jobs/${jobId}`,
        icon: "💬",
      })),
    );
    return { ok: await T("Offer sent. We'll let you know when the company replies.") };
  }

  if (user.role === "COMPANY" && user.company) {
    const app = await db.application.findUnique({
      where: { id: String(fd.get("applicationId")) },
      include: { job: true, driver: { select: { userId: true, fullName: true } } },
    });
    if (!app || app.job.companyId !== user.company.id) return { error: await T("Something went wrong.") };
    if (app.job.kind !== "SHIFT" || !isLive(app.job) || !["APPLIED", "INVITED"].includes(app.status)) return { error: await T("This job is no longer open.") };
    await createOffer(app.id, "COMPANY", terms);
    refresh(app.jobId);
    const companyName = user.company.companyName;
    after(() =>
      notifyUser(app.driver.userId, (tx, lang) => ({
        subject: tx("{company} sent you an offer", { company: companyName }),
        paragraphs: [
          tx("{company} is offering:", { company: companyName }),
          termsLabel(terms, tx, lang),
          ...(terms.note ? [`“${terms.note}”`] : []),
          tx("Accept to get booked, or reply with your own offer."),
        ],
        cta: tx("Review offer"),
        path: `/jobs/${app.jobId}`,
        icon: "💬",
      })),
    );
    return { ok: await T("Counter-offer sent.") };
  }
  return { error: await T("Something went wrong.") };
}

/** Accept or decline the offer from the other side. Accepting books the driver on those terms. */
export async function respondToOffer(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const offer = await db.offer.findUnique({
    where: { id: String(fd.get("offerId")) },
    include: { application: { include: { job: { include: { company: { select: { userId: true, companyName: true } } } }, driver: { select: { userId: true, fullName: true } } } } },
  });
  if (!offer || offer.status !== "PENDING") return { error: await T("This offer is no longer open.") };
  const { application: app } = offer;
  const isDriver = user.role === "DRIVER" && user.driver?.id === app.driverId;
  const isCompany = user.role === "COMPANY" && user.company?.id === app.job.companyId;
  // You can only answer the other side's offer.
  if (!((isDriver && offer.byRole === "COMPANY") || (isCompany && offer.byRole === "DRIVER"))) return { error: await T("Something went wrong.") };
  const otherUserId = isDriver ? app.job.company.userId : app.driver.userId;
  const who = isDriver ? app.driver.fullName.split(" ")[0] : app.job.company.companyName;

  if (fd.get("decision") === "DECLINE") {
    await db.offer.update({ where: { id: offer.id }, data: { status: "DECLINED" } });
    refresh(app.jobId);
    after(() =>
      notifyUser(otherUserId, (tx, lang) => ({
        subject: tx("{who} declined your offer", { who }),
        paragraphs: [tx("{who} declined:", { who }), termsLabel(offer, tx, lang), tx("You can send a different offer.")],
        cta: tx("View job"),
        path: isDriver ? `/company/jobs/${app.jobId}` : `/jobs/${app.jobId}`,
        icon: "💬",
      })),
    );
    return { ok: await T("Offer declined.") };
  }

  try {
    const booking = await bookDriver(app.jobId, app.driverId, { payAmount: offer.payAmount, payType: offer.payType, startAt: offer.startAt, note: offer.note });
    await db.offer.update({ where: { id: offer.id }, data: { status: "ACCEPTED" } });
    refresh(app.jobId);
    after(() =>
      notifyUser(otherUserId, (tx, lang) => ({
        subject: tx("Offer accepted — booked", {}),
        paragraphs: [tx("{who} accepted the offer. The booking is confirmed:", { who }), termsLabel(offer, tx, lang)],
        cta: tx("View booking"),
        path: `/bookings/${booking.id}`,
        icon: "✅",
      })),
    );
    return { ok: await T("Accepted — you're booked!") };
  } catch (e) {
    if (e instanceof BookingError) return { error: await T(e.message) };
    throw e;
  }
}

/** Take back your own pending offer. */
export async function withdrawOffer(fd: FormData) {
  const user = await requireUser();
  const offer = await db.offer.findUnique({ where: { id: String(fd.get("offerId")) }, include: { application: { include: { job: true } } } });
  if (!offer || offer.status !== "PENDING") return;
  const mine =
    (offer.byRole === "DRIVER" && user.driver?.id === offer.application.driverId) ||
    (offer.byRole === "COMPANY" && user.company?.id === offer.application.job.companyId);
  if (!mine) return;
  await db.offer.update({ where: { id: offer.id }, data: { status: "WITHDRAWN" } });
  refresh(offer.application.jobId);
}
