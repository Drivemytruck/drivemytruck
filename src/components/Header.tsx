import Link from "next/link";
import { Suspense } from "react";
import type { Role } from "@prisma/client";
import { Logo } from "./Logo";
import { LangSwitch } from "./LangSwitch";
import { logout } from "@/app/(auth)/actions";
import type { Dict } from "@/lib/i18n";

export function Header({ user, t, lang, unread = 0, bellLabel = "Notifications" }: { user: { role: Role } | null; t: Dict["nav"]; lang: "en" | "pl"; unread?: number; bellLabel?: string }) {
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
              <Link href="/notifications" className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label={`${bellLabel}${unread ? ` (${unread})` : ""}`}>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[11px] font-bold text-white ring-2 ring-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <Link href="/account" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label={t.account} title={t.account}>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0" />
                </svg>
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
