/** Primary emotion colors (UI + check-in cards) */
export const FEELING_COLORS = {
  Happy: "#F4D35E",
  Sad: "#70B6F0",
  Angry: "#F28D8D",
  Fear: "#9F83EA",
} as const;

/** Gradient end stops for the emotion grid (subtle depth) */
export const FEELING_GRADIENT_END: Record<keyof typeof FEELING_COLORS, string> =
  {
    Happy: "#E8C44A",
    Sad: "#5AA8E8",
    Angry: "#E87A7A",
    Fear: "#8B6FD4",
  };

export type PrimaryFeeling = keyof typeof FEELING_COLORS;

export const FEELINGS_MAP: Record<PrimaryFeeling, string[]> = {
  Happy: ["Content", "Hopeful", "Loved", "Grateful", "Adored", "Inspired"],
  Sad: [
    "Disappointed",
    "Hurt",
    "Grief",
    "Disconnected",
    "Hopeless",
    "Discouraged",
  ],
  Angry: [
    "Frustrated",
    "Annoyed",
    "Invalidated",
    "Disrespected",
    "Resentful",
    "Rage/mad",
  ],
  Fear: [
    "Insecure",
    "Vulnerable",
    "Nervous",
    "Worried",
    "Overwhelmed",
    "Dread",
  ],
};

/** Legacy secondary labels → current wording (for stored check-ins) */
const SECONDARY_LABEL_ALIASES: Record<string, string> = {
  Worry: "Worried",
  Overwhelm: "Overwhelmed",
};

export function normalizeSecondaryLabel(
  label: string | null | undefined
): string | null {
  if (label == null || label === "") return null;
  return SECONDARY_LABEL_ALIASES[label] ?? label;
}

/** Maps legacy DB values to current primary keys */
export function normalizePrimaryFeeling(
  primary: string
): keyof typeof FEELING_COLORS {
  if (primary === "Afraid") return "Fear";
  return primary as keyof typeof FEELING_COLORS;
}

export const FEELING_EMOJIS: Record<string, string> = {
  Happy: "😊",
  Sad: "😢",
  Angry: "😠",
  Fear: "😨",
  Content: "😌",
  Hopeful: "🌟",
  Loved: "🥰",
  Grateful: "🙏",
  Adored: "💖",
  Inspired: "🤩",
  Disappointed: "😞",
  Hurt: "💔",
  Grief: "😢",
  Disconnected: "🫥",
  Hopeless: "🌑",
  Discouraged: "😔",
  Frustrated: "😤",
  Annoyed: "😒",
  Invalidated: "😣",
  Disrespected: "😠",
  Resentful: "😾",
  "Rage/mad": "😡",
  Insecure: "😰",
  Vulnerable: "🫂",
  Nervous: "😬",
  Worried: "😟",
  Overwhelmed: "😵",
  Worry: "😟",
  Overwhelm: "😵",
  Dread: "😨",
};
