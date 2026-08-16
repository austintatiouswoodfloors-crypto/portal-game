import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { COLORS, RADIUS } from "@/src/theme";
import { getPlayerName } from "@/src/player";

// Real Nailing Master web build, shipped inside this app's public/ folder and
// served from the app origin (self-contained — no external live link).
const NAILING_URL = `${process.env.EXPO_PUBLIC_BACKEND_URL}/nailing/index.html`;

function nailScore(taps: number, stars: number) {
  return Math.max(1, 300 - (taps || 0)) + (stars || 0) * 20;
}

async function submit(taps: number, stars: number) {
  try {
    const name = await getPlayerName();
    await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/scores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game: "nailing", player: name, score: nailScore(taps, stars) }),
    });
  } catch {
    /* offline play still works */
  }
}

export default function NailingWebGame() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const d = JSON.parse(e.nativeEvent.data);
      if (d && d.type === "nailing_score") submit(d.taps, d.stars);
    } catch {
      /* ignore non-JSON messages */
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <WebView
        source={{ uri: NAILING_URL }}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        onMessage={onMessage}
        onLoadEnd={() => setLoading(false)}
        style={styles.web}
      />
      {loading ? (
        <View style={styles.loader} pointerEvents="none">
          <ActivityIndicator size="large" color={COLORS.brandSecondary} />
        </View>
      ) : null}
      <Pressable
        style={[styles.backBtn, { top: insets.top + 8 }]}
        onPress={() => router.back()}
        testID="webgame-back-button"
        hitSlop={10}
      >
        <Ionicons name="chevron-back" size={24} color={COLORS.onSurface} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EAF6FF" },
  web: { flex: 1, backgroundColor: "#EAF6FF" },
  loader: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  backBtn: {
    position: "absolute",
    left: 12,
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
});
