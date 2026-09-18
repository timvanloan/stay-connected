import Link from "next/link";
import { PLAN_PRICE_LABEL } from "@/lib/constants/billing";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/constants/support";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-serif text-[#2d2a26] mb-2">
        Stay Connected
      </h1>
      <p className="text-lg text-[#6b6560] mb-12 max-w-md text-center">
        A private space to share how you feel with a partner or a small circle
        of friends.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/login"
          className="px-8 py-3 rounded-xl bg-[#2d2a26] text-white font-medium hover:bg-[#3d3a36] transition-colors"
        >
          Log In
        </Link>
        <Link
          href="/signup"
          className="px-8 py-3 rounded-xl border-2 border-[#2d2a26] text-[#2d2a26] font-medium hover:bg-[#f5f3f0] transition-colors"
        >
          Sign Up
        </Link>
      </div>
      <p className="mt-8 text-sm text-[#6b6560]">
        <Link href="/pricing" className="text-[#A78BFA] hover:underline">
          Pricing — {PLAN_PRICE_LABEL}
        </Link>
      </p>
      <div className="mt-12 flex flex-wrap justify-center gap-4 text-xs text-[#6b6560]">
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>
        <Link href="/terms" className="hover:underline">
          Terms of Service
        </Link>
        <a href={SUPPORT_MAILTO} className="hover:underline">
          Support ({SUPPORT_EMAIL})
        </a>
      </div>
    </main>
  );
}
