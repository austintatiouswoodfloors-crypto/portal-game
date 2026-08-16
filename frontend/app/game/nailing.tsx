import React, { useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { COLORS, RADIUS } from "@/src/theme";

// Nailing Master is the original React web build — run it inside a WebView so
// the gameplay is 100% the real app.
const NAILING_URL = "https://nail-master-game.preview.emergentagent.com/?utm_source=cloba-hub";

export default function NailingWebGame() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const webRef = useRef<WebView>(null);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {Platform.OS === "web" ? (
        // react-native-web renders WebView as an iframe
        <WebView
          source={{ uri: NAILING_URL }}
          style={styles.web}
          onLoadEnd={() => setLoading(false)}
        />
      ) : (
        <WebView
          ref={webRef}
          source={{ uri: NAILING_URL }}
          style={styles.web}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          onLoadEnd={() => setLoading(false)}
        />
      )}

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
