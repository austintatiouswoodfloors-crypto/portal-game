// Design tokens for TinyNinja Jumper — "Daytime Bamboo Forest" flat vector theme.
export const colors = {
  surface: "#F4F9F4",
  onSurface: "#1A231F",
  surfaceSecondary: "#E1EFE1",
  surfaceTertiary: "#C5DFC5",
  surfaceInverse: "#1F2924",
  onSurfaceInverse: "#F4F9F4",

  brand: "#22C55E",
  brandPrimary: "#16A34A",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#4ADE80",
  brandTertiary: "#DCFCE7",
  onBrandTertiary: "#14532D",

  success: "#10B981",
  warning: "#F59E0B",
  warningLight: "#FBBF24",
  error: "#EF4444",
  errorDark: "#B91C1C",
  info: "#14B8A6",

  border: "#D1E5D1",
  borderStrong: "#86EFAC",

  // Gameplay sky (top -> bottom)
  sky: ["#BFE9FF", "#E8F7FF", "#F4F9F4"] as const,

  // Entities
  ninjaBody: "#1F2924",
  ninjaEye: "#F4F9F4",
  ninjaBand: "#EF4444",
  platform: "#16A34A",
  platformMoving: "#0EA5E9",
  coin: "#F59E0B",
  coinInner: "#FBBF24",
  enemy: "#EF4444",
  enemyInner: "#B91C1C",
  powerUp: "#10B981",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

export const font = {
  display: "Fredoka",
  displayBold: "Fredoka-SemiBold",
  text: "Nunito",
  textBold: "Nunito-Bold",
};

export const fontSize = {
  sm: 12,
  base: 14,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 48,
};

export const shadow = {
  card: {
    shadowColor: "#1A231F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
  soft: {
    shadowColor: "#1A231F",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
};
