/**
 * Calendar dates for check_ins (YYYY-MM-DD) must match the user's local day,
 * not UTC — otherwise "today" on the server can disagree with stored rows.
 */

/** Browser / client: today's date in the user's local calendar. */
export function getLocalCalendarDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Server: same YYYY-MM-DD for a given IANA timezone (e.g. America/Los_Angeles). */
export function calendarDateInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  if (!y || !m || !d) {
    return date.toISOString().slice(0, 10);
  }
  return `${y}-${m}-${d}`;
}

export const TIMEZONE_COOKIE = "tz";

/**
 * Prefer cookie (set from the browser's IANA zone), then Vercel's IP-derived zone,
 * then UTC so server and client agree after the first client paint.
 */
export function getRequestCalendarDate(
  cookieTz: string | undefined,
  headerTz: string | null
): string {
  const tz = cookieTz || headerTz || "UTC";
  return calendarDateInTimeZone(new Date(), tz);
}
