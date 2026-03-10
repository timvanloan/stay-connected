"use client";

import { FEELING_COLORS } from "@/lib/constants/feelings";

type CheckIn = {
  id: string;
  user_id: string;
  primary_feeling: string;
  secondary_feeling: string | null;
  note: string | null;
  created_at: string;
  is_own?: boolean;
};

type CheckInDisplayProps = {
  ownCheckIn: CheckIn | null;
  partnerCheckIn: CheckIn | null;
  hasPartner: boolean;
};

function CheckInCard({
  checkIn,
  label,
}: {
  checkIn: CheckIn;
  label: string;
}) {
  const color =
    FEELING_COLORS[checkIn.primary_feeling as keyof typeof FEELING_COLORS] ??
    "#6b6560";
  const feelingLabel = checkIn.secondary_feeling ?? checkIn.primary_feeling;

  return (
    <div
      className="rounded-xl border border-[#e5e2de] bg-white p-4"
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <p className="text-xs font-medium text-[#6b6560] uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="font-medium text-[#2d2a26]">{feelingLabel}</p>
      {checkIn.note && (
        <p className="text-sm text-[#6b6560] mt-2 italic">&ldquo;{checkIn.note}&rdquo;</p>
      )}
    </div>
  );
}

export function CheckInDisplay({
  ownCheckIn,
  partnerCheckIn,
  hasPartner,
}: CheckInDisplayProps) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-serif text-[#2d2a26]">Today&apos;s pulse</h2>
      <p className="text-sm text-[#6b6560]">{today}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {ownCheckIn ? (
          <CheckInCard checkIn={ownCheckIn} label="You" />
        ) : (
          <div className="rounded-xl border border-[#e5e2de] bg-[#f5f3f0] p-4 flex items-center justify-center min-h-[80px]">
            <p className="text-sm text-[#6b6560]">You haven&apos;t checked in yet</p>
          </div>
        )}
        {hasPartner ? (
          partnerCheckIn ? (
            <CheckInCard checkIn={partnerCheckIn} label="Partner" />
          ) : (
            <div className="rounded-xl border border-[#e5e2de] bg-[#f5f3f0] p-4 flex items-center justify-center min-h-[80px]">
              <p className="text-sm text-[#6b6560]">Partner hasn&apos;t checked in yet</p>
            </div>
          )
        ) : (
          <div className="rounded-xl border border-[#e5e2de] bg-[#f5f3f0] p-4 flex items-center justify-center min-h-[80px]">
            <p className="text-sm text-[#6b6560]">Complete pairing to see partner</p>
          </div>
        )}
      </div>
    </div>
  );
}
