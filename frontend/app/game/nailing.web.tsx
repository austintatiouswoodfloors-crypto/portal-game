import React, { useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { getPlayerName } from "@/src/player";

// Real Nailing Master web build, served from this app's public/ folder.
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

export default function NailingWeb() {
  const router = useRouter();

  useEffect(() => {
    const handler = (ev: MessageEvent) => {
      try {
        const d = typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data;
        if (d && d.type === "nailing_score") submit(d.taps, d.stars);
      } catch {
        /* ignore */
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("message", handler);
      return () => window.removeEventListener("message", handler);
    }
  }, []);

  return (
    <>
      {React.createElement("iframe", {
        src: NAILING_URL,
        title: "Nailing Master",
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          border: "none",
          backgroundColor: "#EAF6FF",
        },
      })}
      <Pressable
        style={styles.backBtn}
        onPress={() => router.back()}
        testID="webgame-back-button"
      >
        <Ionicons name="chevron-back" size={24} color="#181A1F" />
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    position: "absolute",
    left: 12,
    top: 16,
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
});
