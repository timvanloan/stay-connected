import Link from "next/link";
import { PLAN_PRICE_LABEL } from "@/lib/constants/billing";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/constants/support";

export const metadata = {
  title: "Terms of Service — Stay Connected",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-[#A78BFA] hover:underline">
          ← Back
        </Link>
        <h1 className="text-3xl font-serif text-[#2d2a26] mt-4 mb-1">
          Terms of Service
        </h1>
        <p className="text-sm text-[#6b6560] mb-8">
          Last updated: September 18, 2026
        </p>

        <div className="space-y-8 text-[#2d2a26] leading-relaxed">
          <section>
            <p>By using Stay Connected, you agree to these terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-serif mb-2">The service</h2>
            <p className="text-[#4a453f]">
              Stay Connected lets you share daily emotional check-ins with a
              partner or a small circle of friends (up to 10 people in a
              connected group). Direct friends see each other&apos;s check-ins
              after checking in themselves. It is not a substitute for
              professional therapy, counseling, or medical or mental-health
              advice. If you or someone you care about are in crisis, please
              contact a licensed professional or emergency services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-serif mb-2">Eligibility</h2>
            <p className="text-[#4a453f]">
              You must be at least 18 years old and able to form a binding
              agreement to use this service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-serif mb-2">Your account</h2>
            <p className="text-[#4a453f]">
              You&apos;re responsible for keeping your login credentials
              secure and for everything that happens under your account.
              Don&apos;t share your invite code with anyone you don&apos;t
              want to see your check-ins. Groups are capped at 10 people.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-serif mb-2">Subscriptions and billing</h2>
            <p className="text-[#4a453f]">
              Paid access is billed through Stripe at the then-current price
              shown on the Pricing page (currently {PLAN_PRICE_LABEL} unless
              otherwise stated). Fees are charged in advance for each billing
              period. You can cancel in Settings → Manage billing; access
              continues through the end of the period you already paid for
              unless otherwise stated at checkout. Taxes may apply. Refunds
              are handled case-by-case — email{" "}
              <a
                href={SUPPORT_MAILTO}
                className="text-[#A78BFA] hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-serif mb-2">Acceptable use</h2>
            <p className="text-[#4a453f]">
              Don&apos;t use the service to harass, abuse, or harm another
              person; don&apos;t attempt to access another user&apos;s
              account or data without authorization; don&apos;t use
              automated tools to scrape or abuse the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-serif mb-2">Content</h2>
            <p className="text-[#4a453f]">
              You retain ownership of what you write. By submitting a
              check-in, you grant your direct friends the ability to view it
              (subject to the product&apos;s check-in-first unlock). We may
              remove content that violates these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-serif mb-2">Availability</h2>
            <p className="text-[#4a453f]">
              The service is provided &ldquo;as is&rdquo; without warranties
              of any kind. We may modify or discontinue features, and
              we&apos;ll try to give notice for anything major.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-serif mb-2">
              Limitation of liability
            </h2>
            <p className="text-[#4a453f]">
              To the maximum extent permitted by law, we are not liable for
              indirect, incidental, or consequential damages arising from
              your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-serif mb-2">Termination</h2>
            <p className="text-[#4a453f]">
              You can delete your account at any time from Settings. We may
              suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-serif mb-2">Changes</h2>
            <p className="text-[#4a453f]">
              We may update these terms from time to time; continued use of
              the service after changes means you accept the update.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-serif mb-2">Contact</h2>
            <p className="text-[#4a453f]">
              <a
                href={SUPPORT_MAILTO}
                className="text-[#A78BFA] hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
