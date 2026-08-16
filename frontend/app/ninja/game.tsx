import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ScreenOrientation from "expo-screen-orientation";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";

import { colors, font, fontSize, radius, shadow, spacing } from "@/src/games/ninja/theme";
import {
  CoinView,
  EnemyView,
  GroundView,
  NinjaView,
  PlatformView,
  PowerUpView,
} from "@/src/games/ninja/components/entities";
import {
  activePower,
  createGame,
  GameState,
  getPose,
  getScore,
  Input,
  revive,
  screenXOf,
  step,
} from "@/src/games/ninja/game/engine";
import { haptic } from "@/src/games/ninja/game/haptics";
import { useSettings } from "@/src/games/ninja/game/useSettings";
import { storage } from "@/src/utils/storage";
import { getPlayerName } from "@/src/player";
import { KEY_BEST, KEY_LIVES, STARS_PER_LIFE, WALTZ_BEAT_MS } from "@/src/games/ninja/game/constants";

type Screen = "playing" | "paused" | "dead";

const clock = () =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

const POWER_LABEL = {
  grow: "GROW BIG!",
  invis: "INVISIBLE!",
  star: "STAR POWER!",
  magnet: "COIN MAGNET!",
} as const;

export default function Game() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const { settings, loaded } = useSettings();

  const stateRef = useRef<GameState | null>(null);
  const inputRef = useRef<Input>({ jumpQueued: false, holding: false });
  const lastRef = useRef(0);
  const runningRef = useRef(false);
  const hapticsRef = useRef(true);
  const livesRef = useRef(0);

  const [, setTick] = useState(0);
  const [screen, setScreen] = useState<Screen>("playing");
  const [best, setBest] = useState(0);
  const [lives, setLives] = useState(0);
  const [result, setResult] = useState({ coins: 0, isBest: false });

  // Audio (original SFX + waltz loop).
  const music = useAudioPlayer(require("@/assets/audio/music.wav"));
  const sfxFlap = useAudioPlayer(require("@/assets/audio/flap.wav"));
  const sfxCoin = useAudioPlayer(require("@/assets/audio/coin.wav"));
  const sfxPower = useAudioPlayer(require("@/assets/audio/power.wav"));
  const sfxStar = useAudioPlayer(require("@/assets/audio/star.wav"));
  const sfxDie = useAudioPlayer(require("@/assets/audio/die.wav"));
  const playersRef = useRef<Record<string, ReturnType<typeof useAudioPlayer>>>({});
  const soundRef = useRef(true);

  useEffect(() => {
    soundRef.current = settings.sound;
  }, [settings.sound]);

  useEffect(() => {
    sfxFlap.volume = 0.3;
    sfxCoin.volume = 0.55;
    sfxPower.volume = 0.6;
    sfxStar.volume = 0.6;
    sfxDie.volume = 0.7;
    playersRef.current = {
      jump: sfxFlap,
      coin: sfxCoin,
      power: sfxPower,
      star: sfxStar,
      die: sfxDie,
    };
  }, [sfxFlap, sfxCoin, sfxPower, sfxStar, sfxDie]);

  const playSfx = useCallback((name: string) => {
    if (!soundRef.current) return;
    const p = playersRef.current[name];
    if (p) {
      try {
        p.seekTo(0);
        p.play();
      } catch {
        // ignore
      }
    }
  }, []);

  // Background music loop (separate from sound effects).
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    try {
      music.loop = true;
      music.volume = 0.4;
      if (settings.music) music.play();
      else music.pause();
    } catch {
      // ignore
    }
    return () => {
      try {
        music.pause();
      } catch {
        // ignore
      }
    };
  }, [music, settings.music]);

  useEffect(() => {
    hapticsRef.current = settings.haptics;
  }, [settings.haptics]);

  // Lock to landscape while playing; restore portrait on exit.
  useEffect(() => {
    (async () => {
      try {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE,
        );
      } catch {
        // no-op (web / unsupported)
      }
    })();
    return () => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      ).catch(() => {});
    };
  }, []);

  useEffect(() => {
    (async () => {
      const l = (await storage.getItem<number>(KEY_LIVES, 0)) ?? 0;
      livesRef.current = l;
      setLives(l);
      setBest((await storage.getItem<number>(KEY_BEST, 0)) ?? 0);
    })();
  }, []);

  const gainLife = useCallback(async () => {
    const l = livesRef.current + 1;
    livesRef.current = l;
    setLives(l);
    await storage.setItem(KEY_LIVES, l);
  }, []);

  const persist = useCallback(async (s: GameState) => {
    const coins = s.coinsCollected;
    const prevBest = (await storage.getItem<number>(KEY_BEST, 0)) ?? 0;
    const isBest = coins > prevBest;
    if (isBest) await storage.setItem(KEY_BEST, coins);
    setBest(Math.max(prevBest, coins));
    setResult({ coins, isBest });
    try {
      const name = await getPlayerName();
      fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: "ninja", player: name, score: coins }),
      }).catch(() => {});
    } catch {
      /* no-op */
    }
  }, []);

  const tick = useCallback(() => {
    if (!runningRef.current) return;
    const s = stateRef.current;
    if (!s) return;
    const t = clock();
    if (lastRef.current === 0) lastRef.current = t;
    let dt = (t - lastRef.current) / 1000;
    lastRef.current = t;
    if (dt > 1 / 20) dt = 1 / 20;
    s.now = Date.now();
    step(s, dt, inputRef.current);
    for (const ev of s.events) {
      haptic(ev, hapticsRef.current);
      if (ev === "life") {
        gainLife();
        playSfx("star");
      } else if (ev === "coin") playSfx("coin");
      else if (ev === "power") playSfx("power");
      else if (ev === "die") playSfx("die");
      else if (ev === "jump") playSfx("jump");
    }
    s.events.length = 0;
    setTick((n) => n + 1);
    if (s.status === "dead") {
      runningRef.current = false;
      persist(s);
      setScreen("dead");
    }
  }, [persist, gainLife, playSfx]);

  useEffect(() => {
    if (!loaded || W < 2 || H < 2) return;
    if (!stateRef.current) {
      stateRef.current = createGame(W, H);
      setTick((n) => n + 1);
    }
    if (screen !== "playing") return;
    runningRef.current = true;
    lastRef.current = 0;
    const id = setInterval(tick, 1000 / 60);
    return () => {
      runningRef.current = false;
      clearInterval(id);
    };
  }, [loaded, W, H, screen, tick]);

  const doJump = () => {
    inputRef.current.holding = true;
    inputRef.current.jumpQueued = true;
  };
  const releaseJump = () => {
    inputRef.current.holding = false;
  };
  const pause = () => {
    haptic("tap", settings.haptics);
    setScreen("paused");
  };
  const resume = () => {
    haptic("tap", settings.haptics);
    setScreen("playing");
  };
  const restart = () => {
    haptic("tap", settings.haptics);
    stateRef.current = createGame(W, H);
    inputRef.current = { jumpQueued: false, holding: false };
    setScreen("playing");
  };
  const continueRun = async () => {
    if (livesRef.current <= 0) return;
    haptic("power", settings.haptics);
    const l = livesRef.current - 1;
    livesRef.current = l;
    setLives(l);
    await storage.setItem(KEY_LIVES, l);
    const s = stateRef.current;
    if (!s) return;
    s.now = Date.now();
    revive(s);
    setScreen("playing");
  };
  const goHome = () => {
    haptic("tap", settings.haptics);
    runningRef.current = false;
    router.replace("/");
  };

  const s = stateRef.current;
  if (!s) {
    return (
      <View style={styles.container} testID="game-screen">
        <StatusBar style="dark" />
        <LinearGradient colors={colors.sky} style={StyleSheet.absoluteFill} />
      </View>
    );
  }

  const score = getScore(s);
  const pose = getPose(s);
  const power = activePower(s);
  const powered = s.now < s.growUntil;
  const invisible = s.now < s.invisUntil;
  const starActive = s.now < s.starUntil;
  const spin = starActive ? Math.floor((s.now / 2) % 360) : 0;

  // Waltz-tempo (3/4) leg animation + body bob.
  const legPhase = (s.now / WALTZ_BEAT_MS) * Math.PI * 2;
  let bob = 0;
  if (s.ninja.grounded) {
    const beat = (s.now % (WALTZ_BEAT_MS * 3)) / WALTZ_BEAT_MS; // 0..3
    const idx = Math.floor(beat);
    const frac = beat - idx;
    const amp = idx === 0 ? 6 : 3; // emphasize beat 1 of the measure
    bob = -Math.sin(Math.PI * frac) * amp;
  }
  const measurePos = (s.now % (WALTZ_BEAT_MS * 3)) / WALTZ_BEAT_MS;
  const beatPulse = 1 - (measurePos - Math.floor(measurePos)); // 1 on beat -> 0

  const hillW = 260;
  const hillSpan = W + hillW;
  const hillOffset = -((s.ninja.worldX * 0.25) % hillSpan);

  return (
    <View style={styles.container} testID="game-screen">
      <StatusBar style="dark" />
      <LinearGradient colors={colors.sky} style={StyleSheet.absoluteFill} />

      {/* Parallax hills */}
      <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.hill,
              { left: hillOffset + i * hillSpan, top: s.groundTopY - 120, width: hillW },
            ]}
          />
        ))}
      </View>

      {/* Entity layer */}
      <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
        {s.ground.map((seg, idx) => {
          const left = screenXOf(s, seg.x0);
          const w = seg.x1 - seg.x0;
          if (left > W || left + w < 0) return null;
          return (
            <GroundView key={`g-${idx}-${seg.x0}`} x={left} y={s.groundTopY} w={w} h={H - s.groundTopY} />
          );
        })}
        {s.platforms.map((p) => {
          const left = screenXOf(s, p.x0);
          const w = p.x1 - p.x0;
          if (left > W || left + w < 0) return null;
          return <PlatformView key={p.id} x={left} y={p.y} w={w} />;
        })}
        {s.coins.map((c) => (
          <CoinView key={c.id} x={screenXOf(s, c.wx)} y={c.y} />
        ))}
        {s.powerups.map((pu) => (
          <PowerUpView key={pu.id} x={screenXOf(s, pu.wx)} y={pu.y} type={pu.type} />
        ))}
        {s.enemies.map((e) => {
          const dir = e.vx > 0 ? 1 : -1;
          const distToBound = dir > 0 ? e.maxX - e.wx : e.wx - e.minX;
          const t = distToBound < 60 ? 1 - distToBound / 60 : 0;
          const wobble = t * Math.sin(s.now / 45) * 12;
          return (
            <EnemyView
              key={e.id}
              x={screenXOf(s, e.wx)}
              y={e.y}
              kind={e.kind}
              wobble={wobble}
            />
          );
        })}
        {/* Waltz-beat sparkle trail behind the ninja */}
        {[1, 2, 3].map((i) => {
          const sz = 12 - 2 * i;
          return (
            <View
              key={`trail-${i}`}
              style={{
                position: "absolute",
                left: s.screenX - 16 * i - sz / 2,
                top: s.ninja.y + 6 - sz / 2,
                width: sz,
                height: sz,
                borderRadius: sz / 2,
                backgroundColor: colors.brandSecondary,
                opacity: (0.55 * beatPulse) / i,
                pointerEvents: "none",
              }}
            />
          );
        })}
        <NinjaView
          x={s.screenX}
          y={s.ninja.y}
          pose={pose}
          powered={powered}
          invisible={invisible}
          spin={spin}
          phase={legPhase}
          bob={bob}
        />
      </View>

      {/* Jump tap zone: above entities so taps register; below HUD so
          the pause button stays tappable. Tap anywhere to flap. */}
      {screen === "playing" && (
        <Pressable
          testID="jump-zone"
          style={StyleSheet.absoluteFill}
          onPressIn={doJump}
          onPressOut={releaseJump}
        />
      )}

      {/* HUD */}
      <View
        style={[styles.hud, { paddingTop: insets.top + spacing.sm, pointerEvents: "box-none" }]}
      >
        <Pressable testID="pause-button" style={styles.hudBtn} onPress={pause}>
          <Ionicons name="pause" size={22} color={colors.onSurface} />
        </Pressable>
        <View style={styles.scoreWrap}>
          <View style={styles.scoreRow}>
            <View style={styles.coinDot} />
            <Text testID="score-value" style={styles.score}>
              {score}
            </Text>
          </View>
          <View style={styles.starPips}>
            {Array.from({ length: STARS_PER_LIFE }).map((_, i) => (
              <Ionicons
                key={i}
                name={i < s.stars ? "star" : "star-outline"}
                size={14}
                color={colors.warning}
              />
            ))}
          </View>
        </View>
        <View testID="lives-hud" style={styles.livesHud}>
          <Ionicons name="heart" size={16} color={colors.error} />
          <Text style={styles.livesText}>{lives}</Text>
        </View>
      </View>

      {power && (
        <View style={[styles.powerBanner, { top: insets.top + 70, pointerEvents: "none" }]}>
          <Ionicons name="flash" size={14} color="#FFFFFF" />
          <Text style={styles.powerBannerText}>{POWER_LABEL[power]}</Text>
        </View>
      )}

      {/* Jump: tap anywhere on screen (jump-zone). No visible button. */}

      {/* Pause overlay */}
      {screen === "paused" && (
        <BlurView intensity={40} tint="light" style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Paused</Text>
            <View style={styles.scoreRowBig}>
              <View style={styles.coinDotBig} />
              <Text style={styles.cardScore}>{score}</Text>
            </View>
            <Pressable testID="resume-button" style={styles.primaryBtn} onPress={resume}>
              <Ionicons name="play" size={20} color={colors.onBrandPrimary} />
              <Text style={styles.primaryText}>RESUME</Text>
            </Pressable>
            <Pressable testID="pause-home-button" style={styles.secondaryBtn} onPress={goHome}>
              <Text style={styles.secondaryText}>HOME</Text>
            </Pressable>
          </View>
        </BlurView>
      )}

      {/* Game Over overlay */}
      {screen === "dead" && (
        <BlurView intensity={50} tint="light" style={styles.overlay} testID="game-over-overlay">
          <View style={styles.card}>
            <Text style={styles.cardTitle}>GAME OVER</Text>
            <View style={styles.scoreRowBig}>
              <View style={styles.coinDotBig} />
              <Text style={styles.cardScore}>{result.coins}</Text>
            </View>
            {result.isBest && (
              <View style={styles.bestBadge}>
                <Ionicons name="trophy" size={14} color="#451A03" />
                <Text style={styles.bestBadgeText}>New Best!</Text>
              </View>
            )}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Ionicons name="trophy-outline" size={18} color={colors.onSurface} />
                <Text style={styles.statValue}>{best}</Text>
                <Text style={styles.statLabel}>Best</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Ionicons name="heart" size={18} color={colors.error} />
                <Text style={styles.statValue}>{lives}</Text>
                <Text style={styles.statLabel}>Lives</Text>
              </View>
            </View>

            {lives > 0 && (
              <Pressable testID="continue-button" style={styles.continueBtn} onPress={continueRun}>
                <Ionicons name="heart" size={20} color="#FFFFFF" />
                <Text style={styles.primaryText}>CONTINUE · USE 1 LIFE</Text>
              </Pressable>
            )}

            <View style={styles.actionRow}>
              <Pressable testID="retry-button" style={styles.primaryBtnHalf} onPress={restart}>
                <Ionicons name="refresh" size={20} color={colors.onBrandPrimary} />
                <Text style={styles.primaryText}>RETRY</Text>
              </Pressable>
              <Pressable testID="home-button" style={styles.secondaryBtnHalf} onPress={goHome}>
                <Ionicons name="home" size={20} color={colors.onSurface} />
                <Text style={styles.secondaryText}>HOME</Text>
              </Pressable>
            </View>
          </View>
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, overflow: "hidden" },
  hill: {
    position: "absolute",
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(22,163,74,0.16)",
  },
  hud: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
  },
  hudBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.75)",
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  scoreWrap: { alignItems: "center", gap: 2 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  score: {
    fontFamily: font.displayBold,
    fontSize: fontSize["3xl"],
    color: colors.onSurface,
  },
  starPips: { flexDirection: "row", gap: 3 },
  livesHud: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "rgba(255,255,255,0.75)",
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.pill,
    ...shadow.soft,
  },
  livesText: {
    fontFamily: font.displayBold,
    fontSize: fontSize.lg,
    color: colors.onSurface,
  },
  coinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.coin,
    borderWidth: 4,
    borderColor: colors.coinInner,
  },
  coinDotBig: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.coin,
    borderWidth: 5,
    borderColor: colors.coinInner,
  },
  powerBanner: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.info,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  powerBannerText: {
    fontFamily: font.textBold,
    fontSize: fontSize.sm,
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  jumpBtn: {
    position: "absolute",
    right: spacing.xl,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  jumpLabel: {
    fontFamily: font.displayBold,
    fontSize: fontSize.sm,
    color: colors.onBrandPrimary,
    letterSpacing: 1,
    marginTop: 2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    ...shadow.card,
  },
  cardTitle: {
    fontFamily: font.displayBold,
    fontSize: fontSize["2xl"],
    color: colors.onSurface,
    letterSpacing: 1,
  },
  scoreRowBig: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  cardScore: {
    fontFamily: font.displayBold,
    fontSize: fontSize["3xl"],
    color: colors.brandPrimary,
  },
  bestBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  bestBadgeText: { fontFamily: font.textBold, fontSize: fontSize.sm, color: "#451A03" },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    width: "100%",
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: colors.border },
  statValue: { fontFamily: font.displayBold, fontSize: fontSize.xl, color: colors.onSurface },
  statLabel: { fontFamily: font.text, fontSize: fontSize.sm, color: colors.onSurface, opacity: 0.6 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.brandPrimary,
    width: "100%",
    paddingVertical: spacing.lg,
    borderRadius: radius.pill,
    marginTop: spacing.md,
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.error,
    width: "100%",
    paddingVertical: spacing.lg,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  primaryBtnHalf: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.lg,
    borderRadius: radius.pill,
  },
  primaryText: {
    fontFamily: font.displayBold,
    fontSize: fontSize.lg,
    color: colors.onBrandPrimary,
    letterSpacing: 1,
  },
  secondaryBtn: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: spacing.lg,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  secondaryBtnHalf: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: spacing.lg,
    borderRadius: radius.pill,
  },
  secondaryText: {
    fontFamily: font.displayBold,
    fontSize: fontSize.lg,
    color: colors.onSurface,
    letterSpacing: 1,
  },
  actionRow: { flexDirection: "row", gap: spacing.md, width: "100%" },
});
