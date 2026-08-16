import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChunkyButton } from "@/src/components/ChunkyButton";
import { COLORS, FONTS, GameMeta, RADIUS, SPACING } from "@/src/theme";

interface Props {
  meta: GameMeta;
  best: number;
  onPlay: () => void;
  onHowTo: () => void;
  onBack: () => void;
}

export function GameStart({ meta, best, onPlay, onHowTo, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const lightText = meta.key === "ninja";

  return (
    <View style={[styles.container, { backgroundColor: meta.brand }]}>
      <Image source={{ uri: meta.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
      <LinearGradient
        colors={
          lightText
            ? ["rgba(24,26,31,0.35)", "rgba(24,26,31,0.9)"]
            : ["rgba(255,255,255,0.35)", `${meta.brand}F2`]
        }
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.top, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable style={styles.backBtn} onPress={onBack} testID="game-back-button">
          <Ionicons name="chevron-back" size={24} color={lightText ? "#FFF" : COLORS.onSurface} />
        </Pressable>
      </View>

      <View style={styles.center}>
        <Text style={[styles.brandTag, { color: lightText ? "rgba(255,255,255,0.85)" : meta.accent }]}>
          CLOBA ARCADE
        </Text>
        <Text style={[styles.title, { color: lightText ? "#FFF" : COLORS.onSurface }]}>
          {meta.title}
        </Text>
        <Text style={[styles.subtitle, { color: lightText ? "rgba(255,255,255,0.8)" : COLORS.onSurface }]}>
          {meta.subtitle}
        </Text>

        <View style={styles.bestModule}>
          <Ionicons name="trophy" size={18} color={COLORS.gold} />
          <Text style={styles.bestLabel}>BEST</Text>
          <Text style={styles.bestValue}>{best}</Text>
        </View>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + SPACING.xl }]}>
        <Text style={[styles.tagline, { color: lightText ? "rgba(255,255,255,0.8)" : COLORS.onSurface }]}>
          {meta.tagline}
        </Text>
        <ChunkyButton
          label="PLAY"
          icon="play"
          color={COLORS.brand}
          textColor={COLORS.onSurface}
          haptic="success"
          onPress={onPlay}
          style={{ width: "100%" }}
          testID="play-button"
        />
        <Pressable style={styles.howToBtn} onPress={onHowTo} testID="how-to-play-button">
          <Ionicons name="help-circle-outline" size={20} color={lightText ? "#FFF" : COLORS.onSurface} />
          <Text style={[styles.howToText, { color: lightText ? "#FFF" : COLORS.onSurface }]}>
            How to play
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  top: { paddingHorizontal: SPACING.lg },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: SPACING.xl },
  brandTag: { fontFamily: FONTS.display, fontSize: 13, letterSpacing: 4, marginBottom: SPACING.sm },
  title: { fontFamily: FONTS.display, fontSize: 44, textAlign: "center", lineHeight: 48 },
  subtitle: { fontFamily: FONTS.text, fontSize: 16, marginTop: SPACING.xs },
  bestModule: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.surfaceSecondary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.pill,
    marginTop: SPACING.xl,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
  },
  bestLabel: { fontFamily: FONTS.display, fontSize: 13, letterSpacing: 2, color: COLORS.muted },
  bestValue: { fontFamily: FONTS.display, fontSize: 22, color: COLORS.onSurface },
  bottom: { paddingHorizontal: SPACING.lg, gap: SPACING.md },
  tagline: { fontFamily: FONTS.text, fontSize: 14, textAlign: "center", marginBottom: SPACING.xs },
  howToBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  howToText: { fontFamily: FONTS.display, fontSize: 16 },
});
