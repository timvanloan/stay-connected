import { createClient } from "@/lib/supabase/server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/DashboardContent";
import {
  getRequestCalendarDate,
  TIMEZONE_COOKIE,
} from "@/lib/calendar-date";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const headerList = await headers();
  const tzCookie = cookieStore.get(TIMEZONE_COOKIE)?.value;
  const tzHeader = headerList.get("x-vercel-ip-timezone");
  const today = getRequestCalendarDate(
    tzCookie ? decodeURIComponent(tzCookie) : undefined,
    tzHeader
  );

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("partner_id, deletion_requested_at")
    .eq("id", user.id)
    .single();

  const { data: ownCheckIn } = await supabase
    .from("check_ins")
    .select(
      "id, user_id, primary_feeling, secondary_feeling, note, partner_appreciation, created_at"
    )
    .eq("user_id", user.id)
    .eq("check_in_date", today)
    .single();

  let partnerCheckIn = null;
  let partnerPreviousPulses: {
    id: string;
    user_id: string;
    primary_feeling: string;
    secondary_feeling: string | null;
    note: string | null;
    partner_appreciation: string | null;
    created_at: string;
    check_in_date: string;
  }[] = [];

  if (profile?.partner_id) {
    const { data } = await supabase
      .from("check_ins")
      .select(
        "id, user_id, primary_feeling, secondary_feeling, note, partner_appreciation, created_at, check_in_date"
      )
      .eq("user_id", profile.partner_id)
      .eq("check_in_date", today)
      .single();
    partnerCheckIn = data;

    const { data: history } = await supabase
      .from("check_ins")
      .select(
        "id, user_id, primary_feeling, secondary_feeling, note, partner_appreciation, created_at, check_in_date"
      )
      .eq("user_id", profile.partner_id)
      .lt("check_in_date", today)
      .order("check_in_date", { ascending: false })
      .limit(50);
    partnerPreviousPulses = history ?? [];
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-3xl font-serif text-[#2d2a26]">Dashboard</h1>
          <a
            href="/settings"
            className="mt-2 text-sm text-[#A78BFA] hover:underline whitespace-nowrap"
          >
            Settings
          </a>
        </div>
        <p className="text-[#6b6560] mb-8">
          {profile?.partner_id
            ? "You're connected with your partner."
            : "Complete pairing to see your partner's status."}
        </p>
        {profile?.deletion_requested_at && (
          <div className="mb-8 rounded-xl border border-[#F87171]/40 bg-[#F87171]/10 px-4 py-3 text-sm text-[#8a3a3a]">
            Your account is scheduled for deletion.{" "}
            <a href="/settings" className="underline font-medium">
              Manage in Settings
            </a>
          </div>
        )}
        <DashboardContent
          ownCheckIn={ownCheckIn}
          partnerCheckIn={partnerCheckIn}
          partnerPreviousPulses={partnerPreviousPulses}
          hasPartner={!!profile?.partner_id}
        />
      </div>
    </main>
  );
}
