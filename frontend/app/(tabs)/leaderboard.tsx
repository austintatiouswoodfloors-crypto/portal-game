import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { COLORS, FONTS, GAME_LIST, GAMES, GameKey, RADIUS, SPACING } from "@/src/theme";
import { getLeaderboard, LeaderRow } from "@/src/api";
import { getPlayerName } from "@/src/player";

const MEDALS = [COLORS.gold, COLORS.silver, COLORS.bronze];

export default function Leaderboard() {
  const insets = useSafeAreaInsets();
  const [game, setGame] = useState<GameKey>("nailing");
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [me, setMe] = useState("");

  const fetchData = useCallback(
    async (g: GameKey, showSpinner = true) => {
      if (showSpinner) setLoading(true);
      const [data, name] = await Promise.all([getLeaderboard(g), getPlayerName()]);
      setRows(data);
      setMe(name);
      setLoading(false);
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      fetchData(game);
    }, [game, fetchData]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(game, false);
    setRefreshing(false);
  };

  const meta = GAMES[game];

  const renderItem = ({ item }: { item: LeaderRow }) => {
    const medal = item.rank <= 3 ? MEDALS[item.rank - 1] : null;
    const isMe = item.player === me;
    return (
      <View
        testID={`leader-row-${item.rank}`}
        style={[
          styles.row,
          medal ? { height: 68, borderColor: medal, borderWidth: 2 } : null,
          isMe ? { backgroundColor: COLORS.brandTertiary } : null,
        ]}
      >
        <View style={[styles.rankBadge, medal ? { backgroundColor: medal } : null]}>
          {medal ? (
            <Ionicons name="trophy" size={16} color={COLORS.onSurface} />
          ) : (
            <Text style={styles.rankText}>{item.rank}</Text>
          )}
        </View>
        <Text style={styles.playerName} numberOfLines={1}>
          {item.player}
          {isMe ? "  (you)" : ""}
        </Text>
        <Text style={[styles.scoreText, { color: meta.accent }]}>{item.score}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={{ paddingTop: insets.top + SPACING.lg, paddingHorizontal: SPACING.lg }}>
        <Text style={styles.title}>Rankings</Text>
        <Text style={styles.subtitle}>Top players across CLOBA Arcade</Text>
      </View>

      {/* Game selector chip row (horizontal, chrome — never wraps) */}
      <View style={styles.chipRowWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={GAME_LIST}
          keyExtractor={(g) => g.key}
          contentContainerStyle={styles.chipRow}
          renderItem={({ item: g }) => {
            const active = g.key === game;
            return (
              <Pressable
                testID={`leader-tab-${g.key}`}
                onPress={() => {
                  Haptics.selectionAsync();
                  setGame(g.key);
                }}
                style={[
                  styles.chip,
                  { borderColor: g.brand },
                  active ? { backgroundColor: g.brand } : null,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? COLORS.onSurface : COLORS.muted },
                  ]}
                >
                  {g.title.split(" ")[0]}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={meta.accent} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => `${r.rank}-${r.player}`}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: SPACING.lg,
            paddingTop: SPACING.md,
            paddingBottom: SPACING["3xl"],
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={meta.accent} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Image source={{ uri: meta.image }} style={styles.emptyImg} contentFit="cover" />
              <Text style={styles.emptyTitle}>No scores yet</Text>
              <Text style={styles.emptyText}>Be the first to top the {meta.title} board!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  title: { fontFamily: FONTS.display, fontSize: 30, color: COLORS.onSurface },
  subtitle: { fontFamily: FONTS.text, fontSize: 14, color: COLORS.muted },
  chipRowWrap: { height: 56, justifyContent: "center", marginTop: SPACING.sm },
  chipRow: { paddingHorizontal: SPACING.lg, gap: SPACING.sm, alignItems: "center" },
  chip: {
    height: 36,
    flexShrink: 0,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.pill,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceSecondary,
  },
  chipText: { fontFamily: FONTS.display, fontSize: 14 },
  centerFill: { flex: 1, alignItems: "center", justifyContent: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rankBadge: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { fontFamily: FONTS.display, fontSize: 15, color: COLORS.onSurface },
  playerName: { flex: 1, fontFamily: FONTS.text, fontSize: 15, color: COLORS.onSurface },
  scoreText: { fontFamily: FONTS.display, fontSize: 20 },
  empty: { alignItems: "center", paddingTop: SPACING["3xl"], paddingHorizontal: SPACING.xl },
  emptyImg: { width: 120, height: 120, borderRadius: RADIUS.lg, marginBottom: SPACING.lg, opacity: 0.9 },
  emptyTitle: { fontFamily: FONTS.display, fontSize: 20, color: COLORS.onSurface },
  emptyText: { fontFamily: FONTS.text, fontSize: 14, color: COLORS.muted, textAlign: "center", marginTop: 4 },
});
