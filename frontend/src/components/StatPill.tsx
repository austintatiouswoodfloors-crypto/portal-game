import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS, FONTS, RADIUS, SPACING } from "@/src/theme";

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  iconColor?: string;
  bg?: string;
  textColor?: string;
  style?: ViewStyle;
  testID?: string;
}

export function StatPill({
  icon,
  value,
  iconColor = COLORS.onSurface,
  bg = COLORS.surfaceSecondary,
  textColor = COLORS.onSurface,
  style,
  testID,
}: Props) {
  return (
    <View testID={testID} style={[styles.pill, { backgroundColor: bg }, style]}>
      <Ionicons name={icon} size={16} color={iconColor} />
      <Text style={[styles.value, { color: textColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  value: {
    fontFamily: FONTS.display,
    fontSize: 16,
  },
});
