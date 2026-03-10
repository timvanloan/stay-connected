export const FEELING_COLORS = {
  Happy: "#FDE047",
  Sad: "#60A5FA",
  Angry: "#F87171",
  Afraid: "#A78BFA",
} as const;

export type PrimaryFeeling = keyof typeof FEELING_COLORS;

export const FEELINGS_MAP: Record<PrimaryFeeling, string[]> = {
  Happy: ["Joyful", "Grateful", "Excited", "Content", "Hopeful", "Proud"],
  Sad: ["Lonely", "Grief", "Disappointed", "Hopeless", "Melancholy", "Regretful"],
  Angry: ["Frustrated", "Resentful", "Irritated", "Indignant", "Hostile", "Humiliated"],
  Afraid: ["Anxious", "Overwhelmed", "Insecure", "Worried", "Scared", "Vulnerable"],
};
