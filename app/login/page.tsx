"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TurnstileGate } from "@/components/auth/TurnstileGate";
import { buildAuthCaptchaOptions, turnstileSiteKey } from "@/lib/auth-captcha";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const turnstileKey = turnstileSiteKey();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/pair";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (turnstileKey && !captchaToken) {
      setError("Please complete the verification below.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: buildAuthCaptchaOptions(captchaToken),
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-serif text-[#2d2a26] mb-2">Welcome back</h1>
        <p className="text-[#6b6560] mb-8">Sign in to stay connected.</p>

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
              className="w-full px-4 py-3 rounded-xl border border-[#e5e2de] bg-white focus:outline-none focus:ring-2 focus:ring-[#A78BFA]/30 focus:border-[#A78BFA]"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#2d2a26]"
              >
                Password
              </label>
              <Link
                href="/login/forgot-password"
                className="text-xs text-[#A78BFA] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-[#e5e2de] bg-white focus:outline-none focus:ring-2 focus:ring-[#A78BFA]/30 focus:border-[#A78BFA]"
              placeholder="••••••••"
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
            {loading ? "Signing in..." : "Log In"}
          </button>
        </form>

        <p className="mt-6 text-center text-[#6b6560] text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#A78BFA] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-[#6b6560]">Loading...</p>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
