"use client";

import {
  FEELING_COLORS,
  FEELING_EMOJIS,
  normalizePrimaryFeeling,
  normalizeSecondaryLabel,
} from "@/lib/constants/feelings";

type CheckIn = {
  id: string;
  user_id: string;
  primary_feeling: string;
  secondary_feeling: string | null;
  note: string | null;
  partner_appreciation: string | null;
  created_at: string;
  is_own?: boolean;
};

type PartnerPulseHistory = CheckIn & { check_in_date: string };

function formatPulseDate(isoDate: string) {
  const d = new Date(isoDate + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type CheckInDisplayProps = {
  ownCheckIn: CheckIn | null;
  partnerCheckIn: CheckIn | null;
  partnerPreviousPulses: PartnerPulseHistory[];
  hasPartner: boolean;
};

function CheckInCard({
  checkIn,
  label,
  isPartner = false,
  dateLabel = false,
}: {
  checkIn: CheckIn;
  label: string;
  isPartner?: boolean;
  /** When true, label is a date — no uppercase styling */
  dateLabel?: boolean;
}) {
  const appreciationLabel = isPartner
    ? "Appreciating about you"
    : "Appreciating about my partner";
  const primaryKey = normalizePrimaryFeeling(checkIn.primary_feeling);
  const color = FEELING_COLORS[primaryKey] ?? "#6b6560";
  const feelingLabel =
    normalizeSecondaryLabel(checkIn.secondary_feeling) ??
    checkIn.primary_feeling;

  return (
    <div
      className={`rounded-xl border border-[#e5e2de] bg-white p-4 ${
        isPartner && !dateLabel ? "min-h-[8rem]" : ""
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
          <span>{FEELING_EMOJIS[feelingLabel] ?? FEELING_EMOJIS[primaryKey]}</span>
        )}
        {feelingLabel}
      </p>
      {checkIn.note && (
        <p className="text-sm text-[#6b6560] mt-2 italic">
          &ldquo;{checkIn.note}&rdquo;
        </p>
      )}
      {checkIn.partner_appreciation && (
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
  partnerCheckIn,
  partnerPreviousPulses,
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
            <CheckInCard checkIn={partnerCheckIn} label="Partner" isPartner />
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

      {hasPartner && partnerPreviousPulses.length > 0 && (
        <div className="mt-10 pt-8 border-t border-[#e5e2de]">
          <h2 className="text-lg font-serif text-[#2d2a26] mb-1">
            Previous Pulses
          </h2>
          <p className="text-sm text-[#6b6560] mb-4">
            Up to 50 of your partner&apos;s past check-ins (newest first).
          </p>
          <div className="max-h-[min(70vh,32rem)] overflow-y-auto pr-1 -mr-1 space-y-3 rounded-xl border border-[#e5e2de] bg-[#f5f3f0] p-3">
            {partnerPreviousPulses.map((pulse) => (
              <CheckInCard
                key={pulse.id}
                checkIn={pulse}
                label={formatPulseDate(pulse.check_in_date)}
                isPartner
                dateLabel
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
