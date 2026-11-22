"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";

type Item = { href: string; label: string; icon: string };

const items: Record<Role, Item[]> = {
  DRIVER: [
    { href: "/driver", label: "Jobs", icon: "M3 7h18M3 12h18M3 17h12" },
    { href: "/driver/bookings", label: "My work", icon: "M9 5h6m-8 4h10v11H7zM9 3h6v4H9z" },
    { href: "/driver/availability", label: "Availability", icon: "M7 3v3m10-3v3M4 8h16M5 5h14v15H5z" },
    { href: "/driver/profile", label: "Profile", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0" },
  ],
  COMPANY: [
    { href: "/company", label: "Home", icon: "M3 11l9-7 9 7v9H3z" },
    { href: "/company/jobs/new", label: "Post job", icon: "M12 5v14M5 12h14" },
    { href: "/company/drivers", label: "Drivers", icon: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 10a7 7 0 0 1 14 0m1-10a3 3 0 1 0 0-6m5 16a6 6 0 0 0-4-5.6" },
    { href: "/company/profile", label: "Company", icon: "M4 21V5h10v16M14 9h6v12M7 9h4m-4 4h4m-4 4h4" },
  ],
  ADMIN: [{ href: "/admin", label: "Admin", icon: "M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" }],
};

export function BottomNav({ role }: { role: Role }) {
  const path = usePathname();
  const list = items[role];
  const active = (href: string) =>
    path === href || (href !== "/driver" && href !== "/company" && path.startsWith(href));
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden">
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${list.length}, 1fr)` }}>
        {list.map((i) => (
          <li key={i.href}>
            <Link
              href={i.href}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${active(i.href) ? "text-brand-500" : "text-slate-500"}`}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={i.icon} />
              </svg>
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
