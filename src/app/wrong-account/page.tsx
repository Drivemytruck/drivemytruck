import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";
import { getTx } from "@/lib/i18n";
import { logout } from "@/app/(auth)/actions";

export const metadata: Metadata = { title: "Different account needed" };

export default async function WrongAccount({ searchParams }: { searchParams: Promise<{ need?: string; next?: string }> }) {
  const { need, next } = await searchParams;
  const { tx } = await getTx();
  const user = await getCurrentUser();
  const name = user?.driver?.fullName ?? user?.company?.companyName ?? user?.email ?? "";
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "";
  return (
    <div className="page max-w-md py-12 text-center">
      <p className="text-5xl" aria-hidden>
        🔁
      </p>
      <h1 className="h1 mt-4">{need === "company" ? tx("This link is for a company account") : need === "admin" ? tx("This page is for admins") : tx("This link is for a driver account")}</h1>
      {user && <p className="muted mt-2">{tx("You're signed in as {name}.", { name })}</p>}
      <form action={logout} className="mt-6">
        <input type="hidden" name="next" value={safeNext} />
        <button className="btn-primary w-full">{tx("Log out and sign in with the right account")}</button>
      </form>
      <Link href="/dashboard" className="btn-ghost mt-2 w-full">
        {tx("Back to my dashboard")}
      </Link>
    </div>
  );
}
