"use client";

import { CheckInForm } from "./CheckInForm";
import { CheckInDisplay } from "./CheckInDisplay";

type CheckIn = {
  id: string;
  user_id: string;
  primary_feeling: string;
  secondary_feeling: string | null;
  note: string | null;
  partner_appreciation: string | null;
  created_at: string;
};

export type PartnerPulseHistory = CheckIn & { check_in_date: string };

type DashboardContentProps = {
  ownCheckIn: CheckIn | null;
  partnerCheckIn: CheckIn | null;
  partnerPreviousPulses: PartnerPulseHistory[];
  hasPartner: boolean;
  /** First name or nickname for the share button; defaults to "Partner" */
  partnerName?: string;
};

export function DashboardContent({
  ownCheckIn,
  partnerCheckIn,
  partnerPreviousPulses,
  hasPartner,
  partnerName = "Partner",
}: DashboardContentProps) {
  return (
    <div className="space-y-8">
      <CheckInForm existingCheckIn={ownCheckIn} partnerName={partnerName} />
      <CheckInDisplay
        ownCheckIn={ownCheckIn}
        partnerCheckIn={partnerCheckIn}
        partnerPreviousPulses={partnerPreviousPulses}
        hasPartner={hasPartner}
      />
    </div>
  );
}
