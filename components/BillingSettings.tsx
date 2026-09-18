"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  isBillingUiEnabled,
  isSubscriptionActive,
  PLAN_PRICE_LABEL,
} from "@/lib/constants/billing";

type Props = {
  subscriptionStatus: string | null;
};

export function BillingSettings({ subscriptionStatus }: Props) {
  const searchParams = useSearchParams();
  const billingSuccess = searchParams.get("billing") === "success";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const billingEnabled = isBillingUiEnabled();
  const active = isSubscriptionActive(subscriptionStatus);

  async function postBilling(path: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(path, { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Something went wrong.");
      setLoading(false);
    }
  }

  if (!billingEnabled) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[#e5e2de] bg-white p-5 mb-6">
      <h2 className="font-medium text-[#2d2a26] mb-2">Billing</h2>
      {billingSuccess && (
        <p className="text-sm text-[#4a453f] mb-3 bg-[#A78BFA]/10 px-3 py-2 rounded-lg">
          Thanks — your subscription is updating. Refresh if status still looks
          inactive after a few seconds.
        </p>
      )}
      <p className="text-sm text-[#6b6560] mb-3">
        Status:{" "}
        <span className="text-[#2d2a26]">
          {active
            ? `Active (${subscriptionStatus})`
            : subscriptionStatus
              ? subscriptionStatus
              : "Not subscribed"}
        </span>
        {" · "}
        {PLAN_PRICE_LABEL}
      </p>
      {error && (
        <p className="text-sm text-[#F87171] bg-[#F87171]/10 px-3 py-2 rounded-lg mb-3">
          {error}
        </p>
      )}
      {active ? (
        <button
          type="button"
          onClick={() => postBilling("/api/stripe/portal")}
          disabled={loading}
          className="w-full py-3 rounded-xl border border-[#e5e2de] bg-white hover:bg-[#f5f3f0] transition-colors disabled:opacity-60"
        >
          {loading ? "Opening…" : "Manage billing"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => postBilling("/api/stripe/checkout")}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-[#2d2a26] text-white font-medium hover:bg-[#3d3a36] transition-colors disabled:opacity-60"
        >
          {loading ? "Redirecting…" : "Subscribe"}
        </button>
      )}
    </div>
  );
}
