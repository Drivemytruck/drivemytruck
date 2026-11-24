import { NextResponse } from "next/server";
import { LANG_COOKIE } from "@/lib/i18n";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

/** /lang?to=pl&back=/register — switches language and returns to the page. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const to = url.searchParams.get("to") === "pl" ? "pl" : "en";
  const back = url.searchParams.get("back") ?? "/";
  const safeBack = back.startsWith("/") && !back.startsWith("//") ? back : "/";
  const user = await getCurrentUser();
  if (user && user.locale !== to) await db.user.update({ where: { id: user.id }, data: { locale: to } });
  const res = NextResponse.redirect(new URL(safeBack, url.origin));
  res.cookies.set(LANG_COOKIE, to, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return res;
}
