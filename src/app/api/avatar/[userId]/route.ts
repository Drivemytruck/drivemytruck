import { db } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const avatar = await db.avatar.findUnique({ where: { userId } });
  if (!avatar) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(avatar.data), {
    headers: {
      "Content-Type": avatar.mimeType,
      // URLs carry ?v=<version>, so a new upload gets a new URL.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
