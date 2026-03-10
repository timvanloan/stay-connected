import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-serif text-[#2d2a26] mb-2">
        Stay Connected
      </h1>
      <p className="text-lg text-[#6b6560] mb-12 max-w-md text-center">
        A private space for couples to share how you feel and stay emotionally
        close.
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
    </main>
  );
}
