import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, font, fontSize, radius, spacing } from "@/src/games/ninja/theme";
import type { Settings } from "@/src/games/ninja/game/useSettings";

interface Props {
  visible: boolean;
  settings: Settings;
  onClose: () => void;
  onToggleHaptics: (v: boolean) => void;
  onToggleSound: (v: boolean) => void;
  onReset: () => void;
}

export function SettingsSheet({
  visible,
  settings,
  onClose,
  onToggleHaptics,
  onToggleSound,
  onReset,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      testID="settings-modal"
    >
      <Animated.View entering={FadeIn.duration(160)} style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          testID="settings-backdrop"
        />
        <Animated.View
          entering={SlideInDown.springify().damping(18)}
          exiting={SlideOutDown}
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }]}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>Settings</Text>

          <View style={styles.row}>
            <View style={styles.iconBox}>
              <Ionicons name="pulse-outline" size={20} color={colors.onBrandTertiary} />
            </View>
            <Text style={styles.rowLabel}>Haptics</Text>
            <View style={{ marginLeft: "auto" }}>
              <Switch
                testID="settings-haptics-switch"
                value={settings.haptics}
                onValueChange={onToggleHaptics}
                trackColor={{ true: colors.brand, false: colors.border }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.iconBox}>
              <Ionicons name="musical-notes-outline" size={20} color={colors.onBrandTertiary} />
            </View>
            <Text style={styles.rowLabel}>Sound & Music</Text>
            <View style={{ marginLeft: "auto" }}>
              <Switch
                testID="settings-sound-switch"
                value={settings.sound}
                onValueChange={onToggleSound}
                trackColor={{ true: colors.brand, false: colors.border }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <Pressable
            testID="settings-reset-button"
            style={styles.resetRow}
            onPress={onReset}
          >
            <View style={[styles.iconBox, { backgroundColor: "#FEE2E2" }]}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.error }]}>
              Reset progress
            </Text>
          </Pressable>

          <Pressable
            testID="settings-done-button"
            style={styles.doneBtn}
            onPress={onClose}
          >
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(26,35,31,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  handle: {
    alignSelf: "center",
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: font.displayBold,
    fontSize: fontSize["2xl"],
    color: colors.onSurface,
    marginBottom: spacing.lg,
  },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md },
  resetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  rowLabel: { fontFamily: font.text, fontSize: fontSize.lg, color: colors.onSurface },
  doneBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.surfaceInverse,
    borderRadius: radius.pill,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  doneText: {
    fontFamily: font.displayBold,
    fontSize: fontSize.lg,
    color: colors.onSurfaceInverse,
  },
});
