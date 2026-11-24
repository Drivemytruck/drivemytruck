"use server";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import { sendEmail, siteUrl } from "@/lib/email";
import { tr } from "@/lib/i18n";
import type { ActionState } from "@/components/forms";

const TOKEN_TTL_MIN = 60;
const hash = (t: string) => createHash("sha256").update(t).digest("hex");

export async function requestPasswordReset(_: ActionState, fd: FormData): Promise<ActionState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const done: ActionState = {
    ok: await tr(
      "If an account exists for that email, we've sent a link to reset your password. Check your inbox (and spam).",
      "Jeśli konto z tym adresem istnieje, wysłaliśmy link do zmiany hasła. Sprawdź skrzynkę (i spam).",
    ),
  };
  if (!email.includes("@")) return { error: await tr("Please enter your email.", "Wpisz swój e-mail.") };

  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.suspended) return done; // don't reveal whether the account exists

  // Basic throttle: max 3 links per hour per account.
  const recent = await db.passwordResetToken.count({ where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 3600000) } } });
  if (recent >= 3) return done;

  const token = randomBytes(32).toString("base64url");
  await db.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hash(token), expiresAt: new Date(Date.now() + TOKEN_TTL_MIN * 60000) },
  });
  const link = `${siteUrl()}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Reset your Drive My Truck password",
    text: `Someone asked to reset the password for your Drive My Truck account.\n\nReset it here (valid for ${TOKEN_TTL_MIN} minutes):\n${link}\n\nIf this wasn't you, you can ignore this email.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#0f172a">
      <h2 style="color:#0b2a5b">Drive My <span style="color:#e31b23">Truck</span></h2>
      <p>Someone asked to reset the password for your Drive My Truck account.</p>
      <p><a href="${link}" style="display:inline-block;background:#e31b23;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">Reset password</a></p>
      <p style="color:#64748b;font-size:13px">The link is valid for ${TOKEN_TTL_MIN} minutes. If this wasn't you, you can ignore this email.</p>
    </div>`,
  });
  return done;
}

export async function resetPassword(_: ActionState, fd: FormData): Promise<ActionState> {
  const token = String(fd.get("token") ?? "");
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) return { error: await tr("Password must be at least 8 characters.", "Hasło musi mieć minimum 8 znaków.") };
  if (password !== String(fd.get("confirm") ?? "")) return { error: await tr("The two passwords don't match.", "Hasła nie są takie same.") };

  const row = await db.passwordResetToken.findUnique({ where: { tokenHash: hash(token) }, include: { user: true } });
  if (!row || row.usedAt || row.expiresAt < new Date() || row.user.suspended) {
    return { error: await tr("This link has expired or was already used. Please request a new one.", "Ten link wygasł albo został już użyty. Poproś o nowy.") };
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await db.$transaction([
    db.user.update({ where: { id: row.userId }, data: { passwordHash, sessionVersion: { increment: 1 } } }),
    db.failedLogin.deleteMany({ where: { email: row.user.email } }),
    db.passwordResetToken.updateMany({ where: { userId: row.userId, usedAt: null }, data: { usedAt: new Date() } }),
  ]);
  await createSession(row.user.id, row.user.role, row.user.sessionVersion + 1);
  redirect("/dashboard");
}
