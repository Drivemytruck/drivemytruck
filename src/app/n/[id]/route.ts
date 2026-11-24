import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

/** Open a notification: mark it read and go to what it's about. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const origin = new URL(req.url).origin;
  if (!user) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(`/n/${id}`)}`, origin));
  const n = await db.notification.findUnique({ where: { id } });
  if (!n || n.userId !== user.id) return NextResponse.redirect(new URL("/notifications", origin));
  if (!n.readAt) await db.notification.update({ where: { id }, data: { readAt: new Date() } });
  const to = n.link && n.link.startsWith("/") && !n.link.startsWith("//") ? n.link : "/notifications";
  return NextResponse.redirect(new URL(to, origin));
}
