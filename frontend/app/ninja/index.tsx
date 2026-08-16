import { useCallback, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ScreenOrientation from "expo-screen-orientation";

import { colors, font, fontSize, radius, shadow, spacing } from "@/src/games/ninja/theme";
import { Ninja } from "@/src/games/ninja/components/Ninja";
import { SettingsSheet } from "@/src/games/ninja/components/SettingsSheet";
import { useSettings } from "@/src/games/ninja/game/useSettings";
import { haptic } from "@/src/games/ninja/game/haptics";
import { KEY_BEST, KEY_LIVES } from "@/src/games/ninja/game/constants";
import { storage } from "@/src/utils/storage";

const HOME_BG =
  "https://images.unsplash.com/photo-1676206895862-27adf9e79f8c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzV8MHwxfHNlYXJjaHwxfHxiYW1ib28lMjBmb3Jlc3QlMjBza3klMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc4Njg0NjQ1OHww&ixlib=rb-4.1.0&q=85";

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, setHaptics, setSound, setMusic } = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [best, setBest] = useState(0);
  const [lives, setLives] = useState(0);

  const bounce = useSharedValue(0);
  useEffect(() => {
    bounce.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [bounce]);

  const ninjaStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -18 * bounce.value }, { scale: 1 + 0.04 * bounce.value }],
  }));

  useFocusEffect(
    useCallback(() => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      ).catch(() => {});
      (async () => {
        setBest((await storage.getItem<number>(KEY_BEST, 0)) ?? 0);
        setLives((await storage.getItem<number>(KEY_LIVES, 0)) ?? 0);
      })();
    }, []),
  );

  const reset = async () => {
    await storage.setItem(KEY_BEST, 0);
    await storage.setItem(KEY_LIVES, 0);
    setBest(0);
    setLives(0);
    setShowSettings(false);
  };

  const play = () => {
    haptic("tap", settings.haptics);
    router.push("/ninja/game");
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Image source={{ uri: HOME_BG }} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        colors={["rgba(31,41,36,0.15)", "rgba(31,41,36,0.35)", colors.surfaceInverse]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top HUD */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Pressable
            testID="hub-button"
            style={styles.iconBtn}
            onPress={() => router.replace("/")}
          >
            <Ionicons name="grid" size={20} color={colors.onSurfaceInverse} />
          </Pressable>
          <Pressable
            testID="home-settings-button"
            style={styles.iconBtn}
            onPress={() => {
              haptic("tap", settings.haptics);
              setShowSettings(true);
            }}
          >
            <Ionicons name="settings-sharp" size={22} color={colors.onSurfaceInverse} />
          </Pressable>
        </View>
        <View testID="home-lives-pill" style={styles.coinPill}>
          <Ionicons name="heart" size={16} color={colors.error} />
          <Text style={styles.coinPillText}>{lives}</Text>
        </View>
      </View>

      {/* Center */}
      <View style={styles.center}>
        <Animated.View style={ninjaStyle}>
          <Ninja size={110} />
        </Animated.View>
        <Text style={styles.title}>TINY NINJA</Text>
        <Text style={styles.subtitle}>JUMPER</Text>
        <View style={styles.bestRow}>
          <Ionicons name="trophy" size={16} color={colors.warningLight} />
          <Text testID="home-best-score" style={styles.bestText}>
            Best {best}
          </Text>
        </View>
      </View>

      {/* Bottom */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Pressable testID="home-play-button" style={styles.playBtn} onPress={play}>
          <Ionicons name="play" size={24} color={colors.onBrandPrimary} />
          <Text style={styles.playText}>PLAY</Text>
        </Pressable>
        <Text style={styles.hint}>
          Tap for a small hop, hold for a big jump · grab coins, stars &
          power-ups · dodge the enemies
        </Text>
      </View>

      <SettingsSheet
        visible={showSettings}
        settings={settings}
        onClose={() => setShowSettings(false)}
        onToggleHaptics={setHaptics}
        onToggleSound={setSound}
        onToggleMusic={setMusic}
        onReset={reset}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceInverse },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  coinPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.pill,
  },
  coinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.coin,
    borderWidth: 3,
    borderColor: colors.coinInner,
  },
  coinPillText: {
    fontFamily: font.displayBold,
    fontSize: fontSize.lg,
    color: colors.onSurfaceInverse,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: {
    fontFamily: font.displayBold,
    fontSize: fontSize["3xl"],
    color: colors.onSurfaceInverse,
    marginTop: spacing.xl,
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: font.displayBold,
    fontSize: fontSize["2xl"],
    color: colors.brandSecondary,
    letterSpacing: 6,
    marginTop: -spacing.xs,
  },
  bestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.lg,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  bestText: {
    fontFamily: font.text,
    fontSize: fontSize.lg,
    color: colors.onSurfaceInverse,
  },
  bottom: { paddingHorizontal: spacing.xl, alignItems: "center" },
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.brandPrimary,
    width: "100%",
    paddingVertical: spacing.lg + 2,
    borderRadius: radius.pill,
    ...shadow.card,
  },
  playText: {
    fontFamily: font.displayBold,
    fontSize: fontSize.xl,
    color: colors.onBrandPrimary,
    letterSpacing: 2,
  },
  hint: {
    fontFamily: font.text,
    fontSize: fontSize.sm,
    color: "rgba(244,249,244,0.7)",
    marginTop: spacing.md,
    textAlign: "center",
  },
});
