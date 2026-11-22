import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { avatarUrl } from "@/lib/avatar";
import { dateOnly } from "@/lib/format";
import { licenceLabel } from "@/lib/constants";
import { Avatar, Empty, StatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Admin · Users" };

const ROLES = [
  { v: "", l: "All" },
  { v: "DRIVER", l: "Drivers" },
  { v: "COMPANY", l: "Companies" },
  { v: "ADMIN", l: "Admins" },
];

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ role?: string; q?: string }> }) {
  await requireUser("ADMIN");
  const { role = "", q = "" } = await searchParams;
  const term = q.trim();
  const where: Prisma.UserWhereInput = {
    ...(["DRIVER", "COMPANY", "ADMIN"].includes(role) ? { role: role as "DRIVER" | "COMPANY" | "ADMIN" } : {}),
    ...(term
      ? {
          OR: [
            { email: { contains: term, mode: "insensitive" } },
            { driver: { fullName: { contains: term, mode: "insensitive" } } },
            { company: { companyName: { contains: term, mode: "insensitive" } } },
            { driver: { postcode: { contains: term, mode: "insensitive" } } },
            { company: { postcode: { contains: term, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const users = await db.user.findMany({
    where,
    include: {
      driver: { include: { _count: { select: { bookings: true, applications: true } } } },
      company: { include: { _count: { select: { jobs: true, bookings: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="page space-y-4">
      <h1 className="h1">Users ({users.length})</h1>
      <form className="flex gap-2">
        <input type="hidden" name="role" value={role} />
        <input name="q" defaultValue={term} placeholder="Search name, email, postcode…" className="input" />
        <button className="btn-navy">Search</button>
      </form>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {ROLES.map((r) => (
          <Link
            key={r.v}
            href={`/admin/users?${new URLSearchParams({ ...(r.v ? { role: r.v } : {}), ...(term ? { q: term } : {}) })}`}
            className={`chip shrink-0 px-4 py-2 text-sm ${role === r.v ? "bg-navy-900 text-white" : "border border-slate-300 bg-white text-slate-700"}`}
          >
            {r.l}
          </Link>
        ))}
      </div>
      {users.length ? (
        <ul className="card divide-y divide-slate-100">
          {users.map((u) => {
            const name = u.driver?.fullName ?? u.company?.companyName ?? "Admin";
            return (
              <li key={u.id}>
                <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 p-3 hover:bg-slate-50">
                  <Avatar name={name} src={avatarUrl(u)} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-navy-900">
                      {name} {u.suspended && <span className="chip bg-slate-200 text-slate-700">Suspended</span>}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {u.role} · {u.email} · joined {dateOnly(u.createdAt)}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {u.driver &&
                        `${u.driver.licenceClasses.map(licenceLabel).join(", ") || "no class"} · ${u.driver.town ?? u.driver.postcode ?? "—"} · ${u.driver._count.applications} applications · ${u.driver._count.bookings} bookings`}
                      {u.company && `${u.company.town ?? u.company.postcode ?? "—"} · ${u.company._count.jobs} jobs · ${u.company._count.bookings} bookings`}
                    </p>
                  </div>
                  {u.driver && <StatusBadge status={u.driver.verificationStatus} />}
                  {u.company && <StatusBadge status={u.company.verificationStatus} />}
                  <span aria-hidden className="text-slate-400">›</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <Empty title="No users found" />
      )}
    </div>
  );
}
