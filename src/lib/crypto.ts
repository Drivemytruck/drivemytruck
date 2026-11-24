import "server-only";
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

/**
 * Field-level encryption for sensitive values (document numbers, DVLA check codes).
 * AES-256-GCM. Key: DOCS_ENCRYPTION_KEY (base64, 32 bytes) if set, otherwise derived from SESSION_SECRET.
 * NOTE: if neither key is kept, encrypted values can't be read back — never rotate them without re-encrypting.
 */
const PREFIX = "enc:v1:";

function key() {
  const explicit = process.env.DOCS_ENCRYPTION_KEY;
  if (explicit) {
    const k = Buffer.from(explicit, "base64");
    if (k.length !== 32) throw new Error("DOCS_ENCRYPTION_KEY must be 32 bytes, base64-encoded");
    return k;
  }
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return Buffer.from(hkdfSync("sha256", secret, "drivemytruck", "documents-v1", 32));
}

export function encrypt(plain: string | null | undefined): string | null {
  if (plain == null || plain === "") return null;
  if (plain.startsWith(PREFIX)) return plain;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `${PREFIX}${iv.toString("base64")}.${cipher.getAuthTag().toString("base64")}.${ct.toString("base64")}`;
}

export function decrypt(value: string | null | undefined): string | null {
  if (value == null) return null;
  if (!value.startsWith(PREFIX)) return value; // legacy plaintext
  try {
    const [iv, tag, ct] = value.slice(PREFIX.length).split(".").map((p) => Buffer.from(p, "base64"));
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
  } catch {
    return "[unreadable]";
  }
}

export const isEncrypted = (v: string | null | undefined) => !!v && v.startsWith(PREFIX);
