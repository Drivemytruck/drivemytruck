"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

const MAX_BYTES = 600 * 1024;

/** Detects JPEG / PNG / WebP from the file's first bytes (don't trust the browser's type). */
function sniff(b: Uint8Array): string | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50)
    return "image/webp";
  return null;
}

export async function uploadAvatar(fd: FormData): Promise<{ error?: string; ok?: boolean }> {
  const user = await requireUser();
  const file = fd.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Please choose a photo." };
  if (file.size > MAX_BYTES) return { error: "That photo is too large. Please try another one." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = sniff(bytes);
  if (!mimeType) return { error: "Please upload a JPG, PNG or WebP image." };

  await db.$transaction([
    db.avatar.upsert({
      where: { userId: user.id },
      create: { userId: user.id, data: Buffer.from(bytes), mimeType },
      update: { data: Buffer.from(bytes), mimeType },
    }),
    db.user.update({ where: { id: user.id }, data: { avatarVersion: { increment: 1 } } }),
  ]);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeAvatar(): Promise<{ ok: boolean }> {
  const user = await requireUser();
  await db.$transaction([
    db.avatar.deleteMany({ where: { userId: user.id } }),
    db.user.update({ where: { id: user.id }, data: { avatarVersion: 0 } }),
  ]);
  revalidatePath("/", "layout");
  return { ok: true };
}
