import { GameKey } from "@/src/theme";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

export interface LeaderRow {
  rank: number;
  player: string;
  score: number;
}

export interface SubmitResult {
  best: number;
  rank: number;
  is_new_best: boolean;
}

export async function submitScore(
  game: GameKey,
  player: string,
  score: number,
): Promise<SubmitResult | null> {
  try {
    const res = await fetch(`${BASE}/api/scores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game, player, score }),
    });
    if (!res.ok) return null;
    return (await res.json()) as SubmitResult;
  } catch {
    return null;
  }
}

export async function getLeaderboard(game: GameKey): Promise<LeaderRow[]> {
  try {
    const res = await fetch(`${BASE}/api/leaderboard/${game}?limit=50`);
    if (!res.ok) return [];
    return (await res.json()) as LeaderRow[];
  } catch {
    return [];
  }
}
