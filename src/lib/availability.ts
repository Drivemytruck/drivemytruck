import { money } from "./format";

export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

type Window = { startTime: string | null; endTime: string | null; slot?: string | null };

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

function londonHHMM(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
}

/** Hours are a guide, not a contract: a start up to this many minutes outside the window still counts. */
export const TIME_SLACK_MIN = 180;

/** Does a job starting at `start` fit the driver's availability window for that day (with some wiggle room)? */
export function jobFitsWindow(start: Date, a: Window, slackMin = TIME_SLACK_MIN) {
  const t = toMin(londonHHMM(start));
  if (a.startTime && a.endTime) {
    const s = toMin(a.startTime);
    let e = toMin(a.endTime);
    if (e < s) e += 1440; // overnight window, e.g. 18:00–06:00
    if (e - s + 2 * slackMin >= 1440) return true;
    const lo = s - slackMin;
    const hi = e + slackMin;
    // Check the job time on the same day and wrapped around midnight.
    return [t, t + 1440, t - 1440].some((x) => x >= lo && x <= hi);
  }
  if (a.slot === "DAY") return t >= 4 * 60 && t < 18 * 60;
  if (a.slot === "NIGHT") return t >= 17 * 60 || t < 6 * 60;
  return true;
}

export function windowLabel(a: Window) {
  if (a.startTime && a.endTime) return `${a.startTime}–${a.endTime}`;
  if (a.slot === "DAY") return "days";
  if (a.slot === "NIGHT") return "nights";
  return "any time";
}

export function dayRateLabel(a: { rateAmount: number | null; rateType: "SHIFT" | "HOURLY" | "ANNUAL" | null }) {
  if (a.rateAmount == null) return null;
  return `${money(a.rateAmount)}${a.rateType === "HOURLY" ? "/h" : "/shift"}`;
}

/** Today's date (London) as a UTC-midnight Date, matching how Availability.date is stored. */
export function todayDate() {
  return new Date(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date()) + "T00:00:00Z");
}
