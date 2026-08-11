import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const GRACE_PERIOD_DAYS = 14;

/**
 * Vercel Cron hits this daily. Vercel sends `Authorization: Bearer $CRON_SECRET`
 * automatically when CRON_SECRET is set — see vercel.json for the schedule.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createAdminClient();
  const cutoff = new Date(
    Date.now() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: dueForDeletion, error: queryError } = await supabase
    .from("profiles")
    .select("id")
    .not("deletion_requested_at", "is", null)
    .lt("deletion_requested_at", cutoff);

  if (queryError) {
    return NextResponse.json({ error: queryError.message }, { status: 500 });
  }

  const results = await Promise.allSettled(
    (dueForDeletion ?? []).map((row) =>
      supabase.auth.admin.deleteUser(row.id)
    )
  );

  const purged = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - purged;

  return NextResponse.json({ purged, failed });
}
