import Link from "next/link";
import { Suspense } from "react";
import type { Role } from "@prisma/client";
import { Logo } from "./Logo";
import { LangSwitch } from "./LangSwitch";
import { logout } from "@/app/(auth)/actions";
import type { Dict } from "@/lib/i18n";

export function Header({ user, t, lang }: { user: { role: Role } | null; t: Dict["nav"]; lang: "en" | "pl" }) {
  const links: Record<Role, { href: string; label: string }[]> = {
    DRIVER: [
      { href: "/driver", label: t.driver.jobs },
      { href: "/driver/bookings", label: t.driver.work },
      { href: "/driver/availability", label: t.driver.availability },
      { href: "/driver/profile", label: t.driver.profile },
    ],
    COMPANY: [
      { href: "/company", label: t.company.home },
      { href: "/company/jobs/new", label: t.company.post },
      { href: "/company/drivers", label: t.company.drivers },
      { href: "/company/profile", label: t.company.company },
    ],
    ADMIN: [
      { href: "/admin", label: "Overview" },
      { href: "/admin/users", label: "Users" },
      { href: "/admin/jobs", label: "Jobs" },
      { href: "/admin/bookings", label: "Bookings" },
      { href: "/admin/map", label: "Map" },
    ],
  };
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-4 sm:px-6">
        <Logo href={user ? "/dashboard" : "/"} />
        <div className="flex items-center gap-1">
          {user && (
            <nav className="hidden items-center gap-1 lg:flex">
              {links[user.role].map((l) => (
                <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-navy-50 hover:text-navy-900">
                  {l.label}
                </Link>
              ))}
            </nav>
          )}
          <Suspense fallback={null}>
            <LangSwitch lang={lang} />
          </Suspense>
          {user ? (
            <>
              <Link href="/account" className="rounded-lg px-2 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100">
                {t.account}
              </Link>
              <form action={logout}>
                <button className="rounded-lg px-2 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100">{t.logout}</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost btn-sm sm:px-4 sm:py-2.5 sm:text-sm">
                {t.login}
              </Link>
              <Link href="/register" className="btn-primary btn-sm sm:px-4 sm:py-2.5 sm:text-sm">
                {t.getStarted}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
