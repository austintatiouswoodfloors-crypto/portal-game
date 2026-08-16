import { useCallback, useEffect, useState } from "react";

import { GameKey } from "@/src/theme";
import { getBest, getPlayerName, setBest } from "@/src/player";
import { submitScore } from "@/src/api";

export interface GameResult {
  score: number;
  best: number;
  rank: number | null;
  isNewBest: boolean;
}

export function useGameSession(game: GameKey) {
  const [best, setBestState] = useState(0);
  const [player, setPlayer] = useState("");
  const [result, setResult] = useState<GameResult | null>(null);

  useEffect(() => {
    (async () => {
      setBestState(await getBest(game));
      setPlayer(await getPlayerName());
    })();
  }, [game]);

  const finish = useCallback(
    async (score: number) => {
      const prev = await getBest(game);
      const localBest = await setBest(game, score);
      setBestState(localBest);
      const name = player || (await getPlayerName());
      const res = await submitScore(game, name, score);
      setResult({
        score,
        best: res?.best ?? localBest,
        rank: res?.rank ?? null,
        isNewBest: res?.is_new_best ?? score > prev,
      });
    },
    [game, player],
  );

  const clearResult = useCallback(() => setResult(null), []);

  return { best, result, finish, clearResult };
}
