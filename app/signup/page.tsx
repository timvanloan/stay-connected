"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TurnstileGate } from "@/components/auth/TurnstileGate";
import { buildAuthCaptchaOptions, turnstileSiteKey } from "@/lib/auth-captcha";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const turnstileKey = turnstileSiteKey();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (turnstileKey && !captchaToken) {
      setError("Please complete the verification below.");
      return;
    }
    setLoading(true);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/pair`,
        ...buildAuthCaptchaOptions(captchaToken),
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // Profile is created via DB trigger; redirect to pair page
    router.push("/pair");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-serif text-[#2d2a26] mb-2">Create account</h1>
        <p className="text-[#6b6560] mb-8">Start your journey together.</p>

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
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#2d2a26] mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl border border-[#e5e2de] bg-white focus:outline-none focus:ring-2 focus:ring-[#A78BFA]/30 focus:border-[#A78BFA]"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-[#6b6560]">At least 6 characters</p>
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
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-[#6b6560] text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-[#A78BFA] hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
