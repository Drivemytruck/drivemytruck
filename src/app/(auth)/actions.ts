"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";
import { geocodePostcode, isValidUkPostcode } from "@/lib/geo";
import { TERMS_VERSION } from "@/lib/constants";
import { tr } from "@/lib/i18n";
import type { ActionState } from "@/components/forms";

const registerSchema = z.object({
  role: z.enum(["DRIVER", "COMPANY"]),
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().toLowerCase().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  postcode: z.string().trim().refine(isValidUkPostcode, "Please enter a valid UK postcode (e.g. B1 1AA)"),
  terms: z.literal("on", { errorMap: () => ({ message: "Please accept the terms to continue" }) }),
});

export async function register(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    const pl: Record<string, string> = {
      name: "Wpisz imię i nazwisko albo nazwę firmy.",
      email: "Wpisz poprawny adres e-mail.",
      password: "Hasło musi mieć minimum 8 znaków.",
      postcode: "Wpisz poprawny brytyjski kod pocztowy (np. B1 1AA).",
      terms: "Zaakceptuj regulamin, żeby kontynuować.",
    };
    return { error: await tr(parsed.error.issues[0]?.message ?? "Please check the form.", pl[String(field)] ?? "Sprawdź formularz.") };
  }
  const { role, name, email, password, postcode } = parsed.data;

  if (await db.user.findUnique({ where: { email } })) {
    return { error: await tr("An account with this email already exists. Try logging in.", "Konto z tym adresem e-mail już istnieje. Spróbuj się zalogować.") };
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const isAdmin = !!adminEmail && adminEmail === email;
  const geo = await geocodePostcode(postcode);
  const passwordHash = await bcrypt.hash(password, 12);

  const marketing = formData.get("marketing") === "on";
  const now = new Date();
  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      termsAcceptedAt: now,
      termsVersion: TERMS_VERSION,
      marketingConsent: marketing,
      marketingConsentAt: marketing ? now : null,
      role: isAdmin ? "ADMIN" : role,
      ...(isAdmin
        ? {}
        : role === "DRIVER"
          ? { driver: { create: { fullName: name, postcode: geo.postcode, town: geo.town, lat: geo.lat, lng: geo.lng } } }
          : { company: { create: { companyName: name, postcode: geo.postcode, town: geo.town, lat: geo.lat, lng: geo.lng } } }),
    },
  });

  await createSession(user.id, user.role, user.sessionVersion);
  redirect(user.role === "DRIVER" ? "/driver/profile?welcome=1" : user.role === "COMPANY" ? "/company/profile?welcome=1" : "/admin");
}

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

export async function login(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  const password = String(formData.get("password") ?? "");
  // Slow down password guessing: max 5 wrong attempts per email per 15 minutes.
  const since = new Date(Date.now() - LOCK_MINUTES * 60000);
  const recentFails = await db.failedLogin.count({ where: { email, createdAt: { gte: since } } });
  if (recentFails >= MAX_FAILED) {
    return {
      error: await tr(
        `Too many attempts. Please wait ${LOCK_MINUTES} minutes or reset your password.`,
        `Za dużo prób. Odczekaj ${LOCK_MINUTES} minut albo zresetuj hasło.`,
      ),
    };
  }
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    await db.failedLogin.create({ data: { email } });
    return { error: await tr("Wrong email or password.", "Nieprawidłowy e-mail lub hasło.") };
  }
  if (user.suspended)
    return {
      error: await tr(
        "This account has been suspended. Please contact hello@drivemytruck.co.uk.",
        "To konto zostało zablokowane. Napisz do nas: hello@drivemytruck.co.uk.",
      ),
    };
  await db.failedLogin.deleteMany({ where: { email } });
  await createSession(user.id, user.role, user.sessionVersion);
  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
