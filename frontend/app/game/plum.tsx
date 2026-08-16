import React, { useCallback, useRef, useState } from "react";
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
import { StatPill } from "@/src/components/StatPill";
import { useGameLoop } from "@/src/hooks/useGameLoop";
import { useGameSession } from "@/src/hooks/useGameSession";
import { COLORS, FONTS, GAMES, RADIUS, SPACING } from "@/src/theme";

const meta = GAMES.plum;
const FRUIT = 92;
const SPACING_Y = 100;
const TURBO_AT = 200;

type Phase = "start" | "playing" | "over";
type FruitType = "peach" | "plum";

interface Fruit {
  id: number;
  type: FruitType;
  y: number;
  x: number;
}

export default function PlumGame() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { best, result, finish, clearResult } = useGameSession("plum");

  const catchLineY = height - 250;
  const centerX = width / 2;

  const [phase, setPhase] = useState<Phase>("start");
  const [paused, setPaused] = useState(false);
  const [howTo, setHowTo] = useState(false);
  const [, setTick] = useState(0);

  const fruits = useRef<Fruit[]>([]);
  const score = useRef(0);
  const speed = useRef(2.2);
  const nextId = useRef(1);
  const overRef = useRef(false);

  const spawnType = (): FruitType => (Math.random() < 0.5 ? "peach" : "plum");
  const spawnX = () =>
    score.current >= TURBO_AT
      ? 60 + Math.random() * (width - 120)
      : centerX;

  const endGame = useCallback(() => {
    if (overRef.current) return;
    overRef.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setPhase("over");
    finish(score.current);
  }, [finish]);

  const reset = () => {
    fruits.current = [];
    score.current = 0;
    speed.current = 2.2;
    overRef.current = false;
    // seed a starting stream from the top
    for (let i = 0; i < 4; i++) {
      fruits.current.push({
        id: nextId.current++,
        type: spawnType(),
        y: -20 - i * SPACING_Y,
        x: centerX,
      });
    }
    clearResult();
    setPaused(false);
    setPhase("playing");
  };

  useGameLoop(phase === "playing" && !paused, (dt) => {
    const factor = dt / 16;
    const dy = speed.current * factor;
    let lowest: Fruit | null = null;
    let minY = Infinity;
    for (const f of fruits.current) {
      f.y += dy;
      if (f.y > (lowest?.y ?? -Infinity)) lowest = f;
      if (f.y < minY) minY = f.y;
    }
    // missed fruit crossed the catch line
    if (lowest && lowest.y >= catchLineY) {
      endGame();
      return;
    }
    // keep the stream filled from the top
    if (minY >= -20 + SPACING_Y) {
      fruits.current.push({
        id: nextId.current++,
        type: spawnType(),
        y: minY - SPACING_Y,
        x: spawnX(),
      });
    }
    setTick((t) => t + 1);
  });

  const tapButton = (type: FruitType) => {
    if (phase !== "playing" || paused) return;
    let lowest: Fruit | null = null;
    for (const f of fruits.current) {
      if (!lowest || f.y > lowest.y) lowest = f;
    }
    if (!lowest) return;
    if (lowest.type === type) {
      fruits.current = fruits.current.filter((f) => f.id !== lowest!.id);
      score.current += 1;
      speed.current = 2.2 + score.current * 0.035;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTick((t) => t + 1);
    } else {
      endGame();
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

  const turbo = score.current >= TURBO_AT;

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#FFF3EC", "#FCE3D3"]} style={StyleSheet.absoluteFill} />

      {/* HUD */}
      <View style={[styles.hud, { paddingTop: insets.top + SPACING.sm }]} pointerEvents="box-none">
        <Pressable style={styles.iconBtn} onPress={() => setPaused((p) => !p)} testID="pause-button">
          <Ionicons name={paused ? "play" : "pause"} size={22} color={COLORS.onSurface} />
        </Pressable>
        <View style={styles.scoreBlock}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue} testID="score-value">{score.current}</Text>
        </View>
        <StatPill icon="trophy" value={best} bg={COLORS.surfaceSecondary} iconColor={COLORS.gold} testID="best-pill" />
      </View>

      {turbo ? <Text style={[styles.turbo, { top: insets.top + 74 }]}>TURBO!</Text> : null}

      {/* Catch line */}
      <View style={[styles.catchLine, { top: catchLineY }]} pointerEvents="none">
        {Array.from({ length: 22 }).map((_, i) => (
          <View key={i} style={styles.dash} />
        ))}
      </View>

      {/* Falling fruit */}
      {fruits.current.map((f) => (
        <View
          key={f.id}
          pointerEvents="none"
          style={[
            styles.fruit,
            f.type === "peach" ? styles.peach : styles.plum,
            { left: f.x - FRUIT / 2, top: f.y - FRUIT / 2 },
          ]}
          testID={`fruit-${f.type}`}
        >
          {f.type === "peach" ? <View style={styles.leaf} /> : null}
          <View style={styles.shine} />
        </View>
      ))}

      {/* Buttons */}
      <View style={[styles.buttons, { paddingBottom: insets.bottom + SPACING.xl }]}>
        <Pressable
          style={({ pressed }) => [styles.btn, styles.peachBtn, pressed && styles.btnPressed]}
          onPress={() => tapButton("peach")}
          testID="peach-button"
        >
          <View style={[styles.btnFruit, styles.peach]}>
            <View style={styles.leaf} />
            <View style={styles.shine} />
          </View>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btn, styles.plumBtn, pressed && styles.btnPressed]}
          onPress={() => tapButton("plum")}
          testID="plum-button"
        >
          <View style={[styles.btnFruit, styles.plum]}>
            <View style={styles.shine} />
          </View>
        </Pressable>
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
        score={result?.score ?? score.current}
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
  container: { flex: 1, backgroundColor: "#FFF3EC" },
  hud: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    flexDirection: "row",
    alignItems: "center",
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
  scoreBlock: { alignItems: "center" },
  scoreLabel: { fontFamily: FONTS.display, fontSize: 12, letterSpacing: 3, color: COLORS.muted },
  scoreValue: { fontFamily: FONTS.display, fontSize: 34, color: COLORS.onSurface, marginTop: -4 },
  turbo: {
    position: "absolute",
    alignSelf: "center",
    fontFamily: FONTS.display,
    fontSize: 18,
    letterSpacing: 3,
    color: meta.accent,
  },
  catchLine: {
    position: "absolute",
    left: SPACING.lg,
    right: SPACING.lg,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dash: { width: 10, height: 4, borderRadius: 2, backgroundColor: "rgba(90,42,34,0.35)" },
  fruit: {
    position: "absolute",
    width: FRUIT,
    height: FRUIT,
    borderRadius: FRUIT / 2,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  peach: { backgroundColor: "#F8952E" },
  plum: { backgroundColor: "#6E2247" },
  leaf: {
    position: "absolute",
    top: -6,
    right: FRUIT * 0.28,
    width: 22,
    height: 15,
    backgroundColor: "#3DA35D",
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 12,
    transform: [{ rotate: "22deg" }],
    zIndex: 2,
  },
  shine: {
    position: "absolute",
    top: FRUIT * 0.18,
    left: FRUIT * 0.22,
    width: FRUIT * 0.28,
    height: FRUIT * 0.2,
    borderRadius: FRUIT * 0.14,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  buttons: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    paddingHorizontal: SPACING.lg,
  },
  btn: {
    width: 130,
    height: 130,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
  },
  peachBtn: { backgroundColor: "#FFE7D3", borderColor: "#F8952E" },
  plumBtn: { backgroundColor: "#F3DCE8", borderColor: "#6E2247" },
  btnPressed: { transform: [{ scale: 0.94 }] },
  btnFruit: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(24,26,31,0.6)",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.lg,
    zIndex: 10,
  },
  pauseTitle: { fontFamily: FONTS.display, fontSize: 34, color: "#FFF" },
  resumeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.brand,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING["2xl"],
    borderRadius: RADIUS.pill,
  },
  resumeText: { fontFamily: FONTS.display, fontSize: 18, color: COLORS.onSurface },
  quitBtn: { paddingVertical: SPACING.sm },
  quitText: { fontFamily: FONTS.text, fontSize: 15, color: "rgba(255,255,255,0.85)" },
});
