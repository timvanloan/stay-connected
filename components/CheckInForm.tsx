"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PulseWheel } from "./PulseWheel";
import type { PrimaryFeeling } from "@/lib/constants/feelings";

type ExistingCheckIn = {
  primary_feeling: string;
  secondary_feeling: string | null;
  note: string | null;
} | null;

export function CheckInForm({
  existingCheckIn,
}: {
  existingCheckIn?: ExistingCheckIn;
}) {
  const [primary, setPrimary] = useState<PrimaryFeeling | null>(
    (existingCheckIn?.primary_feeling as PrimaryFeeling) ?? null
  );
  const [secondary, setSecondary] = useState<string | null>(
    existingCheckIn?.secondary_feeling ?? null
  );
  const [note, setNote] = useState(existingCheckIn?.note ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (existingCheckIn) {
      setPrimary(existingCheckIn.primary_feeling as PrimaryFeeling);
      setSecondary(existingCheckIn.secondary_feeling);
      setNote(existingCheckIn.note ?? "");
    }
  }, [existingCheckIn]);

  function handleSelect(p: PrimaryFeeling, s?: string) {
    setPrimary(p);
    setSecondary(s ?? null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!primary) return;

    setError(null);
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Please sign in again.");
      setLoading(false);
      return;
    }

    const { error: upsertError } = await supabase.from("check_ins").upsert(
      {
        user_id: user.id,
        check_in_date: new Date().toISOString().slice(0, 10),
        primary_feeling: primary,
        secondary_feeling: secondary || null,
        note: note.trim() || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,check_in_date",
      }
    );

    setLoading(false);

    if (upsertError) {
      setError(upsertError.message);
      return;
    }

    setSubmitted(true);
    router.refresh();
  }

  if (submitted && !existingCheckIn) {
    return (
      <div className="rounded-xl border border-[#e5e2de] bg-white p-6 text-center">
        <p className="text-[#2d2a26] font-medium">Check-in saved</p>
        <p className="text-[#6b6560] text-sm mt-1">
          Your partner can see how you&apos;re feeling.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-[#e5e2de] bg-white p-6">
        <h2 className="text-xl font-serif text-[#2d2a26] mb-4">
          How are you feeling?
        </h2>
        <PulseWheel
          onSelect={handleSelect}
          selectedPrimary={primary}
          selectedSecondary={secondary}
        />
        <div className="mt-6">
          <label
            htmlFor="note"
            className="block text-sm font-medium text-[#2d2a26] mb-1"
          >
            Note (optional)
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note for your partner..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-[#e5e2de] bg-white focus:outline-none focus:ring-2 focus:ring-[#A78BFA]/30 focus:border-[#A78BFA] resize-none"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-[#F87171] bg-[#F87171]/10 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !primary}
        className="w-full py-3 rounded-xl bg-[#2d2a26] text-white font-medium hover:bg-[#3d3a36] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Saving..." : existingCheckIn ? "Update check-in" : "Save check-in"}
      </button>
    </form>
  );
}
