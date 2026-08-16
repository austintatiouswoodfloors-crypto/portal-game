import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

import { ChunkyButton } from "@/src/components/ChunkyButton";
import { COLORS, FONTS, RADIUS, SPACING } from "@/src/theme";

interface Props {
  visible: boolean;
  score: number;
  best: number;
  rank: number | null;
  isNewBest: boolean;
  brand: string;
  onRetry: () => void;
  onHome: () => void;
}

export function GameOverOverlay({
  visible,
  score,
  best,
  rank,
  isNewBest,
  brand,
  onRetry,
  onHome,
}: Props) {
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      pop.setValue(0);
      Animated.spring(pop, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 10,
      }).start();
    }
  }, [visible, pop]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} testID="game-over-overlay">
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                {
                  scale: pop.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1],
                  }),
                },
              ],
              opacity: pop,
            },
          ]}
        >
          {isNewBest ? (
            <View style={[styles.badge, { backgroundColor: COLORS.gold }]}>
              <Ionicons name="trophy" size={14} color={COLORS.onSurface} />
              <Text style={styles.badgeText}>NEW BEST!</Text>
            </View>
          ) : null}

          <Text style={styles.title}>Game Over</Text>

          <Text style={styles.score}>{score}</Text>
          <Text style={styles.scoreLabel}>SCORE</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{best}</Text>
              <Text style={styles.statLabel}>Best</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{rank ? `#${rank}` : "—"}</Text>
              <Text style={styles.statLabel}>Rank</Text>
            </View>
          </View>

          <View style={styles.buttons}>
            <ChunkyButton
              label="Home"
              icon="home"
              color={COLORS.surfaceTertiary}
              textColor={COLORS.onSurface}
              onPress={onHome}
              style={{ flex: 1 }}
              testID="game-over-home-button"
            />
            <ChunkyButton
              label="Retry"
              icon="refresh"
              color={brand}
              textColor={COLORS.onSurface}
              haptic="success"
              onPress={onRetry}
              style={{ flex: 1 }}
              testID="game-over-retry-button"
            />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: SPACING.xl },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.borderStrong,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    marginBottom: SPACING.md,
  },
  badgeText: { fontFamily: FONTS.display, fontSize: 12, color: COLORS.onSurface, letterSpacing: 0.5 },
  title: { fontFamily: FONTS.display, fontSize: 26, color: COLORS.onSurface },
  score: { fontFamily: FONTS.display, fontSize: 64, lineHeight: 70, color: COLORS.onSurface },
  scoreLabel: { fontFamily: FONTS.text, fontSize: 12, letterSpacing: 2, color: COLORS.muted, marginTop: -6 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.surfaceTertiary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.xl,
  },
  stat: { alignItems: "center", minWidth: 60 },
  statValue: { fontFamily: FONTS.display, fontSize: 22, color: COLORS.onSurface },
  statLabel: { fontFamily: FONTS.text, fontSize: 12, color: COLORS.muted },
  statDivider: { width: 1, height: 30, backgroundColor: COLORS.border },
  buttons: { flexDirection: "row", gap: SPACING.md, width: "100%" },
});
