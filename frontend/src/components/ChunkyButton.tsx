import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

import { COLORS, FONTS, RADIUS, SPACING } from "@/src/theme";

interface Props {
  label: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: "lg" | "md";
  style?: ViewStyle;
  testID?: string;
  haptic?: Haptics.ImpactFeedbackStyle | "success" | null;
}

export function ChunkyButton({
  label,
  onPress,
  color = COLORS.brand,
  textColor = COLORS.onBrand,
  icon,
  size = "lg",
  style,
  testID,
  haptic = Haptics.ImpactFeedbackStyle.Medium,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const animate = (to: number) =>
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();

  const handlePress = () => {
    if (haptic === "success") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (haptic) {
      Haptics.impactAsync(haptic);
    }
    onPress();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        testID={testID}
        onPressIn={() => animate(0.96)}
        onPressOut={() => animate(1)}
        onPress={handlePress}
        style={[
          styles.btn,
          size === "lg" ? styles.lg : styles.md,
          { backgroundColor: color },
        ]}
      >
        <View style={styles.row}>
          {icon ? (
            <Ionicons
              name={icon}
              size={size === "lg" ? 22 : 18}
              color={textColor}
              style={{ marginRight: SPACING.sm }}
            />
          ) : null}
          <Text
            style={[
              styles.label,
              { color: textColor, fontSize: size === "lg" ? 20 : 16 },
            ]}
          >
            {label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  lg: { paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xl },
  md: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg },
  row: { flexDirection: "row", alignItems: "center" },
  label: {
    fontFamily: FONTS.display,
    letterSpacing: 0.5,
  },
});
