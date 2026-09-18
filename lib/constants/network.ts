export const MAX_GROUP_SIZE = 10;

export type NetworkMode = "solo" | "couple" | "group";

export type NetworkFriend = {
  id: string;
  display_name: string;
  invite_code: string;
};

export type MyNetwork = {
  success: boolean;
  error?: string;
  mode: NetworkMode;
  component_size: number;
  max_size: number;
  friends: NetworkFriend[];
  display_name: string | null;
};

export type AppreciationTargetType = "partner" | "person" | "group";

export function friendLabel(friend: NetworkFriend | undefined | null): string {
  const name = friend?.display_name?.trim();
  return name || "Friend";
}
