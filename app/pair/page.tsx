"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  friendLabel,
  MAX_GROUP_SIZE,
  type MyNetwork,
  type NetworkFriend,
} from "@/lib/constants/network";

export default function FriendsPage() {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [friendCode, setFriendCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [savedDisplayName, setSavedDisplayName] = useState<string | null>(null);
  const [friends, setFriends] = useState<NetworkFriend[]>([]);
  const [componentSize, setComponentSize] = useState(1);
  const [mode, setMode] = useState<string>("solo");
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [retryKey, setRetryKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login?redirectTo=/pair");
        return;
      }

      const userId = user.id;

      async function ensureProfile() {
        const { data: profile, error: fetchError } = await supabase
          .from("profiles")
          .select("invite_code, display_name")
          .eq("id", userId)
          .single();

        if (profile) {
          setInviteCode(profile.invite_code);
          setDisplayName(profile.display_name ?? "");
          setSavedDisplayName(profile.display_name);
          return true;
        }

        if (fetchError?.code === "PGRST116") {
          await new Promise((r) => setTimeout(r, 800));
          const { data: retried } = await supabase
            .from("profiles")
            .select("invite_code, display_name")
            .eq("id", userId)
            .single();
          if (retried) {
            setInviteCode(retried.invite_code);
            setDisplayName(retried.display_name ?? "");
            setSavedDisplayName(retried.display_name);
            return true;
          }
        }

        const { generateInviteCode } = await import("@/lib/utils");
        const code = generateInviteCode();
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({ id: userId, invite_code: code });

        if (!insertError) {
          setInviteCode(code);
          return true;
        }
        if (insertError.code === "23505") {
          const { data: refetched } = await supabase
            .from("profiles")
            .select("invite_code, display_name")
            .eq("id", userId)
            .single();
          if (refetched) {
            setInviteCode(refetched.invite_code);
            setDisplayName(refetched.display_name ?? "");
            setSavedDisplayName(refetched.display_name);
            return true;
          }
        }

        setError(
          insertError?.message ??
            "Could not load your invite code. Please try again."
        );
        return false;
      }

      const ok = await ensureProfile();
      if (ok) {
        const { data } = await supabase.rpc("get_my_network");
        const network = data as MyNetwork | null;
        if (network?.success) {
          setFriends(network.friends ?? []);
          setComponentSize(network.component_size ?? 1);
          setMode(network.mode ?? "solo");
          if (network.display_name) {
            setDisplayName(network.display_name);
            setSavedDisplayName(network.display_name);
          }
        }
      }
      setLoadingProfile(false);
    }

    fetchProfile();
  }, [router, retryKey]);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setNameError(null);
    setSavingName(true);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("update_display_name", {
      new_name: displayName.trim(),
    });
    setSavingName(false);
    const result = data as { success?: boolean; error?: string; display_name?: string } | null;
    if (rpcError || !result?.success) {
      setNameError(rpcError?.message ?? result?.error ?? "Could not save name.");
      return;
    }
    setSavedDisplayName(result.display_name ?? displayName.trim());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!friendCode.trim()) return;
    if (!savedDisplayName?.trim()) {
      setError("Set your display name before connecting with others.");
      return;
    }
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("accept_invite", {
      partner_invite_code: friendCode.trim(),
    });

    setLoading(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    const result = data as { success?: boolean; error?: string } | null;
    if (result?.success) {
      setFriendCode("");
      setRetryKey((k) => k + 1);
      setLoadingProfile(true);
      router.refresh();
    } else {
      setError(result?.error ?? "Could not connect. Please check the code.");
    }
  }

  function copyCode() {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
    }
  }

  const atCap = componentSize >= MAX_GROUP_SIZE;
  const canAddMore = !atCap;

  if (loadingProfile) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-[#6b6560]">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-3xl font-serif text-[#2d2a26]">Friends</h1>
          <Link
            href="/dashboard"
            className="mt-2 text-sm text-[#A78BFA] hover:underline whitespace-nowrap"
          >
            Dashboard
          </Link>
        </div>
        <p className="text-[#6b6560] mb-6">
          {mode === "couple"
            ? "Couples mode — just the two of you."
            : mode === "group"
              ? `Group mode — ${componentSize} people in your connection (max ${MAX_GROUP_SIZE}).`
              : "Share your code and enter a friend's to connect."}
        </p>

        <form onSubmit={handleSaveName} className="mb-8 space-y-2">
          <label
            htmlFor="displayName"
            className="block text-sm font-medium text-[#2d2a26]"
          >
            Your display name
          </label>
          <div className="flex gap-2">
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={40}
              required
              placeholder="First name or nickname"
              className="flex-1 px-4 py-3 rounded-xl border border-[#e5e2de] bg-white focus:outline-none focus:ring-2 focus:ring-[#A78BFA]/30 focus:border-[#A78BFA]"
            />
            <button
              type="submit"
              disabled={savingName || !displayName.trim()}
              className="px-4 py-3 rounded-xl bg-[#2d2a26] text-white text-sm font-medium hover:bg-[#3d3a36] disabled:opacity-60"
            >
              {savingName ? "…" : "Save"}
            </button>
          </div>
          {nameError && (
            <p className="text-sm text-[#F87171]">{nameError}</p>
          )}
          {savedDisplayName && !nameError && (
            <p className="text-xs text-[#6b6560]">
              Shown to friends as {savedDisplayName}
            </p>
          )}
        </form>

        {friends.length > 0 && (
          <div className="mb-8">
            <p className="text-sm font-medium text-[#2d2a26] mb-2">
              Connected ({friends.length})
            </p>
            <ul className="space-y-2">
              {friends.map((f) => (
                <li
                  key={f.id}
                  className="px-4 py-3 rounded-xl border border-[#e5e2de] bg-white text-[#2d2a26]"
                >
                  {friendLabel(f)}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-[#6b6560]">
              Remove connections in{" "}
              <Link href="/settings" className="text-[#A78BFA] hover:underline">
                Settings
              </Link>
              .
            </p>
          </div>
        )}

        <div className="mb-8">
          <label className="block text-sm font-medium text-[#2d2a26] mb-2">
            Your invite code
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-3 rounded-xl border border-[#e5e2de] bg-[#f5f3f0] font-mono text-xl tracking-widest text-center">
              {inviteCode ?? "—"}
            </div>
            <button
              type="button"
              onClick={copyCode}
              className="px-4 py-3 rounded-xl border border-[#e5e2de] bg-white hover:bg-[#f5f3f0] transition-colors"
              title="Copy"
            >
              Copy
            </button>
          </div>
        </div>

        {canAddMore ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="friendCode"
                className="block text-sm font-medium text-[#2d2a26] mb-1"
              >
                Friend&apos;s invite code
              </label>
              <input
                id="friendCode"
                type="text"
                value={friendCode}
                onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="XXXXXX"
                className="w-full px-4 py-3 rounded-xl border border-[#e5e2de] bg-white font-mono text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-[#A78BFA]/30 focus:border-[#A78BFA] uppercase"
              />
            </div>
            {error && (
              <div className="space-y-2">
                <p className="text-sm text-[#F87171] bg-[#F87171]/10 px-3 py-2 rounded-lg">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setLoadingProfile(true);
                    setRetryKey((k) => k + 1);
                  }}
                  className="text-sm text-[#A78BFA] hover:underline"
                >
                  Retry
                </button>
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !friendCode.trim()}
              className="w-full py-3 rounded-xl bg-[#2d2a26] text-white font-medium hover:bg-[#3d3a36] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Connecting..." : "Connect"}
            </button>
          </form>
        ) : (
          <p className="text-sm text-[#6b6560] rounded-xl border border-[#e5e2de] bg-[#f5f3f0] px-4 py-3">
            Your group is at the maximum of {MAX_GROUP_SIZE} people. Remove a
            connection in Settings before adding someone new.
          </p>
        )}
      </div>
    </main>
  );
}
