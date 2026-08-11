"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const GRACE_PERIOD_DAYS = 14;

export default function SettingsPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [hasPartner, setHasPartner] = useState(false);
  const [deletionRequestedAt, setDeletionRequestedAt] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingUnpair, setConfirmingUnpair] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login?redirectTo=/settings");
        return;
      }

      setEmail(user.email ?? null);

      const { data: profile } = await supabase
        .from("profiles")
        .select("deletion_requested_at, partner_id")
        .eq("id", user.id)
        .single();

      setDeletionRequestedAt(profile?.deletion_requested_at ?? null);
      setHasPartner(!!profile?.partner_id);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleUnpair() {
    setError(null);
    setActionLoading(true);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("unpair_partner");
    setActionLoading(false);

    const result = data as
      | { success?: boolean; error?: string; invite_code?: string }
      | null;
    if (rpcError || !result?.success) {
      setError(rpcError?.message ?? result?.error ?? "Something went wrong.");
      return;
    }
    setConfirmingUnpair(false);
    router.push("/pair");
    router.refresh();
  }

  async function handleRequestDeletion() {
    setError(null);
    setActionLoading(true);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc(
      "request_account_deletion"
    );
    setActionLoading(false);

    const result = data as { success?: boolean; error?: string } | null;
    if (rpcError || !result?.success) {
      setError(rpcError?.message ?? result?.error ?? "Something went wrong.");
      return;
    }
    setDeletionRequestedAt(new Date().toISOString());
    setConfirmingDelete(false);
  }

  async function handleCancelDeletion() {
    setError(null);
    setActionLoading(true);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc(
      "cancel_account_deletion"
    );
    setActionLoading(false);

    const result = data as { success?: boolean; error?: string } | null;
    if (rpcError || !result?.success) {
      setError(rpcError?.message ?? result?.error ?? "Something went wrong.");
      return;
    }
    setDeletionRequestedAt(null);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-[#6b6560]">Loading...</p>
      </main>
    );
  }

  const purgeDate = deletionRequestedAt
    ? new Date(
        new Date(deletionRequestedAt).getTime() +
          GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
      )
    : null;

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="max-w-md mx-auto">
        <Link href="/dashboard" className="text-sm text-[#A78BFA] hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="text-3xl font-serif text-[#2d2a26] mt-4 mb-8">
          Settings
        </h1>

        <div className="mb-8">
          <p className="text-sm font-medium text-[#2d2a26] mb-1">Email</p>
          <p className="text-[#6b6560]">{email}</p>
        </div>

        {error && (
          <p className="text-sm text-[#F87171] bg-[#F87171]/10 px-3 py-2 rounded-lg mb-6">
            {error}
          </p>
        )}

        {hasPartner && (
          <div className="rounded-xl border border-[#e5e2de] bg-white p-5 mb-6">
            <h2 className="font-medium text-[#2d2a26] mb-2">
              Disconnect from partner
            </h2>
            {confirmingUnpair ? (
              <div className="space-y-3">
                <p className="text-sm text-[#6b6560]">
                  This unpairs you from your partner and issues you a new
                  invite code — your old code will stop working. Your past
                  check-ins aren&apos;t deleted.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmingUnpair(false)}
                    className="flex-1 py-3 rounded-xl border border-[#e5e2de] bg-white hover:bg-[#f5f3f0] transition-colors"
                  >
                    Stay connected
                  </button>
                  <button
                    type="button"
                    onClick={handleUnpair}
                    disabled={actionLoading}
                    className="flex-1 py-3 rounded-xl bg-[#2d2a26] text-white font-medium hover:bg-[#3d3a36] transition-colors disabled:opacity-60"
                  >
                    {actionLoading ? "Disconnecting..." : "Confirm"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[#6b6560]">
                  Remove your partner link and get a fresh invite code.
                </p>
                <button
                  type="button"
                  onClick={() => setConfirmingUnpair(true)}
                  className="w-full py-3 rounded-xl border border-[#e5e2de] bg-white hover:bg-[#f5f3f0] transition-colors"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        )}

        <div className="rounded-xl border border-[#e5e2de] bg-white p-5">
          <h2 className="font-medium text-[#2d2a26] mb-2">Delete account</h2>

          {deletionRequestedAt ? (
            <div className="space-y-3">
              <p className="text-sm text-[#6b6560]">
                Your account is scheduled for permanent deletion on{" "}
                <span className="text-[#2d2a26]">
                  {purgeDate?.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                . Until then you can cancel and keep your account.
              </p>
              <button
                type="button"
                onClick={handleCancelDeletion}
                disabled={actionLoading}
                className="w-full py-3 rounded-xl bg-[#2d2a26] text-white font-medium hover:bg-[#3d3a36] transition-colors disabled:opacity-60"
              >
                {actionLoading ? "Cancelling..." : "Cancel deletion"}
              </button>
            </div>
          ) : confirmingDelete ? (
            <div className="space-y-3">
              <p className="text-sm text-[#6b6560]">
                This deletes your profile, check-ins, and pairing after a
                14-day grace period. You can cancel anytime before then from
                this page.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="flex-1 py-3 rounded-xl border border-[#e5e2de] bg-white hover:bg-[#f5f3f0] transition-colors"
                >
                  Keep account
                </button>
                <button
                  type="button"
                  onClick={handleRequestDeletion}
                  disabled={actionLoading}
                  className="flex-1 py-3 rounded-xl bg-[#F87171] text-white font-medium hover:bg-[#ef5a5a] transition-colors disabled:opacity-60"
                >
                  {actionLoading ? "Requesting..." : "Confirm delete"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[#6b6560]">
                Permanently deletes your account after a 14-day grace period.
              </p>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="w-full py-3 rounded-xl border border-[#F87171] text-[#F87171] font-medium hover:bg-[#F87171]/10 transition-colors"
              >
                Delete account
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
