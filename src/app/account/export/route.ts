import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { decrypt } from "@/lib/crypto";
import { INSTR_KEYS } from "@/lib/instructions";

/** UK GDPR right of access: everything we hold about the signed-in user, as JSON. */
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return new Response("Please log in", { status: 401 });
  const user = await db.user.findUnique({
    where: { id: me.id },
    include: {
      driver: { include: { documents: true, availability: true, applications: true, bookings: true } },
      company: { include: { jobs: true, bookings: true } },
      reviewsWritten: true,
      reviewsReceived: true,
      reliability: true,
    },
  });
  if (!user) return new Response("Not found", { status: 404 });
  const { passwordHash: _omit, ...safe } = user;
  void _omit;
  const data = {
    exportedAt: new Date().toISOString(),
    ...safe,
    driver: safe.driver && {
      ...safe.driver,
      documents: safe.driver.documents.map((d) => ({ ...d, reference: decrypt(d.reference), checkCode: decrypt(d.checkCode) })),
    },
    company: safe.company && {
      ...safe.company,
      ...Object.fromEntries(INSTR_KEYS.map((k) => [k, decrypt(safe.company![k])])),
      bookings: safe.company.bookings.map((b) => ({ ...b, instrExtra: decrypt(b.instrExtra) })),
    },
  };
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="drivemytruck-my-data.json"`,
      "Cache-Control": "no-store",
    },
  });
}
