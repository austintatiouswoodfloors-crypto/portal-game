import { storage } from "@/src/utils/storage";
import { GameKey } from "@/src/theme";

const NAME_KEY = "cloba_player_name";
const bestKey = (g: GameKey) => `cloba_best_${g}`;

const ADJ = [
  "Turbo", "Ninja", "Mighty", "Swift", "Cosmic", "Golden", "Lucky",
  "Pixel", "Rapid", "Fuzzy", "Mega", "Zesty", "Bouncy", "Sneaky",
];
const NOUN = [
  "Panda", "Peach", "Hammer", "Comet", "Otter", "Falcon", "Mango",
  "Tiger", "Bolt", "Sprout", "Koala", "Dragon", "Pebble", "Nova",
];

function randomName(): string {
  const a = ADJ[Math.floor(Math.random() * ADJ.length)];
  const n = NOUN[Math.floor(Math.random() * NOUN.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `${a}${n}${num}`;
}

export async function getPlayerName(): Promise<string> {
  const existing = await storage.getItem(NAME_KEY, "");
  if (existing) return existing;
  const name = randomName();
  await storage.setItem(NAME_KEY, name);
  return name;
}

export async function setPlayerName(name: string): Promise<void> {
  const clean = name.trim().slice(0, 24) || randomName();
  await storage.setItem(NAME_KEY, clean);
}

export async function getBest(game: GameKey): Promise<number> {
  return (await storage.getItem(bestKey(game), 0)) ?? 0;
}

export async function setBest(game: GameKey, value: number): Promise<number> {
  const current = await getBest(game);
  if (value > current) {
    await storage.setItem(bestKey(game), value);
    return value;
  }
  return current;
}
