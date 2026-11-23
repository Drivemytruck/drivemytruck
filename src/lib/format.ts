const TZ = "Europe/London";

export function money(pence: number | null | undefined) {
  if (pence == null) return "—";
  const pounds = pence / 100;
  return `£${pounds.toLocaleString("en-GB", { minimumFractionDigits: pounds % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;
}

type PayKind = "SHIFT" | "HOURLY" | "ANNUAL";

export function payUnit(type: PayKind) {
  return type === "HOURLY" ? "per hour" : type === "ANNUAL" ? "per year" : "per shift";
}

/** Compact pay for pins and chips: £250, £17.50/h, £38k/yr */
export function payShort(pence: number, type: PayKind) {
  if (type === "ANNUAL") return `£${Math.round(pence / 100000)}k/yr`;
  return money(pence) + (type === "HOURLY" ? "/h" : "");
}

export function payLabel(pence: number | null | undefined, type: PayKind) {
  return `${money(pence)} ${payUnit(type)}`;
}

export function dateTime(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function dateOnly(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" }).format(d);
}

export function relativeDay(d: Date) {
  const fmt = (x: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(x);
  const today = new Date();
  const tomorrow = new Date(Date.now() + 86400000);
  if (fmt(d) === fmt(today)) return "Today";
  if (fmt(d) === fmt(tomorrow)) return "Tomorrow";
  return dateOnly(d);
}

export function timeOnly(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(d);
}

/** YYYY-MM-DD for "today" in London. */
export function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

/** Parses "YYYY-MM-DD" + "HH:MM" as London local time into a UTC Date. */
export function londonToDate(date: string, time: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  // Start with UTC guess, then correct by London offset at that moment.
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm));
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(guess);
  const lh = Number(parts.find((p) => p.type === "hour")?.value);
  const lm = Number(parts.find((p) => p.type === "minute")?.value);
  const offsetMin = (lh * 60 + lm - (hh * 60 + mm) + 1440) % 1440;
  return new Date(guess.getTime() - (offsetMin > 720 ? offsetMin - 1440 : offsetMin) * 60000);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}
