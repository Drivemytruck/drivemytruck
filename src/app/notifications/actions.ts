"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function markAllRead() {
  const user = await requireUser();
  await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/", "layout");
}

export async function dismissNotification(fd: FormData) {
  const user = await requireUser();
  await db.notification.updateMany({ where: { id: String(fd.get("id")), userId: user.id }, data: { readAt: new Date() } });
  revalidatePath("/", "layout");
}
