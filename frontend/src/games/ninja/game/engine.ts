// Horizontal side-scrolling runner simulation.
// World scrolls left as the ninja runs right. Two platform tiers, gaps,
// enemies, coins, and power-ups (grow / star / invisibility) that grant
// temporary invincibility (run through enemies). Coins are the score.
import {
  COIN_R,
  ENEMY_H,
  ENEMY_W,
  GRAVITY,
  GROUND_FACTOR,
  GROW_MS,
  HOLD_ACCEL,
  HOLD_MAX_MS,
  INVIS_MS,
  JUMP_MIN,
  JUMP_V,
  MAGNET_MS,
  MAGNET_RADIUS,
  MAX_OFFSCREEN_MS,
  NINJA_H,
  NINJA_SCREEN_FACTOR,
  NINJA_W,
  POWER_S,
  RUN_ACCEL,
  RUN_MAX,
  RUN_START,
  STAR_MS,
  STARS_PER_LIFE,
  UPPER_OFFSET,
} from "./constants";

export type GameStatus = "playing" | "dead";
export type Pose = "run" | "jump";
export type PowerType = "grow" | "star" | "invis" | "magnet";
export type EnemyKind = "walker" | "spiker" | "flyer";

export interface Segment {
  x0: number;
  x1: number;
}
export interface Upper {
  id: number;
  x0: number;
  x1: number;
  y: number;
}
export interface Coin {
  id: number;
  wx: number;
  y: number;
}
export interface Enemy {
  id: number;
  wx: number;
  y: number;
  vx: number;
  minX: number; // patrol bounds (platform edges)
  maxX: number;
  kind: EnemyKind;
  by: number; // base y (for flyer bob)
  ph: number; // phase
  passed: boolean; // already passed through while invisible
}
export interface PowerUp {
  id: number;
  wx: number;
  y: number;
  type: PowerType;
}
export interface Ninja {
  worldX: number;
  y: number;
  vy: number;
  grounded: boolean;
  jumps: number;
  holdUntil: number;
}

export interface GameState {
  W: number;
  H: number;
  groundTopY: number;
  screenX: number;
  ninja: Ninja;
  ground: Segment[];
  platforms: Upper[];
  coins: Coin[];
  enemies: Enemy[];
  powerups: PowerUp[];
  nextX: number;
  runSpeed: number;
  coinsCollected: number;
  stars: number;
  growUntil: number;
  invisUntil: number;
  starUntil: number;
  magnetUntil: number;
  invUntil: number;
  lastEnemyX: number;
  offTopSince: number;
  forcedDown: boolean;
  now: number;
  status: GameStatus;
  nextId: number;
  events: string[];
}

export interface Input {
  jumpQueued: boolean;
  holding: boolean;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const chance = (p: number) => Math.random() < p;

export function screenXOf(s: GameState, wx: number): number {
  return s.screenX + (wx - s.ninja.worldX);
}
export function getScore(s: GameState): number {
  return s.coinsCollected;
}
export function getPose(s: GameState): Pose {
  return s.ninja.grounded ? "run" : "jump";
}
export function isInvincible(s: GameState): boolean {
  return s.now < s.invUntil;
}
export function activePower(s: GameState): PowerType | null {
  if (s.now < s.growUntil) return "grow";
  if (s.now < s.starUntil) return "star";
  if (s.now < s.invisUntil) return "invis";
  if (s.now < s.magnetUntil) return "magnet";
  return null;
}

function spawnEnemy(
  s: GameState,
  wx: number,
  kind: EnemyKind,
  minX: number,
  maxX: number,
) {
  const speed = 45 + Math.random() * 40;
  const dir = Math.random() < 0.5 ? -1 : 1;
  if (kind === "flyer") {
    const by = s.groundTopY - (88 + Math.random() * 22);
    s.enemies.push({
      id: s.nextId++,
      wx,
      y: by,
      by,
      ph: Math.random() * Math.PI * 2,
      vx: dir * speed,
      minX,
      maxX,
      kind,
      passed: false,
    });
  } else {
    const y = s.groundTopY - ENEMY_H / 2;
    s.enemies.push({
      id: s.nextId++,
      wx,
      y,
      by: y,
      ph: 0,
      vx: dir * speed,
      minX,
      maxX,
      kind,
      passed: false,
    });
  }
}

// Remove any collectibles sitting on top of an enemy so everything on
// screen stays fairly reachable (beginner-friendly).
function clearCollectiblesNear(s: GameState, wx: number, r: number) {
  s.coins = s.coins.filter((c) => Math.abs(c.wx - wx) > r);
  s.powerups = s.powerups.filter((p) => Math.abs(p.wx - wx) > r);
}

function weightedKind(): EnemyKind {
  const r = Math.random();
  if (r < 0.45) return "walker";
  if (r < 0.75) return "spiker";
  return "flyer";
}

// Lay a spread-out trail of collectibles (coins with stars & power-ups
// intermixed, never stacked together) along [x0, x1] at the given base y.
function collectibleTrail(s: GameState, x0: number, x1: number, baseY: number) {
  let x = x0 + rand(30, 80);
  while (x < x1 - 30) {
    const y = Math.random() < 0.6 ? baseY - 30 : baseY - 30 - rand(45, 95);
    const r = Math.random();
    if (r < 0.58) {
      s.coins.push({ id: s.nextId++, wx: x, y });
    } else if (r < 0.7) {
      s.powerups.push({ id: s.nextId++, wx: x, y, type: "star" });
    } else if (r < 0.76) {
      s.powerups.push({ id: s.nextId++, wx: x, y, type: "grow" });
    } else if (r < 0.82) {
      s.powerups.push({ id: s.nextId++, wx: x, y, type: "invis" });
    } else if (r < 0.88) {
      s.powerups.push({ id: s.nextId++, wx: x, y, type: "magnet" });
    }
    // else: an intentional empty gap in the trail
    x += rand(85, 165);
  }
}

function generateAhead(s: GameState) {
  const ahead = s.ninja.worldX + s.W * 2.2;
  while (s.nextX < ahead) {
    const diff = s.ninja.worldX;
    const airtime = (2 * JUMP_V) / GRAVITY;
    const maxJumpGap = Math.min(150, s.runSpeed * airtime * 0.85);
    const gap = chance(0.72) ? rand(48, Math.max(64, maxJumpGap)) : 0;
    const platLen = rand(180, 320);
    const x0 = s.nextX + gap;
    const x1 = x0 + platLen;
    s.ground.push({ x0, x1 });

    // Spread collectibles on the lower tier.
    collectibleTrail(s, x0, x1, s.groundTopY);

    // Second tier platform (sometimes) with its own trail.
    if (chance(0.4)) {
      const uw = rand(120, 210);
      const ux0 = rand(x0 + 10, Math.max(x0 + 10, x1 - uw - 10));
      const uy = s.groundTopY - UPPER_OFFSET;
      s.platforms.push({ id: s.nextId++, x0: ux0, x1: ux0 + uw, y: uy });
      collectibleTrail(s, ux0, ux0 + uw, uy);
    }

    // One enemy at a time, well-spaced so a beginner can handle each.
    const enemyChance = Math.min(0.7, 0.4 + diff / 14000);
    if (chance(enemyChance)) {
      const wx = rand(x0 + 70, x1 - 60);
      if (wx - s.lastEnemyX >= 620) {
        spawnEnemy(s, wx, weightedKind(), x0 + 24, x1 - 24);
        s.lastEnemyX = wx;
        clearCollectiblesNear(s, wx, 48);
      }
    }

    s.nextX = x1;
  }
}

export function createGame(W: number, H: number): GameState {
  const groundTopY = H * GROUND_FACTOR;
  const s: GameState = {
    W,
    H,
    groundTopY,
    screenX: W * NINJA_SCREEN_FACTOR,
    ninja: {
      worldX: 0,
      y: groundTopY - NINJA_H / 2,
      vy: 0,
      grounded: true,
      jumps: 0,
      holdUntil: 0,
    },
    ground: [{ x0: -W, x1: W * 0.95 }],
    platforms: [],
    coins: [],
    enemies: [],
    powerups: [],
    nextX: W * 0.95,
    runSpeed: RUN_START,
    coinsCollected: 0,
    stars: 0,
    growUntil: 0,
    invisUntil: 0,
    starUntil: 0,
    magnetUntil: 0,
    invUntil: 0,
    lastEnemyX: 0,
    offTopSince: 0,
    forcedDown: false,
    now: Date.now(),
    status: "playing",
    nextId: 1,
    events: [],
  };
  generateAhead(s);
  // Give the player a few collectibles right away on the starting platform.
  collectibleTrail(s, W * 0.4, W * 0.9, groundTopY);
  return s;
}

// Bring the run back to life at the current position (spends a life).
export function revive(s: GameState) {
  const n = s.ninja;
  s.ground.push({ x0: n.worldX - 140, x1: n.worldX + 520 });
  n.y = s.groundTopY - NINJA_H / 2;
  n.vy = 0;
  n.grounded = true;
  n.jumps = 0;
  s.enemies = s.enemies.filter((e) => Math.abs(e.wx - n.worldX) > 280);
  s.invUntil = s.now + 2600;
  s.status = "playing";
}

function hasSupportAt(s: GameState, wx: number, feetY: number): boolean {
  const eq = (surf: number) => Math.abs(surf - feetY) < 3;
  for (const u of s.platforms)
    if (wx >= u.x0 && wx <= u.x1 && eq(u.y)) return true;
  for (const g of s.ground)
    if (wx >= g.x0 && wx <= g.x1 && eq(s.groundTopY)) return true;
  return false;
}

function landIfPossible(
  s: GameState,
  feetBefore: number,
  feet: number,
): boolean {
  const wx = s.ninja.worldX;
  let best: number | null = null;
  const consider = (x0: number, x1: number, y: number) => {
    if (wx >= x0 && wx <= x1 && feetBefore <= y + 6 && feet >= y) {
      if (best === null || y < best) best = y;
    }
  };
  for (const u of s.platforms) consider(u.x0, u.x1, u.y);
  for (const g of s.ground) consider(g.x0, g.x1, s.groundTopY);
  if (best !== null) {
    s.ninja.y = best - NINJA_H / 2;
    s.ninja.vy = 0;
    s.ninja.grounded = true;
    s.ninja.jumps = 0;
    return true;
  }
  return false;
}

function aabb(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
) {
  return Math.abs(ax - bx) < (aw + bw) / 2 && Math.abs(ay - by) < (ah + bh) / 2;
}

export function step(s: GameState, dt: number, input: Input) {
  if (s.status !== "playing") return;
  const n = s.ninja;

  s.runSpeed = Math.min(RUN_MAX, RUN_START + (n.worldX / 100) * RUN_ACCEL);
  n.worldX += s.runSpeed * dt;

  // Variable jump: a quick tap is a short hop; holding sustains extra lift
  // for a bigger jump. Infinite (can re-jump in the air). Disabled while the
  // ninja is being forced back onto the screen.
  if (input.jumpQueued && !s.forcedDown) {
    n.vy = -JUMP_MIN;
    n.grounded = false;
    n.holdUntil = s.now + HOLD_MAX_MS;
    s.events.push("jump");
  }
  input.jumpQueued = false;

  // Walked off a ledge?
  if (n.grounded && !hasSupportAt(s, n.worldX, n.y + NINJA_H / 2)) {
    n.grounded = false;
  }

  // Vertical integration.
  if (!n.grounded) {
    const feetBefore = n.y + NINJA_H / 2;
    const holding =
      input.holding && !s.forcedDown && s.now < n.holdUntil && n.vy < 0;
    n.vy += GRAVITY * dt;
    if (holding) n.vy -= HOLD_ACCEL * dt; // keep rising while held
    n.y += n.vy * dt;
    const feet = n.y + NINJA_H / 2;
    if (n.vy > 0) landIfPossible(s, feetBefore, feet);

    // Temporary off-screen allowance at the top.
    const topVisible = NINJA_H / 2 + 6;
    const topHard = -NINJA_H; // absolute ceiling (fully off, a bit above)
    if (n.y < topVisible) {
      if (s.offTopSince === 0) s.offTopSince = s.now;
      if (n.y < topHard) {
        n.y = topHard;
        if (n.vy < 0) n.vy = 0;
      }
      if (s.now - s.offTopSince > MAX_OFFSCREEN_MS) s.forcedDown = true;
      if (s.forcedDown && n.vy < 240) n.vy = 240; // pull him back down
    } else {
      s.offTopSince = 0;
      s.forcedDown = false;
    }
  } else {
    s.offTopSince = 0;
    s.forcedDown = false;
  }

  const invincible = s.now < s.invUntil;
  const grow = s.now < s.growUntil;
  const smash = grow || s.now < s.starUntil; // grow/star destroy enemies
  const nx = s.screenX;
  const ny = n.y;
  const nw = grow ? NINJA_W * 1.5 : NINJA_W;
  const nh = grow ? NINJA_H * 1.5 : NINJA_H;

  // Enemies.
  for (let i = s.enemies.length - 1; i >= 0; i--) {
    const e = s.enemies[i];
    // Pace back and forth across the platform.
    e.wx += e.vx * dt;
    if (e.wx <= e.minX) {
      e.wx = e.minX;
      e.vx = Math.abs(e.vx);
    } else if (e.wx >= e.maxX) {
      e.wx = e.maxX;
      e.vx = -Math.abs(e.vx);
    }
    if (e.kind === "flyer") e.y = e.by + Math.sin(s.now / 300 + e.ph) * 16;
    const ex = screenXOf(s, e.wx);
    if (ex < -ENEMY_W || e.wx < n.worldX - s.W) {
      s.enemies.splice(i, 1);
      continue;
    }
    if (!e.passed && aabb(nx, ny, nw, nh, ex, e.y, ENEMY_W, ENEMY_H)) {
      if (smash) {
        // Grow / star: smash through the enemy.
        s.enemies.splice(i, 1);
        s.events.push("through");
      } else if (invincible) {
        // Invisibility: pass through WITHOUT destroying the enemy.
        e.passed = true;
        s.events.push("through");
      } else {
        s.status = "dead";
        s.events.push("die");
        return;
      }
    }
  }

  // Coins (with magnet pull).
  const magnet = s.now < s.magnetUntil;
  for (let i = s.coins.length - 1; i >= 0; i--) {
    const c = s.coins[i];
    if (magnet) {
      const cx0 = screenXOf(s, c.wx);
      const dist = Math.hypot(nx - cx0, ny - c.y);
      if (dist < MAGNET_RADIUS) {
        const k = Math.min(1, (720 * dt) / Math.max(dist, 1));
        c.wx += (n.worldX - c.wx) * k;
        c.y += (ny - c.y) * k;
      }
    }
    const cx = screenXOf(s, c.wx);
    if (cx < -COIN_R * 2) {
      s.coins.splice(i, 1);
      continue;
    }
    if (
      Math.abs(nx - cx) < COIN_R + nw * 0.45 &&
      Math.abs(ny - c.y) < COIN_R + nh * 0.45
    ) {
      s.coins.splice(i, 1);
      s.coinsCollected += 1;
      s.events.push("coin");
    }
  }

  // Power-ups.
  for (let i = s.powerups.length - 1; i >= 0; i--) {
    const pu = s.powerups[i];
    const px = screenXOf(s, pu.wx);
    if (px < -POWER_S) {
      s.powerups.splice(i, 1);
      continue;
    }
    if (aabb(nx, ny, nw, nh, px, pu.y, POWER_S, POWER_S)) {
      s.powerups.splice(i, 1);
      if (pu.type === "grow") {
        s.growUntil = s.now + GROW_MS;
        s.invUntil = Math.max(s.invUntil, s.now + GROW_MS);
      } else if (pu.type === "invis") {
        s.invisUntil = s.now + INVIS_MS;
        s.invUntil = Math.max(s.invUntil, s.now + INVIS_MS);
      } else if (pu.type === "magnet") {
        s.magnetUntil = s.now + MAGNET_MS;
      } else {
        s.starUntil = s.now + STAR_MS;
        s.invUntil = Math.max(s.invUntil, s.now + STAR_MS);
        s.stars += 1;
        if (s.stars >= STARS_PER_LIFE) {
          s.stars -= STARS_PER_LIFE;
          s.events.push("life");
        }
      }
      s.events.push("power");
    }
  }

  // Cull passed geometry.
  s.ground = s.ground.filter((g) => g.x1 > n.worldX - s.W);
  s.platforms = s.platforms.filter((p) => p.x1 > n.worldX - s.W);

  generateAhead(s);

  // Fell into a pit.
  if (n.y - NINJA_H / 2 > s.H) {
    s.status = "dead";
    s.events.push("die");
  }
}
