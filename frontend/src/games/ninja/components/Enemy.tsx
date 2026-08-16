import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { colors } from "@/src/games/ninja/theme";
import { ENEMY_H, ENEMY_W } from "@/src/games/ninja/game/constants";
import type { EnemyKind } from "@/src/games/ninja/game/engine";

// Three distinct flat-vector enemies.
function EnemyBase({ kind }: { kind: EnemyKind }) {
  const w = ENEMY_W;
  const h = ENEMY_H;
  if (kind === "spiker") {
    // Orange blob with spikes on top.
    return (
      <Svg width={w} height={h} viewBox="0 0 40 46">
        <Path d="M6 16 L12 4 L18 16 Z" fill="#C2410C" />
        <Path d="M15 16 L20 3 L25 16 Z" fill="#C2410C" />
        <Path d="M24 16 L30 5 L34 16 Z" fill="#C2410C" />
        <Rect x={4} y={14} width={32} height={30} rx={12} fill="#EA580C" />
        <Circle cx={15} cy={28} r={4} fill="#FFFFFF" />
        <Circle cx={27} cy={28} r={4} fill="#FFFFFF" />
        <Circle cx={15} cy={28} r={2} fill="#7C2D12" />
        <Circle cx={27} cy={28} r={2} fill="#7C2D12" />
      </Svg>
    );
  }
  if (kind === "flyer") {
    // Violet bat with wings.
    return (
      <Svg width={w + 20} height={h} viewBox="0 0 60 46">
        <Path d="M12 22 Q0 12 2 30 Q8 26 16 30 Z" fill="#6D28D9" />
        <Path d="M48 22 Q60 12 58 30 Q52 26 44 30 Z" fill="#6D28D9" />
        <Rect x={16} y={12} width={28} height={26} rx={12} fill="#7C3AED" />
        <Circle cx={25} cy={24} r={4} fill="#FFFFFF" />
        <Circle cx={35} cy={24} r={4} fill="#FFFFFF" />
        <Circle cx={25} cy={24} r={2} fill="#3B0764" />
        <Circle cx={35} cy={24} r={2} fill="#3B0764" />
      </Svg>
    );
  }
  // Walker: red angry blob.
  return (
    <Svg width={w} height={h} viewBox="0 0 40 46">
      <Rect x={4} y={8} width={32} height={34} rx={13} fill={colors.enemy} />
      <Rect x={11} y={20} width={18} height={16} rx={8} fill={colors.enemyInner} />
      <Circle cx={14} cy={20} r={4} fill="#FFFFFF" />
      <Circle cx={26} cy={20} r={4} fill="#FFFFFF" />
      <Circle cx={14} cy={20} r={2} fill="#7F1D1D" />
      <Circle cx={26} cy={20} r={2} fill="#7F1D1D" />
      <Path d="M9 12 L18 16" stroke="#7F1D1D" strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M31 12 L22 16" stroke="#7F1D1D" strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

export const Enemy = React.memo(EnemyBase);
