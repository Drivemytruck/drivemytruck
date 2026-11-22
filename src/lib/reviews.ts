import { db } from "./db";

export const REVIEW_WINDOW_DAYS = 14;

/**
 * Airbnb-style "blind" reviews: a review becomes public once BOTH sides have reviewed,
 * or once the review window has passed since the job was completed.
 */
export async function visibleReviewsFor(subjectUserId: string) {
  const reviews = await db.review.findMany({
    where: { subjectId: subjectUserId, hidden: false },
    include: {
      booking: { select: { completedAt: true, _count: { select: { reviews: true } } } },
      author: { select: { role: true, driver: { select: { fullName: true } }, company: { select: { companyName: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  const cutoff = Date.now() - REVIEW_WINDOW_DAYS * 86400000;
  return reviews
    .filter((r) => r.booking._count.reviews >= 2 || (r.booking.completedAt && r.booking.completedAt.getTime() < cutoff))
    .map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      authorName:
        r.author.role === "COMPANY" ? r.author.company?.companyName ?? "Company" : firstNameOnly(r.author.driver?.fullName),
    }));
}

function firstNameOnly(name?: string | null) {
  if (!name) return "Driver";
  const [first, last] = name.split(/\s+/);
  return last ? `${first} ${last[0]}.` : first;
}

export async function ratingSummary(subjectUserId: string) {
  const reviews = await visibleReviewsFor(subjectUserId);
  if (!reviews.length) return { average: null as number | null, count: 0, reviews };
  const average = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return { average: Math.round(average * 10) / 10, count: reviews.length, reviews };
}

/** Batch version for lists: userId -> {average, count} */
export async function ratingSummaries(userIds: string[]) {
  const out = new Map<string, { average: number | null; count: number }>();
  if (!userIds.length) return out;
  const reviews = await db.review.findMany({
    where: { subjectId: { in: userIds }, hidden: false },
    select: {
      subjectId: true,
      rating: true,
      booking: { select: { completedAt: true, _count: { select: { reviews: true } } } },
    },
  });
  const cutoff = Date.now() - REVIEW_WINDOW_DAYS * 86400000;
  const acc = new Map<string, number[]>();
  for (const r of reviews) {
    const visible = r.booking._count.reviews >= 2 || (r.booking.completedAt && r.booking.completedAt.getTime() < cutoff);
    if (!visible) continue;
    acc.set(r.subjectId, [...(acc.get(r.subjectId) ?? []), r.rating]);
  }
  for (const id of userIds) {
    const list = acc.get(id) ?? [];
    out.set(id, {
      average: list.length ? Math.round((list.reduce((a, b) => a + b, 0) / list.length) * 10) / 10 : null,
      count: list.length,
    });
  }
  return out;
}
