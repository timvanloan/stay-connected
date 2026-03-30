export const FEELING_COLORS = {
  Happy: "#FDE047",
  Sad: "#60A5FA",
  Angry: "#F87171",
  Fear: "#A78BFA",
} as const;

export type PrimaryFeeling = keyof typeof FEELING_COLORS;

export const FEELINGS_MAP: Record<PrimaryFeeling, string[]> = {
  Happy: [
    "Content",
    "Hopeful",
    "Loved",
    "Cherished/appreciated",
    "Grateful",
    "Excited",
  ],
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
    "Worry",
    "Overwhelm",
    "Dread",
  ],
};

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
  "Cherished/appreciated": "🤗",
  Grateful: "🙏",
  Excited: "🤩",
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
  Worry: "😟",
  Overwhelm: "😵",
  Dread: "😨",
};
