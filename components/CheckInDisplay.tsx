"use client";

import {
  FEELING_COLORS,
  FEELING_EMOJIS,
  normalizePrimaryFeeling,
  normalizeSecondaryLabel,
} from "@/lib/constants/feelings";
import { friendLabel, type NetworkFriend } from "@/lib/constants/network";

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

type FriendPulseHistory = CheckIn & {
  check_in_date: string;
  friend_name?: string;
};

function formatPulseDate(isoDate: string) {
  const d = new Date(isoDate + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function appreciationViewerLabel(
  checkIn: CheckIn,
  isFriend: boolean,
  friends: NetworkFriend[]
): string {
  if (!isFriend) {
    if (checkIn.appreciation_target_type === "group") {
      return "Appreciating about the group";
    }
    if (checkIn.appreciation_target_type === "person") {
      const name = friendLabel(
        friends.find((f) => f.id === checkIn.appreciation_target_id)
      );
      return `Appreciating about ${name}`;
    }
    return "Appreciating about my partner";
  }

  if (checkIn.appreciation_target_type === "group") {
    return "Appreciating about the group";
  }
  if (checkIn.appreciation_target_type === "person") {
    return "Appreciating about you";
  }
  return "Appreciating about you";
}

type CheckInDisplayProps = {
  ownCheckIn: CheckIn | null;
  /** Only populated after the viewer has checked in today */
  unlocked: boolean;
  friendCheckInsToday: (CheckIn & { friend_name: string })[];
  friendPreviousPulses: FriendPulseHistory[];
  hasFriends: boolean;
  friends: NetworkFriend[];
  viewerId: string;
};

function shouldShowAppreciation(
  checkIn: CheckIn,
  isFriendCard: boolean,
  viewerId: string
): boolean {
  if (!checkIn.partner_appreciation) return false;
  if (!isFriendCard) return true;
  if (checkIn.appreciation_target_type === "group") return true;
  if (checkIn.appreciation_target_type === "partner") return true;
  if (checkIn.appreciation_target_type === "person") {
    return checkIn.appreciation_target_id === viewerId;
  }
  // Legacy couple appreciations with no target metadata
  return true;
}

function CheckInCard({
  checkIn,
  label,
  isFriend = false,
  dateLabel = false,
  friends = [],
  viewerId,
}: {
  checkIn: CheckIn;
  label: string;
  isFriend?: boolean;
  dateLabel?: boolean;
  friends?: NetworkFriend[];
  viewerId: string;
}) {
  const appreciationLabel = appreciationViewerLabel(checkIn, isFriend, friends);
  const primaryKey = normalizePrimaryFeeling(checkIn.primary_feeling);
  const color = FEELING_COLORS[primaryKey] ?? "#6b6560";
  const feelingLabel =
    normalizeSecondaryLabel(checkIn.secondary_feeling) ??
    checkIn.primary_feeling;

  return (
    <div
      className={`rounded-xl border border-[#e5e2de] bg-white p-4 ${
        isFriend && !dateLabel ? "min-h-[8rem]" : ""
      }`}
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <p
        className={`text-xs font-medium text-[#6b6560] mb-1 ${
          dateLabel ? "" : "uppercase tracking-wide"
        }`}
      >
        {label}
      </p>
      <p className="font-medium text-[#2d2a26] flex items-center gap-1.5">
        {(FEELING_EMOJIS[feelingLabel] ?? FEELING_EMOJIS[primaryKey]) && (
          <span>
            {FEELING_EMOJIS[feelingLabel] ?? FEELING_EMOJIS[primaryKey]}
          </span>
        )}
        {feelingLabel}
      </p>
      {checkIn.note && (
        <p className="text-sm text-[#6b6560] mt-2 italic">
          &ldquo;{checkIn.note}&rdquo;
        </p>
      )}
      {shouldShowAppreciation(checkIn, isFriend, viewerId) && (
        <div className="mt-3 pt-3 border-t border-[#e5e2de]">
          <p className="text-xs font-medium text-[#6b6560] mb-1">
            {appreciationLabel}
          </p>
          <p className="text-sm text-[#2d2a26]">
            {checkIn.partner_appreciation}
          </p>
        </div>
      )}
    </div>
  );
}

export function CheckInDisplay({
  ownCheckIn,
  unlocked,
  friendCheckInsToday,
  friendPreviousPulses,
  hasFriends,
  friends,
  viewerId,
}: CheckInDisplayProps) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  if (!unlocked) {
    return (
      <div className="rounded-xl border border-[#e5e2de] bg-[#f5f3f0] p-6 text-center">
        <h2 className="text-lg font-serif text-[#2d2a26] mb-2">
          Today&apos;s pulse
        </h2>
        <p className="text-sm text-[#6b6560]">
          Check in with how you&apos;re feeling to see your friends&apos; pulses
          for today.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-serif text-[#2d2a26]">Today&apos;s pulse</h2>
      <p className="text-sm text-[#6b6560]">{today}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {ownCheckIn ? (
          <CheckInCard
            checkIn={ownCheckIn}
            label="You"
            friends={friends}
            viewerId={viewerId}
          />
        ) : (
          <div className="rounded-xl border border-[#e5e2de] bg-[#f5f3f0] p-4 flex items-center justify-center min-h-[80px]">
            <p className="text-sm text-[#6b6560]">
              You haven&apos;t checked in yet
            </p>
          </div>
        )}

        {!hasFriends && (
          <div className="rounded-xl border border-[#e5e2de] bg-[#f5f3f0] p-4 flex items-center justify-center min-h-[80px]">
            <p className="text-sm text-[#6b6560]">
              Connect with a friend to see their pulse
            </p>
          </div>
        )}

        {friendCheckInsToday.map((checkIn) => (
          <CheckInCard
            key={checkIn.id}
            checkIn={checkIn}
            label={checkIn.friend_name}
            isFriend
            friends={friends}
            viewerId={viewerId}
          />
        ))}

        {hasFriends &&
          friendCheckInsToday.length < friends.length &&
          friends
            .filter((f) => !friendCheckInsToday.some((c) => c.user_id === f.id))
            .map((f) => (
              <div
                key={f.id}
                className="rounded-xl border border-[#e5e2de] bg-[#f5f3f0] p-4 flex items-center justify-center min-h-[80px]"
              >
                <p className="text-sm text-[#6b6560]">
                  {friendLabel(f)} hasn&apos;t checked in yet
                </p>
              </div>
            ))}
      </div>

      {hasFriends && friendPreviousPulses.length > 0 && (
        <div className="mt-10 pt-8 border-t border-[#e5e2de]">
          <h2 className="text-lg font-serif text-[#2d2a26] mb-1">
            Previous Pulses
          </h2>
          <p className="text-sm text-[#6b6560] mb-4">
            Recent check-ins from your friends (newest first).
          </p>
          <div className="max-h-[min(70vh,32rem)] overflow-y-auto pr-1 -mr-1 space-y-3 rounded-xl border border-[#e5e2de] bg-[#f5f3f0] p-3">
            {friendPreviousPulses.map((pulse) => (
              <CheckInCard
                key={pulse.id}
                checkIn={pulse}
                label={`${pulse.friend_name ?? "Friend"} · ${formatPulseDate(pulse.check_in_date)}`}
                isFriend
                dateLabel
                friends={friends}
                viewerId={viewerId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
