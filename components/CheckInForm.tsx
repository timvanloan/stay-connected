"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EmotionCheckInPanel } from "./emotion-check-in/EmotionCheckInPanel";
import { upsertTodayCheckIn } from "@/lib/check-in-upsert";
import {
  normalizePrimaryFeeling,
  normalizeSecondaryLabel,
  type PrimaryFeeling,
} from "@/lib/constants/feelings";
import {
  friendLabel,
  type AppreciationTargetType,
  type NetworkFriend,
  type NetworkMode,
} from "@/lib/constants/network";

const NOTE_MAX_LENGTH = 1000;

type ExistingCheckIn = {
  primary_feeling: string;
  secondary_feeling: string | null;
  note: string | null;
  partner_appreciation: string | null;
  appreciation_target_type?: string | null;
  appreciation_target_id?: string | null;
} | null;

export function CheckInForm({
  existingCheckIn,
  mode = "solo",
  friends = [],
}: {
  existingCheckIn?: ExistingCheckIn;
  mode?: NetworkMode;
  friends?: NetworkFriend[];
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
  const [targetKind, setTargetKind] = useState<"person" | "group">(
    existingCheckIn?.appreciation_target_type === "group" ? "group" : "person"
  );
  const [targetFriendId, setTargetFriendId] = useState<string>(
    existingCheckIn?.appreciation_target_id ?? friends[0]?.id ?? ""
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
      if (existingCheckIn.appreciation_target_type === "group") {
        setTargetKind("group");
      } else if (existingCheckIn.appreciation_target_type === "person") {
        setTargetKind("person");
        if (existingCheckIn.appreciation_target_id) {
          setTargetFriendId(existingCheckIn.appreciation_target_id);
        }
      }
    }
  }, [existingCheckIn]);

  useEffect(() => {
    if (!targetFriendId && friends[0]?.id) {
      setTargetFriendId(friends[0].id);
    }
  }, [friends, targetFriendId]);

  function handleSelect(p: PrimaryFeeling, s?: string) {
    setPrimary(p);
    setSecondary(s ?? null);
    setError(null);
  }

  const coupleFriend = mode === "couple" ? friends[0] : undefined;
  const shareLabel =
    mode === "couple"
      ? friendLabel(coupleFriend)
      : mode === "group"
        ? "your friends"
        : "friends";

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

    let appreciationTargetType: AppreciationTargetType | null = null;
    let appreciationTargetId: string | null = null;

    if (partnerAppreciation.trim()) {
      if (mode === "couple") {
        appreciationTargetType = "partner";
      } else if (mode === "group") {
        if (targetKind === "group") {
          appreciationTargetType = "group";
        } else {
          if (!targetFriendId) {
            setError("Choose who this appreciation is for.");
            setLoading(false);
            return;
          }
          appreciationTargetType = "person";
          appreciationTargetId = targetFriendId;
        }
      }
    }

    const { error: upsertError } = await upsertTodayCheckIn(supabase, {
      userId: user.id,
      primary,
      secondary: secondary || null,
      note,
      partnerAppreciation,
      appreciationTargetType,
      appreciationTargetId,
    });

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
          {friends.length > 0
            ? "Your friends can see how you're feeling after they check in too."
            : "Connect with someone to share how you're feeling."}
        </p>
      </motion.div>
    );
  }

  const appreciationLabel =
    mode === "couple"
      ? `What I'm appreciating / crushing on about ${friendLabel(coupleFriend)} today`
      : mode === "group"
        ? targetKind === "group"
          ? "What I'm appreciating about the group today"
          : `What I'm appreciating about ${friendLabel(
              friends.find((f) => f.id === targetFriendId)
            )} today`
        : "What I'm appreciating today";

  const appreciationPlaceholder =
    mode === "group" && targetKind === "group"
      ? "Share something you love about this group..."
      : "Share something you love about them...";

  const notePlaceholder =
    mode === "couple"
      ? `Add a note for ${friendLabel(coupleFriend)}...`
      : mode === "group"
        ? "Add a note for your friends..."
        : "Add a note...";

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
              placeholder={notePlaceholder}
              rows={4}
              maxLength={NOTE_MAX_LENGTH}
              className="font-inter w-full rounded-[1.25rem] border border-stone-200/80 bg-[#FDFBF7]/80 px-4 py-3.5 text-[#2d2a26] placeholder:text-stone-400 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-200/40 resize-none shadow-inner"
            />
            <p className="mt-1 text-right text-xs text-stone-400">
              {note.length}/{NOTE_MAX_LENGTH}
            </p>
          </div>

          {mode === "group" && (
            <div className="space-y-3">
              <p className="font-inter text-sm font-medium text-[#5c564e]">
                Appreciation for (optional)
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTargetKind("person")}
                  className={`px-3 py-2 rounded-xl text-sm border transition-colors ${
                    targetKind === "person"
                      ? "border-[#2d2a26] bg-[#2d2a26] text-white"
                      : "border-[#e5e2de] bg-white text-[#2d2a26]"
                  }`}
                >
                  Someone specific
                </button>
                <button
                  type="button"
                  onClick={() => setTargetKind("group")}
                  className={`px-3 py-2 rounded-xl text-sm border transition-colors ${
                    targetKind === "group"
                      ? "border-[#2d2a26] bg-[#2d2a26] text-white"
                      : "border-[#e5e2de] bg-white text-[#2d2a26]"
                  }`}
                >
                  The group
                </button>
              </div>
              {targetKind === "person" && friends.length > 0 && (
                <select
                  value={targetFriendId}
                  onChange={(e) => setTargetFriendId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#e5e2de] bg-white text-[#2d2a26]"
                >
                  {friends.map((f) => (
                    <option key={f.id} value={f.id}>
                      {friendLabel(f)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {(mode === "couple" || mode === "group") && (
            <div>
              <label
                htmlFor="partnerAppreciation"
                className="block font-inter text-sm font-medium text-[#5c564e] mb-2"
              >
                {appreciationLabel} (optional)
              </label>
              <textarea
                id="partnerAppreciation"
                value={partnerAppreciation}
                onChange={(e) => setPartnerAppreciation(e.target.value)}
                placeholder={appreciationPlaceholder}
                rows={4}
                maxLength={NOTE_MAX_LENGTH}
                className="font-inter w-full rounded-[1.25rem] border border-stone-200/80 bg-[#FDFBF7]/80 px-4 py-3.5 text-[#2d2a26] placeholder:text-stone-400 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-200/40 resize-none shadow-inner"
              />
              <p className="mt-1 text-right text-xs text-stone-400">
                {partnerAppreciation.length}/{NOTE_MAX_LENGTH}
              </p>
            </div>
          )}
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
            ? `Update check-in · Share with ${shareLabel}`
            : `Share with ${shareLabel}`}
      </motion.button>
    </form>
  );
}
