"use client";

import { CheckInForm } from "./CheckInForm";
import { CheckInDisplay } from "./CheckInDisplay";

type CheckIn = {
  id: string;
  user_id: string;
  primary_feeling: string;
  secondary_feeling: string | null;
  note: string | null;
  created_at: string;
};

type DashboardContentProps = {
  ownCheckIn: CheckIn | null;
  partnerCheckIn: CheckIn | null;
  hasPartner: boolean;
};

export function DashboardContent({
  ownCheckIn,
  partnerCheckIn,
  hasPartner,
}: DashboardContentProps) {
  return (
    <div className="space-y-8">
      <CheckInForm existingCheckIn={ownCheckIn} />
      <CheckInDisplay
        ownCheckIn={ownCheckIn}
        partnerCheckIn={partnerCheckIn}
        hasPartner={hasPartner}
      />
    </div>
  );
}
