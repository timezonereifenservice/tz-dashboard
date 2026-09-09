const AVATAR_PALETTES = [
  ["#1b4d89", "#3fb7e3", "#183650", "#92c5de", "#e8f0f7"],
  ["#abc629", "#343432", "#8fa622", "#dfe8b0", "#f5f7eb"],
  ["#7c2d12", "#ea580c", "#fdba74", "#431407", "#fff7ed"],
  ["#4c1d95", "#7c3aed", "#c4b5fd", "#2e1065", "#f5f3ff"],
  ["#065f46", "#10b981", "#6ee7b7", "#064e3b", "#ecfdf5"],
  ["#9d174d", "#ec4899", "#fbcfe8", "#831843", "#fdf2f8"],
] as const;

export const BORING_AVATAR_VARIANTS = [
  "marble",
  "beam",
  "pixel",
  "sunset",
  "ring",
  "bauhaus",
] as const;

export type BoringAvatarVariant = (typeof BORING_AVATAR_VARIANTS)[number];

function hashSeed(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAvatarPalette(seed: string) {
  const index = hashSeed(seed) % AVATAR_PALETTES.length;
  return [...AVATAR_PALETTES[index]!];
}

export function getAvatarVariant(seed: string): BoringAvatarVariant {
  const index = hashSeed(`${seed}:variant`) % BORING_AVATAR_VARIANTS.length;
  return BORING_AVATAR_VARIANTS[index]!;
}
