// Rewired to the CLOBA Arcade hub backend (per-game leaderboard).
const BASE = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api`;

export type ScoreEntry = {
  id: string;
  name: string;
  score: number;
  created_at: string;
};

export async function submitScore(name: string, score: number): Promise<ScoreEntry> {
  try {
    await fetch(`${BASE}/scores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game: "plum", player: name, score }),
    });
  } catch {
    // swallow — offline play still works
  }
  return { id: "", name, score, created_at: new Date().toISOString() };
}

export async function getTopScores(limit = 30): Promise<ScoreEntry[]> {
  try {
    const res = await fetch(`${BASE}/leaderboard/plum?limit=${limit}`);
    if (!res.ok) return [];
    const rows = await res.json();
    return rows.map((r: { rank: number; player: string; score: number }) => ({
      id: String(r.rank),
      name: r.player,
      score: r.score,
      created_at: "",
    }));
  } catch {
    return [];
  }
}

export async function getRank(score: number): Promise<{ rank: number; total: number }> {
  try {
    const res = await fetch(`${BASE}/leaderboard/plum?limit=100`);
    const rows = res.ok ? await res.json() : [];
    const higher = rows.filter((r: { score: number }) => r.score > score).length;
    return { rank: higher + 1, total: rows.length };
  } catch {
    return { rank: 0, total: 0 };
  }
}
