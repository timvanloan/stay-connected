"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EmotionCheckInPanel } from "./emotion-check-in/EmotionCheckInPanel";
import {
  normalizePrimaryFeeling,
  normalizeSecondaryLabel,
  type PrimaryFeeling,
} from "@/lib/constants/feelings";

type ExistingCheckIn = {
  primary_feeling: string;
  secondary_feeling: string | null;
  note: string | null;
  partner_appreciation: string | null;
} | null;

export function CheckInForm({
  existingCheckIn,
  partnerName = "Partner",
}: {
  existingCheckIn?: ExistingCheckIn;
  /** Shown on the share button, e.g. first name */
  partnerName?: string;
}) {
  const [primary, setPrimary] = useState<PrimaryFeeling | null>(
    existingCheckIn?.primary_feeling
      ? normalizePrimaryFeeling(existingCheckIn.primary_feeling)
      : null
  );
  const [secondary, setSecondary] = useState<string | null>(
    normalizeSecondaryLabel(existingCheckIn?.secondary_feeling ?? null)
  );
  const [note, setNote] = useState(existingCheckIn?.note ?? "");
  const [partnerAppreciation, setPartnerAppreciation] = useState(
    existingCheckIn?.partner_appreciation ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (existingCheckIn) {
      setPrimary(normalizePrimaryFeeling(existingCheckIn.primary_feeling));
      setSecondary(normalizeSecondaryLabel(existingCheckIn.secondary_feeling));
      setNote(existingCheckIn.note ?? "");
      setPartnerAppreciation(existingCheckIn.partner_appreciation ?? "");
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
        partner_appreciation: partnerAppreciation.trim() || null,
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
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border border-stone-200/60 bg-white/80 p-8 text-center shadow-hubGlow"
      >
        <p className="font-serif text-lg text-[#2d2a26]">Check-in saved</p>
        <p className="font-inter mt-2 text-sm text-[#6b6560]">
          Your partner can see how you&apos;re feeling.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-[2rem] border border-stone-200/40 bg-white/60 p-6 sm:p-10 shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] backdrop-blur-sm"
      >
        <h2 className="font-serif text-2xl sm:text-[1.65rem] leading-snug text-[#2d2a26] text-center mb-8">
          How are you feeling today?
        </h2>

        <EmotionCheckInPanel
          onSelect={handleSelect}
          selectedPrimary={primary}
          selectedSecondary={secondary}
        />

        <div className="mt-10 space-y-6">
          <div>
            <label
              htmlFor="note"
              className="block font-inter text-sm font-medium text-[#5c564e] mb-2"
            >
              A bit more about how I&apos;m feeling (optional)
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note for your partner..."
              rows={4}
              className="font-inter w-full rounded-[1.25rem] border border-stone-200/80 bg-[#FDFBF7]/80 px-4 py-3.5 text-[#2d2a26] placeholder:text-stone-400 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-200/40 resize-none shadow-inner"
            />
          </div>
          <div>
            <label
              htmlFor="partnerAppreciation"
              className="block font-inter text-sm font-medium text-[#5c564e] mb-2"
            >
              What I&apos;m appreciating / crushing on about my partner today
              (optional)
            </label>
            <textarea
              id="partnerAppreciation"
              value={partnerAppreciation}
              onChange={(e) => setPartnerAppreciation(e.target.value)}
              placeholder="Share something you love about them..."
              rows={4}
              className="font-inter w-full rounded-[1.25rem] border border-stone-200/80 bg-[#FDFBF7]/80 px-4 py-3.5 text-[#2d2a26] placeholder:text-stone-400 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-200/40 resize-none shadow-inner"
            />
          </div>
        </div>
      </motion.div>

      {error && (
        <p className="font-inter text-sm text-red-600/90 bg-red-50/80 px-4 py-3 rounded-2xl border border-red-100">
          {error}
        </p>
      )}

      <motion.button
        type="submit"
        disabled={loading || !primary}
        whileHover={{ scale: primary ? 1.01 : 1 }}
        whileTap={{ scale: primary ? 0.99 : 1 }}
        className="font-inter w-full rounded-[1.25rem] border border-amber-900/15 bg-gradient-to-b from-[#FAF0DC] to-[#F3E4C4] py-4 text-base font-semibold text-[#4a3f2e] shadow-[0_8px_32px_-8px_rgba(212,175,100,0.45)] transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:from-[#FCF4E4] hover:to-[#F5E8D0]"
      >
        {loading
          ? "Sharing..."
          : existingCheckIn
            ? `Update check-in · Share with ${partnerName}`
            : `Share with ${partnerName}`}
      </motion.button>
    </form>
  );
}
