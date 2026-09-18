"use client";

import { useState } from "react";
import Link from "next/link";
import {
  PLAN_NAME,
  PLAN_PRICE_LABEL,
  PLAN_TAGLINE,
  isBillingUiEnabled,
} from "@/lib/constants/billing";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/constants/support";

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const billingEnabled = isBillingUiEnabled();

  async function startCheckout() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        if (res.status === 401) {
          window.location.href = "/login?redirectTo=/pricing";
          return;
        }
        setError(data.error ?? "Could not start checkout.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Could not start checkout.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="text-sm text-[#A78BFA] hover:underline">
          ← Back
        </Link>
        <h1 className="text-3xl font-serif text-[#2d2a26] mt-4 mb-2">
          Pricing
        </h1>
        <p className="text-[#6b6560] mb-10">{PLAN_TAGLINE}</p>

        <div className="rounded-2xl border border-[#e5e2de] bg-white p-8">
          <p className="text-sm font-medium text-[#A78BFA] mb-1">{PLAN_NAME}</p>
          <p className="text-4xl font-serif text-[#2d2a26] mb-2">
            {PLAN_PRICE_LABEL}
          </p>
          <ul className="mt-6 space-y-2 text-sm text-[#4a453f]">
            <li>Daily emotional check-ins with a partner or small group</li>
            <li>Private connections — only direct friends see each other</li>
            <li>Cancel anytime from Settings → Manage billing</li>
          </ul>

          {billingEnabled ? (
            <button
              type="button"
              onClick={startCheckout}
              disabled={loading}
              className="mt-8 w-full py-3 rounded-xl bg-[#2d2a26] text-white font-medium hover:bg-[#3d3a36] transition-colors disabled:opacity-60"
            >
              {loading ? "Redirecting…" : "Subscribe"}
            </button>
          ) : (
            <p className="mt-8 text-sm text-[#6b6560]">
              Billing is not enabled in this environment yet. Create an account
              free for now, or email{" "}
              <a href={SUPPORT_MAILTO} className="text-[#A78BFA] hover:underline">
                {SUPPORT_EMAIL}
              </a>{" "}
              if you have questions.
            </p>
          )}

          {error && (
            <p className="mt-4 text-sm text-[#F87171] bg-[#F87171]/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-[#6b6560]">
          Questions?{" "}
          <a href={SUPPORT_MAILTO} className="text-[#A78BFA] hover:underline">
            {SUPPORT_EMAIL}
          </a>
        </p>
        <p className="mt-2 text-center text-xs text-[#6b6560]">
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
          {" · "}
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
        </p>
      </div>
    </main>
  );
}
