"use client";

import { useState } from "react";
import Link from "next/link";
import { TurnstileGate } from "@/components/auth/TurnstileGate";
import { buildAuthCaptchaOptions, turnstileSiteKey } from "@/lib/auth-captcha";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const turnstileKey = turnstileSiteKey();
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (turnstileKey && !captchaToken) {
      setError("Please complete the verification below.");
      return;
    }
    setLoading(true);

    const supabase = createClient();
    const origin = window.location.origin;
    const next = encodeURIComponent("/auth/update-password");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${origin}/auth/callback?next=${next}`,
        ...buildAuthCaptchaOptions(captchaToken),
      }
    );

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-serif text-[#2d2a26] mb-2">
          Reset password
        </h1>
        <p className="text-[#6b6560] mb-8">
          Enter your email and we&apos;ll send you a link to choose a new
          password.
        </p>

        {sent ? (
          <div className="rounded-xl border border-[#e5e2de] bg-white p-4 text-[#2d2a26] text-sm leading-relaxed">
            <p className="font-medium mb-2">Check your email</p>
            <p className="text-[#6b6560]">
              If an account exists for{" "}
              <span className="text-[#2d2a26]">{email}</span>, you&apos;ll
              receive a reset link shortly. The link expires after a while for
              security.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#2d2a26] mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border border-[#e5e2de] bg-white focus:outline-none focus:ring-2 focus:ring-[#A78BFA]/30 focus:border-[#A78BFA]"
                placeholder="you@example.com"
              />
            </div>
            {turnstileKey ? (
              <TurnstileGate siteKey={turnstileKey} onToken={setCaptchaToken} />
            ) : null}
            {error && (
              <p className="text-sm text-[#F87171] bg-[#F87171]/10 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || (!!turnstileKey && !captchaToken)}
              className="w-full py-3 rounded-xl bg-[#2d2a26] text-white font-medium hover:bg-[#3d3a36] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-[#6b6560] text-sm">
          <Link href="/login" className="text-[#A78BFA] hover:underline">
            Back to log in
          </Link>
        </p>
      </div>
    </main>
  );
}
