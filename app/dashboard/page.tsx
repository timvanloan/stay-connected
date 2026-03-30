import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/DashboardContent";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("partner_id")
    .eq("id", user.id)
    .single();

  const today = new Date().toISOString().slice(0, 10);

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
        <h1 className="text-3xl font-serif text-[#2d2a26] mb-2">Dashboard</h1>
        <p className="text-[#6b6560] mb-8">
          {profile?.partner_id
            ? "You're connected with your partner."
            : "Complete pairing to see your partner's status."}
        </p>
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
