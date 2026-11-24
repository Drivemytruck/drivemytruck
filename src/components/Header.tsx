import Link from "next/link";
import type { Role } from "@prisma/client";
import { Logo } from "./Logo";
import { logout } from "@/app/(auth)/actions";

const links: Record<Role, { href: string; label: string }[]> = {
  DRIVER: [
    { href: "/driver", label: "Find jobs" },
    { href: "/driver/bookings", label: "My work" },
    { href: "/driver/availability", label: "Availability" },
    { href: "/driver/profile", label: "Profile" },
  ],
  COMPANY: [
    { href: "/company", label: "Dashboard" },
    { href: "/company/jobs/new", label: "Post a job" },
    { href: "/company/drivers", label: "Find drivers" },
    { href: "/company/profile", label: "Company" },
  ],
  ADMIN: [
    { href: "/admin", label: "Overview" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/jobs", label: "Jobs" },
    { href: "/admin/bookings", label: "Bookings" },
    { href: "/admin/map", label: "Map" },
  ],
};

export function Header({ user }: { user: { role: Role } | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo href={user ? "/dashboard" : "/"} />
        {user ? (
          <div className="flex items-center gap-1">
            <nav className="hidden items-center gap-1 sm:flex">
              {links[user.role].map((l) => (
                <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-navy-50 hover:text-navy-900">
                  {l.label}
                </Link>
              ))}
            </nav>
            <Link href="/account" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100">
              Account
            </Link>
            <form action={logout}>
              <button className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100">Log out</button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost btn-sm sm:px-4 sm:py-2.5 sm:text-sm">
              Log in
            </Link>
            <Link href="/register" className="btn-primary btn-sm sm:px-4 sm:py-2.5 sm:text-sm">
              Get started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
