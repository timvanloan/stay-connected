"use client";

import { CheckInForm } from "./CheckInForm";
import { CheckInDisplay } from "./CheckInDisplay";
import type { NetworkFriend, NetworkMode } from "@/lib/constants/network";

type CheckIn = {
  id: string;
  user_id: string;
  primary_feeling: string;
  secondary_feeling: string | null;
  note: string | null;
  partner_appreciation: string | null;
  appreciation_target_type?: string | null;
  appreciation_target_id?: string | null;
  created_at: string;
};

export type FriendPulseHistory = CheckIn & {
  check_in_date: string;
  friend_name: string;
};

type DashboardContentProps = {
  ownCheckIn: CheckIn | null;
  friendCheckInsToday: (CheckIn & { friend_name: string })[];
  friendPreviousPulses: FriendPulseHistory[];
  friends: NetworkFriend[];
  mode: NetworkMode;
  viewerId: string;
};

export function DashboardContent({
  ownCheckIn,
  friendCheckInsToday,
  friendPreviousPulses,
  friends,
  mode,
  viewerId,
}: DashboardContentProps) {
  const unlocked = !!ownCheckIn;

  return (
    <div className="space-y-8">
      <CheckInForm
        existingCheckIn={ownCheckIn}
        mode={mode}
        friends={friends}
      />
      <CheckInDisplay
        ownCheckIn={ownCheckIn}
        unlocked={unlocked}
        friendCheckInsToday={unlocked ? friendCheckInsToday : []}
        friendPreviousPulses={unlocked ? friendPreviousPulses : []}
        hasFriends={friends.length > 0}
        friends={friends}
        viewerId={viewerId}
      />
    </div>
  );
}
