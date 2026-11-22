import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { licenceLabel } from "@/lib/constants";
import { dateTime, money } from "@/lib/format";
import { todayDate } from "@/lib/availability";
import { AdminMapLoader } from "@/components/AdminMapLoader";

export const metadata: Metadata = { title: "Admin · Map" };

export default async function AdminMapPage() {
  await requireUser("ADMIN");
  const [jobs, drivers, companies] = await Promise.all([
    db.job.findMany({
      where: { lat: { not: null }, lng: { not: null }, startAt: { gte: new Date(Date.now() - 30 * 86400000) } },
      include: { company: { select: { companyName: true } } },
      orderBy: { startAt: "desc" },
      take: 500,
    }),
    db.driverProfile.findMany({
      where: { lat: { not: null }, lng: { not: null }, user: { suspended: false } },
      include: { availability: { where: { date: todayDate() } } },
    }),
    db.companyProfile.findMany({ where: { lat: { not: null }, lng: { not: null }, user: { suspended: false } } }),
  ]);
  return (
    <div className="page space-y-4">
      <h1 className="h1">Map</h1>
      <AdminMapLoader
        data={{
          jobs: jobs.map((j) => ({
            id: j.id,
            lat: j.lat!,
            lng: j.lng!,
            price: money(j.payAmount) + (j.payType === "HOURLY" ? "/h" : ""),
            status: j.status,
            title: `${licenceLabel(j.licenceClass)} driver`,
            when: dateTime(j.startAt),
            company: j.company.companyName,
          })),
          drivers: drivers.map((d) => ({
            userId: d.userId,
            lat: d.lat!,
            lng: d.lng!,
            name: d.fullName,
            info: `${d.licenceClasses.map(licenceLabel).join(", ") || "no class"} · ${d.town ?? d.postcode ?? ""} · up to ${d.travelRadiusMiles} mi`,
            available: d.availability.length > 0,
          })),
          companies: companies.map((c) => ({
            userId: c.userId,
            lat: c.lat!,
            lng: c.lng!,
            name: c.companyName,
            info: c.town ?? c.postcode ?? "",
          })),
        }}
      />
    </div>
  );
}
