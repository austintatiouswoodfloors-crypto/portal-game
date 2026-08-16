import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  PanResponder,
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

const meta = GAMES.nailing;
const NAIL_COUNT = 4;
const HEAD_W = 52;
const HEAD_H = 20;
const FULL_SHAFT = 150;
const MAX_DEPTH = FULL_SHAFT;
const START_TIME = 45000;

type Phase = "start" | "playing" | "over";

interface Nail {
  x: number;
  depth: number;
}

export default function NailingGame() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { best, result, finish, clearResult } = useGameSession("nailing");

  const boardTop = height - 170;
  const topLimit = boardTop - HEAD_H - FULL_SHAFT; // highest a nail head can be

  const nailXs = useMemo(() => {
    const margin = 52;
    const span = width - margin * 2;
    return Array.from({ length: NAIL_COUNT }, (_, i) =>
      margin + (span * i) / (NAIL_COUNT - 1),
    );
  }, [width]);

  const [phase, setPhase] = useState<Phase>("start");
  const [paused, setPaused] = useState(false);
  const [howTo, setHowTo] = useState(false);
  const [, setTick] = useState(0);

  const nails = useRef<Nail[]>([]);
  const hammer = useRef({ x: width / 2, y: Math.round(height * 0.33), swing: 0 });
  const armed = useRef(true);
  const taps = useRef(0);
  const score = useRef(0); // nails driven flush
  const combo = useRef(0);
  const time = useRef(START_TIME);
  const overRef = useRef(false);

  const seedBoard = () => {
    nails.current = nailXs.map((x) => ({ x, depth: 0 }));
  };

  const headTop = (depth: number) => boardTop - HEAD_H - (FULL_SHAFT - depth);

  const endGame = useCallback(() => {
    if (overRef.current) return;
    overRef.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhase("over");
    finish(score.current);
  }, [finish]);

  const reset = () => {
    seedBoard();
    hammer.current = { x: width / 2, y: Math.round(height * 0.33), swing: 0 };
    armed.current = true;
    taps.current = 0;
    score.current = 0;
    combo.current = 0;
    time.current = START_TIME;
    overRef.current = false;
    clearResult();
    setPaused(false);
    setPhase("playing");
  };

  const tryHit = () => {
    if (!armed.current) return;
    const h = hammer.current;
    for (const nail of nails.current) {
      if (nail.depth >= MAX_DEPTH) continue;
      const dx = Math.abs(h.x - nail.x);
      if (dx < 40 && h.y >= headTop(nail.depth) - 6) {
        taps.current += 1;
        armed.current = false;
        hammer.current.swing = 1;
        const perfect = dx < 14;
        if (perfect) {
          combo.current += 1;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else {
          combo.current = 0;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        const drive = perfect ? 52 + Math.min(combo.current * 4, 20) : 30;
        nail.depth = Math.min(nail.depth + drive, MAX_DEPTH);
        if (nail.depth >= MAX_DEPTH) {
          score.current += 1;
        }
        if (nails.current.every((n) => n.depth >= MAX_DEPTH)) {
          time.current = Math.min(time.current + 3000, START_TIME);
          seedBoard();
        }
        break;
      }
    }
  };

  const setHammer = (x: number, y: number) => {
    hammer.current.x = x;
    hammer.current.y = y;
    if (y < topLimit - 30) armed.current = true;
    tryHit();
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) =>
        setHammer(e.nativeEvent.locationX, e.nativeEvent.locationY),
      onPanResponderMove: (e) =>
        setHammer(e.nativeEvent.locationX, e.nativeEvent.locationY),
    }),
  ).current;

  useGameLoop(phase === "playing" && !paused, (dt) => {
    time.current -= dt;
    if (hammer.current.swing > 0) {
      hammer.current.swing = Math.max(0, hammer.current.swing - dt / 120);
    }
    if (time.current <= 0) {
      time.current = 0;
      endGame();
      return;
    }
    setTick((t) => t + 1);
  });

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

  const h = hammer.current;
  const seconds = Math.ceil(time.current / 1000);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#EAF6FF", "#BEE3FB"]} style={StyleSheet.absoluteFill} />

      {/* Play area receives drag input */}
      <View style={StyleSheet.absoluteFill} {...(paused ? {} : pan.panHandlers)}>
        {/* Nails */}
        {nails.current.map((nail, i) => {
          const flush = nail.depth >= MAX_DEPTH;
          const shaft = Math.max(FULL_SHAFT - nail.depth, 0);
          return (
            <View key={i} pointerEvents="none">
              <View
                style={[
                  styles.nailShaft,
                  {
                    left: nail.x - 7,
                    top: headTop(nail.depth) + HEAD_H,
                    height: shaft,
                  },
                ]}
              />
              <View
                style={[
                  styles.nailHead,
                  {
                    left: nail.x - HEAD_W / 2,
                    top: headTop(nail.depth),
                    backgroundColor: flush ? "#9AA6B8" : "#D7DCE4",
                    borderColor: flush ? "#6E7A8C" : "#8A93A3",
                  },
                ]}
              />
            </View>
          );
        })}

        {/* Hammer */}
        <View
          pointerEvents="none"
          style={[
            styles.hammer,
            {
              left: h.x - 74,
              top: h.y - 118,
              transform: [{ rotate: `${-18 + h.swing * 26}deg` }],
            },
          ]}
        >
          <View style={styles.hammerHandle} />
          <View style={styles.hammerHead} />
        </View>
      </View>

      {/* Wooden board */}
      <View style={[styles.board, { top: boardTop, height: height - boardTop }]} pointerEvents="none">
        <View style={styles.boardEdge} />
      </View>

      {/* HUD */}
      <View style={[styles.hud, { paddingTop: insets.top + SPACING.sm }]} pointerEvents="box-none">
        <Pressable style={styles.iconBtn} onPress={() => setPaused((p) => !p)} testID="pause-button">
          <Ionicons name={paused ? "play" : "pause"} size={22} color={COLORS.onSurface} />
        </Pressable>
        <View style={styles.hudCenter}>
          <StatPill icon="hammer" value={`${taps.current} taps`} bg={COLORS.surfaceSecondary} testID="taps-pill" />
        </View>
        <View style={styles.hudRight}>
          <StatPill icon="time" value={`${seconds}s`} bg={COLORS.surfaceSecondary} testID="time-pill" />
        </View>
      </View>
      <View style={[styles.scoreWrap, { top: insets.top + 58 }]} pointerEvents="none">
        <StatPill icon="checkmark-done" value={score.current} bg={COLORS.brand} testID="score-pill" />
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
  container: { flex: 1, backgroundColor: "#EAF6FF" },
  hud: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
  },
  hudCenter: { flex: 1, alignItems: "center" },
  hudRight: {},
  scoreWrap: { position: "absolute", alignSelf: "center", left: 0, right: 0, alignItems: "center" },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  nailShaft: {
    position: "absolute",
    width: 14,
    backgroundColor: "#B7BECB",
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  nailHead: {
    position: "absolute",
    width: HEAD_W,
    height: HEAD_H,
    borderRadius: 8,
    borderWidth: 3,
  },
  hammer: { position: "absolute", width: 148, height: 118 },
  hammerHandle: {
    position: "absolute",
    left: 0,
    top: 46,
    width: 96,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E3B26A",
    borderWidth: 3,
    borderColor: "#C6944A",
  },
  hammerHead: {
    position: "absolute",
    left: 84,
    top: 20,
    width: 56,
    height: 72,
    borderRadius: 16,
    backgroundColor: "#D7DCE4",
    borderWidth: 3,
    borderColor: "#9AA6B8",
  },
  board: { position: "absolute", left: 0, right: 0, backgroundColor: "#E3B26A" },
  boardEdge: { height: 8, backgroundColor: "#C6944A" },
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
    backgroundColor: COLORS.brand,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING["2xl"],
    borderRadius: RADIUS.pill,
  },
  resumeText: { fontFamily: FONTS.display, fontSize: 18, color: COLORS.onSurface },
  quitBtn: { paddingVertical: SPACING.sm },
  quitText: { fontFamily: FONTS.text, fontSize: 15, color: "rgba(255,255,255,0.85)" },
});
