// Physics & gameplay tuning for the horizontal side-scrolling runner.
export const NINJA_W = 40;
export const NINJA_H = 52;
export const NINJA_SCREEN_FACTOR = 0.26; // ninja x = W * this

export const GRAVITY = 1150; // px/s^2 (slow, floaty — rise mirrors the fall)
export const JUMP_V = 430; // reference jump velocity (px/s)
export const JUMP_MIN = 430; // tap = short, gentle hop
export const HOLD_MAX_MS = 420; // how long extra lift can be sustained
export const HOLD_ACCEL = 1500; // gentle extra upward accel while held
export const MAX_JUMPS = 2; // (legacy) unused with infinite flap

export const RUN_START = 110; // world scroll speed px/s (very relaxed)
export const RUN_MAX = 210;
export const RUN_ACCEL = 1.5;

export const GROUND_FACTOR = 0.78; // ground surface as fraction of H
export const UPPER_OFFSET = 130; // second platform tier height above ground

export const GROW_MS = 6500;
export const INVIS_MS = 6000;
export const STAR_MS = 2800;
export const MAGNET_MS = 6500;
export const MAGNET_RADIUS = 240;
export const MAX_OFFSCREEN_MS = 900; // how long the ninja may leave the top
export const STARS_PER_LIFE = 3;

// Animation cadence: 3/4 waltz feel (150 bpm -> 400ms per beat).
export const WALTZ_BEAT_MS = 400;

export const COIN_R = 13;
export const ENEMY_W = 40;
export const ENEMY_H = 46;
export const POWER_S = 42;

// Persistence keys
export const KEY_BEST = "tn_best_coins"; // high score = best coins in a run
export const KEY_LIVES = "tn_lives"; // saved indefinitely
export const KEY_HAPTICS = "tn_haptics";
export const KEY_SOUND = "tn_sound";
