import type { SupabaseClient } from "@supabase/supabase-js";
import { getLocalCalendarDate } from "@/lib/calendar-date";
import type { PrimaryFeeling } from "@/lib/constants/feelings";

type UpsertArgs = {
  userId: string;
  primary: PrimaryFeeling;
  secondary: string | null;
  note: string | null;
  partnerAppreciation: string | null;
};

/** PostgREST / Postgres errors sometimes split text across `message`, `details`, `hint`. */
function errorText(err: unknown): string {
  if (err == null) return "";
  if (typeof err === "string") return err;
  if (typeof err !== "object") return String(err);
  const o = err as {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
  };
  return [o.message, o.details, o.hint, o.code].filter(Boolean).join(" ");
}

/** Legacy DBs allow `Afraid` in CHECK but not `Fear`. */
function shouldRetryFearAsAfraid(primary: PrimaryFeeling, err: unknown): boolean {
  if (primary !== "Fear") return false;
  const t = errorText(err).toLowerCase();
  if (!t.includes("check_ins")) return false;
  return (
    t.includes("23514") ||
    t.includes("check_ins_primary_feeling_check") ||
    (t.includes("violates") && t.includes("check constraint")) ||
    (t.includes("new row") && t.includes("check"))
  );
}

/**
 * Upserts today's check-in. If the DB still enforces legacy `Afraid` in the
 * CHECK constraint, retries once with `Afraid` after `Fear` fails (read paths
 * already normalize Afraid → Fear via normalizePrimaryFeeling).
 */
export async function upsertTodayCheckIn(
  supabase: SupabaseClient,
  args: UpsertArgs
): Promise<{ error: { message: string } | null }> {
  const { userId, primary, secondary, note, partnerAppreciation } = args;

  const row = (primaryFeeling: string) => ({
    user_id: userId,
    check_in_date: getLocalCalendarDate(),
    primary_feeling: primaryFeeling,
    secondary_feeling: secondary,
    note: (note ?? "").trim() || null,
    partner_appreciation: (partnerAppreciation ?? "").trim() || null,
    updated_at: new Date().toISOString(),
  });

  const opts = { onConflict: "user_id,check_in_date" as const };

  let { error } = await supabase.from("check_ins").upsert(row(primary), opts);
  if (!error) return { error: null };

  if (shouldRetryFearAsAfraid(primary, error)) {
    ({ error } = await supabase.from("check_ins").upsert(row("Afraid"), opts));
  }

  return { error: error ? { message: error.message } : null };
}
