"use client";

import { useEffect } from "react";
import { TIMEZONE_COOKIE } from "@/lib/calendar-date";

/**
 * Persists the browser IANA timezone so the server can compute "today" for
 * check-in queries (must match getLocalCalendarDate on submit).
 */
export function TimezoneCookie() {
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!tz) return;
      const secure =
        typeof window !== "undefined" && window.location.protocol === "https:"
          ? ";secure"
          : "";
      document.cookie = `${TIMEZONE_COOKIE}=${encodeURIComponent(
        tz
      )};path=/;max-age=31536000;samesite=lax${secure}`;
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}
