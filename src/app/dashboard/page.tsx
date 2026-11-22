import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";

export default async function Dashboard() {
  const user = await requireUser();
  redirect(user.role === "DRIVER" ? "/driver" : user.role === "COMPANY" ? "/company" : "/admin");
}
