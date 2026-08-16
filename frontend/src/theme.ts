// Central design tokens for CLOBA Arcade (Tactile / Playful LIGHT).

export const COLORS = {
  surface: "#FFF9F0",
  onSurface: "#181A1F",
  surfaceSecondary: "#FFFFFF",
  surfaceTertiary: "#F2E8DB",
  surfaceInverse: "#181A1F",
  onSurfaceInverse: "#FFF9F0",

  brand: "#FFD166",
  onBrand: "#181A1F",
  brandSecondary: "#EF476F",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#FFEBC2",

  success: "#06D6A0",
  warning: "#FFD166",
  error: "#EF476F",

  border: "#E5D8C5",
  borderStrong: "#181A1F",
  divider: "#E5D8C5",

  muted: "#8A8170",
  gold: "#FFC94D",
  silver: "#C9CDD6",
  bronze: "#E0A96D",
};

export const FONTS = {
  display: "Fredoka",
  text: "Nunito",
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
};

export const RADIUS = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 999,
};

export type GameKey = "nailing" | "plum" | "ninja";

export interface GameMeta {
  key: GameKey;
  title: string;
  subtitle: string;
  tagline: string;
  brand: string;
  onBrand: string;
  accent: string;
  bg: [string, string];
  image: string;
  howTo: string[];
}

export const GAMES: Record<GameKey, GameMeta> = {
  nailing: {
    key: "nailing",
    title: "Nailing Master",
    subtitle: "Hammer every nail flush!",
    tagline: "Drag the hammer and drive every nail flush.",
    brand: "#87CEFA",
    onBrand: "#0E2A3F",
    accent: "#2F6FB0",
    bg: ["#EAF6FF", "#87CEFA"],
    image:
      "https://images.unsplash.com/photo-1601571268456-008be5537067?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHwxfHxoYW1tZXIlMjBoaXR0aW5nJTIwbmFpbCUyMHdvb2R8ZW58MHx8fHwxNzg2ODUyNjQzfDA&ixlib=rb-4.1.0&q=85",
    howTo: [
      "Drag your finger to move the hammer around.",
      "Swing it straight DOWN onto a nail head to drive it in.",
      "Dead-center hits drive deeper — fewer taps is better!",
      "Drive all the nails flush before time runs out.",
    ],
  },
  plum: {
    key: "plum",
    title: "Plum Peach",
    subtitle: "Fruit reaction game",
    tagline: "Tap the button matching the lowest falling fruit!",
    brand: "#FFB5A7",
    onBrand: "#5A2A22",
    accent: "#E8663C",
    bg: ["#FFF3EC", "#FFB5A7"],
    image:
      "https://images.unsplash.com/photo-1767765562964-f1e750934d0f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDV8MHwxfHNlYXJjaHwxfHxwZWFjaCUyMGZydWl0JTIwY3V0ZSUyMGNhcnRvb258ZW58MHx8fHwxNzg2ODUyNjQzfDA&ixlib=rb-4.1.0&q=85",
    howTo: [
      "Fruits fall in a stream from the top.",
      "Tap the button that matches the LOWEST fruit.",
      "Clear them before they cross the dashed catch line.",
      "It keeps speeding up — TURBO at 200!",
    ],
  },
  ninja: {
    key: "ninja",
    title: "TinyNinja Jumper",
    subtitle: "Hop, jump & dodge",
    tagline: "Tap for a small hop, hold for a big jump.",
    brand: "#2D6A4F",
    onBrand: "#FFFFFF",
    accent: "#40916C",
    bg: ["#95D5B2", "#2D6A4F"],
    image:
      "https://images.unsplash.com/photo-1586061968253-7bf5724aab7b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwxfHx0aW55JTIwbmluamElMjBqdW1waW5nJTIwYmFtYm9vJTIwZm9yZXN0fGVufDB8fHx8MTc4Njg1MjY0NHww&ixlib=rb-4.1.0&q=85",
    howTo: [
      "Tap for a small hop, hold for a big jump.",
      "Leap across the gaps between platforms.",
      "Grab gold coins for bonus points.",
      "Dodge the red enemies — and don't fall!",
    ],
  },
};

export const GAME_LIST: GameMeta[] = [GAMES.nailing, GAMES.plum, GAMES.ninja];
