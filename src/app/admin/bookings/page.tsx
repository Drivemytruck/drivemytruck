import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { licenceLabel } from "@/lib/constants";
import { dateTime, money } from "@/lib/format";
import { RowLink } from "@/components/admin";
import { Empty, StatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Admin · Bookings" };

export default async function AdminBookings() {
  await requireUser("ADMIN");
  const bookings = await db.booking.findMany({
    include: { job: true, driver: { select: { fullName: true } }, company: { select: { companyName: true } } },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  return (
    <div className="page space-y-4">
      <h1 className="h1">Bookings ({bookings.length})</h1>
      {bookings.length ? (
        <div className="card divide-y divide-slate-100 px-4">
          {bookings.map((b) => (
            <RowLink
              key={b.id}
              href={`/bookings/${b.id}`}
              title={`${b.company.companyName} → ${b.driver.fullName}`}
              sub={`${licenceLabel(b.job.licenceClass)} · ${dateTime(b.job.startAt)} · ${b.job.town ?? b.job.postcode} · ${money(b.job.payAmount)}`}
              right={<StatusBadge status={b.status} />}
            />
          ))}
        </div>
      ) : (
        <Empty title="No bookings yet" />
      )}
    </div>
  );
}
