import { db } from "./db";

export const LATE_CANCEL_HOURS = 24;
/** Don't show a percentage until there's enough history to be fair. */
export const MIN_HISTORY_FOR_SCORE = 3;

export type Reliability = {
  completed: number;
  noShows: number;
  lateCancels: number;
  /** % of bookings honoured; null until there's enough history */
  score: number | null;
};

/** Batch reliability for many users (drivers or companies). */
export async function reliabilityFor(users: { userId: string; driverId?: string; companyId?: string }[]) {
  const out = new Map<string, Reliability>();
  if (!users.length) return out;
  const driverIds = users.map((u) => u.driverId).filter(Boolean) as string[];
  const companyIds = users.map((u) => u.companyId).filter(Boolean) as string[];
  const [events, driverDone, companyDone] = await Promise.all([
    db.reliabilityEvent.groupBy({
      by: ["userId", "type"],
      where: { userId: { in: users.map((u) => u.userId) }, overturned: false, type: { in: ["NO_SHOW", "LATE_CANCEL"] } },
      _count: true,
    }),
    driverIds.length
      ? db.booking.groupBy({ by: ["driverId"], where: { driverId: { in: driverIds }, status: "COMPLETED" }, _count: true })
      : Promise.resolve([] as { driverId: string; _count: number }[]),
    companyIds.length
      ? db.booking.groupBy({ by: ["companyId"], where: { companyId: { in: companyIds }, status: "COMPLETED" }, _count: true })
      : Promise.resolve([] as { companyId: string; _count: number }[]),
  ]);
  for (const u of users) {
    const ev = (t: string) => events.find((e) => e.userId === u.userId && e.type === t)?._count ?? 0;
    const completed =
      (u.driverId ? driverDone.find((d) => d.driverId === u.driverId)?._count : companyDone.find((c) => c.companyId === u.companyId)?._count) ?? 0;
    const noShows = ev("NO_SHOW");
    const lateCancels = ev("LATE_CANCEL");
    const total = completed + noShows + lateCancels;
    out.set(u.userId, { completed, noShows, lateCancels, score: total >= MIN_HISTORY_FOR_SCORE ? Math.round((completed / total) * 100) : null });
  }
  return out;
}

export async function reliabilityOf(u: { userId: string; driverId?: string; companyId?: string }) {
  return (await reliabilityFor([u])).get(u.userId)!;
}

/** Our published policy: 3 no-shows (not overturned on appeal) and the driver's account is suspended. */
export const NO_SHOW_LIMIT = 3;

export async function enforceNoShowPolicy(driverUserId: string) {
  const count = await db.reliabilityEvent.count({ where: { userId: driverUserId, type: "NO_SHOW", overturned: false } });
  if (count >= NO_SHOW_LIMIT) {
    await db.user.update({ where: { id: driverUserId }, data: { suspended: true, sessionVersion: { increment: 1 } } });
    return true;
  }
  return false;
}
