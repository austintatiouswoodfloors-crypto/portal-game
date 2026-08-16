import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { ChunkyButton } from "@/src/components/ChunkyButton";
import { COLORS, FONTS, GAME_LIST, GameMeta, RADIUS, SPACING } from "@/src/theme";
import { getBest, getPlayerName, setPlayerName } from "@/src/player";

export default function HubHome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [name, setName] = useState("Player");
  const [bests, setBests] = useState<Record<string, number>>({});
  const [editVisible, setEditVisible] = useState(false);
  const [draft, setDraft] = useState("");

  const load = useCallback(() => {
    (async () => {
      setName(await getPlayerName());
      const entries = await Promise.all(
        GAME_LIST.map(async (g) => [g.key, await getBest(g.key)] as const),
      );
      setBests(Object.fromEntries(entries));
    })();
  }, []);

  useFocusEffect(load);

  const openGame = (g: GameMeta) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/game/${g.key}` as never);
  };

  const saveName = async () => {
    await setPlayerName(draft);
    setName(await getPlayerName());
    setEditVisible(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + SPACING.lg,
          paddingBottom: SPACING["3xl"],
          paddingHorizontal: SPACING.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandSmall}>CLOBA</Text>
            <Text style={styles.brandBig}>Arcade</Text>
          </View>
          <Pressable
            style={styles.playerChip}
            onPress={() => {
              setDraft(name);
              setEditVisible(true);
            }}
            testID="player-chip"
          >
            <View style={styles.avatar}>
              <Ionicons name="person" size={16} color={COLORS.onSurface} />
            </View>
            <Text style={styles.playerName} numberOfLines={1}>
              {name}
            </Text>
            <Ionicons name="pencil" size={13} color={COLORS.muted} />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Pick a game</Text>

        {GAME_LIST.map((g) => (
          <Pressable
            key={g.key}
            testID={`game-card-${g.key}`}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: g.brand, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
            onPress={() => openGame(g)}
          >
            <Image
              source={{ uri: g.image }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={300}
            />
            <LinearGradient
              colors={["rgba(24,26,31,0.15)", "rgba(24,26,31,0.82)"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.cardBody}>
              <View style={styles.cardTop}>
                <View style={[styles.bestBadge, { backgroundColor: g.brand }]}>
                  <Ionicons name="trophy" size={13} color={COLORS.onSurface} />
                  <Text style={styles.bestBadgeText}>Best {bests[g.key] ?? 0}</Text>
                </View>
              </View>
              <View style={styles.cardBottom}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{g.title}</Text>
                  <Text style={styles.cardSubtitle} numberOfLines={1}>
                    {g.subtitle}
                  </Text>
                </View>
                <View style={[styles.playCircle, { backgroundColor: g.brand }]}>
                  <Ionicons name="play" size={22} color={COLORS.onSurface} />
                </View>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Name edit modal */}
      <Modal visible={editVisible} transparent animationType="fade" onRequestClose={() => setEditVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalBackdrop}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setEditVisible(false)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Your player name</Text>
            <TextInput
              testID="name-input"
              value={draft}
              onChangeText={setDraft}
              maxLength={24}
              placeholder="Enter a name"
              placeholderTextColor={COLORS.muted}
              style={styles.input}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveName}
            />
            <ChunkyButton
              label="Save"
              color={COLORS.brand}
              onPress={saveName}
              style={{ marginTop: SPACING.lg }}
              testID="save-name-button"
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xl,
  },
  brandSmall: {
    fontFamily: FONTS.display,
    fontSize: 14,
    letterSpacing: 4,
    color: COLORS.brandSecondary,
  },
  brandBig: { fontFamily: FONTS.display, fontSize: 36, color: COLORS.onSurface, marginTop: -4 },
  playerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.surfaceSecondary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.pill,
    maxWidth: 160,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  playerName: { fontFamily: FONTS.text, fontSize: 13, color: COLORS.onSurface, flexShrink: 1 },
  sectionTitle: {
    fontFamily: FONTS.display,
    fontSize: 20,
    color: COLORS.onSurface,
    marginBottom: SPACING.md,
  },
  card: {
    height: 190,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    marginBottom: SPACING.lg,
    borderWidth: 3,
    borderColor: COLORS.borderStrong,
  },
  cardBody: { flex: 1, padding: SPACING.lg, justifyContent: "space-between" },
  cardTop: { flexDirection: "row" },
  bestBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  bestBadgeText: { fontFamily: FONTS.display, fontSize: 12, color: COLORS.onSurface },
  cardBottom: { flexDirection: "row", alignItems: "flex-end", gap: SPACING.md },
  cardTitle: { fontFamily: FONTS.display, fontSize: 26, color: "#FFFFFF" },
  cardSubtitle: { fontFamily: FONTS.text, fontSize: 14, color: "rgba(255,255,255,0.85)" },
  playCircle: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(24,26,31,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 3,
    borderColor: COLORS.borderStrong,
  },
  modalTitle: { fontFamily: FONTS.display, fontSize: 20, color: COLORS.onSurface, marginBottom: SPACING.md },
  input: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontFamily: FONTS.text,
    fontSize: 16,
    color: COLORS.onSurface,
    backgroundColor: COLORS.surfaceSecondary,
  },
});
