import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { GameStart } from "@/src/components/GameStart";
import { GameOverOverlay } from "@/src/components/GameOverOverlay";
import { HowToPlayModal } from "@/src/components/HowToPlayModal";
import { useGameLoop } from "@/src/hooks/useGameLoop";
import { useGameSession } from "@/src/hooks/useGameSession";
import { COLORS, FONTS, GAMES, RADIUS, SPACING } from "@/src/theme";

const meta = GAMES.ninja;
const NINJA = 46;
const JUMP_V = -13;
const GRAVITY = 0.85;
const HOLD_GRAVITY = 0.38;

type Phase = "start" | "playing" | "over";
interface Platform {
  id: number;
  x: number;
  w: number;
}
interface Coin {
  id: number;
  x: number;
  y: number;
  taken: boolean;
}
interface Enemy {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function NinjaGame() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { best, result, finish, clearResult } = useGameSession("ninja");

  const groundY = height - 150;
  const blockH = height - groundY;
  const groundTop = groundY - NINJA;
  const ninjaX = useMemo(() => Math.round(width * 0.26), [width]);

  const [phase, setPhase] = useState<Phase>("start");
  const [paused, setPaused] = useState(false);
  const [howTo, setHowTo] = useState(false);
  const [, setTick] = useState(0);

  const platforms = useRef<Platform[]>([]);
  const coinsArr = useRef<Coin[]>([]);
  const enemiesArr = useRef<Enemy[]>([]);
  const ninja = useRef({ y: groundTop, vy: 0, grounded: true, holding: false });
  const cam = useRef(0);
  const speed = useRef(5);
  const coins = useRef(0);
  const lives = useRef(3);
  const invuln = useRef(0);
  const lastEnd = useRef(0);
  const ids = useRef(1);
  const overRef = useRef(false);

  const scoreOf = () => Math.floor(cam.current / 12) + coins.current * 10;

  const addPlatform = (x: number, w: number) => {
    platforms.current.push({ id: ids.current++, x, w });
    lastEnd.current = x + w;
    // coins along the platform
    const nCoins = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < nCoins; i++) {
      coinsArr.current.push({
        id: ids.current++,
        x: x + 40 + (w - 80) * (i / Math.max(nCoins - 1, 1)),
        y: groundY - 70 - Math.random() * 70,
        taken: false,
      });
    }
    // enemy on wide platforms
    if (w > 210 && Math.random() < 0.45) {
      const eh = 34;
      enemiesArr.current.push({
        id: ids.current++,
        x: x + w / 2,
        y: groundY - eh,
        w: 36,
        h: eh,
      });
    }
  };

  const ensureWorld = () => {
    const target = cam.current + width + 500;
    while (lastEnd.current < target) {
      const gap = 60 + Math.random() * 80;
      const w = 150 + Math.random() * 170;
      const x = lastEnd.current + gap;
      // tempting coin over the gap
      coinsArr.current.push({
        id: ids.current++,
        x: lastEnd.current + gap / 2,
        y: groundY - 95,
        taken: false,
      });
      addPlatform(x, w);
    }
  };

  const endGame = useCallback(() => {
    if (overRef.current) return;
    overRef.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setPhase("over");
    finish(scoreOf());
  }, [finish]);

  const reset = () => {
    platforms.current = [];
    coinsArr.current = [];
    enemiesArr.current = [];
    ninja.current = { y: groundTop, vy: 0, grounded: true, holding: false };
    cam.current = 0;
    speed.current = 5;
    coins.current = 0;
    lives.current = 3;
    invuln.current = 0;
    lastEnd.current = 0;
    overRef.current = false;
    // long starting platform so the ninja begins grounded
    addPlatform(-150, ninjaX + 500);
    ensureWorld();
    clearResult();
    setPaused(false);
    setPhase("playing");
  };

  useGameLoop(phase === "playing" && !paused, (dt) => {
    const factor = dt / 16;
    const n = ninja.current;

    speed.current = 5 + Math.min(cam.current * 0.0004, 4.5);
    cam.current += speed.current * factor;
    if (invuln.current > 0) invuln.current -= dt;

    // ground support under the ninja feet
    const footL = cam.current + ninjaX + 6;
    const footR = cam.current + ninjaX + NINJA - 6;
    const onPlat = platforms.current.some((p) => p.x < footR && p.x + p.w > footL);

    const g = n.holding && n.vy < 0 ? HOLD_GRAVITY : GRAVITY;
    n.vy += g * factor;
    n.y += n.vy * factor;
    if (onPlat && n.vy >= 0 && n.y >= groundTop) {
      n.y = groundTop;
      n.vy = 0;
      n.grounded = true;
      n.holding = false;
    } else if (!onPlat) {
      n.grounded = false;
    }
    if (n.y > height + 80) {
      endGame();
      return;
    }

    // coins
    for (const c of coinsArr.current) {
      if (c.taken) continue;
      const sx = c.x - cam.current;
      if (
        ninjaX < sx + 26 &&
        ninjaX + NINJA > sx &&
        n.y < c.y + 26 &&
        n.y + NINJA > c.y
      ) {
        c.taken = true;
        coins.current += 1;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }

    // enemies
    if (invuln.current <= 0) {
      for (const e of enemiesArr.current) {
        if (
          ninjaX < e.x - cam.current + e.w &&
          ninjaX + NINJA > e.x - cam.current &&
          n.y < e.y + e.h &&
          n.y + NINJA > e.y
        ) {
          lives.current -= 1;
          invuln.current = 1200;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          if (lives.current <= 0) {
            endGame();
            return;
          }
          break;
        }
      }
    }

    // cull + generate
    const cutoff = cam.current - 150;
    platforms.current = platforms.current.filter((p) => p.x + p.w > cutoff);
    coinsArr.current = coinsArr.current.filter((c) => !c.taken && c.x > cutoff);
    enemiesArr.current = enemiesArr.current.filter((e) => e.x > cutoff);
    ensureWorld();

    setTick((t) => t + 1);
  });

  const pressIn = () => {
    if (phase !== "playing" || paused) return;
    const n = ninja.current;
    if (n.grounded) {
      n.vy = JUMP_V;
      n.grounded = false;
      n.holding = true;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  const pressOut = () => {
    const n = ninja.current;
    if (n.holding) {
      n.holding = false;
      if (n.vy < 0) n.vy *= 0.45;
    }
  };

  if (phase === "start") {
    return (
      <>
        <GameStart
          meta={meta}
          best={best}
          onPlay={reset}
          onHowTo={() => setHowTo(true)}
          onBack={() => router.back()}
        />
        <HowToPlayModal
          visible={howTo}
          onClose={() => setHowTo(false)}
          title={meta.title}
          steps={meta.howTo}
          brand={meta.brand}
        />
      </>
    );
  }

  const n = ninja.current;
  const blinking = invuln.current > 0 && Math.floor(invuln.current / 120) % 2 === 0;
  const starsFilled = Math.min(3, Math.floor(scoreOf() / 100));

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#CDEFFF", "#EAF7FF", "#F4FBFF"]} style={StyleSheet.absoluteFill} />
      {/* soft hill decoration */}
      <View style={[styles.hill, { top: groundY - 130 }]} pointerEvents="none" />

      {/* Platforms */}
      {platforms.current.map((p) => (
        <View
          key={p.id}
          pointerEvents="none"
          style={{ position: "absolute", left: p.x - cam.current, top: groundY, width: p.w, height: blockH }}
        >
          <View style={styles.platTop} />
          <View style={styles.platBody} />
        </View>
      ))}

      {/* Coins */}
      {coinsArr.current.map((c) =>
        c.taken ? null : (
          <View
            key={c.id}
            pointerEvents="none"
            style={[styles.coin, { left: c.x - cam.current, top: c.y }]}
            testID="coin"
          >
            <View style={styles.coinInner} />
          </View>
        ),
      )}

      {/* Enemies */}
      {enemiesArr.current.map((e) => (
        <View
          key={e.id}
          pointerEvents="none"
          style={[styles.enemy, { left: e.x - cam.current, top: e.y, width: e.w, height: e.h }]}
          testID="enemy"
        >
          <View style={styles.enemyEye} />
          <View style={[styles.enemyEye, { left: undefined, right: 6 }]} />
        </View>
      ))}

      {/* Ninja */}
      {blinking ? null : (
        <View style={[styles.ninja, { left: ninjaX, top: n.y }]} pointerEvents="none">
          <View style={styles.ninjaBand}>
            <View style={styles.bandTail} />
          </View>
          <View style={styles.ninjaEyes}>
            <View style={styles.ninjaEye} />
            <View style={styles.ninjaEye} />
          </View>
        </View>
      )}

      {/* Tap catcher */}
      <Pressable style={StyleSheet.absoluteFill} onPressIn={pressIn} onPressOut={pressOut} testID="jump-area" />

      {/* HUD */}
      <View style={[styles.hud, { paddingTop: insets.top + SPACING.sm }]} pointerEvents="box-none">
        <Pressable style={styles.iconBtn} onPress={() => setPaused(true)} testID="pause-button">
          <Ionicons name="pause" size={22} color={COLORS.onSurface} />
        </Pressable>
        <View style={styles.centerHud}>
          <View style={styles.scoreRow}>
            <View style={styles.coinMini}>
              <View style={styles.coinMiniInner} />
            </View>
            <Text style={styles.scoreValue} testID="score-value">{scoreOf()}</Text>
          </View>
          <View style={styles.stars}>
            {[0, 1, 2].map((i) => (
              <Ionicons
                key={i}
                name={i < starsFilled ? "star" : "star-outline"}
                size={16}
                color={COLORS.gold}
              />
            ))}
          </View>
        </View>
        <View style={styles.livesPill}>
          <Ionicons name="heart" size={16} color={COLORS.error} />
          <Text style={styles.livesText} testID="lives">{lives.current}</Text>
        </View>
      </View>

      {paused ? (
        <View style={styles.pauseOverlay} testID="pause-overlay">
          <Text style={styles.pauseTitle}>Paused</Text>
          <Pressable style={styles.resumeBtn} onPress={() => setPaused(false)} testID="resume-button">
            <Ionicons name="play" size={20} color={COLORS.onSurface} />
            <Text style={styles.resumeText}>Resume</Text>
          </Pressable>
          <Pressable style={styles.quitBtn} onPress={() => router.back()} testID="quit-button">
            <Text style={styles.quitText}>Quit to menu</Text>
          </Pressable>
        </View>
      ) : null}

      <GameOverOverlay
        visible={phase === "over"}
        score={result?.score ?? scoreOf()}
        best={result?.best ?? best}
        rank={result?.rank ?? null}
        isNewBest={result?.isNewBest ?? false}
        brand={meta.brand}
        onRetry={reset}
        onHome={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EAF7FF" },
  hill: {
    position: "absolute",
    left: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(45,106,79,0.12)",
  },
  hud: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  centerHud: { alignItems: "center" },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  coinMini: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.gold,
    borderWidth: 2,
    borderColor: "#B8860B",
    alignItems: "center",
    justifyContent: "center",
  },
  coinMiniInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFF3C4" },
  scoreValue: { fontFamily: FONTS.display, fontSize: 30, color: COLORS.onSurface },
  stars: { flexDirection: "row", gap: 3, marginTop: 2 },
  livesPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 44,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceSecondary,
  },
  livesText: { fontFamily: FONTS.display, fontSize: 16, color: COLORS.onSurface },
  platTop: { height: 8, backgroundColor: "#2ECC71" },
  platBody: { flex: 1, backgroundColor: "#1FA85A" },
  coin: {
    position: "absolute",
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.gold,
    borderWidth: 3,
    borderColor: "#B8860B",
    alignItems: "center",
    justifyContent: "center",
  },
  coinInner: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#FFF3C4" },
  enemy: {
    position: "absolute",
    backgroundColor: "#EF4444",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#B91C1C",
  },
  enemyEye: {
    position: "absolute",
    top: 8,
    left: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FFF",
  },
  ninja: {
    position: "absolute",
    width: NINJA,
    height: NINJA,
    borderRadius: 15,
    backgroundColor: "#1A1A1A",
    overflow: "hidden",
    alignItems: "center",
  },
  ninjaBand: { position: "absolute", top: 12, left: 0, right: 0, height: 12, backgroundColor: "#E63946" },
  bandTail: {
    position: "absolute",
    left: -8,
    top: 0,
    width: 10,
    height: 12,
    backgroundColor: "#E63946",
    transform: [{ skewY: "-18deg" }],
  },
  ninjaEyes: { position: "absolute", top: 15, flexDirection: "row", gap: 6, alignSelf: "center" },
  ninjaEye: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFF" },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(24,26,31,0.6)",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.lg,
  },
  pauseTitle: { fontFamily: FONTS.display, fontSize: 34, color: "#FFF" },
  resumeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.success,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING["2xl"],
    borderRadius: RADIUS.pill,
  },
  resumeText: { fontFamily: FONTS.display, fontSize: 18, color: COLORS.onSurface },
  quitBtn: { paddingVertical: SPACING.sm },
  quitText: { fontFamily: FONTS.text, fontSize: 15, color: "rgba(255,255,255,0.85)" },
});
