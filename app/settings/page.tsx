"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BillingSettings } from "@/components/BillingSettings";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/constants/support";
import {
  friendLabel,
  type MyNetwork,
  type NetworkFriend,
} from "@/lib/constants/network";
import { createClient } from "@/lib/supabase/client";

const GRACE_PERIOD_DAYS = 14;

export default function SettingsPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [friends, setFriends] = useState<NetworkFriend[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(
    null
  );
  const [deletionRequestedAt, setDeletionRequestedAt] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [removingFriendId, setRemovingFriendId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function loadNetwork() {
    const supabase = createClient();
    const { data } = await supabase.rpc("get_my_network");
    const network = data as MyNetwork | null;
    if (network?.success) {
      setFriends(network.friends ?? []);
    }
  }

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
        .select("deletion_requested_at, subscription_status")
        .eq("id", user.id)
        .single();

      setDeletionRequestedAt(profile?.deletion_requested_at ?? null);
      setSubscriptionStatus(profile?.subscription_status ?? null);
      await loadNetwork();
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleRemoveFriend(friendId: string) {
    setError(null);
    setActionLoading(true);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("remove_friend", {
      friend_id: friendId,
    });
    setActionLoading(false);

    const result = data as
      | { success?: boolean; error?: string; invite_code?: string }
      | null;
    if (rpcError || !result?.success) {
      setError(rpcError?.message ?? result?.error ?? "Something went wrong.");
      return;
    }
    setRemovingFriendId(null);
    await loadNetwork();
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

        <Suspense fallback={null}>
          <BillingSettings subscriptionStatus={subscriptionStatus} />
        </Suspense>

        <div className="rounded-xl border border-[#e5e2de] bg-white p-5 mb-6">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h2 className="font-medium text-[#2d2a26]">Friends</h2>
            <Link href="/pair" className="text-sm text-[#A78BFA] hover:underline">
              Manage
            </Link>
          </div>
          {friends.length === 0 ? (
            <p className="text-sm text-[#6b6560]">
              No connections yet.{" "}
              <Link href="/pair" className="text-[#A78BFA] hover:underline">
                Add a friend
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-3">
              {friends.map((f) => (
                <li key={f.id} className="space-y-2">
                  {removingFriendId === f.id ? (
                    <div className="space-y-2">
                      <p className="text-sm text-[#6b6560]">
                        Disconnect from {friendLabel(f)}? Your invite code will
                        refresh. Past check-ins are kept.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setRemovingFriendId(null)}
                          className="flex-1 py-2 rounded-xl border border-[#e5e2de] bg-white hover:bg-[#f5f3f0] text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFriend(f.id)}
                          disabled={actionLoading}
                          className="flex-1 py-2 rounded-xl bg-[#2d2a26] text-white text-sm font-medium disabled:opacity-60"
                        >
                          {actionLoading ? "Removing…" : "Confirm"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#2d2a26]">{friendLabel(f)}</span>
                      <button
                        type="button"
                        onClick={() => setRemovingFriendId(f.id)}
                        className="text-sm text-[#F87171] hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-[#e5e2de] bg-white p-5 mb-6">
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
                This deletes your profile, check-ins, and connections after a
                14-day grace period. You can cancel anytime before then from
                this page. Cancel any Stripe subscription from Manage billing
                first if you are subscribed.
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

        <p className="text-sm text-[#6b6560]">
          Support:{" "}
          <a href={SUPPORT_MAILTO} className="text-[#A78BFA] hover:underline">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    </main>
  );
}
