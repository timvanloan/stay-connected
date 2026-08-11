import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Stay Connected",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-[#A78BFA] hover:underline">
          ← Back
        </Link>
        <h1 className="text-3xl font-serif text-[#2d2a26] mt-4 mb-1">
          Privacy Policy
        </h1>
        <p className="text-sm text-[#6b6560] mb-8">
          Last updated: August 11, 2026
        </p>

        <div className="space-y-8 text-[#2d2a26] leading-relaxed">
          <section>
            <p>
              Stay Connected (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is a private
              space for couples to share daily emotional check-ins. This
              policy explains what we collect, why, and how you can control
              it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-serif mb-2">What we collect</h2>
            <ul className="list-disc pl-5 space-y-1 text-[#4a453f]">
              <li>
                <span className="font-medium">Account info:</span> your email
                address and password. Passwords are stored securely by our
                authentication provider, Supabase — we never see your
                plaintext password.
              </li>
              <li>
                <span className="font-medium">Check-in content:</span> the
                feelings, notes, and appreciation messages you choose to
                share, stored so your paired partner can see them.
              </li>
              <li>
                <span className="font-medium">Pairing info:</span> your
                invite code and a link to your partner&apos;s account, used
                to connect the two of you.
              </li>
              <li>
                <span className="font-medium">Technical data:</span> your
                browser&apos;s timezone (used only to determine your local
                &ldquo;today&rdquo; for check-ins) and, if our
                bot-verification step is active, a verification token from
                Cloudflare Turnstile.
              </li>
            </ul>
            <p className="mt-3 text-[#4a453f]">
              We do not collect payment information, run advertising
              trackers, or sell your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-serif mb-2">Who can see your data</h2>
            <p className="text-[#4a453f]">
              Only you and the partner you&apos;ve paired with can see your
              check-ins. Our infrastructure providers — Supabase (database
              and authentication), Vercel (hosting), and Cloudflare (bot
              protection) — process data on our behalf under their own
              security commitments, and do not use it for their own
              purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-serif mb-2">How long we keep it</h2>
            <p className="text-[#4a453f]">
              We keep your data as long as your account is active. If you
              delete your account from Settings, it is scheduled for
              permanent deletion after a 14-day grace period (in case you
              change your mind). After that period, your profile, check-ins,
              and pairing are permanently erased.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-serif mb-2">Your rights</h2>
            <p className="text-[#4a453f]">
              You can request a copy of your data, correct it, or delete your
              account at any time from Settings, or by emailing{" "}
              <a
                href="mailto:nursing_above.3q@icloud.com"
                className="text-[#A78BFA] hover:underline"
              >
                nursing_above.3q@icloud.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-serif mb-2">Security</h2>
            <p className="text-[#4a453f]">
              Data is encrypted in transit (HTTPS), and database access is
              restricted so only you and your paired partner can read your
              check-ins — even we access it only to operate and support the
              service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-serif mb-2">Changes</h2>
            <p className="text-[#4a453f]">
              We&apos;ll update this page if anything material changes and
              update the date above.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-serif mb-2">Contact</h2>
            <p className="text-[#4a453f]">
              Questions? Email{" "}
              <a
                href="mailto:nursing_above.3q@icloud.com"
                className="text-[#A78BFA] hover:underline"
              >
                nursing_above.3q@icloud.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
