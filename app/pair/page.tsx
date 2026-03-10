"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PairPage() {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [partnerCode, setPartnerCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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

      async function loadProfile() {
        const { data: profile, error: fetchError } = await supabase
          .from("profiles")
          .select("invite_code, partner_id")
          .eq("id", user.id)
          .single();

        if (profile) {
          setInviteCode(profile.invite_code);
          if (profile.partner_id) {
            router.replace("/dashboard");
            return true;
          }
          return true;
        }

        // Profile might not exist yet (trigger delay) - wait and retry once
        if (fetchError?.code === "PGRST116") {
          await new Promise((r) => setTimeout(r, 800));
          const { data: retried } = await supabase
            .from("profiles")
            .select("invite_code, partner_id")
            .eq("id", user.id)
            .single();
          if (retried) {
            setInviteCode(retried.invite_code);
            if (retried.partner_id) router.replace("/dashboard");
            return true;
          }
        }

        // Create manually if trigger didn't run
        const { generateInviteCode } = await import("@/lib/utils");
        const code = generateInviteCode();
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({ id: user.id, invite_code: code });

        if (!insertError) {
          setInviteCode(code);
          return true;
        }
        if (insertError.code === "23505") {
          // Duplicate - trigger created it; refetch
          const { data: refetched } = await supabase
            .from("profiles")
            .select("invite_code, partner_id")
            .eq("id", user.id)
            .single();
          if (refetched) {
            setInviteCode(refetched.invite_code);
            if (refetched.partner_id) router.replace("/dashboard");
            return true;
          }
        }

        setError(
          insertError?.message ?? "Could not load your invite code. Please try again."
        );
        return false;
      }

      loadProfile().finally(() => setLoadingProfile(false));
    }

    fetchProfile();
  }, [router, retryKey]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!partnerCode.trim()) return;
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("accept_invite", {
      partner_invite_code: partnerCode.trim(),
    });

    setLoading(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    const result = data as { success?: boolean; error?: string } | null;
    if (result?.success) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError(result?.error ?? "Pairing failed. Please check the code.");
    }
  }

  function copyCode() {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
    }
  }

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
        <h1 className="text-3xl font-serif text-[#2d2a26] mb-2">
          Connect with your partner
        </h1>
        <p className="text-[#6b6560] mb-8">
          Share your code and enter theirs to link your accounts.
        </p>

        {/* Your invite code */}
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

        {/* Partner code input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="partnerCode"
              className="block text-sm font-medium text-[#2d2a26] mb-1"
            >
              Partner code
            </label>
            <input
              id="partnerCode"
              type="text"
              value={partnerCode}
              onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
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
            disabled={loading || !partnerCode.trim()}
            className="w-full py-3 rounded-xl bg-[#2d2a26] text-white font-medium hover:bg-[#3d3a36] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Connecting..." : "Connect"}
          </button>
        </form>
      </div>
    </main>
  );
}
