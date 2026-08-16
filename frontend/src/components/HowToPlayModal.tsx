import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ChunkyButton } from "@/src/components/ChunkyButton";
import { COLORS, FONTS, RADIUS, SPACING } from "@/src/theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  steps: string[];
  brand: string;
}

export function HowToPlayModal({ visible, onClose, title, steps, brand }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} testID="howto-backdrop">
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.iconWrap, { backgroundColor: brand }]}>
            <Ionicons name="game-controller" size={26} color={COLORS.onSurface} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>How to play</Text>

          <View style={styles.steps}>
            {steps.map((s, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.stepNum, { backgroundColor: brand }]}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{s}</Text>
              </View>
            ))}
          </View>

          <ChunkyButton
            label="Got it!"
            color={brand}
            textColor={COLORS.onSurface}
            onPress={onClose}
            style={{ width: "100%", marginTop: SPACING.md }}
            testID="howto-close-button"
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(24,26,31,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 3,
    borderColor: COLORS.borderStrong,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  title: { fontFamily: FONTS.display, fontSize: 24, color: COLORS.onSurface },
  subtitle: { fontFamily: FONTS.text, fontSize: 13, color: COLORS.muted, marginBottom: SPACING.lg },
  steps: { gap: SPACING.md, marginBottom: SPACING.md },
  stepRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: { fontFamily: FONTS.display, fontSize: 14, color: COLORS.onSurface },
  stepText: { flex: 1, fontFamily: FONTS.text, fontSize: 15, color: COLORS.onSurface, lineHeight: 20 },
});
