"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MIN_PASSWORD_LENGTH } from "@/lib/constants/auth";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!cancelled) {
        setHasSession(!!session);
        setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      );
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/pair");
    router.refresh();
  }

  if (checking) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-[#6b6560]">Loading…</p>
      </main>
    );
  }

  if (!hasSession) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-serif text-[#2d2a26] mb-2">
            Link invalid or expired
          </h1>
          <p className="text-[#6b6560] mb-6 text-sm leading-relaxed">
            Open the reset link from your email, or request a new one.
          </p>
          <Link
            href="/login/forgot-password"
            className="inline-block py-3 px-6 rounded-xl bg-[#2d2a26] text-white font-medium hover:bg-[#3d3a36] transition-colors"
          >
            Request reset link
          </Link>
          <p className="mt-6 text-sm text-[#6b6560]">
            <Link href="/login" className="text-[#A78BFA] hover:underline">
              Back to log in
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-serif text-[#2d2a26] mb-2">
          New password
        </h1>
        <p className="text-[#6b6560] mb-8">
          Choose a strong password for your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#2d2a26] mb-1"
            >
              New password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              className="w-full px-4 py-3 rounded-xl border border-[#e5e2de] bg-white focus:outline-none focus:ring-2 focus:ring-[#A78BFA]/30 focus:border-[#A78BFA]"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-[#6b6560]">
              At least {MIN_PASSWORD_LENGTH} characters
            </p>
          </div>
          <div>
            <label
              htmlFor="confirm"
              className="block text-sm font-medium text-[#2d2a26] mb-1"
            >
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              className="w-full px-4 py-3 rounded-xl border border-[#e5e2de] bg-white focus:outline-none focus:ring-2 focus:ring-[#A78BFA]/30 focus:border-[#A78BFA]"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="text-sm text-[#F87171] bg-[#F87171]/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#2d2a26] text-white font-medium hover:bg-[#3d3a36] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>

        <p className="mt-6 text-center text-[#6b6560] text-sm">
          <Link href="/login" className="text-[#A78BFA] hover:underline">
            Back to log in
          </Link>
        </p>
      </div>
    </main>
  );
}
