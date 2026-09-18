import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/DashboardContent";
import { isSubscriptionActive } from "@/lib/constants/billing";
import {
  friendLabel,
  type MyNetwork,
  type NetworkFriend,
  type NetworkMode,
} from "@/lib/constants/network";
import {
  getRequestCalendarDate,
  TIMEZONE_COOKIE,
} from "@/lib/calendar-date";

type CheckInRow = {
  id: string;
  user_id: string;
  primary_feeling: string;
  secondary_feeling: string | null;
  note: string | null;
  partner_appreciation: string | null;
  appreciation_target_type: string | null;
  appreciation_target_id: string | null;
  created_at: string;
  check_in_date?: string;
};

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
    .select("deletion_requested_at, subscription_status, display_name")
    .eq("id", user.id)
    .single();

  if (
    process.env.REQUIRE_SUBSCRIPTION === "true" &&
    !isSubscriptionActive(profile?.subscription_status)
  ) {
    redirect("/pricing");
  }

  const { data: networkData } = await supabase.rpc("get_my_network");
  const network = networkData as MyNetwork | null;
  const friends: NetworkFriend[] = network?.success ? network.friends : [];
  const mode: NetworkMode = network?.success ? network.mode : "solo";

  const checkInSelect =
    "id, user_id, primary_feeling, secondary_feeling, note, partner_appreciation, appreciation_target_type, appreciation_target_id, created_at, check_in_date";

  const { data: ownCheckIn } = await supabase
    .from("check_ins")
    .select(checkInSelect)
    .eq("user_id", user.id)
    .eq("check_in_date", today)
    .single();

  let friendCheckInsToday: (CheckInRow & { friend_name: string })[] = [];
  let friendPreviousPulses: (CheckInRow & {
    check_in_date: string;
    friend_name: string;
  })[] = [];

  // Gate: only load friends' pulses after you've checked in today
  if (ownCheckIn && friends.length > 0) {
    const friendIds = friends.map((f) => f.id);
    const nameById = Object.fromEntries(
      friends.map((f) => [f.id, friendLabel(f)])
    );

    const { data: todayRows } = await supabase
      .from("check_ins")
      .select(checkInSelect)
      .in("user_id", friendIds)
      .eq("check_in_date", today);

    friendCheckInsToday = (todayRows ?? []).map((row) => ({
      ...(row as CheckInRow),
      friend_name: nameById[row.user_id] ?? "Friend",
    }));

    const { data: history } = await supabase
      .from("check_ins")
      .select(checkInSelect)
      .in("user_id", friendIds)
      .lt("check_in_date", today)
      .order("check_in_date", { ascending: false })
      .limit(50);

    friendPreviousPulses = (history ?? []).map((row) => ({
      ...(row as CheckInRow),
      check_in_date: row.check_in_date as string,
      friend_name: nameById[row.user_id] ?? "Friend",
    }));
  }

  const statusCopy =
    mode === "couple"
      ? `Couples mode with ${friendLabel(friends[0])}.`
      : mode === "group"
        ? `Group mode — ${network?.component_size ?? friends.length + 1} people in your connection.`
        : "Add a friend to share how you're feeling.";

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-3xl font-serif text-[#2d2a26]">Dashboard</h1>
          <div className="mt-2 flex gap-3 text-sm whitespace-nowrap">
            <Link href="/pair" className="text-[#A78BFA] hover:underline">
              Friends
            </Link>
            <Link href="/settings" className="text-[#A78BFA] hover:underline">
              Settings
            </Link>
          </div>
        </div>
        <p className="text-[#6b6560] mb-8">{statusCopy}</p>
        {profile?.deletion_requested_at && (
          <div className="mb-8 rounded-xl border border-[#F87171]/40 bg-[#F87171]/10 px-4 py-3 text-sm text-[#8a3a3a]">
            Your account is scheduled for deletion.{" "}
            <Link href="/settings" className="underline font-medium">
              Manage in Settings
            </Link>
          </div>
        )}
        {!profile?.display_name && (
          <div className="mb-8 rounded-xl border border-[#e5e2de] bg-[#f5f3f0] px-4 py-3 text-sm text-[#6b6560]">
            Add a display name so friends know who you are.{" "}
            <Link href="/pair" className="text-[#A78BFA] hover:underline">
              Set it on Friends
            </Link>
            .
          </div>
        )}
        <DashboardContent
          ownCheckIn={ownCheckIn}
          friendCheckInsToday={friendCheckInsToday}
          friendPreviousPulses={friendPreviousPulses}
          friends={friends}
          mode={mode}
          viewerId={user.id}
        />
      </div>
    </main>
  );
}
