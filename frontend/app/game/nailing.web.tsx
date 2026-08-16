import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Web-only variant of the Nailing Master screen: render the real web build in
// a raw <iframe> (react-native-webview has no web renderer). On native, the
// sibling nailing.tsx (react-native-webview) is used instead.
const NAILING_URL =
  "https://nail-master-game.preview.emergentagent.com/?utm_source=cloba-hub";

export default function NailingWeb() {
  const router = useRouter();
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
